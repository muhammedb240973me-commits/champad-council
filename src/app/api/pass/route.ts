import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  const rawMobile = searchParams.get("mobile")?.trim();

  try {
    if (id) {
      const councilor = await prisma.councilor.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          mobile: true,
          membershipId: true,
          unit: true,
          position: true,
          isCheckedIn: true,
          checkedInAt: true,
        },
      });

      if (!councilor) {
        return NextResponse.json(
          { error: "Digital pass not found." },
          { status: 404 }
        );
      }

      return NextResponse.json({ councilor });
    }

    if (rawMobile) {
      const cleanMobile = rawMobile.replace(/\D/g, "").slice(-10);

      if (cleanMobile.length < 10) {
        return NextResponse.json(
          { error: "Please enter a valid 10-digit mobile number." },
          { status: 400 }
        );
      }

      const councilor = await prisma.councilor.findUnique({
        where: { mobile: cleanMobile },
        select: {
          id: true,
          name: true,
          mobile: true,
          membershipId: true,
          unit: true,
          position: true,
          isCheckedIn: true,
          checkedInAt: true,
        },
      });

      if (!councilor) {
        return NextResponse.json(
          {
            error:
              "Mobile number not registered. Please contact the registration desk.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({ councilor });
    }

    return NextResponse.json(
      { error: "Mobile number or Pass ID is required." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Pass lookup error:", error);
    return NextResponse.json(
      { error: "Unable to fetch digital pass right now. Please try again." },
      { status: 500 }
    );
  }
}