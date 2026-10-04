const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/results/check -> verifier si un resultat est pret
router.post("/check", requireAuth, async (req, res) => {
  const { serviceKey, queueNumber, examDate, password } = req.body;
  const hospitalId = req.patient.hospitalId;

  const patient = db.prepare("SELECT first_name, last_name, password_hash FROM patients WHERE id = ?").get(req.patient.patientId);
  const valid = await bcrypt.compare(password, patient.password_hash);
  if (!valid) return res.status(401).json({ error: "Mot de passe incorrect" });

  const patientFullName = (patient.first_name + " " + patient.last_name).trim().toLowerCase();

  const result = db.prepare(
    `SELECT status, full_name FROM results
     WHERE hospital_id = ? AND service_key = ? AND queue_number = ? AND exam_date = ?`
  ).get(hospitalId, serviceKey, queueNumber, examDate);

  if (!result) {
    return res.json({ status: "pending" });
  }

  if (result.full_name.trim().toLowerCase() !== patientFullName) {
    return res.status(403).json({ error: "Ce resultat ne correspond pas a votre compte" });
  }

  res.json({ status: result.status });
});

module.exports = router;