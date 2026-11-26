import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function isAuthorized() {
  const cookieStore = await cookies();
  const checkinAuth =
    cookieStore.get("ssf_checkin_session")?.value === "authenticated";
  const adminAuth =
    cookieStore.get("ssf_admin_session")?.value === "authenticated";
  return checkinAuth || adminAuth;
}

export async function GET() {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const councilors = await prisma.councilor.findMany({
      orderBy: [{ unit: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ councilors });
  } catch {
    return NextResponse.json(
      { error: "Failed to load delegates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, councilorId, action } = body;

    // Case 1: Manual check-in or undo from table row
    if (councilorId) {
      const existing = await prisma.councilor.findUnique({
        where: { id: councilorId },
      });

      if (!existing) {
        return NextResponse.json(
          { status: "invalid", error: "Delegate not found" },
          { status: 404 }
        );
      }

      if (action === "undo") {
        const updated = await prisma.councilor.update({
          where: { id: councilorId },
          data: { isCheckedIn: false, checkedInAt: null },
        });
        return NextResponse.json({
          status: "undone",
          councilor: updated,
        });
      }

      if (existing.isCheckedIn) {
        return NextResponse.json({
          status: "already_checked_in",
          councilor: existing,
        });
      }

      const updated = await prisma.councilor.update({
        where: { id: councilorId },
        data: { isCheckedIn: true, checkedInAt: new Date() },
      });

      return NextResponse.json({
        status: "checked_in",
        councilor: updated,
      });
    }

    // Case 2: Instant QR Code Scan
    if (code) {
      let cleanCode = String(code).trim();

      // Support JSON-encoded QR payloads if present
      if (cleanCode.startsWith("{")) {
        try {
          const parsed = JSON.parse(cleanCode);
          cleanCode = String(parsed.id || parsed.membershipId || cleanCode).trim();
        } catch {
          // Keep raw string if not JSON
        }
      }

      const councilor = await prisma.councilor.findFirst({
        where: {
          OR: [
            { id: cleanCode },
            { membershipId: cleanCode },
            { mobile: cleanCode },
          ],
        },
      });

      if (!councilor) {
        return NextResponse.json(
          {
            status: "invalid",
            error: "Invalid QR Code — No matching councilor found.",
          },
          { status: 404 }
        );
      }

      if (councilor.isCheckedIn) {
        return NextResponse.json({
          status: "already_checked_in",
          councilor,
        });
      }

      const updated = await prisma.councilor.update({
        where: { id: councilor.id },
        data: { isCheckedIn: true, checkedInAt: new Date() },
      });

      return NextResponse.json({
        status: "checked_in",
        councilor: updated,
      });
    }

    return NextResponse.json(
      { error: "Missing QR code or delegate ID" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Server error during check-in" },
      { status: 500 }
    );
  }
}