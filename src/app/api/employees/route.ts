import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, hashPassword, validateEmail, validatePassword } from "@/lib/auth";

const employeeUserSelect = {
  id: true,
  userId: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  gender: true,
  department: true,
  designation: true,
  dateOfJoining: true,
  employmentType: true,
  phone: true,
  address: true,
  profilePicture: true,
  basicSalary: true,
  hra: true,
  allowances: true,
  deductions: true,
  bankName: true,
  bankAccountNo: true,
  ifscCode: true,
  documents: true,
  user: {
    select: { id: true, employeeId: true, email: true, role: true },
  },
} as const;

function isDuplicateError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2002" || error.code === "P2025")
  );
}

function parseOptionalDate(value: unknown): Date | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (authUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      employeeId,
      email,
      password,
      role,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      department,
      designation,
      dateOfJoining,
      employmentType,
      phone,
      address,
      profilePicture,
      basicSalary,
      hra,
      allowances,
      deductions,
      bankName,
      bankAccountNo,
      ifscCode,
    } = body;

    if (!employeeId || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "employeeId, email, password, firstName, and lastName are required" },
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
    const dob = parseOptionalDate(dateOfBirth);
    const doj = parseOptionalDate(dateOfJoining);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          employeeId,
          email,
          passwordHash,
          role: role === "ADMIN" ? "ADMIN" : "EMPLOYEE",
          employee: {
            create: {
              firstName,
              lastName,
              ...(dob ? { dateOfBirth: dob } : {}),
              ...(gender ? { gender } : {}),
              ...(department ? { department } : {}),
              ...(designation ? { designation } : {}),
              ...(doj ? { dateOfJoining: doj } : {}),
              ...(employmentType ? { employmentType } : {}),
              ...(phone ? { phone } : {}),
              ...(address ? { address } : {}),
              ...(profilePicture ? { profilePicture } : {}),
              ...(typeof basicSalary === "number" ? { basicSalary } : {}),
              ...(typeof hra === "number" ? { hra } : {}),
              ...(typeof allowances === "number" ? { allowances } : {}),
              ...(typeof deductions === "number" ? { deductions } : {}),
              ...(bankName ? { bankName } : {}),
              ...(bankAccountNo ? { bankAccountNo } : {}),
              ...(ifscCode ? { ifscCode } : {}),
            },
          },
        },
        include: { employee: true },
      });
      return user;
    });

    const sanitizedEmployee =
      result.employee &&
      (await prisma.employee.findUnique({
        where: { id: result.employee.id },
        select: employeeUserSelect,
      }));

    return NextResponse.json({ success: true, data: sanitizedEmployee }, { status: 201 });
  } catch (error) {
    console.error("POST employees error:", error);
    if (isDuplicateError(error)) {
      return NextResponse.json(
        { success: false, error: "User with this email or employee ID already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (authUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId } = body;

    if (!employeeId) {
      return NextResponse.json({ success: false, error: "employeeId is required" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { employeeId } });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: targetUser.id } });

    return NextResponse.json({
      success: true,
      data: { message: "Employee deleted successfully" },
    });
  } catch (error) {
    console.error("DELETE employees error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "ADMIN") {
      const employees = await prisma.employee.findMany({
        include: { user: { select: { employeeId: true, email: true, role: true } } },
        orderBy: { firstName: "asc" },
      });
      return NextResponse.json({ success: true, data: employees });
    }

    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      include: { user: { select: { employeeId: true, email: true, role: true } } },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    console.error("GET employees error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { employeeId, ...updates } = body;

    let targetUserId = user.id;

    if (employeeId && user.role === "ADMIN") {
      const targetUser = await prisma.user.findUnique({ where: { employeeId } });
      if (!targetUser) {
        return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
      }
      targetUserId = targetUser.id;
    } else if (employeeId && user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const allowedEmployeeFields = ["address", "phone", "profilePicture"];
    const adminFields = [
      "firstName", "lastName", "department", "designation", "phone", "address",
      "profilePicture", "basicSalary", "hra", "allowances", "deductions",
      "employmentType", "gender", "dateOfBirth", "bankName", "bankAccountNo", "ifscCode",
    ];

    const fieldsToUpdate =
      user.role === "ADMIN" ? adminFields : allowedEmployeeFields;

    const filteredUpdates: Record<string, unknown> = {};
    for (const key of fieldsToUpdate) {
      if (key in updates) {
        filteredUpdates[key] = updates[key];
      }
    }

    const employee = await prisma.employee.update({
      where: { userId: targetUserId },
      data: filteredUpdates,
      include: { user: { select: { employeeId: true, email: true, role: true } } },
    });

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    console.error("PATCH employees error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
