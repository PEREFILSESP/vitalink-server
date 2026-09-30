function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Erreur serveur interne"
  });
}

module.exports = { errorHandler };
