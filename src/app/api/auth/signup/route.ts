import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, validatePassword, validateEmail } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, email, password, role } = body;

    if (!employeeId || !email || !password) {
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
      return NextResponse.json(
        { success: false, error: "User with this email or employee ID already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const desiredRole = role === "ADMIN" ? "ADMIN" : "EMPLOYEE";

    const user = await prisma.user.create({
      data: {
        employeeId,
        email,
        passwordHash,
        employee: {
          create: {
            firstName: body.firstName || "New",
            lastName: body.lastName || "Employee",
          },
        },
      },
      include: { employee: true },
    });

    const roleRecord = await prisma.role.findFirst({
      where: { roleName: desiredRole },
    });
    if (roleRecord) {
      await prisma.userRole.create({
        data: { userId: user.userId, roleId: roleRecord.roleId },
      });
    }

    const token = signToken({
      userId: user.userId.toString(),
      employeeId: user.employeeId,
      email: user.email,
      role: desiredRole,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        userId: user.userId.toString(),
        employeeId: user.employeeId,
        email: user.email,
        role: desiredRole,
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
