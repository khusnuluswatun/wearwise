import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // If partner, fetch partner info
    let partner = null;
    if (user.role === "partner") {
      partner = await prisma.partner.findUnique({
        where: { userId: user.id },
      });
    }

    // In a real app, you would set a session cookie or JWT here.
    // For this demo, we'll just return the user info (excluding password).
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { success: true, user: { ...userWithoutPassword, partner } },
      { status: 200 }
    );
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
