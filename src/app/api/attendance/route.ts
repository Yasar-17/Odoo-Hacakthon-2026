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
    const date = searchParams.get("date");
    const week = searchParams.get("week");
    const employeeIdParam = searchParams.get("employeeId");

    let whereClause: Record<string, unknown> = {};

    if (user.role === "ADMIN") {
      if (employeeIdParam) {
        const targetUser = await prisma.user.findUnique({ where: { employeeId: employeeIdParam } });
        if (targetUser) {
          const targetEmp = await prisma.employee.findUnique({ where: { userId: targetUser.id } });
          if (targetEmp) whereClause.employeeId = targetEmp.id;
        }
      }
    } else {
      const employee = await prisma.employee.findUnique({ where: { userId: user.id } });
      if (!employee) {
        return NextResponse.json({ success: false, error: "Employee profile not found" }, { status: 404 });
      }
      whereClause.employeeId = employee.id;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.date = { gte: startOfDay, lte: endOfDay };
    } else if (week) {
      const startOfWeek = new Date(week);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      whereClause.date = { gte: startOfWeek, lte: endOfWeek };
    } else {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      whereClause.date = { gte: startOfMonth, lte: endOfMonth };
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            user: { select: { employeeId: true, email: true, role: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ success: true, data: attendance });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "EMPLOYEE") {
      return NextResponse.json({ success: false, error: "Only employees can check in/out" }, { status: 403 });
    }

    const employee = await prisma.employee.findUnique({ where: { userId: user.id } });
    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    if (!action || !["checkin", "checkout"].includes(action)) {
      return NextResponse.json({ success: false, error: "Action must be 'checkin' or 'checkout'" }, { status: 400 });
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const existingRecord = await prisma.attendance.findFirst({
      where: { employeeId: employee.id, date: { gte: startOfDay, lte: endOfDay } },
    });

    if (action === "checkin") {
      if (existingRecord) {
        return NextResponse.json({ success: false, error: "Already checked in today" }, { status: 400 });
      }
      const attendance = await prisma.attendance.create({
        data: { employeeId: employee.id, date: now, checkIn: now, status: "PRESENT" },
      });
      return NextResponse.json({ success: true, data: attendance });
    }

    if (action === "checkout") {
      if (!existingRecord) {
        return NextResponse.json({ success: false, error: "No check-in record found for today" }, { status: 400 });
      }
      const attendance = await prisma.attendance.update({
        where: { id: existingRecord.id },
        data: { checkOut: now },
      });
      return NextResponse.json({ success: true, data: attendance });
    }
  } catch (error) {
    console.error("Error processing attendance:", error);
    return NextResponse.json({ success: false, error: "Failed to process attendance" }, { status: 500 });
  }
}
