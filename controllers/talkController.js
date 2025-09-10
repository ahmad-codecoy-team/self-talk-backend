// // controllers/talkController.js
// const Conversation = require("../models/Conversation");

// // bring your existing helpers
// const { success, error } = require("../utils/response");

// function deriveTitle(messages) {
//   // Use the first user message as title; fallback to first message
//   const firstUser = messages.find((m) => m.role === "user");
//   const base = (firstUser?.text || messages[0]?.text || "").trim();
//   if (!base) return "Conversation";
//   // truncate to ~70 chars to match list preview feel
//   return base.length > 70 ? base.slice(0, 67) + "..." : base;
// }

// function deriveTimes(messages, startedAtInput, endedAtInput) {
//   // If client passes timestamps on messages, use min/max; else use provided startedAt/endedAt; else now/now+30s
//   const timestamps = messages
//     .map((m) => (m.timestamp ? new Date(m.timestamp) : null))
//     .filter(Boolean)
//     .map((d) => d.getTime());

//   let startedAt = startedAtInput ? new Date(startedAtInput) : null;
//   let endedAt = endedAtInput ? new Date(endedAtInput) : null;

//   if (timestamps.length) {
//     const min = new Date(Math.min(...timestamps));
//     const max = new Date(Math.max(...timestamps));
//     startedAt = startedAt || min;
//     endedAt = endedAt || max;
//   }

//   if (!startedAt) startedAt = new Date();
//   if (!endedAt) endedAt = new Date(startedAt.getTime() + 30 * 1000); // default to 30s to match UI

//   const durationSec = Math.max(0, Math.round((endedAt - startedAt) / 1000));
//   return { startedAt, endedAt, durationSec };
// }

// // POST /api/talk/conversations
// exports.createConversation = async (req, res) => {
//   try {
//     const userId = req.user?.uid;
//     const { messages = [], mood = null, startedAt, endedAt } = req.body;

//     const title = deriveTitle(messages);
//     const {
//       startedAt: sAt,
//       endedAt: eAt,
//       durationSec,
//     } = deriveTimes(messages, startedAt, endedAt);

//     const doc = await Conversation.create({
//       userId,
//       title,
//       mood,
//       startedAt: sAt,
//       endedAt: eAt,
//       durationSec,
//       messages: messages.map((m) => ({
//         role: m.role,
//         text: m.text,
//         timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
//       })),
//     });

//     return success(res, 201, "Conversation created", {
//       conversationId: doc._id,
//     });
//   } catch (err) {
//     return error(res, 500, "Failed to create conversation", [
//       { message: err.message },
//     ]);
//   }
// };

// // GET /api/talk/conversations
// exports.listConversations = async (req, res) => {
//   try {
//     const userId = req.user?.uid;
//     const page = req.query.page || 1;
//     const limit = req.query.limit || 20;
//     const skip = (page - 1) * limit;

//     const [items, total] = await Promise.all([
//       Conversation.find({ userId })
//         .sort({ startedAt: -1, _id: -1 })
//         .skip(skip)
//         .limit(limit)
//         .select("_id title mood startedAt durationSec"),
//       Conversation.countDocuments({ userId }),
//     ]);

//     return success(res, 200, "OK", {
//       items,
//       pagination: {
//         total,
//         page: Number(page),
//         limit: Number(limit),
//         hasMore: skip + items.length < total,
//       },
//     });
//   } catch (err) {
//     return error(res, 500, "Failed to fetch conversations", [
//       { message: err.message },
//     ]);
//   }
// };

// // GET /api/talk/conversations/:id
// exports.getConversation = async (req, res) => {
//   try {
//     const userId = req.user?.uid;
//     const { id } = req.params;

//     const convo = await Conversation.findOne({ _id: id, userId });
//     if (!convo) {
//       return error(res, 404, "Conversation not found");
//     }
//     return success(res, 200, "OK", {
//       _id: convo._id,
//       title: convo.title,
//       mood: convo.mood,
//       startedAt: convo.startedAt,
//       endedAt: convo.endedAt,
//       durationSec: convo.durationSec,
//       messages: convo.messages.map((m) => ({
//         role: m.role,
//         text: m.text,
//         timestamp: m.timestamp,
//       })),
//     });
//   } catch (err) {
//     return error(res, 500, "Failed to fetch conversation", [
//       { message: err.message },
//     ]);
//   }
// };

