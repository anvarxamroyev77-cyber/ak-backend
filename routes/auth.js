import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import nodemailer from "nodemailer";

const router = express.Router();

// 📌 Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail", // Agar iCloud ishlatmoqchi bo‘lsang → host: "smtp.mail.me.com", port: 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 📌 Signup – ro‘yxatdan o‘tish + email verification yuborish
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const user = new User({ name, email, password, verified: false });
    await user.save();

    // 🔑 verification token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // ✅ link to‘g‘rilangan
    const link = `${process.env.FRONTEND_URL}/verify/${token}`;

    // email yuborish
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your email",
      html: `<p>Hello ${name}, please verify your email by clicking below:</p>
             <a href="${link}">Verify Email</a>`,
    });

    res.status(201).json({ msg: "User created, verification email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// 📌 Verify – emailni tasdiqlash
router.get("/verify/:token", async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(400).json({ msg: "Invalid token" });

    user.verified = true;
    await user.save();

    res.status(200).json({ msg: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ msg: "Invalid or expired token" });
  }
});

// 📌 Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    if (user.password !== password) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    if (!user.verified) {
      return res.status(400).json({ msg: "Please verify your email first" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
