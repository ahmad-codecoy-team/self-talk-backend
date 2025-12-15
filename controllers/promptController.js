const Prompt = require("../models/Prompt");
const { success, error } = require("../utils/response");

// =================== GET GLOBAL PROMPT ===================
exports.getPrompt = async (req, res, next) => {
  try {
    // Get the first prompt from database (global prompt)
    const prompt = await Prompt.findOne().select("prompt llmModal createdAt updatedAt");

    if (!prompt) {
      return error(res, 404, "No prompt found");
    }

    return success(res, 200, "Prompt fetched successfully", {
      prompt: {
        _id: prompt._id,
        prompt: prompt.prompt,
        llmModal: prompt.llmModal,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};