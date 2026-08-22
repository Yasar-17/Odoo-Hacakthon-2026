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
    const status = searchParams.get("status");

    let whereClause: Record<string, unknown> = {};

    if (user.role === "ADMIN") {
      if (status) whereClause.status = status;
    } else {
      const employee = await prisma.employee.findUnique({ where: { userId: user.id } });
      if (!employee) {
        return NextResponse.json({ success: false, error: "Employee profile not found" }, { status: 404 });
      }
      whereClause.employeeId = employee.id;
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            user: { select: { employeeId: true, email: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: leaves });
  } catch (error) {
    console.error("Error fetching leaves:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch leaves" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "EMPLOYEE") {
      return NextResponse.json({ success: false, error: "Only employees can apply for leave" }, { status: 403 });
    }

    const employee = await prisma.employee.findUnique({ where: { userId: user.id } });
    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { type, startDate, endDate, remarks } = body;

    if (!type || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: "Type, startDate, and endDate are required" }, { status: 400 });
    }

    if (!["PAID", "SICK", "UNPAID"].includes(type)) {
      return NextResponse.json({ success: false, error: "Type must be PAID, SICK, or UNPAID" }, { status: 400 });
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        remarks: remarks || "",
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, data: leave });
  } catch (error) {
    console.error("Error creating leave request:", error);
    return NextResponse.json({ success: false, error: "Failed to create leave request" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Only admins can approve/reject leaves" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, adminComments } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "ID and status are required" }, { status: 400 });
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ success: false, error: "Status must be APPROVED or REJECTED" }, { status: 400 });
    }

    const leave = await prisma.leaveRequest.update({
      where: { id },
      data: { status, adminComments: adminComments || "" },
      include: {
        employee: {
          include: {
            user: { select: { employeeId: true, email: true, role: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: leave });
  } catch (error) {
    console.error("Error updating leave:", error);
    return NextResponse.json({ success: false, error: "Failed to update leave" }, { status: 500 });
  }
}
