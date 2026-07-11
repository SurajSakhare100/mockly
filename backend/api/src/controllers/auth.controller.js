import axios from "axios";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Helper to sign JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user is a Google-only login
    if (user.googleId && !user.password) {
      return res.status(400).json({ 
        message: "This account was created with Google Sign-In. Please sign in using Google." 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Authenticate with Google idToken
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res) => {
  const { idToken } = req.body;
  try {
    if (!idToken) {
      return res.status(400).json({ message: "Google ID Token is required" });
    }

    // Call Google's tokeninfo API to verify the token
    const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
    const response = await axios.get(tokenInfoUrl);
    const { sub, email, email_verified, name, picture, aud } = response.data;

    // Check email verification status
    if (email_verified !== "true" && email_verified !== true) {
      return res.status(400).json({ message: "Google email is not verified" });
    }

    // Optional: Verify Google Client ID if configured in .env and not placeholder
    const envClientId = process.env.GOOGLE_CLIENT_ID;
    if (envClientId && envClientId !== "your_google_client_id_here") {
      if (aud !== envClientId) {
        return res.status(400).json({ message: "Google Client ID mismatch (unauthorized client)" });
      }
    }

    // Check if user exists in database
    let user = await User.findOne({ email });

    if (user) {
      // Link Google ID if the user registered with email first
      if (!user.googleId) {
        user.googleId = sub;
        if (!user.avatar && picture) {
          user.avatar = picture;
        }
        await user.save();
      }
    } else {
      // Create new user for Google signup
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        googleId: sub,
        avatar: picture
      });
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error("Google Token Verification Error:", err.response?.data || err.message);
    res.status(400).json({ 
      message: "Google token verification failed. Please try again.",
      error: err.response?.data?.error_description || err.message 
    });
  }
};
