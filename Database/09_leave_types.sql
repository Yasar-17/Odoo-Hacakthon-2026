CREATE TABLE leave_types (
    leave_type_id SERIAL PRIMARY KEY,

    type_name VARCHAR(50) UNIQUE NOT NULL,

    description TEXT
);