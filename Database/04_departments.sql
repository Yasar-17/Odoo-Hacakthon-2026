CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,

    department_name VARCHAR(100) UNIQUE NOT NULL,

    description TEXT
);
