const express = require("express");
const rateLimit = require("express-rate-limit");
const db = require("../config/database");
const { signToken } = require("../config/jwt");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de tentatives. Reessayez dans 15 minutes." }
});

// POST /api/hospital-auth/login -> connexion avec le code d'acces
router.post("/login", loginLimiter, (req, res) => {
  const { accessCode } = req.body;

  const hospital = db.prepare(
    "SELECT id, name FROM hospitals WHERE access_code = ?"
  ).get(accessCode);

  if (!hospital) return res.status(401).json({ error: "Code d'acces invalide" });

  const token = signToken({ hospitalId: hospital.id, hospitalStaff: true });
  res.json({ token, hospitalName: hospital.name });
});

module.exports = router;