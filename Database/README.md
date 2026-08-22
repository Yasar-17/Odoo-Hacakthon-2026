# Dayflow Database

PostgreSQL database schema for the Dayflow HRMS project.

## Tables

1. users
2. roles
3. user_roles
4. departments
5. job_positions
6. employees
7. employee_documents
8. attendance
9. leave_types
10. leave_requests
11. leave_approvals
12. salary_structures
13. payroll_records
14. notifications
15. audit_logs

## Setup

1. Create a PostgreSQL database named `dayflow`.
2. Run the SQL files in numerical order.
3. Run `16_seed_data.sql`.
4. The database is then ready for backend integration.

## Database

- PostgreSQL
- Managed/developed using pgAdmin