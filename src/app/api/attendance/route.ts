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
          const targetEmp = await prisma.employee.findUnique({ where: { userId: targetUser.userId } });
          if (targetEmp) whereClause.employeeId = targetEmp.employeeId;
        }
      }
    } else {
      const employee = user.employee;
      if (!employee) {
        return NextResponse.json({ success: false, error: "Employee profile not found" }, { status: 404 });
      }
      whereClause.employeeId = employee.employeeId;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.attendanceDate = { gte: startOfDay, lte: endOfDay };
    } else if (week) {
      const startOfWeek = new Date(week);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      whereClause.attendanceDate = { gte: startOfWeek, lte: endOfWeek };
    } else {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      whereClause.attendanceDate = { gte: startOfMonth, lte: endOfMonth };
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: true,
      },
      orderBy: { attendanceDate: "desc" },
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

    const employee = user.employee;
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
      where: { employeeId: employee.employeeId, attendanceDate: { gte: startOfDay, lte: endOfDay } },
    });

    if (action === "checkin") {
      if (existingRecord) {
        return NextResponse.json({ success: false, error: "Already checked in today" }, { status: 400 });
      }
      const attendance = await prisma.attendance.create({
        data: { employeeId: employee.employeeId, attendanceDate: now, checkIn: now, status: "PRESENT" },
      });
      return NextResponse.json({ success: true, data: attendance });
    }

    if (action === "checkout") {
      if (!existingRecord) {
        return NextResponse.json({ success: false, error: "No check-in record found for today" }, { status: 400 });
      }
      const attendance = await prisma.attendance.update({
        where: { employeeId_attendanceDate: { employeeId: employee.employeeId, attendanceDate: startOfDay } },
        data: { checkOut: now },
      });
      return NextResponse.json({ success: true, data: attendance });
    }
  } catch (error) {
    console.error("Error processing attendance:", error);
    return NextResponse.json({ success: false, error: "Failed to process attendance" }, { status: 500 });
  }
}

const VALID_ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"] as const;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseAttendanceDate(value: unknown): Date | null {
  if (typeof value !== "string" || !DATE_REGEX.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function parseTimeToDate(dateValue: string, timeValue: string): Date | null {
  if (!TIME_REGEX.test(timeValue)) return null;
  return new Date(`${dateValue}T${timeValue}:00`);
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only admins can manage attendance records" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { employeeId, date, status, checkIn, checkOut } = body;

    if (!employeeId || typeof employeeId !== "string") {
      return NextResponse.json({ success: false, error: "employeeId is required" }, { status: 400 });
    }

    const attendanceDate = parseAttendanceDate(date);
    if (!attendanceDate) {
      return NextResponse.json(
        { success: false, error: "date must be a valid date in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    if (!status || !VALID_ATTENDANCE_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: "status must be one of: PRESENT, ABSENT, HALF_DAY, LEAVE" },
        { status: 400 }
      );
    }

    let checkInAt: Date | null = null;
    let checkOutAt: Date | null = null;

    if (status === "PRESENT" || status === "HALF_DAY") {
      if (checkIn != null) {
        checkInAt = parseTimeToDate(date, checkIn);
        if (!checkInAt) {
          return NextResponse.json(
            { success: false, error: "checkIn must be a valid time in HH:MM format" },
            { status: 400 }
          );
        }
      }
      if (checkOut != null) {
        checkOutAt = parseTimeToDate(date, checkOut);
        if (!checkOutAt) {
          return NextResponse.json(
            { success: false, error: "checkOut must be a valid time in HH:MM format" },
            { status: 400 }
          );
        }
      }
      if (checkInAt && checkOutAt && checkOutAt <= checkInAt) {
        return NextResponse.json(
          { success: false, error: "checkOut must be after checkIn" },
          { status: 400 }
        );
      }
    }

    const targetUser = await prisma.user.findUnique({ where: { employeeId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const employee = await prisma.employee.findUnique({ where: { userId: targetUser.userId } });
    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const data = { status, checkIn: checkInAt, checkOut: checkOutAt };

    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_attendanceDate: {
          employeeId: employee.employeeId,
          attendanceDate,
        },
      },
      update: data,
      create: {
        employeeId: employee.employeeId,
        attendanceDate,
        ...data,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...attendance,
        attendanceId: attendance.attendanceId.toString(),
        employeeId: attendance.employeeId.toString(),
      },
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json({ success: false, error: "Failed to update attendance" }, { status: 500 });
  }
}
