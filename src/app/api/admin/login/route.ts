import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("ssf_admin_session");
  return NextResponse.json({ authenticated: session?.value === "authenticated" });
}

export async function POST(request: Request) {
  try {
    const { userId, password } = await request.json();

    const validUser = process.env.ADMIN_USERID || "admin";
    const validPass = process.env.ADMIN_PASSWORD || "ssfchampad2026";

    if (userId === validUser && password === validPass) {
      const cookieStore = await cookies();
      cookieStore.set("ssf_admin_session", "authenticated", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 12, // 12 hours
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid User ID or Password" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}