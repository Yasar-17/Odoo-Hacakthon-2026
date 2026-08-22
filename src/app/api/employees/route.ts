import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

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
