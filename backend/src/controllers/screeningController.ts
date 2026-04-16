import { Response } from "express";
import { Job, Applicant, ScreeningResult } from "../models";
import { AuthRequest } from "../middleware/auth";
import { screenCandidates } from "../services/aiService";

export const triggerScreening = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: jobId } = req.params;
    const { shortlistSize = 10, weights } = req.body;

    if (shortlistSize !== 10 && shortlistSize !== 20) {
      res.status(400).json({ error: "Shortlist size must be 10 or 20." });
      return;
    }

    // Validate weights if provided
    let finalWeights = { skills: 40, experience: 30, education: 15, relevance: 15 };
    if (weights) {
      const total = (weights.skills || 0) + (weights.experience || 0) + (weights.education || 0) + (weights.relevance || 0);
      if (total !== 100) {
        res.status(400).json({ error: `Weights must total 100%. Current total: ${total}%` });
        return;
      }
      finalWeights = weights;
    }

    const job = await Job.findOne({ _id: jobId, recruiterId: req.userId });
    if (!job) {
      res.status(404).json({ error: "Job not found." });
      return;
    }

    const applicants = await Applicant.find({ jobId });
    if (applicants.length === 0) {
      res.status(400).json({ error: "No applicants found for this job." });
      return;
    }

    const aiResult = await screenCandidates(job, applicants, shortlistSize, finalWeights);

    const screeningResult = new ScreeningResult({
      jobId,
      recruiterId: req.userId,
      shortlistSize,
      candidates: aiResult.candidates,
      aiModelVersion: aiResult.modelVersion,
      promptUsed: aiResult.promptUsed,
      weights: aiResult.weights,
      poolInsights: aiResult.poolInsights,
      completedAt: new Date(),
    });

    await screeningResult.save();
    await Job.findByIdAndUpdate(jobId, { status: "screened" });

    res.json({ message: "Screening completed successfully.", result: screeningResult });
  } catch (error: any) {
    console.error("Screening error:", error.message);
    res.status(500).json({ error: error.message, details: error.message });
  }
};

export const getScreeningResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: jobId } = req.params;
    const job = await Job.findOne({ _id: jobId, recruiterId: req.userId });
    if (!job) {
      res.status(404).json({ error: "Job not found." });
      return;
    }
    const results = await ScreeningResult.find({ jobId })
      .populate("candidates.applicantId", "profileData source")
      .sort({ completedAt: -1 });
    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch screening results.", details: error.message });
  }
};