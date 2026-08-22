# DayFlow Backend API

Base URL: `/api`

All responses use the envelope `{ "success": true, "data": ... }` or `{ "success": false, "error": "..." }`.

Authentication is shared across all endpoints (`getUserFromRequest`):
- `Authorization: Bearer <jwt>` header **or** the httpOnly `token` cookie (set by signin/signup).
- Roles are read from the database (`roles` / `user_roles` tables): `ADMIN`, `EMPLOYEE`.
- All IDs are returned as strings (BigInt serialization). Money values are numbers.
- Password hashes are never returned by any endpoint.

---

## Auth

### POST /auth/signup
Public.

Request:
```json
{ "employeeId": "EMP010", "email": "a@b.com", "password": "Str0ng!pass", "firstName": "A", "lastName": "B" }
```
- Always creates an `EMPLOYEE`-role account (client-supplied roles are ignored).
- Password policy: 8+ chars, uppercase, lowercase, digit, special char.

Success (200):
```json
{ "success": true, "data": { "id": "12", "employeeId": "EMP010", "email": "a@b.com", "role": "EMPLOYEE" } }
```
Errors: `400` invalid input/email/password policy, `409` email or employee ID exists, `500`.

### POST /auth/signin
Public.

Request: `{ "email": "...", "password": "..." }`

Success (200):
```json
{
  "success": true,
  "data": {
    "id": "1",
    "employeeId": "EMP001",
    "email": "admin@dayflow.com",
    "role": "ADMIN",
    "employee": { "firstName": "Rajesh", "...": "..." }
  }
}
```
Sets the `token` cookie (7 days). Errors: `400`, `401` invalid credentials, `500`.

### POST /auth/signout
Public. Clears the `token` cookie. Returns `{ "success": true, "message": "Signed out" }`.

### GET /auth/me
Auth required.

Success (200):
```json
{ "success": true, "data": { "id": "1", "employeeId": "EMP001", "email": "...", "role": "ADMIN", "roles": ["ADMIN"], "employee": { "...": "Employee record" } } }
```
Errors: `401`, `500`.

---

## Dashboard

### GET /dashboard
Any authenticated user.

**EMPLOYEE** success (200):
```json
{
  "success": true,
  "data": {
    "employee": { "...": "own profile (same shape as GET /employees)" },
    "attendance": { "today": { "...": "record or null" }, "thisMonth": { "present": 0, "absent": 0, "leave": 0, "halfDay": 0 } },
    "leave": { "pending": 0, "approved": 0, "rejected": 0 },
    "payroll": { "latest": { "...": "latest payroll record or null" } }
  }
}
```
**ADMIN** success (200):
```json
{
  "success": true,
  "data": {
    "stats": { "totalEmployees": 0, "presentToday": 0, "onLeaveToday": 0, "pendingLeaves": 0 },
    "recentLeaves": [],
    "recentAttendance": [],
    "latestPayroll": null
  }
}
```
Errors: `401`, `404` (employee without profile), `500`.

---

## Employees

### GET /employees
Auth required. ADMIN: all employees (array). EMPLOYEE: own profile (object), `404` if no profile.

Record shape (both roles):
```json
{
  "id": "5",
  "userId": "5",
  "employeeId": "EMP002",
  "email": "employee@dayflow.com",
  "role": "EMPLOYEE",
  "firstName": "Priya",
  "lastName": "Sharma",
  "dateOfBirth": "1995-01-01T00:00:00.000Z",
  "gender": "Female",
  "phone": "+91...",
  "address": "...",
  "department": "Engineering",
  "designation": "Software Developer",
  "dateOfJoining": "2026-01-01T00:00:00.000Z",
  "employmentType": "FULL_TIME",
  "profilePicture": "data:... | url | null",
  "basicSalary": 60000, "hra": 18000, "allowances": 8000, "deductions": 5000,
  "user": { "employeeId": "EMP002", "email": "...", "role": "EMPLOYEE" }
}
```
(`department`/`designation` are resolved names; salary values come from the active `salary_structures` row; `null` when absent.)

### POST /employees
ADMIN only (`403` otherwise). Creates a User + Employee (+ role link, + initial salary structure when salary fields are provided).

Request:
```json
{
  "employeeId": "EMP011", "email": "x@y.com", "password": "Str0ng!pass",
  "firstName": "X", "lastName": "Y", "role": "EMPLOYEE",
  "dateOfBirth": "1990-01-31", "gender": "Male",
  "department": "Sales", "designation": "Account Executive",
  "dateOfJoining": "2026-08-01", "employmentType": "FULL_TIME",
  "phone": "+91...", "address": "...", "profilePicture": "url",
  "basicSalary": 50000, "hra": 15000, "allowances": 5000, "deductions": 3000
}
```
Success: `201` with the mapped record above. Errors: `400` validation, `403`, `409` duplicate email/employeeId, `500`.

### PATCH /employees
Auth required.

