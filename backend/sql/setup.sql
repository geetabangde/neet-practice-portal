-- NEET PG practice portal: database setup for phpMyAdmin.
-- Open phpMyAdmin, pick your database on the left, then Import and choose this file.
-- Safe to import again: tables are only created if missing, and starter rows are not duplicated.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS admins (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(190) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(30)  NOT NULL DEFAULT 'admin',
    status     ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_admins_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subjects (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    icon        VARCHAR(30)  NOT NULL DEFAULT 'stethoscope',
    status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_subjects_name (name),
    KEY idx_subjects_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS modules (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    subject_id INT UNSIGNED NOT NULL,
    name       VARCHAR(150) NOT NULL,
    status     ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_modules_subject_name (subject_id, name),
    KEY idx_modules_status (status),
    CONSTRAINT fk_modules_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS topics (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    subject_id INT UNSIGNED NOT NULL,
    module_id  INT UNSIGNED NOT NULL,
    name       VARCHAR(150) NOT NULL,
    status     ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_topics_module_name (module_id, name),
    KEY idx_topics_subject (subject_id),
    KEY idx_topics_status (status),
    CONSTRAINT fk_topics_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
    CONSTRAINT fk_topics_module FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS questions (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    subject_id    INT UNSIGNED NULL,
    topic_id      INT UNSIGNED NULL,
    question_text TEXT NOT NULL,
    difficulty    ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
    type          ENUM('single','multiple') NOT NULL DEFAULT 'single',
    option_a      VARCHAR(500) NOT NULL DEFAULT '',
    option_b      VARCHAR(500) NOT NULL DEFAULT '',
    option_c      VARCHAR(500) NOT NULL DEFAULT '',
    option_d      VARCHAR(500) NOT NULL DEFAULT '',
    correct       VARCHAR(7) NOT NULL DEFAULT '',
    explanation   TEXT NOT NULL,
    reference_text VARCHAR(255) NOT NULL DEFAULT '',
    image_name    VARCHAR(255) NOT NULL DEFAULT '',
    status        ENUM('published','draft') NOT NULL DEFAULT 'draft',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_questions_subject (subject_id),
    KEY idx_questions_topic (topic_id),
    KEY idx_questions_status (status),
    CONSTRAINT fk_questions_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
    CONSTRAINT fk_questions_topic FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tests (
    id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    title              VARCHAR(200) NOT NULL,
    description        VARCHAR(1000) NOT NULL DEFAULT '',
    kind               ENUM('grand','mini','subject') NOT NULL DEFAULT 'grand',
    pattern            ENUM('NEET','INICET') NOT NULL DEFAULT 'NEET',
    duration_minutes   SMALLINT UNSIGNED NOT NULL,
    marks_per_question DECIMAL(6,2) NOT NULL,
    negative_marking   DECIMAL(6,2) NOT NULL DEFAULT 0,
    start_at           DATETIME NOT NULL,
    end_at             DATETIME NOT NULL,
    status             ENUM('draft','published','completed') NOT NULL DEFAULT 'draft',
    created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tests_status (status),
    KEY idx_tests_start (start_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS test_subjects (
    test_id    INT UNSIGNED NOT NULL,
    subject_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (test_id, subject_id),
    CONSTRAINT fk_test_subjects_test FOREIGN KEY (test_id) REFERENCES tests (id) ON DELETE CASCADE,
    CONSTRAINT fk_test_subjects_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS test_topics (
    test_id  INT UNSIGNED NOT NULL,
    topic_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (test_id, topic_id),
    CONSTRAINT fk_test_topics_test FOREIGN KEY (test_id) REFERENCES tests (id) ON DELETE CASCADE,
    CONSTRAINT fk_test_topics_topic FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS test_questions (
    test_id     INT UNSIGNED NOT NULL,
    question_id INT UNSIGNED NOT NULL,
    position    SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (test_id, question_id),
    KEY idx_test_questions_order (test_id, position),
    CONSTRAINT fk_test_questions_test FOREIGN KEY (test_id) REFERENCES tests (id) ON DELETE CASCADE,
    CONSTRAINT fk_test_questions_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS plans (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL,
    price           INT UNSIGNED NOT NULL DEFAULT 0,
    duration_months SMALLINT UNSIGNED NOT NULL,
    status          ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_plans_name (name),
    KEY idx_plans_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS plan_features (
    plan_id  INT UNSIGNED NOT NULL,
    position SMALLINT UNSIGNED NOT NULL,
    feature  VARCHAR(200) NOT NULL,
    PRIMARY KEY (plan_id, position),
    CONSTRAINT fk_plan_features_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS students (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL,
    mobile          CHAR(10) NOT NULL,
    email           VARCHAR(190) NOT NULL,
    exam            ENUM('NEET PG','FMGE') NOT NULL DEFAULT 'NEET PG',
    status          ENUM('active','inactive') NOT NULL DEFAULT 'active',
    plan_id         INT UNSIGNED NULL,
    plan_expires_at DATETIME NULL,
    last_login_at   DATETIME NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_students_mobile (mobile),
    UNIQUE KEY uq_students_email (email),
    KEY idx_students_status (status),
    CONSTRAINT fk_students_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_otps (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    mobile     CHAR(10) NOT NULL,
    purpose    ENUM('signup','login') NOT NULL,
    code_hash  CHAR(64) NOT NULL,
    attempts   TINYINT UNSIGNED NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    used_at    DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_student_otps_lookup (mobile, purpose, id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_answers (
    student_id  INT UNSIGNED NOT NULL,
    question_id INT UNSIGNED NOT NULL,
    selected    VARCHAR(7) NOT NULL,
    is_correct  TINYINT(1) NOT NULL,
    attempts    SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    answered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, question_id),
    KEY idx_student_answers_question (question_id),
    CONSTRAINT fk_student_answers_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_student_answers_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_bookmarks (
    student_id  INT UNSIGNED NOT NULL,
    question_id INT UNSIGNED NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, question_id),
    KEY idx_student_bookmarks_question (question_id),
    CONSTRAINT fk_student_bookmarks_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    CONSTRAINT fk_student_bookmarks_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS custom_modules (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id INT UNSIGNED NOT NULL,
    title      VARCHAR(150) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_custom_modules_student (student_id, id),
    CONSTRAINT fk_custom_modules_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS custom_module_questions (
    module_id   INT UNSIGNED NOT NULL,
    question_id INT UNSIGNED NOT NULL,
    position    SMALLINT UNSIGNED NOT NULL,
    PRIMARY KEY (module_id, question_id),
    KEY idx_custom_module_questions_order (module_id, position),
    CONSTRAINT fk_custom_module_questions_module FOREIGN KEY (module_id) REFERENCES custom_modules (id) ON DELETE CASCADE,
    CONSTRAINT fk_custom_module_questions_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS test_attempts (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    test_id      INT UNSIGNED NOT NULL,
    student_id   INT UNSIGNED NOT NULL,
    started_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at DATETIME NULL,
    correct      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    incorrect    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    unattempted  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    score        DECIMAL(8,2) NOT NULL DEFAULT 0,
    total_marks  DECIMAL(8,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_attempt_student_test (student_id, test_id),
    KEY idx_attempt_test_score (test_id, score),
    CONSTRAINT fk_attempt_test FOREIGN KEY (test_id) REFERENCES tests (id) ON DELETE CASCADE,
    CONSTRAINT fk_attempt_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS test_attempt_answers (
    attempt_id  INT UNSIGNED NOT NULL,
    question_id INT UNSIGNED NOT NULL,
    selected    VARCHAR(7) NOT NULL DEFAULT '',
    marked      TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (attempt_id, question_id),
    CONSTRAINT fk_attempt_answers_attempt FOREIGN KEY (attempt_id) REFERENCES test_attempts (id) ON DELETE CASCADE,
    CONSTRAINT fk_attempt_answers_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Starter subjects
INSERT IGNORE INTO subjects (name, description, icon, status) VALUES ('Anatomy', 'Gross anatomy, embryology, histology and neuroanatomy.', 'bone', 'active');
INSERT IGNORE INTO subjects (name, description, icon, status) VALUES ('Physiology', 'Body systems, nerve and muscle physiology and homeostasis.', 'activity', 'active');
INSERT IGNORE INTO subjects (name, description, icon, status) VALUES ('Biochemistry', 'Metabolism, enzymes, molecular biology and clinical biochemistry.', 'flask', 'active');
INSERT IGNORE INTO subjects (name, description, icon, status) VALUES ('Pathology', 'General and systemic pathology with haematology.', 'microscope', 'active');
INSERT IGNORE INTO subjects (name, description, icon, status) VALUES ('Pharmacology', 'General pharmacology, autonomic drugs and chemotherapy.', 'pill', 'active');
INSERT IGNORE INTO subjects (name, description, icon, status) VALUES ('Microbiology', 'Bacteriology, virology, immunology and general microbiology.', 'dna', 'active');
INSERT IGNORE INTO subjects (name, description, icon, status) VALUES ('Community Medicine', 'Epidemiology, biostatistics, preventive and social medicine.', 'heart', 'active');
INSERT IGNORE INTO subjects (name, description, icon, status) VALUES ('Ophthalmology', 'Eye anatomy, refractive errors and common eye diseases.', 'eye', 'active');
INSERT IGNORE INTO subjects (name, description, icon, status) VALUES ('Anaesthesia', 'General and regional anaesthesia and perioperative care.', 'syringe', 'active');
INSERT IGNORE INTO subjects (name, description, icon, status) VALUES ('Psychiatry', 'Mood and psychotic disorders and psychiatric management.', 'brain', 'active');

-- Starter plans (a plan is skipped when its name already exists)
INSERT IGNORE INTO plans (name, price, duration_months, status) VALUES ('Free Trial', 0, 1, 'active');
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 1, 'Sample modules in every subject' FROM plans WHERE name = 'Free Trial';
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 2, 'Answers with explanations' FROM plans WHERE name = 'Free Trial';
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 3, 'Limited custom modules' FROM plans WHERE name = 'Free Trial';
INSERT IGNORE INTO plans (name, price, duration_months, status) VALUES ('Plan A', 9999, 9, 'active');
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 1, 'Full Test Series' FROM plans WHERE name = 'Plan A';
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 2, 'Grand Tests with rank' FROM plans WHERE name = 'Plan A';
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 3, 'Score and rank report' FROM plans WHERE name = 'Plan A';
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 4, 'Performance analytics' FROM plans WHERE name = 'Plan A';
INSERT IGNORE INTO plans (name, price, duration_months, status) VALUES ('Plan B', 14999, 12, 'active');
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 1, 'QBank with 18,500+ MCQs' FROM plans WHERE name = 'Plan B';
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 2, 'Full Test Series' FROM plans WHERE name = 'Plan B';
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 3, 'Custom Module' FROM plans WHERE name = 'Plan B';
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 4, 'Bookmarks and Magic Module' FROM plans WHERE name = 'Plan B';
INSERT IGNORE INTO plans (name, price, duration_months, status) VALUES ('Plan C', 28999, 12, 'active');
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 1, '810+ hours of video classes' FROM plans WHERE name = 'Plan C';
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 2, 'QBank with 18,500+ MCQs' FROM plans WHERE name = 'Plan C';
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 3, 'Test Series with 390+ tests' FROM plans WHERE name = 'Plan C';
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 4, 'Updated Schema' FROM plans WHERE name = 'Plan C';
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 5, 'Priority doubt support' FROM plans WHERE name = 'Plan C';
INSERT IGNORE INTO plans (name, price, duration_months, status) VALUES ('Legacy Plan', 7999, 6, 'inactive');
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 1, 'QBank access' FROM plans WHERE name = 'Legacy Plan';
INSERT IGNORE INTO plan_features (plan_id, position, feature) SELECT id, 2, 'Basic Test Series' FROM plans WHERE name = 'Legacy Plan';
