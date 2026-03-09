-- Clear existing data first (in correct order for FK constraints)
DELETE FROM blockchain_records;
DELETE FROM audit_logs;
DELETE FROM encrypted_columns;
DELETE FROM documents;
DELETE FROM users;

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE documents_id_seq RESTART WITH 1;
ALTER SEQUENCE encrypted_columns_id_seq RESTART WITH 1;
ALTER SEQUENCE audit_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE blockchain_records_id_seq RESTART WITH 1;

-- Seed demo users (passwords are bcrypt hashes of 'password123')
-- Using a known valid bcrypt hash
INSERT INTO users (id, username, email, password_hash, role) VALUES
  (1, 'admin', 'admin@schoolsystem.edu', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'admin'),
  (2, 'principal_jones', 'jones@schoolsystem.edu', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'admin'),
  (3, 'teacher_smith', 'smith@schoolsystem.edu', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'teacher'),
  (4, 'teacher_davis', 'davis@schoolsystem.edu', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'teacher'),
  (5, 'student_alex', 'alex@schoolsystem.edu', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'student'),
  (6, 'student_maria', 'maria@schoolsystem.edu', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'student'),
  (7, 'office_clark', 'clark@schoolsystem.edu', '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', 'office');

-- Update sequence after explicit ID insert
SELECT setval('users_id_seq', 7);
