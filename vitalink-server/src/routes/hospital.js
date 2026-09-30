const express = require("express");
const db = require("../config/database");
const { requireHospitalAuth } = require("../middleware/hospitalAuth");

const router = express.Router();
router.use(requireHospitalAuth);

// ---------- PROFIL ----------
router.get("/profile", (req, res) => {
  const h = db.prepare(
    "SELECT id, name, city, phone, email, ambulance_phone AS ambulancePhone FROM hospitals WHERE id = ?"
  ).get(req.hospitalId);
  res.json(h);
});

router.put("/profile", (req, res) => {
  const { phone, email, ambulancePhone } = req.body;
  db.prepare(
    "UPDATE hospitals SET phone = ?, email = ?, ambulance_phone = ? WHERE id = ?"
  ).run(phone, email, ambulancePhone, req.hospitalId);
  res.json({ ok: true });
});

// ---------- SERVICES ----------
router.get("/services", (req, res) => {
  const rows = db.prepare(
    `SELECT service_key AS serviceKey, label, max_per_day AS maxPerDay,
            days, morning_hours AS morning, evening_hours AS evening
     FROM services WHERE hospital_id = ?`
  ).all(req.hospitalId);
  res.json(rows.map(r => ({ ...r, days: JSON.parse(r.days) })));
});

router.post("/services", (req, res) => {
  const { serviceKey, label, maxPerDay, days, morning, evening } = req.body;
  db.prepare(
    `INSERT INTO services (hospital_id, service_key, label, max_per_day, days, morning_hours, evening_hours)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(hospital_id, service_key) DO UPDATE SET
       label = excluded.label, max_per_day = excluded.max_per_day,
       days = excluded.days, morning_hours = excluded.morning_hours, evening_hours = excluded.evening_hours`
  ).run(req.hospitalId, serviceKey, label, maxPerDay, JSON.stringify(days), morning, evening);
  res.json({ ok: true });
});

// ---------- RENDEZ-VOUS / EXAMENS ----------
router.get("/bookings", (req, res) => {
  const { day, serviceKey } = req.query;
  let sql = "SELECT * FROM bookings WHERE hospital_id = ?";
  const params = [req.hospitalId];

  if (day) { sql += " AND day = ?"; params.push(day); }
  if (serviceKey) { sql += " AND service_key = ?"; params.push(serviceKey); }
  sql += " ORDER BY day, slot, queue_number";

  res.json(db.prepare(sql).all(...params));
});

// ---------- RESULTATS ----------
router.get("/results", (req, res) => {
  res.json(db.prepare(
    "SELECT * FROM results WHERE hospital_id = ? ORDER BY created_at DESC"
  ).all(req.hospitalId));
});

router.post("/results", (req, res) => {
  const { serviceKey, queueNumber, fullName, examDate, status } = req.body;
  db.prepare(
    `INSERT INTO results (hospital_id, service_key, queue_number, full_name, exam_date, status)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(req.hospitalId, serviceKey, queueNumber, fullName, examDate, status || "pending");
  res.json({ ok: true });
});

router.put("/results/:id", (req, res) => {
  const { status } = req.body;
  db.prepare(
    "UPDATE results SET status = ? WHERE id = ? AND hospital_id = ?"
  ).run(status, req.params.id, req.hospitalId);
  res.json({ ok: true });
});

// ---------- DOSSIERS PATIENTS ----------
router.get("/patients", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  const rows = db.prepare(
    `SELECT DISTINCT patient_full_name AS fullName, patient_phone AS phone
     FROM patient_records
     WHERE hospital_id = ? AND (lower(patient_full_name) LIKE ? OR patient_phone LIKE ?)`
  ).all(req.hospitalId, `%${q}%`, `%${q}%`);
  res.json(rows);
});

router.get("/patients/:name/records", (req, res) => {
  const rows = db.prepare(
    `SELECT id, note, created_at AS createdAt, patient_phone AS phone
     FROM patient_records
     WHERE hospital_id = ? AND patient_full_name = ?
     ORDER BY created_at DESC`
  ).all(req.hospitalId, req.params.name);
  res.json(rows);
});

router.post("/patients/:name/records", (req, res) => {
  const { note, phone } = req.body;
  db.prepare(
    `INSERT INTO patient_records (hospital_id, patient_full_name, patient_phone, note)
     VALUES (?, ?, ?, ?)`
  ).run(req.hospitalId, req.params.name, phone || null, note);
  res.json({ ok: true });
});

module.exports = router;
