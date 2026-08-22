CREATE TABLE user_roles (
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(role_id) ON DELETE RESTRICT,

    PRIMARY KEY (user_id, role_id)
);