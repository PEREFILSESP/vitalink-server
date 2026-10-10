const express = require("express");
const db = require("../config/database");

const router = express.Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-moi";

function generateAccessCode(prefix) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return prefix + "-" + random;
}

router.post("/create-hospital", (req, res) => {
  const { adminPassword, name, city, phone, email, ambulancePhone, prefix } = req.body;

  if (adminPassword !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Mot de passe admin incorrect" });
  }

  if (!name || !city || !prefix) {
    return res.status(400).json({ error: "Nom, ville et prefixe sont obligatoires" });
  }

  const id = prefix.toLowerCase() + "-" + Date.now();
  const accessCode = generateAccessCode(prefix.toUpperCase());

  db.prepare(
    `INSERT INTO hospitals (id, name, city, phone, email, ambulance_phone, access_code)
     VALUES (@id, @name, @city, @phone, @email, @ambulancePhone, @accessCode)`
  ).run({
    id,
    name,
    city,
    phone: phone || "",
    email: email || "",
    ambulancePhone: ambulancePhone || "",
    accessCode
  });

  res.json({ success: true, hospitalId: id, accessCode });
});

// POST /api/admin/list-hospitals -> liste tous les hopitaux (id, nom, ville, code d'acces)
router.post("/list-hospitals", (req, res) => {
  const { adminPassword } = req.body;

  if (adminPassword !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Mot de passe admin incorrect" });
  }

  const hospitals = db.prepare(
    "SELECT id, name, city, access_code FROM hospitals"
  ).all();

  res.json({ hospitals });
});

// POST /api/admin/delete-hospital -> supprime un hopital par son id
router.post("/delete-hospital", (req, res) => {
  const { adminPassword, hospitalId } = req.body;

  if (adminPassword !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Mot de passe admin incorrect" });
  }

  if (!hospitalId) {
    return res.status(400).json({ error: "hospitalId obligatoire" });
  }

  db.prepare("DELETE FROM hospitals WHERE id = ?").run(hospitalId);

  res.json({ success: true });
});

module.exports = router;