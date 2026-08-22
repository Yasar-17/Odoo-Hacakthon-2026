import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, getUserRoles, serializeData } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    let body: { email?: unknown; password?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const roles = await getUserRoles(user.userId);
    const role = roles.includes("ADMIN") ? "ADMIN" : "EMPLOYEE";

    const token = signToken({
      userId: user.userId.toString(),
      employeeId: user.employeeId,
      email: user.email,
      role,
    });

    const response = NextResponse.json({
      success: true,
      data: serializeData({
        id: user.userId,
        employeeId: user.employeeId,
        email: user.email,
        role,
        employee: user.employee
          ? {
              ...user.employee,
              department: null,
              designation: null,
            }
          : null,
      }),
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
    console.error("Signin error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
