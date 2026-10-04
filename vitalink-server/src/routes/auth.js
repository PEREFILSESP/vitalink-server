const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const db = require("../config/database");
const { signToken } = require("../config/jwt");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de tentatives. Reessayez dans 15 minutes." }
});

// POST /api/auth/register -> creation de compte patient dans un hopital
router.post("/register", async (req, res) => {
  const { hospitalId, firstName, lastName, birthDate, gender, contact, password } = req.body;

  if (!hospitalId || !firstName || !lastName || !contact || !password) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  const existing = db.prepare(
    "SELECT id FROM patients WHERE hospital_id = ? AND contact = ?"
  ).get(hospitalId, contact);

  if (existing) {
    return res.status(409).json({ error: "Un compte existe deja avec ce contact" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = db.prepare(
    `INSERT INTO patients (hospital_id, first_name, last_name, birth_date, gender, contact, password_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(hospitalId, firstName, lastName, birthDate || null, gender || null, contact, passwordHash);

  const token = signToken({ patientId: result.lastInsertRowid, hospitalId });
  res.status(201).json({ token });
});

// POST /api/auth/login -> connexion patient
router.post("/login", loginLimiter, async (req, res) => {
  const { hospitalId, contact, password } = req.body;

  const patient = db.prepare(
    "SELECT * FROM patients WHERE hospital_id = ? AND contact = ?"
  ).get(hospitalId, contact);

  if (!patient) return res.status(401).json({ error: "Identifiants invalides" });

  const valid = await bcrypt.compare(password, patient.password_hash);
  if (!valid) return res.status(401).json({ error: "Identifiants invalides" });

  const token = signToken({ patientId: patient.id, hospitalId });
  res.json({ token });
});

module.exports = router;