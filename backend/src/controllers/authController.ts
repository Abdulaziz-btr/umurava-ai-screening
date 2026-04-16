import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models";
import { config } from "../config";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, company } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: "Email already registered." });
      return;
    }

    // Create new user
    const user = new User({
      email,
      passwordHash: password, // Will be hashed by the pre-save hook
      fullName,
      company: company || "",
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    } as jwt.SignOptions);

    res.status(201).json({
      message: "Registration successful.",
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        company: user.company,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Registration failed.", details: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    } as jwt.SignOptions);

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        company: user.company,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Login failed.", details: error.message });
  }
};

export const getProfile = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select("-passwordHash");
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get profile.", details: error.message });
  }
};
