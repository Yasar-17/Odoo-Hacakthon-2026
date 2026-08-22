import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getUserFromRequest,
  isAdminUser,
  hashPassword,
  validateEmail,
  validatePassword,
  assignUserRole,
  serializeData,
} from "@/lib/auth";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const EMPLOYEE_INCLUDE = {
  department: true,
  position: true,
  user: {
    select: {
      employeeId: true,
      email: true,
      userRoles: { include: { role: true } },
    },
  },
  salaryStructures: { orderBy: { effectiveFrom: Prisma.SortOrder.desc } },
} satisfies Prisma.EmployeeInclude;

type EmployeeWithRelations = Prisma.EmployeeGetPayload<{
  include: typeof EMPLOYEE_INCLUDE;
}>;

function resolveUserRole(employee: EmployeeWithRelations): "ADMIN" | "EMPLOYEE" {
  const roles = employee.user?.userRoles ?? [];
  return roles.some((ur) => ur.role.roleName?.toUpperCase() === "ADMIN")
    ? "ADMIN"
    : "EMPLOYEE";
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

function parseOptionalDate(value: unknown): Date | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  return parseDateOnly(value) ?? undefined;
}

function parseMoney(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
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
    return undefined;
  }
  if (num < 0) return undefined;
  return Math.round(num * 100) / 100;
}

function pickSalaryStructure(employee: EmployeeWithRelations) {
  const now = new Date();
  return (
    employee.salaryStructures.find(
      (structure) =>
        structure.effectiveTo === null || structure.effectiveTo >= now
    ) ?? employee.salaryStructures[0]
  );
}

function mapEmployeeForClient(employee: EmployeeWithRelations) {
  const structure = pickSalaryStructure(employee);
  const role = resolveUserRole(employee);
  return {
    ...employee,
    id: employee.employeeId.toString(),
    userId: employee.userId ? employee.userId.toString() : null,
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
    user: employee.user
      ? { employeeId: employee.user.employeeId, email: employee.user.email, role }
      : undefined,
    role,
  };
}

async function resolveDepartmentByName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  return prisma.department.upsert({
    where: { departmentName: trimmed },
    update: {},
    create: { departmentName: trimmed },
  });
}

