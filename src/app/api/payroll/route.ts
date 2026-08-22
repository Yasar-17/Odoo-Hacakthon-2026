import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

function serializeData<T>(value: T): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, val: unknown) =>
      typeof val === "bigint" ? val.toString() : val
    )
  );
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

function parseRecordId(value: unknown): bigint | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return BigInt(value);
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return BigInt(value.trim());
  }
  return null;
}

function parseMoney(value: unknown): number | null {
  let num: number;
  if (typeof value === "number" && Number.isFinite(value)) {
    num = value;
  } else if (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value))
  ) {
    num = Number(value);
  } else {
    return null;
  }
  if (num < 0) return null;
  return Math.round(num * 100) / 100;
}

function parseYearMonth(
  value: unknown
): { year: number; month: number } | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();

  const yearMonthMatch = /^(\d{4})-(\d{2})$/.exec(trimmed);
  if (yearMonthMatch) {
    const year = Number.parseInt(yearMonthMatch[1], 10);
    const month = Number.parseInt(yearMonthMatch[2], 10);
    if (year < 1970 || year > 2100 || month < 1 || month > 12) return null;
    return { year, month };
  }

  const fullDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (fullDateMatch) {
    const year = Number.parseInt(fullDateMatch[1], 10);
    const month = Number.parseInt(fullDateMatch[2], 10);
    const day = Number.parseInt(fullDateMatch[3], 10);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day ||
      year < 1970 ||
      year > 2100 ||
      month < 1 ||
      month > 12
    ) {
      return null;
    }
    return { year, month };
  }

  return null;
}

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

const PAYROLL_SELECT = {
  payroll_id: true,
  employee_id: true,
  salary_id: true,
  payroll_month: true,
  gross_salary: true,
  total_deductions: true,
  net_salary: true,
  payment_status: true,
  generated_at: true,
  employees: {
    include: {
      user: { select: { employeeId: true, email: true } },
    },
  },
} as const;

