export type { User, Employee, Attendance, LeaveRequest, Payroll } from "@prisma/client";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthUser {
  id: string;
  employeeId: string;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    department?: string | null;
    designation?: string | null;
    profilePicture?: string | null;
  };
}

export interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
}

export interface LeaveRequestData {
  id: string;
  type: "PAID" | "SICK" | "UNPAID";
  startDate: string;
  endDate: string;
  remarks?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminComments?: string | null;
  createdAt: string;
  employee?: {
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

export interface PayrollData {
  id: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  month: number;
  year: number;
  status: string;
}

export interface EmployeeData {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  department?: string | null;
  designation?: string | null;
  phone?: string | null;
  address?: string | null;
  profilePicture?: string | null;
  basicSalary?: number | null;
  hra?: number | null;
  allowances?: number | null;
  deductions?: number | null;
  employmentType?: string | null;
  dateOfJoining: string;
  user: {
    employeeId: string;
    email: string;
    role: string;
  };
}
