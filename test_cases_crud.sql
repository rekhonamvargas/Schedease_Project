-- ============================================
-- SchedEase CRUD Test Cases for MySQL Workbench
-- ============================================

USE dbgirlcode;

-- ============================================
-- 1. USER TABLE CRUD OPERATIONS
-- ============================================

-- CREATE: Insert new users
INSERT INTO user (full_name, username, password, email) 
VALUES ('John Doe', 'johndoe', 'password123', 'john@example.com');

INSERT INTO user (full_name, username, password, email) 
VALUES ('Jane Smith', 'janesmith', 'pass456', 'jane@example.com');

INSERT INTO user (full_name, username, password, email) 
VALUES ('Bob Wilson', 'bobwilson', 'bob789', 'bob@example.com');

-- READ: Retrieve all users
SELECT * FROM user;

-- READ: Get specific user by ID
SELECT * FROM user WHERE user_id = 1;

-- READ: Search by username
SELECT * FROM user WHERE username = 'johndoe';

-- UPDATE: Modify user information
UPDATE user 
SET email = 'john.doe@newdomain.com', full_name = 'John M. Doe'
WHERE user_id = 1;

-- UPDATE: Change password
UPDATE user 
SET password = 'newpassword123'
WHERE username = 'janesmith';

-- Verify UPDATE
SELECT * FROM user WHERE user_id = 1;

-- DELETE: Remove a user
DELETE FROM user WHERE user_id = 3;

-- Verify DELETE
SELECT * FROM user;

-- ============================================
-- 2. DATA_TABLE (SUBJECTS) CRUD OPERATIONS
-- ============================================

-- CREATE: Insert subject data
INSERT INTO data_table (number_column, offering_dept, subject, subject_title, credited_units, section, schedule, room, total_slots, enrolled, assessed, is_closed)
VALUES (1, 'CS', 'CS101', 'Introduction to Computer Science', 3, 'A', 'MWF 9:00-10:00 AM', 'Room 201', 40, 35, 35, 'No');

INSERT INTO data_table (number_column, offering_dept, subject, subject_title, credited_units, section, schedule, room, total_slots, enrolled, assessed, is_closed)
VALUES (2, 'CS', 'CS102', 'Data Structures and Algorithms', 3, 'B', 'TTH 10:30-12:00 PM', 'Room 202', 35, 30, 28, 'No');

INSERT INTO data_table (number_column, offering_dept, subject, subject_title, credited_units, section, schedule, room, total_slots, enrolled, assessed, is_closed)
VALUES (3, 'MATH', 'MATH201', 'Calculus I', 4, 'A', 'MWF 1:00-2:30 PM', 'Room 301', 45, 45, 45, 'Yes');

INSERT INTO data_table (number_column, offering_dept, subject, subject_title, credited_units, section, schedule, room, total_slots, enrolled, assessed, is_closed)
VALUES (4, 'ENG', 'ENG101', 'English Composition', 3, 'C', 'TTH 8:00-9:30 AM', 'Room 101', 30, 25, 25, 'No');

-- READ: Retrieve all subjects
SELECT * FROM data_table;

-- READ: Get subjects by department
SELECT * FROM data_table WHERE offering_dept = 'CS';

-- READ: Find available (not closed) subjects
SELECT * FROM data_table WHERE is_closed = 'No';

-- READ: Get subjects with available slots
SELECT *, (total_slots - enrolled) AS available_slots 
FROM data_table 
WHERE (total_slots - enrolled) > 0;

-- UPDATE: Update enrollment numbers
UPDATE data_table 
SET enrolled = 36, assessed = 36
WHERE data_id = 1;

-- UPDATE: Close a subject
UPDATE data_table 
SET is_closed = 'Yes'
WHERE data_id = 2;

-- UPDATE: Change room and schedule
UPDATE data_table 
SET room = 'Room 205', schedule = 'MWF 11:00-12:00 PM'
WHERE data_id = 4;

-- Verify UPDATE
SELECT * FROM data_table WHERE data_id IN (1, 2, 4);

-- DELETE: Remove a subject
DELETE FROM data_table WHERE data_id = 4;

-- Verify DELETE
SELECT * FROM data_table;

-- ============================================
-- 3. SCHEDULE TABLE CRUD OPERATIONS
-- ============================================

-- CREATE: Insert schedules
INSERT INTO schedule (schedule_name, time_range, view_days, is_saved, user_id)
VALUES ('Morning Classes', '8:00 AM - 12:00 PM', 'Monday,Wednesday,Friday', 1, 1);

INSERT INTO schedule (schedule_name, time_range, view_days, is_saved, user_id)
VALUES ('Afternoon Classes', '1:00 PM - 5:00 PM', 'Tuesday,Thursday', 1, 1);

INSERT INTO schedule (schedule_name, time_range, view_days, is_saved, user_id)
VALUES ('Full Week Schedule', '8:00 AM - 5:00 PM', 'Monday,Tuesday,Wednesday,Thursday,Friday', 1, 2);

-- READ: Retrieve all schedules
SELECT * FROM schedule;

-- READ: Get schedules for specific user
SELECT * FROM schedule WHERE user_id = 1;

