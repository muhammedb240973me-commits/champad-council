import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("ssf_checkin_session");
  return NextResponse.json({
    authenticated: session?.value === "authenticated",
  });
}

export async function POST(request: Request) {
  try {
    const { userId, password } = await request.json();

    const validUser = process.env.CHECKIN_USERID || "checkin";
    const validPass = process.env.CHECKIN_PASSWORD || "council123";

    if (userId === validUser && password === validPass) {
      const cookieStore = await cookies();
      cookieStore.set("ssf_checkin_session", "authenticated", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 12, // 12 hours
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid Check-in User ID or Password" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}