const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/bookings -> creer un rendez-vous ou une demande d'examen
router.post("/", requireAuth, (req, res) => {
  const { mode, serviceKey, day, slot, fullName, birthInfo, gender, phone } = req.body;
  const hospitalId = req.patient.hospitalId;

  const service = db.prepare(
    "SELECT max_per_day AS maxPerDay FROM services WHERE hospital_id = ? AND service_key = ?"
  ).get(hospitalId, serviceKey);

  if (!service) return res.status(404).json({ error: "Service introuvable" });

  const countRow = db.prepare(
    `SELECT COUNT(*) AS count FROM bookings
     WHERE hospital_id = ? AND service_key = ? AND day = ? AND slot = ?`
  ).get(hospitalId, serviceKey, day, slot);

  if (countRow.count >= service.maxPerDay) {
    return res.status(409).json({ error: "Pas de place disponible pour ce creneau" });
  }

  const queueNumber = countRow.count + 1;

  db.prepare(
    `INSERT INTO bookings (hospital_id, patient_id, mode, service_key, day, slot, queue_number, full_name, birth_info, gender, phone)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(hospitalId, req.patient.patientId, mode, serviceKey, day, slot, queueNumber, fullName, birthInfo, gender, phone);

  res.status(201).json({ queueNumber });
});

module.exports = router;
