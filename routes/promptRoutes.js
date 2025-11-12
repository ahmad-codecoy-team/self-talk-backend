const express = require("express");
const { getPrompt } = require("../controllers/promptController");

const router = express.Router();

// =========================
// Prompt Routes (Public)
// =========================

// GET - Get global prompt
router.get("/", getPrompt);

module.exports = router;