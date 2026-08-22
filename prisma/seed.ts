import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function ensureRole(roleName: string) {
  return prisma.role.upsert({
    where: { roleName },
    update: {},
    create: { roleName },
  });
}

async function ensureDepartment(departmentName: string) {
  return prisma.department.upsert({
    where: { departmentName },
    update: {},
    create: { departmentName },
  });
}

async function ensurePosition(positionName: string) {
  const existing = await prisma.jobPosition.findFirst({
    where: { positionName },
  });
  if (existing) return existing;
  return prisma.jobPosition.create({ data: { positionName } });
}

async function assignRole(userId: bigint, roleName: string) {
  const role = await ensureRole(roleName);
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.roleId } },
    update: {},
    create: { userId, roleId: role.roleId },
  });
}

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const empPasswordHash = await bcrypt.hash("Employee@123", 10);

  const adminRole = await ensureRole("ADMIN");
  const employeeRole = await ensureRole("EMPLOYEE");

  const hrDepartment = await ensureDepartment("Human Resources");
  const engineeringDepartment = await ensureDepartment("Engineering");
  const hrManagerPosition = await ensurePosition("HR Manager");
  const developerPosition = await ensurePosition("Software Developer");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@dayflow.com" },
    update: {},
    create: {
      employeeId: "EMP001",
      email: "admin@dayflow.com",
      passwordHash: adminPasswordHash,
      employee: {
        create: {
          firstName: "Rajesh",
          lastName: "Kumar",
          department: { connect: { departmentId: hrDepartment.departmentId } },
          position: { connect: { positionId: hrManagerPosition.positionId } },
          phone: "+91-9876543210",
          address: "12 MG Road, Bangalore, Karnataka 560001",
          gender: "Male",
          employmentStatus: "ACTIVE",
        },
      },
    },
  });
  await assignRole(adminUser.userId, "ADMIN");

  const empUser = await prisma.user.upsert({
    where: { email: "employee@dayflow.com" },
    update: {},
    create: {
      employeeId: "EMP002",
      email: "employee@dayflow.com",
      passwordHash: empPasswordHash,
      employee: {
        create: {
          firstName: "Priya",
          lastName: "Sharma",
          department: {
            connect: { departmentId: engineeringDepartment.departmentId },
          },
          position: { connect: { positionId: developerPosition.positionId } },
          phone: "+91-9876543211",
          address: "45 Indiranagar, Bangalore, Karnataka 560038",
          joiningDate: new Date(new Date().getFullYear(), 0, 1),
          gender: "Female",
          employmentStatus: "ACTIVE",
        },
      },
    },
  });
  await assignRole(empUser.userId, "EMPLOYEE");

  const emp = await prisma.employee.findUnique({
    where: { userId: empUser.userId },
  });

  if (emp) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    for (let i = 0; i < 5; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      date.setHours(0, 0, 0, 0);
      if (date > today) break;

      const checkIn = new Date(date);
      checkIn.setHours(9, Math.floor(Math.random() * 30), 0, 0);
      const checkOut = new Date(date);
      checkOut.setHours(18, Math.floor(Math.random() * 30), 0, 0);

      await prisma.attendance.upsert({
        where: {
          employeeId_attendanceDate: {
            employeeId: emp.employeeId,
            attendanceDate: date,
          },
        },
        update: {},
        create: {
          employeeId: emp.employeeId,
          attendanceDate: date,
          checkIn,
          checkOut,
          status: "PRESENT",
        },
      });
    }

    const salaryStructure = await prisma.salaryStructure.findFirst({
      where: { employeeId: emp.employeeId },
    });

    if (!salaryStructure) {
      await prisma.salaryStructure.create({
        data: {
          employeeId: emp.employeeId,
          basicSalary: 60000,
          hra: 18000,
          allowances: 8000,
          deductions: 5000,
          effectiveFrom: new Date(today.getFullYear(), today.getMonth(), 1),
        },
      });
    }

    const payrollMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    await prisma.payroll_records.upsert({
      where: {
        employee_id_payroll_month: {
          employee_id: emp.employeeId,
          payroll_month: payrollMonth,
        },
      },
      update: {},
      create: {
        employee_id: emp.employeeId,
        payroll_month: payrollMonth,
        gross_salary: 60000,
        total_deductions: 5000,
        net_salary: 55000,
        payment_status: "PAID",
      },
    });

    const leaveType = await prisma.leaveType.upsert({
      where: { typeName: "PAID" },
      update: {},
      create: { typeName: "PAID", description: "Paid leave" },
    });

    await prisma.leaveRequest.create({
      data: {
        employeeId: emp.employeeId,
        leaveTypeId: leaveType.leaveTypeId,
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6),
        reason: "Family function",
        status: "PENDING",
      },
    });
  }

  console.log("Seed complete:");
  console.log("  Admin:    admin@dayflow.com / Admin@123");
  console.log("  Employee: employee@dayflow.com / Employee@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
