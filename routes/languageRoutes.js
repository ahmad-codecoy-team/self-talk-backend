const express = require("express");
const { getPublicLanguages } = require("../controllers/languageController");

const router = express.Router();

// GET - Get all languages with their accents (Public)
router.get("/", getPublicLanguages);

module.exports = router;
