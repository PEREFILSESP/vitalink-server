const { verifyToken } = require("../config/jwt");

function requireHospitalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Non authentifie" });

  try {
    const payload = verifyToken(token);
    if (!payload.hospitalStaff) throw new Error("invalid");
    req.hospitalId = payload.hospitalId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expire" });
  }
}

module.exports = { requireHospitalAuth };
