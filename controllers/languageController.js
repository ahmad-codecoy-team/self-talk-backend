const Language = require("../models/Language");
const Accent = require("../models/Accent");
const { success, error } = require("../utils/response");

// GET - Get all languages with their accents
exports.getPublicLanguages = async (req, res, next) => {
  try {
    const languages = await Language.find().sort({ name: 1 });
    const accents = await Accent.find().populate("language");

    // Group accents by language
    const languagesWithAccents = languages.map((lang) => {
      const languageAccents = accents
        .filter((accent) => accent.language && accent.language._id.toString() === lang._id.toString())
        .map((accent) => ({
          _id: accent._id,
          name: accent.name,
        }));

      return {
        _id: lang._id,
        name: lang.name,
        code: lang.code,
        accents: languageAccents,
      };
    });

    return success(res, 200, "Languages fetched successfully", {
      languages: languagesWithAccents,
    });
  } catch (err) {
    next(err);
  }
};
