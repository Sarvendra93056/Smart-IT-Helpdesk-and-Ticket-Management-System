-- Smart IT Helpdesk & Ticket Management System Database Schema
-- Compatible with both PostgreSQL and SQLite

CREATE TABLE IF NOT EXISTS support_teams (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  specialties TEXT, -- JSON or comma-separated specialties
  lead_name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('employee', 'agent', 'admin')),
  department TEXT NOT NULL,
  team_id INTEGER REFERENCES support_teams(id),
  avatar_color TEXT DEFAULT '#4f46e5',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('hardware', 'network', 'software', 'access', 'security', 'other')),
  subcategory TEXT,
  priority TEXT NOT NULL CHECK(priority IN ('P1 - Critical', 'P2 - High', 'P3 - Medium', 'P4 - Low')),
  status TEXT NOT NULL CHECK(status IN ('Open', 'Assigned', 'In Progress', 'Pending User', 'Resolved', 'Closed')),
  created_by_id INTEGER NOT NULL REFERENCES users(id),
  assigned_to_id INTEGER REFERENCES users(id),
  team_id INTEGER REFERENCES support_teams(id),
  device_tag TEXT,
  location TEXT,
  attachments TEXT, -- JSON array of file objects
  ai_category TEXT,
  ai_confidence REAL DEFAULT 0.0,
  ai_suggested_priority TEXT,
  ai_suggested_solutions TEXT, -- JSON array of solution runbooks
  resolution_notes TEXT,
  resolution_time_minutes INTEGER,
  first_responded_at TIMESTAMP,
  resolved_at TIMESTAMP,
  sla_response_deadline TIMESTAMP NOT NULL,
  sla_resolution_deadline TIMESTAMP NOT NULL,
  sla_breached INTEGER DEFAULT 0, -- 0 for false, 1 for true
  csat_rating INTEGER, -- 1 to 5
  csat_feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_timeline (
  id INTEGER PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  action_type TEXT NOT NULL, -- 'created', 'assigned', 'status_change', 'priority_change', 'sla_warning', 'sla_breach', 'resolved', 'closed'
  message TEXT NOT NULL,
  meta_json TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id INTEGER PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  is_internal INTEGER DEFAULT 0, -- 0 = public to employee, 1 = internal support team only
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  keywords TEXT NOT NULL,
  summary TEXT NOT NULL,
  steps TEXT NOT NULL, -- JSON array of troubleshooting steps
  verified_solutions_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sla_policies (
  id INTEGER PRIMARY KEY,
  priority TEXT UNIQUE NOT NULL,
  response_time_minutes INTEGER NOT NULL,
  resolution_time_minutes INTEGER NOT NULL,
  description TEXT
);