-- READ: Get saved schedules only
SELECT * FROM schedule WHERE is_saved = 1;

-- READ: Join schedules with user information
SELECT s.schedule_id, s.schedule_name, s.time_range, s.view_days, u.full_name, u.username
FROM schedule s
INNER JOIN user u ON s.user_id = u.user_id;

-- UPDATE: Modify schedule details
UPDATE schedule 
SET schedule_name = 'Updated Morning Classes', time_range = '7:30 AM - 12:30 PM'
WHERE schedule_id = 1;

-- UPDATE: Mark schedule as saved
UPDATE schedule 
SET is_saved = 1
WHERE schedule_id = 2;

-- Verify UPDATE
SELECT * FROM schedule WHERE schedule_id IN (1, 2);

-- DELETE: Remove a schedule
DELETE FROM schedule WHERE schedule_id = 3;

-- Verify DELETE
SELECT * FROM schedule;

-- ============================================
-- 4. SUBJECT_LIST TABLE CRUD OPERATIONS
-- ============================================

-- CREATE: Add subjects to subject list
INSERT INTO subject_list (data_id, filter_id, display_order, is_selected)
VALUES (1, 1, 1, 1);

INSERT INTO subject_list (data_id, filter_id, display_order, is_selected)
VALUES (2, 1, 2, 1);

INSERT INTO subject_list (data_id, filter_id, display_order, is_selected)
VALUES (3, 2, 1, 0);

-- READ: Retrieve all subject list entries
SELECT * FROM subject_list;

-- READ: Get selected subjects only
SELECT * FROM subject_list WHERE is_selected = 1;

-- READ: Join subject_list with data_table to see full details
SELECT sl.subjectlist_id, sl.display_order, sl.is_selected, 
       d.subject_title, d.section, d.schedule, d.room
FROM subject_list sl
INNER JOIN data_table d ON sl.data_id = d.data_id;

-- UPDATE: Change selection status
UPDATE subject_list 
SET is_selected = 0
WHERE subjectlist_id = 1;

-- UPDATE: Reorder subjects
UPDATE subject_list 
SET display_order = 1
WHERE subjectlist_id = 2;

-- Verify UPDATE
SELECT * FROM subject_list;

-- DELETE: Remove from subject list
DELETE FROM subject_list WHERE subjectlist_id = 3;

-- Verify DELETE
SELECT * FROM subject_list;

-- ============================================
-- 5. COMPLEX QUERIES AND REPORTS
-- ============================================

-- Get all subjects enrolled by a specific user through their schedules
SELECT u.full_name, s.schedule_name, d.subject_title, d.schedule, d.room
FROM user u
INNER JOIN schedule s ON u.user_id = s.user_id
LEFT JOIN subject_list sl ON s.schedule_id = sl.filter_id
LEFT JOIN data_table d ON sl.data_id = d.data_id
WHERE u.user_id = 1 AND sl.is_selected = 1;

-- Count subjects by department
SELECT offering_dept, COUNT(*) as subject_count, 
       SUM(total_slots) as total_capacity,
       SUM(enrolled) as total_enrolled
FROM data_table
GROUP BY offering_dept;

-- Find subjects that are almost full (>90% capacity)
SELECT subject_title, section, enrolled, total_slots,
       ROUND((enrolled / total_slots * 100), 2) as fill_percentage
FROM data_table
WHERE (enrolled / total_slots) >= 0.9;

-- Get user's schedule count
SELECT u.username, u.full_name, COUNT(s.schedule_id) as schedule_count
FROM user u
LEFT JOIN schedule s ON u.user_id = s.user_id
GROUP BY u.user_id, u.username, u.full_name;

-- ============================================
-- 6. CLEANUP AND RESET (Optional)
-- ============================================

-- Uncomment below to clean all test data
/*
DELETE FROM subject_list WHERE subjectlist_id > 0;
DELETE FROM schedule WHERE schedule_id > 0;
DELETE FROM data_table WHERE data_id > 0;
DELETE FROM user WHERE user_id > 0;

-- Reset auto-increment counters
ALTER TABLE subject_list AUTO_INCREMENT = 1;
ALTER TABLE schedule AUTO_INCREMENT = 1;
ALTER TABLE data_table AUTO_INCREMENT = 1;
ALTER TABLE user AUTO_INCREMENT = 1;
*/

-- ============================================
-- 7. VERIFICATION QUERIES
-- ============================================

-- Check all table counts
SELECT 'Users' as table_name, COUNT(*) as record_count FROM user
UNION ALL
SELECT 'Data Table', COUNT(*) FROM data_table
UNION ALL
SELECT 'Schedules', COUNT(*) FROM schedule
UNION ALL
SELECT 'Subject List', COUNT(*) FROM subject_list;

-- Final verification - show all data
SELECT '=== USERS ===' as section;
SELECT * FROM user;

SELECT '=== SUBJECTS ===' as section;
SELECT * FROM data_table;

SELECT '=== SCHEDULES ===' as section;
SELECT * FROM schedule;

SELECT '=== SUBJECT LIST ===' as section;
SELECT * FROM subject_list;
