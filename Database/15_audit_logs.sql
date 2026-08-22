CREATE TABLE audit_logs (
    audit_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    action VARCHAR(100) NOT NULL,

    table_name VARCHAR(100),

    record_id BIGINT,

    old_data JSONB,

    new_data JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);