require("dotenv").config();
const db = require("../config/database");

const hospital = {
  id: "cnhu-test",
  name: "CNHU (Test)",
  city: "Cotonou",
  phone: "+229 21 30 01 55",
  email: "contact@cnhu-test.bj",
  ambulancePhone: "+229 21 30 01 99",
  accessCode: "CNHU-" + Math.random().toString(36).slice(2, 8).toUpperCase()
};

db.prepare(
  `INSERT OR REPLACE INTO hospitals (id, name, city, phone, email, ambulance_phone, access_code)
   VALUES (@id, @name, @city, @phone, @email, @ambulancePhone, @accessCode)`
).run(hospital);

const services = [
  { serviceKey: "cardiologie", label: "Cardiologie", maxPerDay: 10, days: ["lundi", "mardi", "jeudi", "vendredi"], morning: "8h - 12h", evening: "15h - 18h" },
  { serviceKey: "ophtalmologie", label: "Ophtalmologie", maxPerDay: 8, days: ["lundi", "mercredi", "vendredi"], morning: "8h - 12h", evening: "" }
];

const insertService = db.prepare(
  `INSERT OR REPLACE INTO services (hospital_id, service_key, label, max_per_day, days, morning_hours, evening_hours)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);

for (const s of services) {
  insertService.run(hospital.id, s.serviceKey, s.label, s.maxPerDay, JSON.stringify(s.days), s.morning, s.evening);
}

console.log("Hopital de test cree avec le code d'acces :", hospital.accessCode);
