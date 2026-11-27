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
      const rowId = row.tempId ? String(row.tempId).trim() : "";

      if (!name || mobile.length < 10 || !unit) continue;

      // 1. Check if this exact row ID already exists in DB
      const existingById = rowId
        ? await prisma.councilor.findUnique({ where: { id: rowId } })
        : null;

      if (existingById) {
        await prisma.councilor.update({
          where: { id: existingById.id },
          data: { name, mobile, unit, position },
        });
        savedCount++;
        continue;
      }

      // 2. Check if the same person (same mobile + same name) already exists
      const existingSamePerson = await prisma.councilor.findFirst({
        where: {
          mobile,
          name: { equals: name, mode: "insensitive" },
        },
      });

      if (existingSamePerson) {
        await prisma.councilor.update({
          where: { id: existingSamePerson.id },
          data: { name, unit, position },
        });
        savedCount++;
        continue;
      }

      // 3. Otherwise create a new delegate (allows multiple delegates with same mobile)
      const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const generatedMembershipId =
        row.membershipId && String(row.membershipId).trim()
          ? String(row.membershipId).trim()
          : `SSF-${mobile.slice(-4)}-${uniqueSuffix}`;

      await prisma.councilor.create({
        data: {
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