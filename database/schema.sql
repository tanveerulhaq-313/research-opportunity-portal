-- ============================================================
-- Research Opportunity Portal — Database Schema
-- ============================================================

DROP DATABASE IF EXISTS research_portal;
CREATE DATABASE research_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE research_portal;

-- ------------------------------------------------------------
-- Table: opportunities
-- ------------------------------------------------------------
CREATE TABLE opportunities (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255)  NOT NULL,
  description     TEXT          NOT NULL,
  area            VARCHAR(100)  NOT NULL,
  faculty_name    VARCHAR(100)  NOT NULL,
  department      VARCHAR(100)  NOT NULL,
  skills          VARCHAR(255)  NOT NULL,
  positions       INT           NOT NULL,
  deadline        DATE          NOT NULL,
  status          ENUM('Open','Closed') NOT NULL DEFAULT 'Open',
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Seed rows for testing
-- ------------------------------------------------------------
INSERT INTO opportunities
  (title, description, area, faculty_name, department, skills, positions, deadline, status)
VALUES
  ('AI for Healthcare',
   'Exploring machine learning models for early disease detection.',
   'Artificial Intelligence',
   'Dr. Ayesha Khan',
   'Computer Science',
   'Python, TensorFlow, Data Analysis',
   3,
   '2025-12-31',
   'Open'),

  ('Cybersecurity in IoT',
   'Investigating security flaws in smart home devices.',
   'Cybersecurity',
   'Dr. Bilal Ahmed',
   'Computer Science',
   'Networking, Linux, Python',
   2,
   '2025-11-15',
   'Open'),

  ('Renewable Energy Optimization',
   'Optimizing solar panel efficiency using simulation.',
   'Renewable Energy',
   'Dr. Sana Malik',
   'Electrical Engineering',
   'MATLAB, Simulation, Physics',
   4,
   '2026-01-20',
   'Open');