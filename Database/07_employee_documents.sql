CREATE TABLE employee_documents (
    document_id BIGSERIAL PRIMARY KEY,

    employee_id BIGINT NOT NULL
        REFERENCES employees(employee_id)
        ON DELETE CASCADE,

    document_type VARCHAR(50) NOT NULL,

    document_name VARCHAR(255) NOT NULL,

    document_url TEXT NOT NULL,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);