-- ============================================================
-- VITALINK - SCHEMA DE LA BASE DE DONNEES
-- ============================================================

-- Table des hopitaux
CREATE TABLE IF NOT EXISTS hospitals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  phone TEXT,
  email TEXT,
  ambulance_phone TEXT,
  access_code TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Table des services d'un hopital (cardiologie, ophtalmologie...)
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hospital_id TEXT NOT NULL,
  service_key TEXT NOT NULL,
  label TEXT NOT NULL,
  max_per_day INTEGER DEFAULT 10,
  days TEXT NOT NULL,
  morning_hours TEXT,
  evening_hours TEXT,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  UNIQUE (hospital_id, service_key)
);

-- Table des patients (comptes crees dans chaque hopital)
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hospital_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date TEXT,
  gender TEXT,
  contact TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  UNIQUE (hospital_id, contact)
);

-- Table des rendez-vous / demandes d'examen
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hospital_id TEXT NOT NULL,
  patient_id INTEGER,
  mode TEXT NOT NULL,
  service_key TEXT NOT NULL,
  day TEXT NOT NULL,
  slot TEXT NOT NULL,
  queue_number INTEGER NOT NULL,
  full_name TEXT,
  birth_info TEXT,
  gender TEXT,
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Table des resultats d'examens
CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hospital_id TEXT NOT NULL,
  service_key TEXT NOT NULL,
  queue_number INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  exam_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- Table des dossiers patients (notes / historique conserve par l'hopital)
CREATE TABLE IF NOT EXISTS patient_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hospital_id TEXT NOT NULL,
  patient_full_name TEXT NOT NULL,
  patient_phone TEXT,
  note TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);