// // DELETE /api/talk/conversations/:id   (you can enable now or later)
// exports.deleteConversation = async (req, res) => {
//   try {
//     const userId = req.user?.uid;
//     const { id } = req.params;

//     const deleted = await Conversation.findOneAndDelete({ _id: id, userId });
//     if (!deleted) {
//       return error(res, 404, "Conversation not found");
//     }
//     return success(res, 200, "Conversation deleted");
//   } catch (err) {
//     return error(res, 500, "Failed to delete conversation", [
//       { message: err.message },
//     ]);
//   }
// };

// // (Dev-only) POST /api/talk/conversations/dev-seed
// // creates N fake conversations for the current user (no external deps)
// exports.devSeedConversations = async (req, res) => {
//   try {
//     if (process.env.NODE_ENV === "production") {
//       return error(res, 403, "Seeding disabled in production");
//     }
//     const userId = req.user?.uid;
//     const count = Math.min(Number(req.body.count || 5), 20);

//     const now = Date.now();
//     const docs = [];
//     for (let i = 0; i < count; i++) {
//       const start = new Date(now - (i + 1) * 3600 * 1000);
//       const end = new Date(start.getTime() + 30 * 1000);
//       const msgText = "I'm feeling overwhelmed, but I'll get through it.";
//       docs.push({
//         userId,
//         title: msgText,
//         mood: "Happy", // fixed for now
//         startedAt: start,
//         endedAt: end,
//         durationSec: 30,
//         messages: [
//           { role: "user", text: msgText, timestamp: start },
//           {
//             role: "ai",
//             text: msgText,
//             timestamp: new Date(start.getTime() + 5000),
//           },
//           {
//             role: "user",
//             text: msgText,
//             timestamp: new Date(start.getTime() + 10000),
//           },
//           {
//             role: "ai",
//             text: msgText,
//             timestamp: new Date(start.getTime() + 15000),
//           },
//           {
//             role: "user",
//             text: msgText,
//             timestamp: new Date(start.getTime() + 20000),
//           },
//           {
//             role: "ai",
//             text: msgText,
//             timestamp: new Date(start.getTime() + 25000),
//           },
//         ],
//       });
//     }

//     const created = await Conversation.insertMany(docs);
//     return success(res, 201, "Seeded conversations", {
//       created: created.length,
//     });
//   } catch (err) {
//     return error(res, 500, "Failed to seed conversations", [
//       { message: err.message },
//     ]);
//   }
// };

// controllers/talkController.js
const Conversation = require("../models/Conversation");
const Message = require("../models/Message"); // ✅ new separate collection
const { success, error } = require("../utils/response");

// -------- Helpers --------
function deriveTitle(messages) {
  const firstUser = messages.find((m) => m.role === "user");
  const base = (firstUser?.text || messages[0]?.text || "").trim();
  if (!base) return "Conversation";
  return base.length > 70 ? base.slice(0, 67) + "..." : base;
}

function deriveTimes(messages, startedAtInput, endedAtInput) {
  const timestamps = messages
    .map((m) => (m.timestamp ? new Date(m.timestamp) : null))
    .filter(Boolean)
    .map((d) => d.getTime());

  let startedAt = startedAtInput ? new Date(startedAtInput) : null;
  let endedAt = endedAtInput ? new Date(endedAtInput) : null;

  if (timestamps.length) {
    const min = new Date(Math.min(...timestamps));
    const max = new Date(Math.max(...timestamps));
    startedAt = startedAt || min;
    endedAt = endedAt || max;
  }

  if (!startedAt) startedAt = new Date();
  if (!endedAt) endedAt = new Date(startedAt.getTime() + 30 * 1000); // default 30s

  const durationSec = Math.max(0, Math.round((endedAt - startedAt) / 1000));
  return { startedAt, endedAt, durationSec };
}

// -------- Controllers --------

// POST /api/talk/conversations
exports.createConversation = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const { messages = [], mood = null, startedAt, endedAt } = req.body;

    const title = deriveTitle(messages);
    const {
      startedAt: sAt,
      endedAt: eAt,
      durationSec,
    } = deriveTimes(messages, startedAt, endedAt);

    // 1) Create the conversation (no embedded messages)
    const convo = await Conversation.create({
      userId,
      title,
      mood,
      startedAt: sAt,
      endedAt: eAt,
      durationSec,
    });

    // 2) Insert messages in bulk
    if (Array.isArray(messages) && messages.length) {
      const docs = messages.map((m) => ({
        conversationId: convo._id,
        userId,
        role: m.role,
        text: m.text,
        timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
      }));

      try {
        await Message.insertMany(docs);
      } catch (msgErr) {
        // rollback conversation if message insert fails
        await Conversation.deleteOne({ _id: convo._id, userId });
        return error(res, 500, "Failed to create conversation messages", [
          { message: msgErr.message },
        ]);
      }
    }

    return success(res, 201, "Conversation created", {
      conversationId: convo._id,
    });
  } catch (err) {
    return error(res, 500, "Failed to create conversation", [
      { message: err.message },
    ]);
  }
};

