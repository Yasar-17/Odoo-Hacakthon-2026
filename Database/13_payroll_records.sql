CREATE TABLE payroll_records (
    payroll_id BIGSERIAL PRIMARY KEY,

    employee_id BIGINT NOT NULL
        REFERENCES employees(employee_id)
        ON DELETE CASCADE,

    salary_id BIGINT
        REFERENCES salary_structures(salary_id)
        ON DELETE SET NULL,

    payroll_month DATE NOT NULL,

    gross_salary NUMERIC(12,2) NOT NULL,

    total_deductions NUMERIC(12,2) DEFAULT 0,

    net_salary NUMERIC(12,2) NOT NULL,

    payment_status VARCHAR(30) DEFAULT 'PENDING',

    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(employee_id, payroll_month),

    CHECK (gross_salary >= 0),

    CHECK (total_deductions >= 0),

    CHECK (net_salary >= 0)
);