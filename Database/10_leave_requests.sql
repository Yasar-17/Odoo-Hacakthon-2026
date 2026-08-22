CREATE TABLE leave_requests (
    leave_request_id BIGSERIAL PRIMARY KEY,

    employee_id BIGINT NOT NULL
        REFERENCES employees(employee_id)
        ON DELETE CASCADE,

    leave_type_id INT NOT NULL
        REFERENCES leave_types(leave_type_id)
        ON DELETE RESTRICT,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    reason TEXT,

    status VARCHAR(20) DEFAULT 'PENDING',

    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (end_date >= start_date)
);