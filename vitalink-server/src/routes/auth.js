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

const sendCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de demandes de code. Reessayez dans 15 minutes." }
});

// Configuration Africa's Talking
const africastalking = require("africastalking")({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME || "sandbox"
});
const sms = africastalking.SMS;

// Stockage temporaire des codes de verification (en memoire)
// cle = numero de telephone, valeur = { code, expiresAt }
const otpStore = new Map();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// Verifie que le nom/prenom est raisonnable (lettres, espaces, tirets, apostrophes, 2 a 50 caracteres)
function isValidName(name) {
  return typeof name === "string" && /^[A-Za-zÀ-ÿ' -]{2,50}$/.test(name.trim());
}

// Verifie que la date de naissance est une vraie date, pas dans le futur, et pas plus de 120 ans
function isValidBirthDate(dateStr) {
  if (!dateStr) return true; // optionnel
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  const now = new Date();
  const minDate = new Date();
  minDate.setFullYear(now.getFullYear() - 120);
  return date <= now && date >= minDate;
}

// Verifie un numero de telephone beninois (8 chiffres, avec ou sans indicatif +229, avec ou sans le 01)
function isValidPhone(contact) {
  if (typeof contact !== "string") return false;
  const cleaned = contact.replace(/[\s-]/g, "");
  return /^(\+229)?(01)?\d{8}$/.test(cleaned);
}

// Met le numero au format international +229... pour l'envoi SMS
function toInternationalFormat(contact) {
  let cleaned = contact.replace(/[\s-]/g, "");
  if (cleaned.startsWith("+229")) return cleaned;
  if (cleaned.startsWith("229")) return "+" + cleaned;
  return "+229" + cleaned;
}

function generateOtpCode() {
  return Math.floor(10000 + Math.random() * 90000).toString(); // 5 chiffres
}

// POST /api/auth/send-code -> envoie un code de verification par SMS
router.post("/send-code", sendCodeLimiter, async (req, res) => {
  const { contact } = req.body;

  if (!isValidPhone(contact)) {
    return res.status(400).json({ error: "Numero de telephone invalide" });
  }

  const code = generateOtpCode();
  otpStore.set(contact, { code, expiresAt: Date.now() + OTP_EXPIRY_MS });

  try {
    await sms.send({
      to: [toInternationalFormat(contact)],
      message: `Votre code de verification VITALINK est : ${code}`
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Erreur envoi SMS:", err.message);
    res.status(500).json({ error: "Impossible d'envoyer le SMS pour le moment" });
  }
});

// POST /api/auth/register -> creation de compte patient dans un hopital (necessite un code verifie)
router.post("/register", async (req, res) => {
  const { hospitalId, firstName, lastName, birthDate, gender, contact, password, otpCode } = req.body;

  if (!hospitalId || !firstName || !lastName || !contact || !password || !otpCode) {
    return res.status(400).json({ error: "Champs manquants" });
  }

  if (!isValidName(firstName) || !isValidName(lastName)) {
    return res.status(400).json({ error: "Nom ou prenom invalide" });
  }

  if (!isValidBirthDate(birthDate)) {
    return res.status(400).json({ error: "Date de naissance invalide" });
  }

  if (!isValidPhone(contact)) {
    return res.status(400).json({ error: "Numero de telephone invalide" });
  }

  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caracteres" });
  }

  const saved = otpStore.get(contact);
  if (!saved || saved.expiresAt < Date.now() || saved.code !== otpCode) {
    return res.status(400).json({ error: "Code de verification invalide ou expire" });
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

  otpStore.delete(contact);

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