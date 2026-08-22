INSERT INTO roles (role_name)
VALUES
    ('ADMIN'),
    ('HR'),
    ('EMPLOYEE');

INSERT INTO leave_types (type_name, description)
VALUES
    ('PAID', 'Paid leave'),
    ('SICK', 'Sick leave'),
    ('UNPAID', 'Unpaid leave');

INSERT INTO departments (department_name, description)
VALUES
    ('Engineering', 'Software development and technology'),
    ('Human Resources', 'Employee and HR operations'),
    ('Finance', 'Financial and payroll operations'),
    ('Operations', 'General business operations');
    