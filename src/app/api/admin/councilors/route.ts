import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function isAuthorized() {
  const cookieStore = await cookies();
  return cookieStore.get("ssf_admin_session")?.value === "authenticated";
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
      { error: "Failed to fetch councilors" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { councilors } = await request.json();

    if (!Array.isArray(councilors) || councilors.length === 0) {
      return NextResponse.json(
        { error: "No valid councilor rows provided." },
        { status: 400 }
      );
    }

    let savedCount = 0;

    for (const row of councilors) {
      const name = String(row.name || "").trim();
      const mobile = String(row.mobile || "").replace(/\D/g, "").slice(-10);
      const unit = String(row.unit || "").trim();
      const position = String(row.position || "Councilor").trim() || "Councilor";

      if (!name || mobile.length < 10 || !unit) continue;

      const generatedMembershipId =
        row.membershipId && String(row.membershipId).trim()
          ? String(row.membershipId).trim()
          : `SSF-${mobile.slice(-6)}`;

      await prisma.councilor.upsert({
        where: { mobile },
        update: {
          name,
          unit,
          position,
        },
        create: {
          name,
          mobile,
          membershipId: generatedMembershipId,
          unit,
          position,
        },
      });
      savedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${savedCount} councilor(s) to database.`,
      savedCount,
    });
  } catch (error) {
    console.error("Save councilors error:", error);
    return NextResponse.json(
      { error: "Database error while saving councilors." },
      { status: 500 }
    );
  }
}