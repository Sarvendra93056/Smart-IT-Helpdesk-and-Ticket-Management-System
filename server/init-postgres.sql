-- =========================================================
-- Smart IT Helpdesk & Ticket Management System
-- PostgreSQL Migration & Schema Setup
-- =========================================================
-- To run against local or hosted PostgreSQL:
-- psql -U postgres -d postgres -f init-postgres.sql
-- or set DATABASE_URL=postgres://user:password@localhost:5432/it_helpdesk
-- =========================================================

CREATE DATABASE it_helpdesk;
\c it_helpdesk;

-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS ticket_messages CASCADE;
DROP TABLE IF EXISTS ticket_timeline CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS support_teams CASCADE;
DROP TABLE IF EXISTS knowledge_base CASCADE;
DROP TABLE IF EXISTS sla_policies CASCADE;

-- 1. Support Teams
CREATE TABLE support_teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  specialties TEXT, -- JSON array of specialized topics
  lead_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users (Employees, Support Agents, IT Admins)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('employee', 'agent', 'admin')),
  department VARCHAR(100) NOT NULL,
  team_id INTEGER REFERENCES support_teams(id) ON DELETE SET NULL,
  avatar_color VARCHAR(20) DEFAULT '#4f46e5',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tickets
CREATE TABLE tickets (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('hardware', 'network', 'software', 'access', 'security', 'other')),
  subcategory VARCHAR(100),
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('P1 - Critical', 'P2 - High', 'P3 - Medium', 'P4 - Low')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('Open', 'Assigned', 'In Progress', 'Pending User', 'Resolved', 'Closed')),
  created_by_id INTEGER NOT NULL REFERENCES users(id),
  assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  team_id INTEGER REFERENCES support_teams(id) ON DELETE SET NULL,
  device_tag VARCHAR(100),
  location VARCHAR(150),
  attachments TEXT, -- JSON array
  ai_category VARCHAR(50),
  ai_confidence NUMERIC(3,2) DEFAULT 0.0,
  ai_suggested_priority VARCHAR(50),
  ai_suggested_solutions TEXT, -- JSON array
  resolution_notes TEXT,
  resolution_time_minutes INTEGER,
  first_responded_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  sla_response_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  sla_resolution_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  sla_breached SMALLINT DEFAULT 0,
  csat_rating SMALLINT CHECK (csat_rating BETWEEN 1 AND 5),
  csat_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Ticket Timeline / Audit Trail
CREATE TABLE ticket_timeline (
  id SERIAL PRIMARY KEY,
  ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  meta_json TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ticket Messages (Comments & Internal Notes)
CREATE TABLE ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_internal SMALLINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Knowledge Base
CREATE TABLE knowledge_base (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  keywords TEXT NOT NULL,
  summary TEXT NOT NULL,
  steps TEXT NOT NULL, -- JSON array
  verified_solutions_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. SLA Policies
CREATE TABLE sla_policies (
  id SERIAL PRIMARY KEY,
  priority VARCHAR(50) UNIQUE NOT NULL,
  response_time_minutes INTEGER NOT NULL,
  resolution_time_minutes INTEGER NOT NULL,
  description TEXT
);

-- Indexes for lightning fast lookups
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_category ON tickets(category);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to_id);
CREATE INDEX idx_tickets_created_by ON tickets(created_by_id);
CREATE INDEX idx_tickets_team_id ON tickets(team_id);
CREATE INDEX idx_tickets_sla_resolution_deadline ON tickets(sla_resolution_deadline);