async function resolveAdminTargetEmployee(publicEmployeeId: unknown) {
  if (!publicEmployeeId || typeof publicEmployeeId !== "string") return null;
  const targetUser = await prisma.user.findUnique({
    where: { employeeId: publicEmployeeId },
  });
  if (!targetUser) return null;
  return prisma.employee.findUnique({ where: { userId: targetUser.userId } });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdminUser(user.userId);
    const whereClause: Record<string, unknown> = {};

    const { searchParams } = new URL(request.url);

    if (admin) {
      const employeeIdFilter = searchParams.get("employeeId");
      if (employeeIdFilter) {
        const targetEmployee = await resolveAdminTargetEmployee(employeeIdFilter);
        if (!targetEmployee) {
          return NextResponse.json({ success: true, data: [] });
        }
        whereClause.employee_id = targetEmployee.employeeId;
      }
    } else {
      const employee = await prisma.employee.findUnique({
        where: { userId: user.userId },
      });
      if (!employee) {
        return NextResponse.json(
          { success: false, error: "Employee profile not found" },
          { status: 404 }
        );
      }
      whereClause.employee_id = employee.employeeId;
    }

    const monthValue = searchParams.get("month");
    const yearValue = searchParams.get("year");

    if (monthValue && yearValue) {
      const monthNum = Number.parseInt(monthValue, 10);
      const yearNum = Number.parseInt(yearValue, 10);
      if (
        !Number.isInteger(monthNum) ||
        monthNum < 1 ||
        monthNum > 12 ||
        !Number.isInteger(yearNum) ||
        yearNum < 1970 ||
        yearNum > 2100
      ) {
        return NextResponse.json(
          { success: false, error: "Invalid month or year filter" },
          { status: 400 }
        );
      }
      const { start, end } = monthRange(yearNum, monthNum);
      whereClause.payroll_month = { gte: start, lte: end };
    } else if (monthValue) {
      const parsed = parseYearMonth(monthValue);
      if (!parsed) {
        return NextResponse.json(
          { success: false, error: "Invalid month filter. Use YYYY-MM or YYYY-MM-DD." },
          { status: 400 }
        );
      }
      const { start, end } = monthRange(parsed.year, parsed.month);
      whereClause.payroll_month = { gte: start, lte: end };
    }

    const payrollRecords = await prisma.payroll_records.findMany({
      where: whereClause,
      select: PAYROLL_SELECT,
      orderBy: { payroll_month: "desc" },
    });

    return NextResponse.json({ success: true, data: serializeData(payrollRecords) });
  } catch (error) {
    console.error("Error fetching payroll:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payroll" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdminUser(user.userId);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Only admins can create payroll records" },
        { status: 403 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const publicEmployeeId = body.employeeId;
    if (!publicEmployeeId || typeof publicEmployeeId !== "string") {
      return NextResponse.json(
        { success: false, error: "employeeId is required" },
        { status: 400 }
      );
    }

    const monthInput =
      body.payroll_month !== undefined ? body.payroll_month : body.month;
    if (monthInput === undefined || monthInput === null) {
      return NextResponse.json(
        { success: false, error: "month is required (YYYY-MM)" },
        { status: 400 }
      );
    }
    const parsedMonth = parseYearMonth(monthInput);
    if (!parsedMonth) {
      return NextResponse.json(
        { success: false, error: "month must be a valid YYYY-MM or YYYY-MM-DD value" },
        { status: 400 }
      );
    }

    if (body.gross_salary === undefined && body.grossSalary === undefined) {
      return NextResponse.json(
        { success: false, error: "grossSalary is required" },
        { status: 400 }
      );
    }
    const gross = parseMoney(body.gross_salary ?? body.grossSalary);
    if (gross === null) {
      return NextResponse.json(
        { success: false, error: "grossSalary must be a non-negative number" },
        { status: 400 }
      );
    }

    const deductionsInput = body.total_deductions ?? body.totalDeductions ?? body.deductions;
    let deductions = 0;
    if (deductionsInput !== undefined && deductionsInput !== null) {
      const parsedDeductions = parseMoney(deductionsInput);
      if (parsedDeductions === null) {
        return NextResponse.json(
          { success: false, error: "totalDeductions must be a non-negative number" },
          { status: 400 }
        );
      }
      deductions = parsedDeductions;
    }

    let net: number;
    if (body.net_salary !== undefined || body.netSalary !== undefined) {
      const parsedNet = parseMoney(body.net_salary ?? body.netSalary);
      if (parsedNet === null) {
        return NextResponse.json(
          { success: false, error: "netSalary must be a non-negative number" },
          { status: 400 }
        );
      }
      net = parsedNet;
    } else {
      net = Math.round((gross - deductions) * 100) / 100;
    }
    if (net < 0) {
      return NextResponse.json(
        { success: false, error: "netSalary cannot be negative" },
        { status: 400 }
      );
    }

    let paymentStatus = "PENDING";
    const statusInput = body.payment_status ?? body.paymentStatus ?? body.status;
    if (statusInput !== undefined && statusInput !== null) {
      if (typeof statusInput !== "string" || !statusInput.trim()) {
        return NextResponse.json(
          { success: false, error: "paymentStatus must be a non-empty string" },
          { status: 400 }
        );
      }
      paymentStatus = statusInput.trim().toUpperCase().slice(0, 30);
    }

    const employee = await resolveAdminTargetEmployee(publicEmployeeId);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    const payrollMonth = new Date(parsedMonth.year, parsedMonth.month - 1, 1);

    const duplicate = await prisma.payroll_records.findUnique({
      where: {
        employee_id_payroll_month: {
          employee_id: employee.employeeId,
          payroll_month: payrollMonth,
        },
      },
    });
    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: `A payroll record already exists for ${publicEmployeeId} for ${parsedMonth.year}-${String(
            parsedMonth.month
          ).padStart(2, "0")}`,
        },
        { status: 409 }
      );
    }

    const created = await prisma.payroll_records.create({
      data: {
        employee_id: employee.employeeId,
        payroll_month: payrollMonth,
        gross_salary: gross,
        total_deductions: deductions,
        net_salary: net,
        payment_status: paymentStatus,
      },
      select: PAYROLL_SELECT,
    });

    return NextResponse.json({ success: true, data: serializeData(created) }, { status: 201 });
  } catch (error) {
    console.error("Error creating payroll:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create payroll record" },
      { status: 500 }
    );
  }
}

