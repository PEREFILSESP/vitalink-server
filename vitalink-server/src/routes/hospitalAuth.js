const express = require("express");
const db = require("../config/database");
const { signToken } = require("../config/jwt");

const router = express.Router();

// POST /api/hospital-auth/login -> connexion avec le code d'acces
router.post("/login", (req, res) => {
  const { accessCode } = req.body;

  const hospital = db.prepare(
    "SELECT id, name FROM hospitals WHERE access_code = ?"
  ).get(accessCode);

  if (!hospital) return res.status(401).json({ error: "Code d'acces invalide" });

  const token = signToken({ hospitalId: hospital.id, hospitalStaff: true });
  res.json({ token, hospitalName: hospital.name });
});

module.exports = router;
