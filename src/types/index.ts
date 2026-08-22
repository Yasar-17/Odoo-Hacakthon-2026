export type {
  User,
  Employee,
  Attendance,
  LeaveRequest,
  LeaveType,
  LeaveApproval,
  EmployeeDocument,
  SalaryStructure,
} from "@prisma/client";
export type { payroll_records as Payroll } from "@prisma/client";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthUser {
  userId: string;
  employeeId: string;
  email: string;
  role: "EMPLOYEE" | "ADMIN";
  employee?: {
    employeeId: string;
    firstName: string;
    lastName: string;
    departmentId?: number | null;
    positionId?: number | null;
    profilePictureUrl?: string | null;
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
  type: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  comments?: string | null;
  createdAt: string;
  employee?: {
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

export interface PayrollData {
  id: string;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  payrollMonth: string;
  paymentStatus: string;
}

export interface EmployeeData {
  employeeId: string;
  userId: string;
  firstName: string;
  lastName: string;
  departmentId?: number | null;
  positionId?: number | null;
  phone?: string | null;
  address?: string | null;
  profilePictureUrl?: string | null;
  employmentStatus?: string | null;
  user: {
    employeeId: string;
    email: string;
  };
}