- Self-service (no `employeeId` in body). Editable: `firstName`, `lastName`, `phone`, `address`, `gender`, `dateOfBirth` (YYYY-MM-DD), `profilePictureUrl` (legacy alias `profilePicture` also accepted).
- Employees cannot modify `employeeId`, `email`, `role`, salary, department, position, employment status (non-whitelisted keys are ignored).
- Sending `employeeId`: non-admin → `403`; ADMIN → updates the target employee (unknown → `404`) and may additionally set `department`/`designation` (by name, auto-created), `employmentType`/`employmentStatus`, `joiningDate`/`dateOfJoining`, and `basicSalary`/`hra`/`allowances`/`deductions` (updates latest salary structure or creates one).

Success (200): updated mapped record. Errors: `400`, `401`, `403`, `404` (no profile/target), `500`.

### DELETE /employees
ADMIN only. Body `{ "employeeId": "EMP011" }` or `?employeeId=`. Deletes the user account (cascades the employee row).

Success: `{ "success": true, "data": { "message": "Employee deleted successfully" } }`. Errors: `400`, `401`, `403`, `404`, `500`.

---

## Employee Documents

Fields: `documentId`, `employeeId`, `documentType`, `documentName`, `documentUrl`, `uploadedAt` (all BigInt ids serialized as strings). Ordered newest first (`uploadedAt desc`). No file storage — the provided URL is stored as-is.

### GET /employees/documents
Auth required. EMPLOYEE: own documents. ADMIN: all documents, or one employee's via `?employeeId=EMP002` (`404` unknown employee).

Success (200): `{ "success": true, "data": [ { "documentId": "3", "employeeId": "7", "documentType": "ID_PROOF", "documentName": "passport.pdf", "documentUrl": "https://...", "uploadedAt": "..." } ] }`

Errors: `401`, `404`, `500`.

### POST /employees/documents
Auth required.

