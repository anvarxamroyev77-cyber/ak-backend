import express from "express";
import Message from "../models/Message.js";
import { Configuration, OpenAIApi } from "openai";

const router = express.Router();

// Save & fetch chat messages
router.post("/message", async (req, res) => {
  const msg = new Message(req.body);
  await msg.save();
  res.json(msg);
});

router.get("/messages", async (req, res) => {
  const msgs = await Message.find().sort({ createdAt: -1 }).limit(20);
  res.json(msgs);
});

// AI chat
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

router.post("/ai", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });
    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
