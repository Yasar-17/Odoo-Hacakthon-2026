CREATE TABLE employees (
    employee_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT UNIQUE
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    first_name VARCHAR(100) NOT NULL,

    last_name VARCHAR(100),

    date_of_birth DATE,

    gender VARCHAR(20),

    phone VARCHAR(20),

    address TEXT,

    department_id INT
        REFERENCES departments(department_id)
        ON DELETE SET NULL,

    position_id INT
        REFERENCES job_positions(position_id)
        ON DELETE SET NULL,

    joining_date DATE,

    employment_status VARCHAR(30)
        DEFAULT 'ACTIVE',

    profile_picture_url TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);