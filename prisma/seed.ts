import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const empPasswordHash = await bcrypt.hash("Employee@123", 10);

  const adminRole = await prisma.role.upsert({
    where: { roleName: "ADMIN" },
    update: {},
    create: { roleName: "ADMIN" },
  });

  const employeeRole = await prisma.role.upsert({
    where: { roleName: "EMPLOYEE" },
    update: {},
    create: { roleName: "EMPLOYEE" },
  });

  const hrDept = await prisma.department.upsert({
    where: { departmentName: "Human Resources" },
    update: {},
    create: { departmentName: "Human Resources", description: "HR Department" },
  });

  const engDept = await prisma.department.upsert({
    where: { departmentName: "Engineering" },
    update: {},
    create: { departmentName: "Engineering", description: "Engineering Department" },
  });

  const hrPosition = await prisma.jobPosition.upsert({
    where: { positionId: 1 },
    update: {},
    create: { positionId: 1, positionName: "HR Manager", departmentId: hrDept.departmentId },
  });

  const devPosition = await prisma.jobPosition.upsert({
    where: { positionId: 2 },
    update: {},
    create: { positionId: 2, positionName: "Software Developer", departmentId: engDept.departmentId },
  });

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
          departmentId: hrDept.departmentId,
          positionId: hrPosition.positionId,
          phone: "+91-9876543210",
          address: "12 MG Road, Bangalore, Karnataka 560001",
          gender: "Male",
          employmentStatus: "ACTIVE",
        },
      },
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.userId, roleId: adminRole.roleId } },
    update: {},
    create: { userId: adminUser.userId, roleId: adminRole.roleId },
  });

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
          departmentId: engDept.departmentId,
          positionId: devPosition.positionId,
          phone: "+91-9876543211",
          address: "45 Indiranagar, Bangalore, Karnataka 560038",
          gender: "Female",
          employmentStatus: "ACTIVE",
        },
      },
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: empUser.userId, roleId: employeeRole.roleId } },
    update: {},
    create: { userId: empUser.userId, roleId: employeeRole.roleId },
  });

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
      if (date > today) break;

      const checkIn = new Date(date);
      checkIn.setHours(9, Math.floor(Math.random() * 30), 0, 0);
      const checkOut = new Date(date);
      checkOut.setHours(18, Math.floor(Math.random() * 30), 0, 0);

      await prisma.attendance.upsert({
        where: { employeeId_attendanceDate: { employeeId: emp.employeeId, attendanceDate: date } },
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

    const salaryStructure = await prisma.salaryStructure.create({
      data: {
        employeeId: emp.employeeId,
        basicSalary: 60000,
        hra: 18000,
        allowances: 8000,
        deductions: 5000,
        effectiveFrom: new Date(today.getFullYear(), today.getMonth(), 1),
      },
    });

    const payrollMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    await prisma.payroll_records.upsert({
      where: { employee_id_payroll_month: { employee_id: emp.employeeId, payroll_month: payrollMonth } },
      update: {},
      create: {
        employee_id: emp.employeeId,
        salary_id: salaryStructure.salaryId,
        payroll_month: payrollMonth,
        gross_salary: 86000,
        total_deductions: 5000,
        net_salary: 81000,
        payment_status: "PAID",
      },
    });

    let leaveType = await prisma.leaveType.findFirst({ where: { typeName: "PAID" } });
    if (!leaveType) {
      leaveType = await prisma.leaveType.create({ data: { typeName: "PAID", description: "Paid Leave" } });
    }

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