async function resolvePositionByName(name: string, departmentId?: number) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = await prisma.jobPosition.findFirst({
    where: { positionName: trimmed },
  });
  if (existing) return existing;
  return prisma.jobPosition.create({
    data: { positionName: trimmed, ...(departmentId ? { departmentId } : {}) },
  });
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdminUser(user.userId);
    if (admin) {
      const employees = await prisma.employee.findMany({
        include: EMPLOYEE_INCLUDE,
        orderBy: { firstName: "asc" },
      });
      return NextResponse.json({
        success: true,
        data: serializeData(employees.map((employee) => mapEmployeeForClient(employee))),
      });
    }

    const employee = await prisma.employee.findUnique({
      where: { userId: user.userId },
      include: EMPLOYEE_INCLUDE,
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: serializeData(mapEmployeeForClient(employee)),
    });
  } catch (error) {
    console.error("GET employees error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdminUser(authUser.userId))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const employeeId = body.employeeId;
    const email = body.email;
    const password = body.password;

    if (
      !employeeId ||
      !email ||
      !password ||
      typeof employeeId !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "employeeId, email, password, firstName, and lastName are required",
        },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.error },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { employeeId }] },
    });

    if (existingUser) {
      const conflictField =
        existingUser.employeeId === employeeId ? "Employee ID" : "Email";
      return NextResponse.json(
        { success: false, error: `${conflictField} already exists` },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const dob = parseOptionalDate(body.dateOfBirth);
    const doj = parseOptionalDate(body.dateOfJoining);
    const requestedRole =
      typeof body.role === "string" && body.role.toUpperCase() === "ADMIN"
        ? "ADMIN"
        : "EMPLOYEE";

    let departmentRecord = null;
    if (typeof body.department === "string" && body.department.trim()) {
      departmentRecord = await resolveDepartmentByName(body.department);
    }
    let positionRecord = null;
    if (typeof body.designation === "string" && body.designation.trim()) {
      positionRecord = await resolvePositionByName(
        body.designation,
        departmentRecord?.departmentId
      );
    }

    const basicSalary = parseMoney(body.basicSalary);
    const hra = parseMoney(body.hra);
    const allowances = parseMoney(body.allowances);
    const deductions = parseMoney(body.deductions);
    const hasSalary =
      basicSalary !== undefined ||
      hra !== undefined ||
      allowances !== undefined ||
      deductions !== undefined;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          employeeId,
          email,
          passwordHash,
          employee: {
            create: {
              firstName:
                typeof body.firstName === "string" && body.firstName.trim()
                  ? body.firstName.trim()
                  : "New",
              lastName:
                typeof body.lastName === "string" && body.lastName.trim()
                  ? body.lastName.trim()
                  : "Employee",
              ...(dob ? { dateOfBirth: dob } : {}),
              ...(typeof body.gender === "string" && body.gender
                ? { gender: body.gender }
                : {}),
              ...(departmentRecord ? { departmentId: departmentRecord.departmentId } : {}),
              ...(positionRecord ? { positionId: positionRecord.positionId } : {}),
              ...(doj ? { joiningDate: doj } : {}),
              ...(typeof body.employmentType === "string" && body.employmentType
                ? { employmentStatus: body.employmentType }
                : {}),
              ...(typeof body.phone === "string" && body.phone ? { phone: body.phone } : {}),
              ...(typeof body.address === "string" && body.address
                ? { address: body.address }
                : {}),
              ...(typeof body.profilePicture === "string" && body.profilePicture
                ? { profilePictureUrl: body.profilePicture }
                : {}),
              ...(hasSalary
                ? {
                    salaryStructures: {
                      create: {
                        basicSalary: basicSalary ?? 0,
                        ...(hra !== undefined ? { hra } : {}),
                        ...(allowances !== undefined ? { allowances } : {}),
                        ...(deductions !== undefined ? { deductions } : {}),
                        effectiveFrom: doj ?? new Date(),
                      },
                    },
                  }
                : {}),
            },
          },
        },
        include: { employee: { include: EMPLOYEE_INCLUDE } },
      });
      return user;
    });

    await assignUserRole(result.userId, requestedRole);

    if (!result.employee) {
      return NextResponse.json(
        { success: false, error: "Failed to load created employee" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: serializeData(mapEmployeeForClient(result.employee)),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST employees error:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { success: false, error: "User with this email or employee ID already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isAdminUser(authUser.userId))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { searchParams } = new URL(req.url);
    const employeeId =
      typeof body.employeeId === "string"
        ? body.employeeId
        : searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "employeeId is required" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({ where: { employeeId } });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { userId: targetUser.userId } });

    return NextResponse.json({
      success: true,
      data: { message: "Employee deleted successfully" },
    });
  } catch (error) {
    console.error("DELETE employees error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

const SELF_EDITABLE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "address",
  "gender",
  "dateOfBirth",
  "profilePictureUrl",
] as const;

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const admin = await isAdminUser(user.userId);
    const targetPublicId =
      typeof body.employeeId === "string" && body.employeeId.trim()
        ? body.employeeId.trim()
        : null;

    if (targetPublicId && !admin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    let targetUserId = user.userId;
    if (targetPublicId && admin) {
      const targetUser = await prisma.user.findUnique({
        where: { employeeId: targetPublicId },
      });
      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: "Employee not found" },
          { status: 404 }
        );
      }
      targetUserId = targetUser.userId;
    }

    const employeeUpdates: Record<string, unknown> = {};

    if (body.firstName !== undefined && typeof body.firstName === "string") {
      employeeUpdates.firstName = body.firstName.trim().slice(0, 100) || undefined;
    }
    if (body.lastName !== undefined && typeof body.lastName === "string") {
      employeeUpdates.lastName = body.lastName.trim().slice(0, 100) || null;
    }
    if (body.phone !== undefined && typeof body.phone === "string") {
      employeeUpdates.phone = body.phone.slice(0, 20) || null;
    }
    if (body.address !== undefined && typeof body.address === "string") {
      employeeUpdates.address = body.address || null;
    }
    if (body.gender !== undefined && typeof body.gender === "string") {
      employeeUpdates.gender = body.gender.slice(0, 20) || null;
    }
    if (body.dateOfBirth !== undefined) {
      const dob = parseOptionalDate(body.dateOfBirth);
      if (body.dateOfBirth && !dob) {
        return NextResponse.json(
          { success: false, error: "dateOfBirth must be a valid YYYY-MM-DD date" },
          { status: 400 }
        );
      }
      if (dob) employeeUpdates.dateOfBirth = dob;
    }
    if (
      body.profilePictureUrl !== undefined &&
      typeof body.profilePictureUrl === "string"
    ) {
      employeeUpdates.profilePictureUrl = body.profilePictureUrl || null;
    } else if (
      body.profilePicture !== undefined &&
      typeof body.profilePicture === "string"
    ) {
      employeeUpdates.profilePictureUrl = body.profilePicture || null;
    }

    if (!admin) {
      for (const key of Object.keys(employeeUpdates)) {
        if (!(SELF_EDITABLE_FIELDS as readonly string[]).includes(key)) {
          delete employeeUpdates[key];
        }
      }
    } else {
      if (typeof body.department === "string" && body.department.trim()) {
        const departmentRecord = await resolveDepartmentByName(body.department);
        if (departmentRecord) employeeUpdates.departmentId = departmentRecord.departmentId;
      }
      if (typeof body.designation === "string" && body.designation.trim()) {
        const departmentId =
          typeof employeeUpdates.departmentId === "number"
            ? employeeUpdates.departmentId
            : undefined;
        const positionRecord = await resolvePositionByName(
          body.designation,
          departmentId
        );
        if (positionRecord) employeeUpdates.positionId = positionRecord.positionId;
      }
      if (body.employmentType !== undefined && typeof body.employmentType === "string") {
        employeeUpdates.employmentStatus = body.employmentType || null;
      }
      if (body.employmentStatus !== undefined && typeof body.employmentStatus === "string") {
        employeeUpdates.employmentStatus = body.employmentStatus || null;
      }
      if (body.joiningDate !== undefined || body.dateOfJoining !== undefined) {
        const doj = parseOptionalDate(body.joiningDate ?? body.dateOfJoining);
        if ((body.joiningDate ?? body.dateOfJoining) && !doj) {
          return NextResponse.json(
            { success: false, error: "dateOfJoining must be a valid YYYY-MM-DD date" },
            { status: 400 }
          );
        }
        if (doj) employeeUpdates.joiningDate = doj;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.update({
        where: { userId: targetUserId },
        data: employeeUpdates,
        include: EMPLOYEE_INCLUDE,
      });

      if (admin) {
        const salaryInput = {
          basicSalary: parseMoney(body.basicSalary),
          hra: parseMoney(body.hra),
          allowances: parseMoney(body.allowances),
          deductions: parseMoney(body.deductions),
        };
        const hasSalaryUpdate = Object.values(salaryInput).some((v) => v !== undefined);

        if (hasSalaryUpdate) {
          const latestStructure = await tx.salaryStructure.findFirst({
            where: { employeeId: employee.employeeId },
            orderBy: { effectiveFrom: "desc" },
          });

          const structureData = {
            ...(salaryInput.basicSalary !== undefined
              ? { basicSalary: salaryInput.basicSalary }
              : {}),
            ...(salaryInput.hra !== undefined ? { hra: salaryInput.hra } : {}),
            ...(salaryInput.allowances !== undefined
              ? { allowances: salaryInput.allowances }
              : {}),
            ...(salaryInput.deductions !== undefined
              ? { deductions: salaryInput.deductions }
              : {}),
          };

          if (latestStructure) {
            await tx.salaryStructure.update({
              where: { salaryId: latestStructure.salaryId },
              data: structureData,
            });
          } else {
            await tx.salaryStructure.create({
              data: {
                employeeId: employee.employeeId,
                basicSalary: salaryInput.basicSalary ?? 0,
                effectiveFrom: new Date(),
                ...structureData,
              },
            });
          }

          const refreshed = await tx.employee.findUniqueOrThrow({
            where: { employeeId: employee.employeeId },
            include: EMPLOYEE_INCLUDE,
          });
          return refreshed;
        }
      }

      return employee;
    });

    return NextResponse.json({
      success: true,
      data: serializeData(mapEmployeeForClient(updated)),
    });
  } catch (error) {
    console.error("PATCH employees error:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { success: false, error: "Employee profile not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
