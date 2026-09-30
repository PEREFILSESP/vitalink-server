const express = require("express");
const db = require("../config/database");

const router = express.Router();

// GET /api/hospitals?q=cnhu -> recherche d'hopitaux par nom
router.get("/", (req, res) => {
  const q = (req.query.q || "").toLowerCase();

  const hospitals = db.prepare(
    `SELECT id, name, city, phone, email, ambulance_phone AS ambulancePhone
     FROM hospitals
     WHERE lower(name) LIKE ?`
  ).all(`%${q}%`);

  res.json(hospitals);
});

// GET /api/hospitals/:id -> details d'un hopital + ses services
router.get("/:id", (req, res) => {
  const hospital = db.prepare(
    `SELECT id, name, city, phone, email, ambulance_phone AS ambulancePhone
     FROM hospitals WHERE id = ?`
  ).get(req.params.id);

  if (!hospital) return res.status(404).json({ error: "Hopital introuvable" });

  const services = db.prepare(
    `SELECT service_key AS serviceKey, label, max_per_day AS maxPerDay,
            days, morning_hours AS morning, evening_hours AS evening
     FROM services WHERE hospital_id = ?`
  ).all(req.params.id);

  hospital.services = services.map(s => ({
    ...s,
    days: JSON.parse(s.days)
  }));

  res.json(hospital);
});

module.exports = router;
