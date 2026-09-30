const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/results/check -> verifier si un resultat est pret
router.post("/check", requireAuth, async (req, res) => {
  const { serviceKey, queueNumber, examDate, password } = req.body;
  const hospitalId = req.patient.hospitalId;

  const patient = db.prepare("SELECT password_hash FROM patients WHERE id = ?").get(req.patient.patientId);
  const valid = await bcrypt.compare(password, patient.password_hash);
  if (!valid) return res.status(401).json({ error: "Mot de passe incorrect" });

  const result = db.prepare(
    `SELECT status FROM results
     WHERE hospital_id = ? AND service_key = ? AND queue_number = ? AND exam_date = ?`
  ).get(hospitalId, serviceKey, queueNumber, examDate);

  if (!result) {
    return res.json({ status: "pending" });
  }

  res.json({ status: result.status });
});

module.exports = router;
