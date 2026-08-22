import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, getUserRoles, serializeData } from "@/lib/auth";

async function safeDepartment(departmentId: number | null) {
  if (!departmentId) return null;
  try {
    return await prisma.department.findUnique({ where: { departmentId } });
  } catch {
    return null;
  }
}

async function safePosition(positionId: number | null) {
  if (!positionId) return null;
  try {
    return await prisma.jobPosition.findUnique({ where: { positionId } });
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const roles = await getUserRoles(user.userId);
    const role = roles.includes("ADMIN") ? "ADMIN" : "EMPLOYEE";

    let employee = user.employee;
    if (employee) {
      const [department, position] = await Promise.all([
        safeDepartment(employee.departmentId),
        safePosition(employee.positionId),
      ]);

      employee = {
        ...employee,
        profilePicture: employee.profilePictureUrl,
        department: department?.departmentName ?? null,
        designation: position?.positionName ?? null,
      } as any;
    }

    return NextResponse.json({
      success: true,
      data: serializeData({
        id: user.userId,
        employeeId: user.employeeId,
        email: user.email,
        role,
        roles,
        employee,
      }),
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
