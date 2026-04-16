import { Response } from "express";
import { Job } from "../models";
import { AuthRequest } from "../middleware/auth";

export const createJob = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, description, requirements } = req.body;

    const job = new Job({
      recruiterId: req.userId,
      title,
      description,
      requirements: {
        skills: requirements?.skills || [],
        experienceYears: requirements?.experienceYears || 0,
        education: requirements?.education || "",
        other: requirements?.other || "",
      },
      status: "active",
    });

    await job.save();
    res.status(201).json({ message: "Job created successfully.", job });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create job.", details: error.message });
  }
};

export const getJobs = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const jobs = await Job.find({ recruiterId: req.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ jobs });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch jobs.", details: error.message });
  }
};

export const getJobById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      recruiterId: req.userId,
    });

    if (!job) {
      res.status(404).json({ error: "Job not found." });
      return;
    }

    res.json({ job });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch job.", details: error.message });
  }
};

export const updateJob = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, description, requirements, status } = req.body;

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, recruiterId: req.userId },
      {
        ...(title && { title }),
        ...(description && { description }),
        ...(requirements && { requirements }),
        ...(status && { status }),
      },
      { new: true }
    );

    if (!job) {
      res.status(404).json({ error: "Job not found." });
      return;
    }

    res.json({ message: "Job updated successfully.", job });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update job.", details: error.message });
  }
};

export const deleteJob = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, recruiterId: req.userId },
      { status: "archived" },
      { new: true }
    );

    if (!job) {
      res.status(404).json({ error: "Job not found." });
      return;
    }

    res.json({ message: "Job archived successfully.", job });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to archive job.", details: error.message });
  }
};
