-- Optional project schedule. Existing rows stay valid with NULL dates.

ALTER TABLE projects
    ADD COLUMN start_date DATE NULL AFTER status,
    ADD COLUMN end_date DATE NULL AFTER start_date,
    ADD KEY idx_projects_type (type);
