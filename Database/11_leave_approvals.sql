CREATE TABLE leave_approvals (
    approval_id BIGSERIAL PRIMARY KEY,

    leave_request_id BIGINT NOT NULL
        REFERENCES leave_requests(leave_request_id)
        ON DELETE CASCADE,

    approved_by BIGINT NOT NULL
        REFERENCES employees(employee_id)
        ON DELETE RESTRICT,

    decision VARCHAR(20) NOT NULL,

    comments TEXT,

    decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);