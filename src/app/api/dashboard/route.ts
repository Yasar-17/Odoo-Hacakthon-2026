import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserFromRequest,
  isAdminUser,
  serializeData,
} from "@/lib/auth";

const EMPLOYEE_DASHBOARD_INCLUDE = {
  department: true,
  position: true,
  user: { select: { employeeId: true, email: true } },
  salaryStructures: { orderBy: { effectiveFrom: "desc" as const }, take: 1 },
} as const;

function mapEmployeeSummary(employee: {
  employeeId: bigint;
  firstName: string;
  lastName: string | null;
  joiningDate: Date | null;
  employmentStatus: string | null;
  profilePictureUrl: string | null;
  dateOfBirth: Date | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  department?: { departmentName: string } | null;
  position?: { positionName: string } | null;
  user?: { employeeId: string; email: string } | null;
  salaryStructures?: Array<{
    basicSalary: unknown;
    hra: unknown;
    allowances: unknown;
    deductions: unknown;
  }>;
}) {
  const structure = employee.salaryStructures?.[0];
  return {
    ...employee,
    id: employee.employeeId.toString(),
    employeeId: employee.user?.employeeId ?? employee.employeeId.toString(),
    email: employee.user?.email ?? null,
    department: employee.department?.departmentName ?? null,
    designation: employee.position?.positionName ?? null,
    dateOfJoining: employee.joiningDate,
    employmentType: employee.employmentStatus,
    profilePicture: employee.profilePictureUrl,
    basicSalary: structure ? Number(structure.basicSalary) : null,
    hra: structure && structure.hra !== null ? Number(structure.hra) : null,
    allowances:
      structure && structure.allowances !== null ? Number(structure.allowances) : null,
    deductions:
      structure && structure.deductions !== null ? Number(structure.deductions) : null,
  };
}

function mapPayrollRecord(record: {
  payroll_id: bigint;
  employee_id: bigint;
  salary_id: bigint | null;
  payroll_month: Date;
  gross_salary: unknown;
  total_deductions: unknown;
  net_salary: unknown;
  payment_status: string | null;
  generated_at: Date | null;
  employees?: {
    user?: { employeeId: string; email: string } | null;
    salary_structures?: Array<{
      basicSalary: unknown;
      hra: unknown;
      allowances: unknown;
      deductions: unknown;
    }>;
  } | null;
}) {
  const structure = record.employees?.salary_structures?.[0];
  return {
    ...record,
    id: record.payroll_id.toString(),
    month: record.payroll_month.getMonth() + 1,
    year: record.payroll_month.getFullYear(),
    basicSalary: Number(record.gross_salary),
    hra: structure ? Number(structure.hra ?? 0) : 0,
    allowances: structure ? Number(structure.allowances ?? 0) : 0,
    deductions: Number(record.total_deductions ?? 0),
    netSalary: Number(record.net_salary),
    status: record.payment_status ?? "PENDING",
    employeeId: record.employee_id.toString(),
  };
}

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

    const admin = await isAdminUser(user.userId);

    if (!admin) {
      const employee = await prisma.employee.findUnique({
        where: { userId: user.userId },
      });
      if (!employee) {
        return NextResponse.json(
          { success: false, error: "Employee profile not found" },
          { status: 404 }
        );
      }

      const [todayAttendance, monthAttendance, leaveCounts, latestPayroll] =
        await Promise.all([
          prisma.attendance.findFirst({
            where: {
              employeeId: employee.employeeId,
              attendanceDate: { gte: startOfToday, lte: endOfToday },
            },
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

      const fullEmployee = await prisma.employee.findUniqueOrThrow({
        where: { employeeId: employee.employeeId },
        include: EMPLOYEE_DASHBOARD_INCLUDE,
      });

      return NextResponse.json({
        success: true,
        data: serializeData({
          employee: mapEmployeeSummary(fullEmployee),
          attendance: {
            today: todayAttendance
              ? {
                  ...todayAttendance,
                  id: todayAttendance.attendanceId.toString(),
                  date: todayAttendance.attendanceDate,
                }
              : null,
            thisMonth: monthCounts,
          },
          leave: leaveCountsMap,
          payroll: {
            latest: latestPayroll ? mapPayrollRecord(latestPayroll) : null,
          },
        }),
      });
    }

    const [totalEmployees, presentToday, onLeaveToday, pendingLeavesCount, recentLeavesRaw, recentAttendanceRaw, latestPayroll] =
      await Promise.all([
        prisma.employee.count(),
        prisma.attendance.count({
          where: {
            attendanceDate: { gte: startOfToday, lte: endOfToday },
            status: "PRESENT",
          },
        }),
        prisma.leaveRequest.count({
          where: {
            status: "APPROVED",
            startDate: { lte: endOfToday },
            endDate: { gte: startOfToday },
          },
        }),
        prisma.leaveRequest.count({ where: { status: "PENDING" } }),
        prisma.leaveRequest.findMany({
          include: {
            employee: {
              include: {
                department: true,
                position: true,
                user: { select: { employeeId: true, email: true } },
              },
            },
            leaveType: true,
          },
          orderBy: { appliedAt: "desc" },
          take: 5,
        }),
        prisma.attendance.findMany({
          include: {
            employee: {
              include: {
                department: true,
                position: true,
                user: { select: { employeeId: true, email: true } },
              },
            },
          },
          orderBy: [{ attendanceDate: "desc" }, { checkIn: "desc" }],
          take: 10,
        }),
        prisma.payroll_records.findFirst({
          include: {
            employees: {
              include: {
                department: true,
                position: true,
                user: { select: { employeeId: true, email: true } },
              },
            },
          },
          orderBy: { payroll_month: "desc" },
        }),
      ]);

    const mapRelatedEmployee = (employee: {
      employeeId: bigint;
      firstName: string;
      lastName: string | null;
      profilePictureUrl: string | null;
      joiningDate: Date | null;
      employmentStatus: string | null;
      department?: { departmentName: string } | null;
      position?: { positionName: string } | null;
      user?: { employeeId: string; email: string } | null;
    }) => ({
      id: employee.employeeId.toString(),
      employeeId: employee.user?.employeeId ?? employee.employeeId.toString(),
      firstName: employee.firstName,
      lastName: employee.lastName,
      department: employee.department?.departmentName ?? null,
      designation: employee.position?.positionName ?? null,
      profilePicture: employee.profilePictureUrl,
      dateOfJoining: employee.joiningDate,
      employmentType: employee.employmentStatus,
      user: employee.user
        ? { employeeId: employee.user.employeeId, email: employee.user.email }
        : undefined,
    });

    const recentLeaves = recentLeavesRaw.map((leave) => ({
      ...leave,
      id: leave.leaveRequestId.toString(),
      type: leave.leaveType?.typeName ?? null,
      remarks: leave.reason,
      createdAt: leave.appliedAt,
      employee: mapRelatedEmployee(leave.employee),
    }));

    const recentAttendance = recentAttendanceRaw.map((record) => ({
      ...record,
      id: record.attendanceId.toString(),
      date: record.attendanceDate,
      employee: mapRelatedEmployee(record.employee),
    }));

    return NextResponse.json({
      success: true,
      data: serializeData({
        stats: {
          totalEmployees,
          presentToday,
          onLeaveToday,
          pendingLeaves: pendingLeavesCount,
        },
        recentLeaves,
        recentAttendance,
        latestPayroll: latestPayroll
          ? {
              ...mapPayrollRecord(latestPayroll),
              employee: mapRelatedEmployee(latestPayroll.employees),
            }
          : null,
      }),
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