Request:
```json
{ "employeeId": "EMP002", "documentType": "ID_PROOF", "documentName": "passport.pdf", "documentUrl": "https://..." }
```
- EMPLOYEE: may only create for themselves (someone else's `employeeId` → `403`). Omitting `employeeId` targets self.
- ADMIN: must pass `employeeId` (`400` if missing; `404` unknown).

Success: `201` with the created document. Errors: `400`, `401`, `403`, `404`, `500`.

### DELETE /employees/documents
Auth required. `documentId` via JSON body or `?documentId=` / `?id=`. EMPLOYEE: own documents only (`403` otherwise). ADMIN: any document.

Success: `{ "success": true, "data": { "message": "Document deleted", "documentId": "3" } }`. Errors: `400` invalid/missing id, `401`, `403`, `404`, `500`.

---

## Attendance

Record shape: schema fields plus aliases `id` (= attendanceId) and `date` (= attendanceDate); includes `employee.user { employeeId, email }`.

### GET /attendance
Auth required. Default range: current month.

Query params:
- `date=YYYY-MM-DD` — single day
- `week=YYYY-MM-DD` — 7 days from that date
- `employeeId=EMP001` — ADMIN only (filters by that employee)
- Invalid date/week formats → `400`

EMPLOYEE sees only their own records (`404` if no employee profile).

### POST /attendance
EMPLOYEE role only (admins get `403`). Body: `{ "action": "checkin" | "checkout" }` — acts on today.

- `checkin`: creates today's record (`status: PRESENT`, `checkIn: now`). Already checked in → `400`.
- `checkout`: sets `checkOut = now` on today's record. No record → `400`.

Success (200): `{ "success": true, "data": { "...": "attendance record" } }`

### PUT /attendance
ADMIN only (`403` otherwise). Manual create/update — one record per employee per date (upsert on `employee_id + attendance_date`).

Request:
```json
{ "employeeId": "EMP002", "date": "2026-08-22", "status": "PRESENT", "checkIn": "09:00", "checkOut": "17:00" }
```
- `status`: `PRESENT | ABSENT | HALF_DAY | LEAVE` (invalid → `400`)
- `date` must be a real `YYYY-MM-DD` date (`400`)
- `checkIn`/`checkOut` optional `HH:MM` (`400` invalid; forced `null` for `ABSENT`/`LEAVE`; `checkOut` must be after `checkIn`)
- Unknown employee → `404`

Success (200): `{ "success": true, "data": { "...": "upserted record with id/date aliases" } }`

---

## Leave

Response aliases included on every leave object: `id` (= leaveRequestId), `type` (= leave type name), `remarks` (= reason), `createdAt` (= appliedAt), `adminComments` (first approval comment). Includes `employee (+ user {employeeId, email})`, `leaveType`, `approvals`. Ordered newest first.

### GET /leave
Auth required. EMPLOYEE: own requests. ADMIN: all requests. Optional `?status=PENDING|APPROVED|REJECTED` (case-insensitive) for both roles.

### POST /leave
EMPLOYEE role only (`403` otherwise; `404` if no employee profile).

Request:
```json
{ "leaveTypeId": 1, "startDate": "2026-09-01", "endDate": "2026-09-03", "reason": "Family function" }
```
Legacy fallbacks accepted: `type` (leave-type name instead of id) and `remarks` (instead of `reason`).

Validation (`400`): required fields, real `YYYY-MM-DD` dates, `endDate >= startDate`, leave type must exist.

Success: `201` with the created request (`status: PENDING`).

### PUT /leave  (and PATCH /leave — identical)
ADMIN only (`403` otherwise).

Request:
```json
{ "leaveRequestId": "12", "decision": "APPROVED", "comments": "Enjoy!" }
```
Legacy aliases accepted: `id`, `status` (instead of `decision`), `adminComments` (instead of `comments`).

- `400` invalid/missing fields · `404` request not found · `403` if the admin has no employee record to attach as approver.
- Atomically creates or updates the `LeaveApproval` row and sets `LeaveRequest.status` to the decision.

Success (200): updated leave request (with includes/aliases).

### DELETE /leave
Auth required. `leaveRequestId` via JSON body or `?leaveRequestId=` / `?id=`.

- EMPLOYEE: own request AND `status === PENDING` only (`403` not owner, `400` otherwise).
- ADMIN: any request.

Success: `{ "success": true, "data": { "message": "Leave request deleted", "leaveRequestId": "12" } }`. Errors: `400`, `401`, `403`, `404`, `500`.

---

## Payroll

Every record includes both schema fields (`payroll_id`, `gross_salary`, ...) and frontend-friendly aliases: `id`, `month` (1–12), `year`, `basicSalary` (= gross_salary), `hra` / `allowances` (from the latest salary structure, else 0), `deductions` (= total_deductions), `netSalary`, `status` (= payment_status). Includes `employees.user { employeeId, email }`. Ordered by month, newest first.

### GET /payroll
Auth required. EMPLOYEE: own records (`404` no profile). ADMIN: all records, optional `?employeeId=EMP002` (unknown → empty list).

Month filtering: `?month=8&year=2026` (integers) or `?month=2026-08` / `?month=2026-08-01`. Invalid values → `400`.

### POST /payroll
ADMIN only (`403` otherwise).

Request:
```json
{ "employeeId": "EMP002", "month": "2026-08", "grossSalary": 60000, "totalDeductions": 5000, "netSalary": 55000, "paymentStatus": "PAID" }
```
Aliases: `payroll_month`/`payrollMonth`, `gross_salary`, `total_deductions`, `net_salary`, `payment_status`, `status`.

- `netSalary` defaults to `grossSalary - totalDeductions` (rounded to 2 decimals); negative values rejected (`400`).
- Unknown employee → `404`. Duplicate for same employee + month → `409`.

Success: `201` with the created record.

### PUT /payroll  (and PATCH /payroll — identical)
ADMIN only (`403` otherwise).

Request: `{ "payrollId": "9", "grossSalary": 65000, "totalDeductions": 5000, "paymentStatus": "PAID" }`
(`id` accepted instead of `payrollId`; `basicSalary` accepted as an alias of gross salary.)

Recomputes net when gross/deductions change and net isn't supplied. Errors: `400` invalid id/values, `401`, `403`, `404` record not found, `500`.

---

## Notifications

Fields: `notification_id`, `user_id` (serialized strings), `title`, `message`, `notification_type`, `is_read`, `created_at`. Newest first.

### GET /notifications
Auth required. Returns only the caller's notifications. Optional `?unread=true` (only unread).

### POST /notifications
ADMIN only (`403` otherwise).

```json
{ "userId": "7", "title": "Payslip ready", "message": "August payslip is available.", "notificationType": "PAYROLL" }
```
- `400` invalid/missing fields (`title` ≤ 255 chars, `notificationType` ≤ 50)
- `404` target user does not exist

Success: `201` with the created notification (`is_read: false`).

### PATCH /notifications
Auth required. Marks a notification read/unread — owner only (even admins cannot modify others').

```json
{ "notificationId": "15", "isRead": true }
```
`isRead` defaults to `true` (`"true"`/`"false"` strings tolerated). Errors: `400`, `401`, `403` not owner, `404`, `500`.

### DELETE /notifications
Auth required. `notificationId` via JSON body or `?notificationId=` / `?id=`. Users delete only their own (`403` otherwise); ADMIN may delete any.

Success: `{ "success": true, "data": { "message": "Notification deleted", "notification_id": "15" } }`. Errors: `400`, `401`, `403`, `404`, `500`.

---

## Common error codes

| Code | Meaning |
| --- | --- |
| 400 | Invalid input (bad format, missing/invalid fields) |
| 401 | Missing/invalid credentials |
| 403 | Authenticated but not allowed (wrong role / not owner) |
| 404 | Record/profile not found |
| 409 | Conflict (duplicate payroll/user) |
| 500 | Unexpected server error |

## Notes

- `src/middleware.ts` redirects unauthenticated page navigations to `/signin`; API routes always enforce authentication themselves.
- Seed accounts are created by `prisma/seed.ts` (see its console output after seeding).
