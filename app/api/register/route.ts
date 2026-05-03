import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, phone, address, role, partnerType } = await req.json();

    if (!name || !email || !password || !phone || !address) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole = role === "partner" ? "partner" : "user";

    // Create user and partner transactionally if role is partner
    await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          address,
          role: userRole,
        },
      });

      if (userRole === "partner" && partnerType) {
        await tx.partner.create({
          data: {
            userId: user.id,
            type: partnerType,
            name: name,
            address: address,
            phone: phone,
          },
        });
      }
    });

    return NextResponse.json(
      { success: true, message: "Registered successfully" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Failed to register user", detail: String(err) },
      { status: 500 }
    );
  }
}
