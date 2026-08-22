CREATE TABLE job_positions (
    position_id SERIAL PRIMARY KEY,

    position_name VARCHAR(100) NOT NULL,

    department_id INT
        REFERENCES departments(department_id)
        ON DELETE SET NULL,

    description TEXT
);