// GET /api/talk/conversations
exports.listConversations = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Conversation.find({ userId })
        .sort({ startedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .select("_id title mood startedAt durationSec"),
      Conversation.countDocuments({ userId }),
    ]);

    return success(res, 200, "OK", {
      items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: skip + items.length < total,
      },
    });
  } catch (err) {
    return error(res, 500, "Failed to fetch conversations", [
      { message: err.message },
    ]);
  }
};

// GET /api/talk/conversations/:id
exports.getConversation = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const { id } = req.params;

    const convo = await Conversation.findOne({ _id: id, userId });
    if (!convo) return error(res, 404, "Conversation not found");

    // Read messages from Message collection
    const msgs = await Message.find({ conversationId: id, userId })
      .sort({ timestamp: 1, _id: 1 })
      .select("role text timestamp")
      .lean();

    return success(res, 200, "OK", {
      _id: convo._id,
      title: convo.title,
      mood: convo.mood,
      startedAt: convo.startedAt,
      endedAt: convo.endedAt,
      durationSec: convo.durationSec,
      messages: msgs,
    });
  } catch (err) {
    return error(res, 500, "Failed to fetch conversation", [
      { message: err.message },
    ]);
  }
};

// DELETE /api/talk/conversations/:id
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user?.uid;
    const { id } = req.params;

    const deleted = await Conversation.findOneAndDelete({ _id: id, userId });
    if (!deleted) return error(res, 404, "Conversation not found");

    // Cascade delete messages
    await Message.deleteMany({ conversationId: id, userId });

    return success(res, 200, "Conversation deleted");
  } catch (err) {
    return error(res, 500, "Failed to delete conversation", [
      { message: err.message },
    ]);
  }
};

// (Dev-only) POST /api/talk/conversations/dev-seed
exports.devSeedConversations = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return error(res, 403, "Seeding disabled in production");
    }
    const userId = req.user?.uid;
    const count = Math.min(Number(req.body.count || 5), 20);

    const now = Date.now();

    // 1) Create convos
    const convDocs = [];
    for (let i = 0; i < count; i++) {
      const start = new Date(now - (i + 1) * 3600 * 1000);
      const end = new Date(start.getTime() + 30 * 1000);
      const msgText = "I'm feeling overwhelmed, but I'll get through it.";
      convDocs.push({
        userId,
        title: msgText,
        mood: "Happy",
        startedAt: start,
        endedAt: end,
        durationSec: 30,
      });
    }
    const createdConvs = await Conversation.insertMany(convDocs);

    // 2) Create messages for each convo
    const msgDocs = [];
    for (const c of createdConvs) {
      const start = c.startedAt;
      msgDocs.push(
        {
          conversationId: c._id,
          userId,
          role: "user",
          text: c.title,
          timestamp: start,
        },
        {
          conversationId: c._id,
          userId,
          role: "ai",
          text: c.title,
          timestamp: new Date(start.getTime() + 5000),
        },
        {
          conversationId: c._id,
          userId,
          role: "user",
          text: c.title,
          timestamp: new Date(start.getTime() + 10000),
        },
        {
          conversationId: c._id,
          userId,
          role: "ai",
          text: c.title,
          timestamp: new Date(start.getTime() + 15000),
        },
        {
          conversationId: c._id,
          userId,
          role: "user",
          text: c.title,
          timestamp: new Date(start.getTime() + 20000),
        },
        {
          conversationId: c._id,
          userId,
          role: "ai",
          text: c.title,
          timestamp: new Date(start.getTime() + 25000),
        }
      );
    }
    if (msgDocs.length) await Message.insertMany(msgDocs);

    return success(res, 201, "Seeded conversations", {
      created: createdConvs.length,
    });
  } catch (err) {
    return error(res, 500, "Failed to seed conversations", [
      { message: err.message },
    ]);
  }
};
