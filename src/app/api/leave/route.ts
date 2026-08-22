import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function serializeData<T>(value: T): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, val: unknown) =>
      typeof val === "bigint" ? val.toString() : val
    )
  );
}

function parseDateOnly(value: unknown): Date | null {
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

function parseLeaveTypeId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }
  return null;
}

function parseLeaveRequestId(value: unknown): bigint | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return BigInt(value);
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return BigInt(value.trim());
  }
  return null;
}

async function isAdminUser(userId: bigint): Promise<boolean> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return userRoles.some(
    (userRole) => userRole.role.roleName?.toUpperCase() === "ADMIN"
  );
}

function isPrismaNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2025"
  );
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const whereClause: Record<string, unknown> = {};

    const admin = await isAdminUser(user.userId);
    if (admin) {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status");
      if (status) {
        whereClause.status = status.toUpperCase();
      }
    } else {
      const employee = await prisma.employee.findUnique({ where: { userId: user.userId } });
      if (!employee) {
        return NextResponse.json(
          { success: false, error: "Employee profile not found" },
          { status: 404 }
        );
      }
      whereClause.employeeId = employee.employeeId;

      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status");
      if (status) {
        whereClause.status = status.toUpperCase();
      }
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            user: { select: { employeeId: true, email: true } },
          },
        },
        leaveType: true,
        approvals: true,
      },
      orderBy: { appliedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: serializeData(leaves) });
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

    const admin = await isAdminUser(user.userId);
    if (admin) {
      return NextResponse.json(
        { success: false, error: "Only employees can apply for leave" },
        { status: 403 }
      );
    }

    const employee = await prisma.employee.findUnique({ where: { userId: user.userId } });
    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee profile not found" },
        { status: 404 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { startDate, endDate } = body;
    const reasonValue = body.reason !== undefined ? body.reason : body.remarks;
    const reason =
      reasonValue === undefined || reasonValue === null ? null : String(reasonValue);

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const start = parseDateOnly(startDate);
    if (!start) {
      return NextResponse.json(
        { success: false, error: "startDate must be a valid date in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    const end = parseDateOnly(endDate);
    if (!end) {
      return NextResponse.json(
        { success: false, error: "endDate must be a valid date in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    if (end.getTime() < start.getTime()) {
      return NextResponse.json(
        { success: false, error: "endDate cannot be before startDate" },
        { status: 400 }
      );
    }

    let leaveTypeRecord = null;
    if (body.leaveTypeId !== undefined && body.leaveTypeId !== null) {
      const leaveTypeId = parseLeaveTypeId(body.leaveTypeId);
      if (leaveTypeId === null) {
        return NextResponse.json(
          { success: false, error: "leaveTypeId must be a positive integer" },
          { status: 400 }
        );
      }
      leaveTypeRecord = await prisma.leaveType.findUnique({
        where: { leaveTypeId },
      });
    } else if (body.type !== undefined && body.type !== null && String(body.type).trim()) {
      const normalized = String(body.type).trim().toUpperCase();
      const leaveTypes = await prisma.leaveType.findMany();
      leaveTypeRecord =
        leaveTypes.find(
          (leaveType) => leaveType.typeName.toUpperCase() === normalized
        ) ?? null;
    }

    if (!leaveTypeRecord) {
      return NextResponse.json(
        { success: false, error: "Leave type not found. Provide a valid leaveTypeId." },
        { status: 400 }
      );
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.employeeId,
        leaveTypeId: leaveTypeRecord.leaveTypeId,
        startDate: start,
        endDate: end,
        reason,
        status: "PENDING",
      },
      include: {
        employee: {
          include: {
            user: { select: { employeeId: true, email: true } },
          },
        },
        leaveType: true,
      },
    });

    return NextResponse.json({ success: true, data: serializeData(leave) }, { status: 201 });
  } catch (error) {
    console.error("Error creating leave request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create leave request" },
      { status: 500 }
    );
  }
}

async function handleDecision(adminUserId: bigint, body: Record<string, unknown>) {
  const rawId = body.leaveRequestId !== undefined ? body.leaveRequestId : body.id;
  const leaveRequestId = parseLeaveRequestId(rawId);
  if (leaveRequestId === null) {
    return NextResponse.json(
      { success: false, error: "A valid leaveRequestId is required" },
      { status: 400 }
    );
  }

  const decisionValue = body.decision !== undefined ? body.decision : body.status;
  const decision =
    typeof decisionValue === "string" ? decisionValue.toUpperCase() : "";
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    return NextResponse.json(
      { success: false, error: "decision must be APPROVED or REJECTED" },
      { status: 400 }
    );
  }

  const commentsValue = body.comments !== undefined ? body.comments : body.adminComments;
  const comments =
    commentsValue === undefined || commentsValue === null ? null : String(commentsValue);

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { leaveRequestId },
  });
  if (!leaveRequest) {
    return NextResponse.json(
      { success: false, error: "Leave request not found" },
      { status: 404 }
    );
  }

  const adminEmployee = await prisma.employee.findUnique({
    where: { userId: adminUserId },
  });
  if (!adminEmployee) {
    return NextResponse.json(
      { success: false, error: "Admin employee profile not found for approval record" },
      { status: 403 }
    );
  }

  const updatedLeave = await prisma.$transaction(async (tx) => {
    const existingApproval = await tx.leaveApproval.findFirst({
      where: { leaveRequestId },
    });

    if (existingApproval) {
      await tx.leaveApproval.update({
        where: { approvalId: existingApproval.approvalId },
        data: {
          approvedBy: adminEmployee.employeeId,
          decision,
          comments,
          decidedAt: new Date(),
        },
      });
    } else {
      await tx.leaveApproval.create({
        data: {
          leaveRequestId,
          approvedBy: adminEmployee.employeeId,
          decision,
          comments,
          decidedAt: new Date(),
        },
      });
    }

    return tx.leaveRequest.update({
      where: { leaveRequestId },
      data: { status: decision },
      include: {
        employee: {
          include: {
            user: { select: { employeeId: true, email: true } },
          },
        },
        leaveType: true,
        approvals: true,
      },
    });
  });

  return NextResponse.json({ success: true, data: serializeData(updatedLeave) });
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdminUser(user.userId);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Only admins can approve/reject leaves" },
        { status: 403 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    return await handleDecision(user.userId, body);
  } catch (error) {
    console.error("Error updating leave:", error);
    return NextResponse.json({ success: false, error: "Failed to update leave" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdminUser(user.userId);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Only admins can approve/reject leaves" },
        { status: 403 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    return await handleDecision(user.userId, body);
  } catch (error) {
    console.error("Error updating leave:", error);
    return NextResponse.json({ success: false, error: "Failed to update leave" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }

    const { searchParams } = new URL(request.url);
    const rawId = body.leaveRequestId ?? searchParams.get("leaveRequestId") ?? searchParams.get("id");
    const leaveRequestId = parseLeaveRequestId(rawId);
    if (leaveRequestId === null) {
      return NextResponse.json(
        { success: false, error: "A valid leaveRequestId is required" },
        { status: 400 }
      );
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { leaveRequestId },
    });
    if (!leaveRequest) {
      return NextResponse.json(
        { success: false, error: "Leave request not found" },
        { status: 404 }
      );
    }

    const admin = await isAdminUser(user.userId);
    if (!admin) {
      const employee = await prisma.employee.findUnique({ where: { userId: user.userId } });
      if (!employee || employee.employeeId !== leaveRequest.employeeId) {
        return NextResponse.json(
          { success: false, error: "You can only cancel your own leave requests" },
          { status: 403 }
        );
      }
      if (leaveRequest.status !== "PENDING") {
        return NextResponse.json(
          { success: false, error: "Only pending leave requests can be cancelled" },
          { status: 400 }
        );
      }
    }

    await prisma.leaveRequest.delete({ where: { leaveRequestId } });

    return NextResponse.json({
      success: true,
      data: { message: "Leave request deleted", leaveRequestId: leaveRequestId.toString() },
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json(
        { success: false, error: "Leave request not found" },
        { status: 404 }
      );
    }
    console.error("Error deleting leave:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete leave" },
      { status: 500 }
    );
  }
}
