const express = require("express");
const cors = require("cors");

const hospitalsRouter = require("./routes/hospitals");
const authRouter = require("./routes/auth");
const bookingsRouter = require("./routes/bookings");
const resultsRouter = require("./routes/results");
const hospitalAuthRouter = require("./routes/hospitalAuth");
const hospitalRouter = require("./routes/hospital");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => res.json({ message: "Vitalink API running"}))
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/hospitals", hospitalsRouter);
app.use("/api/auth", authRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/results", resultsRouter);
app.use("/api/hospital-auth", hospitalAuthRouter);
app.use("/api/hospital", hospitalRouter);

app.use(errorHandler);

module.exports = app;