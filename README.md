# DayFlow – Human Resource Management System

DayFlow is a web-based Human Resource Management System (HRMS) developed for the **Odoo Hackathon 2026**.

The application provides a centralized platform for managing employees, attendance, leave requests, payroll, roles, authentication, and HR-related information.

## 🚀 Features

### 🔐 Authentication & Authorization
- User registration and login
- JWT-based authentication
- Secure password hashing
- HTTP-only authentication cookies
- Role-based access control
- Admin and Employee roles
- Protected API endpoints

### 👨‍💼 Employee Management
- Employee profiles
- Employee ID management
- Department and job position management
- Joining date and employment status
- Contact and personal information
- Employee document management

### 📊 Dashboard
#### Admin Dashboard
- Total employees
- Employees present today
- Employees on leave
- Pending leave requests
- Recent attendance
- Recent leave requests
- Latest payroll information

#### Employee Dashboard
- Personal employee information
- Today's attendance
- Monthly attendance summary
- Leave request status
- Latest payroll information

### ⏰ Attendance Management
- Employee check-in
- Employee check-out
- Attendance status
- Daily attendance records
- Monthly attendance statistics
- Total working hours
- Attendance remarks

### 🏖️ Leave Management
- Leave type management
- Leave requests
- Leave approval workflow
- Pending, approved and rejected leave status
- Leave request history
- Admin approval functionality

### 💰 Payroll Management
- Employee salary structures
- Basic salary
- HRA
- Allowances
- Deductions
- Gross salary
- Net salary
- Monthly payroll records
- Payment status

### 🔔 Notifications & Audit Logs
- User notifications
- Read/unread notification status
- Audit logging
- Tracking database-related actions

---

## 🛠️ Technology Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Next.js API Routes
- TypeScript
- JWT
- bcryptjs

### Database
- PostgreSQL
- Prisma ORM

### Development Tools
- Node.js
- npm
- Git & GitHub

The project uses Next.js, React, TypeScript, Prisma, PostgreSQL (`pg`), JWT, bcryptjs and Tailwind CSS. 

---

## 🏗️ Project Structure

```text
Odoo-Hacakthon-2026/
│
├── Backend/
│   └── Backend-related resources
│
├── Database/
│   ├── 01_users.sql
│   ├── 02_roles.sql
│   ├── 03_user_roles.sql
│   ├── 04_departments.sql
│   ├── 05_job_positions.sql
│   ├── 06_employees.sql
│   ├── 07_employee_documents.sql
│   ├── 08_attendance.sql
│   ├── 09_leave_types.sql
│   ├── 10_leave_requests.sql
│   ├── 11_leave_approvals.sql
│   ├── 12_salary_structures.sql
│   └── 13_payroll_records.sql
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   └── Application source code
│
├── BACKEND_API.md
├── next.config.js
├── package.json
├── package-lock.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
