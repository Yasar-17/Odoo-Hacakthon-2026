CREATE TABLE salary_structures (
    salary_id BIGSERIAL PRIMARY KEY,

    employee_id BIGINT NOT NULL
        REFERENCES employees(employee_id)
        ON DELETE CASCADE,

    basic_salary NUMERIC(12,2) NOT NULL,

    hra NUMERIC(12,2) DEFAULT 0,

    allowances NUMERIC(12,2) DEFAULT 0,

    deductions NUMERIC(12,2) DEFAULT 0,

    effective_from DATE NOT NULL,

    effective_to DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (basic_salary >= 0),

    CHECK (hra >= 0),

    CHECK (allowances >= 0),

    CHECK (deductions >= 0)
);