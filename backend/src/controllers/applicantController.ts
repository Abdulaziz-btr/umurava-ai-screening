import { Response } from "express";
import { Applicant, Job } from "../models";
import { AuthRequest } from "../middleware/auth";
import { parseCSV, parseExcel, parsePDF } from "../services/fileParser";

// Add applicants via JSON (Umurava structured profiles)
export const addApplicants = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: jobId } = req.params;
    const { applicants } = req.body;

    // Verify job belongs to recruiter
    const job = await Job.findOne({ _id: jobId, recruiterId: req.userId });
    if (!job) {
      res.status(404).json({ error: "Job not found." });
      return;
    }

    const created = await Applicant.insertMany(
      applicants.map((a: any) => ({
        jobId,
        source: "umurava_profile",
        profileData: {
          fullName: a.fullName,
          email: a.email || "",
          phone: a.phone || "",
          skills: a.skills || [],
          experienceYears: a.experienceYears || 0,
          education: a.education || "",
          summary: a.summary || "",
          workHistory: a.workHistory || [],
        },
        parsedAt: new Date(),
      }))
    );

    res.status(201).json({
      message: `${created.length} applicants added successfully.`,
      count: created.length,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Failed to add applicants.", details: error.message });
  }
};

// Upload applicants via file (CSV, Excel, PDF)
export const uploadApplicants = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: jobId } = req.params;

    // Verify job belongs to recruiter
    const job = await Job.findOne({ _id: jobId, recruiterId: req.userId });
    if (!job) {
      res.status(404).json({ error: "Job not found." });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded." });
      return;
    }

    let parsedApplicants: any[] = [];

    if (file.mimetype === "text/csv") {
      parsedApplicants = await parseCSV(file.path);
    } else if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      parsedApplicants = await parseExcel(file.path);
    } else if (file.mimetype === "application/pdf") {
      const parsed = await parsePDF(file.path);
      parsedApplicants = [parsed];
    }

    const created = await Applicant.insertMany(
      parsedApplicants.map((a) => ({
        jobId,
        source: file.mimetype === "application/pdf" ? "pdf_resume" : "csv_upload",
        profileData: {
          fullName: a.fullName || "Unknown",
          email: a.email || "",
          phone: a.phone || "",
          skills: a.skills || [],
          experienceYears: a.experienceYears || 0,
          education: a.education || "",
          summary: a.summary || "",
          workHistory: a.workHistory || [],
        },
        rawResumeUrl: file.mimetype === "application/pdf" ? file.path : undefined,
        parsedAt: new Date(),
      }))
    );

    res.status(201).json({
      message: `${created.length} applicant(s) uploaded and parsed.`,
      count: created.length,
      applicants: created,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Failed to upload applicants.", details: error.message });
  }
};

// Get applicants for a job
export const getApplicants = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: jobId } = req.params;

    // Verify job belongs to recruiter
    const job = await Job.findOne({ _id: jobId, recruiterId: req.userId });
    if (!job) {
      res.status(404).json({ error: "Job not found." });
      return;
    }

    const applicants = await Applicant.find({ jobId }).sort({ createdAt: -1 });
    res.json({ applicants, count: applicants.length });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Failed to fetch applicants.", details: error.message });
  }
};
