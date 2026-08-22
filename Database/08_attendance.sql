CREATE TABLE attendance (
    attendance_id BIGSERIAL PRIMARY KEY,

    employee_id BIGINT NOT NULL
        REFERENCES employees(employee_id)
        ON DELETE CASCADE,

    attendance_date DATE NOT NULL,

    check_in TIMESTAMP,

    check_out TIMESTAMP,

    status VARCHAR(20) NOT NULL,

    total_hours NUMERIC(5,2),

    remarks TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(employee_id, attendance_date)
);