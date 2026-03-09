-- Seed demo documents
INSERT INTO documents (id, creator_id, document_name, column_schema, sha256_hash, row_count) VALUES
  (1, 1, 'Student Grades Q1 2026', '["student_name","grade","student_id","comments","parent_contact"]', 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', 42),
  (2, 2, 'Faculty Payroll March 2026', '["employee_name","salary","tax_id","bank_account","department"]', 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', 35),
  (3, 1, 'Enrollment Records 2025-2026', '["student_name","date_of_birth","address","emergency_contact","medical_notes"]', 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', 128),
  (4, 2, 'Disciplinary Reports Feb 2026', '["student_name","incident_description","action_taken","parent_notified","follow_up_date"]', 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5', 8),
  (5, 1, 'Budget Allocation FY2026', '["department","allocated_amount","spent_amount","remaining","notes"]', 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6', 12),
  (6, 7, 'Staff Directory Update', '["staff_name","email","phone","department","home_address"]', 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1', 67);

SELECT setval('documents_id_seq', 6);

-- Seed encrypted columns with role-based access
INSERT INTO encrypted_columns (document_id, column_name, allowed_roles, encrypted_data) VALUES
  (1, 'student_name', ARRAY['admin','teacher'], '[{"row":1,"val":"Alice Johnson"},{"row":2,"val":"Bob Williams"},{"row":3,"val":"Carol Davis"}]'),
  (1, 'grade', ARRAY['admin','teacher'], '[{"row":1,"val":"A"},{"row":2,"val":"B+"},{"row":3,"val":"A-"}]'),
  (1, 'student_id', ARRAY['admin'], '[{"row":1,"val":"STU-001"},{"row":2,"val":"STU-002"},{"row":3,"val":"STU-003"}]'),
  (1, 'comments', ARRAY['admin','teacher','student'], '[{"row":1,"val":"Excellent work"},{"row":2,"val":"Good improvement"},{"row":3,"val":"Consistent effort"}]'),
  (1, 'parent_contact', ARRAY['admin'], '[{"row":1,"val":"555-0101"},{"row":2,"val":"555-0102"},{"row":3,"val":"555-0103"}]'),
  (2, 'employee_name', ARRAY['admin','office'], '[{"row":1,"val":"John Smith"},{"row":2,"val":"Jane Davis"},{"row":3,"val":"Mike Brown"}]'),
  (2, 'salary', ARRAY['admin'], '[{"row":1,"val":"$65,000"},{"row":2,"val":"$72,000"},{"row":3,"val":"$58,000"}]'),
  (2, 'tax_id', ARRAY['admin'], '[{"row":1,"val":"***-**-1234"},{"row":2,"val":"***-**-5678"},{"row":3,"val":"***-**-9012"}]'),
  (2, 'bank_account', ARRAY['admin'], '[{"row":1,"val":"****4567"},{"row":2,"val":"****8901"},{"row":3,"val":"****2345"}]'),
  (2, 'department', ARRAY['admin','office','teacher'], '[{"row":1,"val":"Mathematics"},{"row":2,"val":"English"},{"row":3,"val":"Science"}]'),
  (3, 'student_name', ARRAY['admin','teacher','office'], '[{"row":1,"val":"Alice Johnson"},{"row":2,"val":"David Lee"},{"row":3,"val":"Emma Wilson"}]'),
  (3, 'date_of_birth', ARRAY['admin','office'], '[{"row":1,"val":"2010-03-15"},{"row":2,"val":"2009-11-22"},{"row":3,"val":"2010-07-08"}]'),
  (3, 'address', ARRAY['admin','office'], '[{"row":1,"val":"123 Oak St"},{"row":2,"val":"456 Pine Ave"},{"row":3,"val":"789 Elm Rd"}]'),
  (3, 'emergency_contact', ARRAY['admin','office'], '[{"row":1,"val":"555-0201"},{"row":2,"val":"555-0202"},{"row":3,"val":"555-0203"}]'),
  (3, 'medical_notes', ARRAY['admin'], '[{"row":1,"val":"No allergies"},{"row":2,"val":"Peanut allergy"},{"row":3,"val":"Asthma - inhaler"}]'),
  (4, 'student_name', ARRAY['admin','teacher'], '[{"row":1,"val":"Bob Williams"},{"row":2,"val":"Charlie Green"}]'),
  (4, 'incident_description', ARRAY['admin','teacher'], '[{"row":1,"val":"Late to class 3x"},{"row":2,"val":"Unauthorized device use"}]'),
  (4, 'action_taken', ARRAY['admin'], '[{"row":1,"val":"Warning issued"},{"row":2,"val":"Device confiscated"}]'),
  (4, 'parent_notified', ARRAY['admin','teacher'], '[{"row":1,"val":"Yes - 02/10"},{"row":2,"val":"Yes - 02/18"}]'),
  (4, 'follow_up_date', ARRAY['admin','teacher','office'], '[{"row":1,"val":"2026-03-10"},{"row":2,"val":"2026-03-18"}]'),
  (5, 'department', ARRAY['admin','office'], '[{"row":1,"val":"Mathematics"},{"row":2,"val":"Science"},{"row":3,"val":"Athletics"}]'),
  (5, 'allocated_amount', ARRAY['admin'], '[{"row":1,"val":"$125,000"},{"row":2,"val":"$180,000"},{"row":3,"val":"$95,000"}]'),
  (5, 'spent_amount', ARRAY['admin'], '[{"row":1,"val":"$87,500"},{"row":2,"val":"$142,000"},{"row":3,"val":"$71,000"}]'),
  (5, 'remaining', ARRAY['admin','office'], '[{"row":1,"val":"$37,500"},{"row":2,"val":"$38,000"},{"row":3,"val":"$24,000"}]'),
  (5, 'notes', ARRAY['admin','office','teacher'], '[{"row":1,"val":"On track"},{"row":2,"val":"Lab equipment ordered"},{"row":3,"val":"New uniforms pending"}]'),
  (6, 'staff_name', ARRAY['admin','teacher','office','student'], '[{"row":1,"val":"John Smith"},{"row":2,"val":"Jane Davis"},{"row":3,"val":"Sarah Clark"}]'),
  (6, 'email', ARRAY['admin','teacher','office'], '[{"row":1,"val":"smith@school.edu"},{"row":2,"val":"davis@school.edu"},{"row":3,"val":"clark@school.edu"}]'),
  (6, 'phone', ARRAY['admin','office'], '[{"row":1,"val":"555-1001"},{"row":2,"val":"555-1002"},{"row":3,"val":"555-1003"}]'),
  (6, 'department', ARRAY['admin','teacher','office','student'], '[{"row":1,"val":"Mathematics"},{"row":2,"val":"English"},{"row":3,"val":"Administration"}]'),
  (6, 'home_address', ARRAY['admin'], '[{"row":1,"val":"10 Faculty Ln"},{"row":2,"val":"22 Teacher Ct"},{"row":3,"val":"5 Admin Way"}]');

-- Seed audit logs
INSERT INTO audit_logs (user_id, document_id, accessed_columns, denied_columns, action, ip_address, tx_hash) VALUES
  (1, 1, ARRAY['student_name','grade','student_id','comments','parent_contact'], ARRAY[]::text[], 'upload', '192.168.1.10', NULL),
  (3, 1, ARRAY['student_name','grade','comments'], ARRAY['student_id','parent_contact'], 'view', '192.168.1.50', NULL),
  (5, 1, ARRAY['comments'], ARRAY['student_name','grade','student_id','parent_contact'], 'view', '192.168.1.80', NULL),
  (1, 2, ARRAY['employee_name','salary','tax_id','bank_account','department'], ARRAY[]::text[], 'upload', '192.168.1.10', NULL),
  (7, 2, ARRAY['employee_name','department'], ARRAY['salary','tax_id','bank_account'], 'view', '192.168.1.60', NULL),
  (1, 1, ARRAY[]::text[], ARRAY[]::text[], 'verify', '192.168.1.10', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
  (2, 4, ARRAY['student_name','incident_description','action_taken','parent_notified','follow_up_date'], ARRAY[]::text[], 'upload', '192.168.1.11', NULL),
  (1, 1, ARRAY[]::text[], ARRAY[]::text[], 'role_change', '192.168.1.10', NULL),
  (3, 3, ARRAY['student_name'], ARRAY['date_of_birth','address','emergency_contact','medical_notes'], 'view', '192.168.1.50', NULL),
  (1, 4, ARRAY[]::text[], ARRAY[]::text[], 'verify', '192.168.1.10', '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234');

-- Seed blockchain records
INSERT INTO blockchain_records (document_id, sha256_hash, column_access_mapping, creator_id, tx_hash, block_number, verified) VALUES
  (1, 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', '{"student_name":["admin","teacher"],"grade":["admin","teacher"],"student_id":["admin"],"comments":["admin","teacher","student"],"parent_contact":["admin"]}', 1, '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 18234567, true),
  (2, 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3', '{"employee_name":["admin","office"],"salary":["admin"],"tax_id":["admin"],"bank_account":["admin"],"department":["admin","office","teacher"]}', 2, '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', 18234589, true),
  (4, 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5', '{"student_name":["admin","teacher"],"incident_description":["admin","teacher"],"action_taken":["admin"],"parent_notified":["admin","teacher"],"follow_up_date":["admin","teacher","office"]}', 2, '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234', 18234612, true),
  (6, 'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1', '{"staff_name":["admin","teacher","office","student"],"email":["admin","teacher","office"],"phone":["admin","office"],"department":["admin","teacher","office","student"],"home_address":["admin"]}', 7, '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456', 18234701, true);
