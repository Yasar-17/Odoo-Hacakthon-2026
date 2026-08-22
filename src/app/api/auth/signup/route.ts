import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  signToken,
  validatePassword,
  validateEmail,
  assignUserRole,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { employeeId, email, password, firstName, lastName } = body as {
      employeeId?: unknown;
      email?: unknown;
      password?: unknown;
      firstName?: unknown;
      lastName?: unknown;
    };

    if (
      !employeeId ||
      !email ||
      !password ||
      typeof employeeId !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "Employee ID, email, and password are required" },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.error },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { employeeId }] },
    });

    if (existingUser) {
      const conflictField =
        existingUser.employeeId === employeeId ? "Employee ID" : "Email";
      return NextResponse.json(
        { success: false, error: `${conflictField} already exists` },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        employeeId,
        email,
        passwordHash,
        employee: {
          create: {
            firstName: typeof firstName === "string" && firstName ? firstName : "New",
            lastName: typeof lastName === "string" && lastName ? lastName : "Employee",
          },
        },
      },
      include: { employee: true },
    });

    await assignUserRole(user.userId, "EMPLOYEE");

    const token = signToken({
      userId: user.userId.toString(),
      employeeId: user.employeeId,
      email: user.email,
      role: "EMPLOYEE",
    });

    const response = NextResponse.json({
      success: true,
      data: {
        id: user.userId.toString(),
        employeeId: user.employeeId,
        email: user.email,
        role: "EMPLOYEE",
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
