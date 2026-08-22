import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    if (user.role === "EMPLOYEE") {
      const employee = user.employee;
      if (!employee) {
        return NextResponse.json({ success: false, error: "Employee profile not found" }, { status: 404 });
      }

      const [todayAttendance, monthAttendance, leaveCounts, latestPayroll] = await Promise.all([
        prisma.attendance.findFirst({
          where: { employeeId: employee.employeeId, attendanceDate: { gte: startOfToday, lte: endOfToday } },
        }),
        prisma.attendance.groupBy({
          by: ["status"],
          where: {
            employeeId: employee.employeeId,
            attendanceDate: { gte: startOfMonth, lte: endOfMonth },
          },
          _count: { status: true },
        }),
        prisma.leaveRequest.groupBy({
          by: ["status"],
          where: { employeeId: employee.employeeId },
          _count: { status: true },
        }),
        prisma.payroll_records.findFirst({
          where: { employee_id: employee.employeeId },
          orderBy: { payroll_month: "desc" },
        }),
      ]);

      const monthCounts = { present: 0, absent: 0, leave: 0, halfDay: 0 };
      for (const group of monthAttendance) {
        switch (group.status) {
          case "PRESENT":
            monthCounts.present = group._count.status;
            break;
          case "ABSENT":
            monthCounts.absent = group._count.status;
            break;
          case "LEAVE":
            monthCounts.leave = group._count.status;
            break;
          case "HALF_DAY":
            monthCounts.halfDay = group._count.status;
            break;
        }
      }

      const leaveCountsMap = { pending: 0, approved: 0, rejected: 0 };
      for (const group of leaveCounts) {
        switch (group.status) {
          case "PENDING":
            leaveCountsMap.pending = group._count.status;
            break;
          case "APPROVED":
            leaveCountsMap.approved = group._count.status;
            break;
          case "REJECTED":
            leaveCountsMap.rejected = group._count.status;
            break;
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          employee,
          attendance: {
            today: todayAttendance,
            thisMonth: monthCounts,
          },
          leave: leaveCountsMap,
          payroll: {
            latest: latestPayroll,
          },
        },
      });
    }

    const [totalEmployees, presentToday, onLeaveToday, pendingLeaves, recentLeaves, recentAttendance, latestPayroll] =
      await Promise.all([
        prisma.employee.count(),
        prisma.attendance.count({
          where: { attendanceDate: { gte: startOfToday, lte: endOfToday }, status: "PRESENT" },
        }),
        prisma.leaveRequest.count({
          where: { status: "APPROVED", startDate: { lte: endOfToday }, endDate: { gte: startOfToday } },
        }),
        prisma.leaveRequest.count({ where: { status: "PENDING" } }),
        prisma.leaveRequest.findMany({
          include: {
            employee: true,
          },
          orderBy: { appliedAt: "desc" },
          take: 5,
        }),
        prisma.attendance.findMany({
          include: {
            employee: true,
          },
          orderBy: { attendanceDate: "desc" },
          take: 10,
        }),
        prisma.payroll_records.findFirst({
          include: {
            employees: true,
          },
          orderBy: { payroll_month: "desc" },
        }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalEmployees,
          presentToday,
          onLeaveToday,
          pendingLeaves,
        },
        recentLeaves,
        recentAttendance,
        latestPayroll,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
