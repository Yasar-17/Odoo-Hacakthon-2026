import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const empPasswordHash = await bcrypt.hash("Employee@123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@dayflow.com" },
    update: {},
    create: {
      employeeId: "EMP001",
      email: "admin@dayflow.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      employee: {
        create: {
          firstName: "Rajesh",
          lastName: "Kumar",
          department: "Human Resources",
          designation: "HR Manager",
          phone: "+91-9876543210",
          address: "12 MG Road, Bangalore, Karnataka 560001",
          basicSalary: 80000,
          hra: 24000,
          allowances: 12000,
          deductions: 8000,
          employmentType: "FULL_TIME",
          gender: "Male",
        },
      },
    },
  });

  const empUser = await prisma.user.upsert({
    where: { email: "employee@dayflow.com" },
    update: {},
    create: {
      employeeId: "EMP002",
      email: "employee@dayflow.com",
      passwordHash: empPasswordHash,
      role: "EMPLOYEE",
      employee: {
        create: {
          firstName: "Priya",
          lastName: "Sharma",
          department: "Engineering",
          designation: "Software Developer",
          phone: "+91-9876543211",
          address: "45 Indiranagar, Bangalore, Karnataka 560038",
          basicSalary: 60000,
          hra: 18000,
          allowances: 8000,
          deductions: 5000,
          employmentType: "FULL_TIME",
          gender: "Female",
        },
      },
    },
  });

  const emp = await prisma.employee.findUnique({
    where: { userId: empUser.id },
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
        where: { employeeId_date: { employeeId: emp.id, date } },
        update: {},
        create: {
          employeeId: emp.id,
          date,
          checkIn,
          checkOut,
          status: "PRESENT",
        },
      });
    }

    await prisma.payroll.upsert({
      where: { employeeId_month_year: { employeeId: emp.id, month: today.getMonth() + 1, year: today.getFullYear() } },
      update: {},
      create: {
        employeeId: emp.id,
        basicSalary: 60000,
        hra: 18000,
        allowances: 8000,
        deductions: 5000,
        netSalary: 81000,
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        status: "PAID",
      },
    });

    await prisma.leaveRequest.create({
      data: {
        employeeId: emp.id,
        type: "PAID",
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6),
        remarks: "Family function",
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