async function handleUpdate(body: Record<string, unknown>) {
  const rawId = body.payroll_id !== undefined ? body.payroll_id : body.id;
  const payrollId = parseRecordId(rawId);
  if (payrollId === null) {
    return NextResponse.json(
      { success: false, error: "A valid payrollId is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.payroll_records.findUnique({
    where: { payroll_id: payrollId },
  });
  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Payroll record not found" },
      { status: 404 }
    );
  }

  const updateData: Record<string, unknown> = {};
  let grossTouched = false;
  let deductionsTouched = false;

  if (body.payroll_month !== undefined || body.month !== undefined || body.payrollMonth !== undefined) {
    const monthInput = body.payroll_month ?? body.month ?? body.payrollMonth;
    const parsedMonth = parseYearMonth(monthInput);
    if (!parsedMonth) {
      return NextResponse.json(
        { success: false, error: "payroll_month must be a valid YYYY-MM or YYYY-MM-DD value" },
        { status: 400 }
      );
    }
    updateData.payroll_month = new Date(parsedMonth.year, parsedMonth.month - 1, 1);
  }

  let gross = Number(existing.gross_salary);
  if (body.gross_salary !== undefined || body.grossSalary !== undefined) {
    const parsedGross = parseMoney(body.gross_salary ?? body.grossSalary);
    if (parsedGross === null) {
      return NextResponse.json(
        { success: false, error: "grossSalary must be a non-negative number" },
        { status: 400 }
      );
    }
    gross = parsedGross;
    updateData.gross_salary = gross;
    grossTouched = true;
  }

  let deductions = Number(existing.total_deductions ?? 0);
  const deductionsInput = body.total_deductions ?? body.totalDeductions ?? body.deductions;
  if (deductionsInput !== undefined) {
    const parsedDeductions = parseMoney(deductionsInput);
    if (parsedDeductions === null) {
      return NextResponse.json(
        { success: false, error: "totalDeductions must be a non-negative number" },
        { status: 400 }
      );
    }
    deductions = parsedDeductions;
    updateData.total_deductions = deductions;
    deductionsTouched = true;
  }

  if (body.net_salary !== undefined || body.netSalary !== undefined) {
    const net = parseMoney(body.net_salary ?? body.netSalary);
    if (net === null || net < 0) {
      return NextResponse.json(
        { success: false, error: "netSalary must be a non-negative number" },
        { status: 400 }
      );
    }
    updateData.net_salary = net;
  } else if (grossTouched || deductionsTouched) {
    const recomputed = Math.round((gross - deductions) * 100) / 100;
    if (recomputed < 0) {
      return NextResponse.json(
        { success: false, error: "netSalary cannot be negative" },
        { status: 400 }
      );
    }
    updateData.net_salary = recomputed;
  }

  const statusInput = body.payment_status ?? body.paymentStatus ?? body.status;
  if (statusInput !== undefined) {
    if (typeof statusInput !== "string" || !statusInput.trim()) {
      return NextResponse.json(
        { success: false, error: "paymentStatus must be a non-empty string" },
        { status: 400 }
      );
    }
    updateData.payment_status = statusInput.trim().toUpperCase().slice(0, 30);
  }

  try {
    const updated = await prisma.payroll_records.update({
      where: { payroll_id: payrollId },
      data: updateData,
      select: PAYROLL_SELECT,
    });
    return NextResponse.json({ success: true, data: serializeData(updated) });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json(
        { success: false, error: "Payroll record not found" },
        { status: 404 }
      );
    }
    throw error;
  }
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
        { success: false, error: "Only admins can update payroll" },
        { status: 403 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    return await handleUpdate(body);
  } catch (error) {
    console.error("Error updating payroll:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update payroll record" },
      { status: 500 }
    );
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
        { success: false, error: "Only admins can update payroll" },
        { status: 403 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    return await handleUpdate(body);
  } catch (error) {
    console.error("Error updating payroll:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update payroll record" },
      { status: 500 }
    );
  }
}
