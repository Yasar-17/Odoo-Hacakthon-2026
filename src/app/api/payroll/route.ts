import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    let whereClause: Record<string, unknown> = {};

    if (user.role === "ADMIN") {
      if (month && year) {
        whereClause.month = parseInt(month);
        whereClause.year = parseInt(year);
      }
    } else {
      const employee = await prisma.employee.findUnique({ where: { userId: user.id } });
      if (!employee) {
        return NextResponse.json({ success: false, error: "Employee profile not found" }, { status: 404 });
      }
      whereClause.employeeId = employee.id;
    }

    const payroll = await prisma.payroll.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            user: { select: { employeeId: true, email: true, role: true } },
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json({ success: true, data: payroll });
  } catch (error) {
    console.error("Error fetching payroll:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payroll" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Only admins can update payroll" }, { status: 403 });
    }

    const body = await request.json();
    const { id, basicSalary, hra, allowances, deductions, netSalary, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const existingPayroll = await prisma.payroll.findUnique({ where: { id } });
    if (!existingPayroll) {
      return NextResponse.json({ success: false, error: "Payroll record not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (basicSalary !== undefined) updateData.basicSalary = basicSalary;
    if (hra !== undefined) updateData.hra = hra;
    if (allowances !== undefined) updateData.allowances = allowances;
    if (deductions !== undefined) updateData.deductions = deductions;
    if (status !== undefined) updateData.status = status;

    if (basicSalary !== undefined || hra !== undefined || allowances !== undefined || deductions !== undefined) {
      const finalBasic = basicSalary ?? existingPayroll.basicSalary;
      const finalHra = hra ?? existingPayroll.hra;
      const finalAllowances = allowances ?? existingPayroll.allowances;
      const finalDeductions = deductions ?? existingPayroll.deductions;
      updateData.netSalary = finalBasic + finalHra + finalAllowances - finalDeductions;
    } else if (netSalary !== undefined) {
      updateData.netSalary = netSalary;
    }

    const payroll = await prisma.payroll.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          include: {
            user: { select: { employeeId: true, email: true, role: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: payroll });
  } catch (error) {
    console.error("Error updating payroll:", error);
    return NextResponse.json({ success: false, error: "Failed to update payroll" }, { status: 500 });
  }
}
