import { Response } from "express";
import { Applicant, Job } from "../models";
import { AuthRequest } from "../middleware/auth";
import { parseCSV, parseExcel, parsePDF } from "../services/fileParser";

// Schema completeness checker
function checkProfileCompleteness(profileData: any) {
  const checks = [
    { section: "Basic Info", fields: ["firstName", "lastName", "email", "headline", "location"],
      status: "missing" as string, details: [] as string[], optional: false },
    { section: "Skills", fields: ["skills"],
      status: "missing" as string, details: [] as string[], optional: false },
    { section: "Experience", fields: ["experience"],
      status: "missing" as string, details: [] as string[], optional: false },
    { section: "Education", fields: ["education"],
      status: "missing" as string, details: [] as string[], optional: false },
    { section: "Certifications", fields: ["certifications"],
      status: "missing" as string, details: [] as string[], optional: true },
    { section: "Projects", fields: ["projects"],
      status: "missing" as string, details: [] as string[], optional: false },
    { section: "Availability", fields: ["availability"],
      status: "missing" as string, details: [] as string[], optional: false },
    { section: "Social Links", fields: ["socialLinks"],
      status: "missing" as string, details: [] as string[], optional: true },
  ];

  checks.forEach((check) => {
    const missing: string[] = [];
    check.fields.forEach((field) => {
      const value = profileData?.[field];
      if (!value) {
        missing.push(field);
      } else if (Array.isArray(value) && value.length === 0) {
        missing.push(`${field} (empty)`);
      } else if (typeof value === "object" && !Array.isArray(value)) {
        const hasValues = Object.values(value).some((v) => v !== null && v !== undefined && v !== "");
        if (!hasValues) missing.push(`${field} (empty)`);
      }
    });

    if (missing.length === 0) {
      check.status = "complete";
    } else if (missing.length < check.fields.length) {
      check.status = "partial";
    } else {
      check.status = "missing";
    }
    check.details = missing;
  });

  const required = checks.filter((c) => !c.optional);
  const completed = required.filter((c) => c.status === "complete").length;
  const total = required.length;
  const score = Math.round((completed / total) * 100);

  const alerts: string[] = [];
  checks.forEach((c) => {
    if (c.status === "missing" && !c.optional) {
      alerts.push(`Missing: ${c.section}`);
    } else if (c.status === "partial") {
      alerts.push(`Incomplete: ${c.section} (${c.details.join(", ")})`);
    }
  });

  return { score, completed, total, sections: checks, alerts };
}

// Check if a candidate has minimum required data
function hasMinimumData(profileData: any): boolean {
  const hasName = !!(profileData?.firstName || profileData?.lastName || profileData?.fullName);
  return hasName;
}

// Normalize profile data to ensure consistent structure
function normalizeProfile(raw: any): any {
  return {
    firstName: raw.firstName || raw.fullName?.split(" ")[0] || "",
    lastName: raw.lastName || raw.fullName?.split(" ").slice(1).join(" ") || "",
    email: raw.email || "",
    headline: raw.headline || "",
    bio: raw.bio || raw.summary || "",
    location: raw.location || "",
    skills: raw.skills || [],
    languages: raw.languages || [],
    experience: raw.experience || [],
    education: raw.education || [],
    certifications: raw.certifications || [],
    projects: raw.projects || [],
    availability: raw.availability || { status: "Available", type: "Full-time" },
    socialLinks: raw.socialLinks || {},
  };
}

// Add applicants via JSON (Umurava structured profiles)
export const addApplicants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: jobId } = req.params;
    const { applicants } = req.body;

    const job = await Job.findOne({ _id: jobId, recruiterId: req.userId });
    if (!job) { res.status(404).json({ error: "Job not found." }); return; }

    // Deduplicate by email
    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const a of applicants) {
      const profile = normalizeProfile(a);

      if (!hasMinimumData(profile)) {
        skipped++;
        continue;
      }

      if (profile.email) {
        const existing = await Applicant.findOne({ jobId, "profileData.email": profile.email });
        if (existing) {
          // Update existing candidate
          existing.profileData = profile;
          await existing.save();
          updated++;
          continue;
        }
      }

      await Applicant.create({
        jobId,
        source: "umurava_profile",
        profileData: profile,
        parsedAt: new Date(),
      });
      added++;
    }

    res.status(201).json({
      message: `${added} added, ${updated} updated, ${skipped} skipped (insufficient data).`,
      added,
      updated,
      skipped,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add applicants.", details: error.message });
  }
};

// Upload applicants via file (CSV, Excel, PDF)
export const uploadApplicants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: jobId } = req.params;

    const job = await Job.findOne({ _id: jobId, recruiterId: req.userId });
    if (!job) { res.status(404).json({ error: "Job not found." }); return; }

    const file = req.file;
    if (!file) { res.status(400).json({ error: "No file uploaded." }); return; }

    let parsedApplicants: any[] = [];
    let extractionWarnings: string[] = [];

    if (file.mimetype === "text/csv") {
      parsedApplicants = await parseCSV(file.path);
    } else if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      parsedApplicants = parseExcel(file.path);
    } else if (file.mimetype === "application/pdf") {
      const parsed = await parsePDF(file.path);
      parsedApplicants = [parsed];
      const p = parsed as any;
      if (!p.skills || p.skills.length === 0) extractionWarnings.push("Could not extract skills from PDF");
      if (!p.experience || p.experience.length === 0) extractionWarnings.push("Could not extract work experience from PDF");
      if (!p.education || p.education.length === 0) extractionWarnings.push("Could not extract education from PDF");
      if (!p.headline) extractionWarnings.push("Could not extract professional headline from PDF");
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;
    const createdApplicants: any[] = [];

    for (const raw of parsedApplicants) {
      const profile = normalizeProfile(raw);

      // Skip candidates with no name at all
      if (!hasMinimumData(profile)) {
        skipped++;
        continue;
      }

      // Deduplicate by email within this job
      if (profile.email) {
        const existing = await Applicant.findOne({ jobId, "profileData.email": profile.email });
        if (existing) {
          existing.profileData = profile;
          await existing.save();
          updated++;
          createdApplicants.push(existing);
          continue;
        }
      }

      const created = await Applicant.create({
        jobId,
        source: file.mimetype === "application/pdf" ? "pdf_resume" : "csv_upload",
        profileData: profile,
        rawResumeUrl: file.mimetype === "application/pdf" ? file.path : undefined,
        parsedAt: new Date(),
      });
      added++;
      createdApplicants.push(created);
    }

    // Compute completeness for response
    const completenessResults = createdApplicants.map((a: any) => ({
      id: a._id,
      name: `${a.profileData.firstName} ${a.profileData.lastName}`.trim(),
      completeness: checkProfileCompleteness(a.profileData),
    }));

    const needsReview = completenessResults.filter((r: any) => r.completeness.score < 80);

    // Build response message
    const parts: string[] = [];
    if (added > 0) parts.push(`${added} new candidate${added > 1 ? "s" : ""} added`);
    if (updated > 0) parts.push(`${updated} existing candidate${updated > 1 ? "s" : ""} updated`);
    if (skipped > 0) parts.push(`${skipped} skipped (no name found)`);

    res.status(201).json({
      message: parts.join(", ") + ".",
      added,
      updated,
      skipped,
      total: createdApplicants.length,
      applicants: createdApplicants,
      extractionWarnings: extractionWarnings.length > 0 ? extractionWarnings : undefined,
      needsReview: needsReview.length > 0 ? needsReview : undefined,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to upload applicants.", details: error.message });
  }
};

// Get all applicants for a job
export const getApplicants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: jobId } = req.params;

    const job = await Job.findOne({ _id: jobId, recruiterId: req.userId });
    if (!job) { res.status(404).json({ error: "Job not found." }); return; }

    const applicants = await Applicant.find({ jobId }).sort({ createdAt: -1 });

    const enriched = applicants.map((a: any) => ({
      ...a.toObject(),
      completeness: checkProfileCompleteness(a.profileData),
    }));

    res.json({ applicants: enriched, count: enriched.length });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch applicants.", details: error.message });
  }
};

// Get single applicant profile
export const getApplicantById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: jobId, applicantId } = req.params;

    const job = await Job.findOne({ _id: jobId, recruiterId: req.userId });
    if (!job) { res.status(404).json({ error: "Job not found." }); return; }

    const applicant = await Applicant.findOne({ _id: applicantId, jobId });
    if (!applicant) { res.status(404).json({ error: "Applicant not found." }); return; }

    const completeness = checkProfileCompleteness(applicant.profileData);

    res.json({ applicant: { ...applicant.toObject(), completeness } });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch applicant.", details: error.message });
  }
};

// Update applicant profile (HR edit)
export const updateApplicant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: jobId, applicantId } = req.params;
    const { profileData } = req.body;

    const job = await Job.findOne({ _id: jobId, recruiterId: req.userId });
    if (!job) { res.status(404).json({ error: "Job not found." }); return; }

    const applicant = await Applicant.findOne({ _id: applicantId, jobId });
    if (!applicant) { res.status(404).json({ error: "Applicant not found." }); return; }

    const updatedProfile = { ...applicant.profileData, ...profileData };
    applicant.profileData = updatedProfile;
    await applicant.save();

    const completeness = checkProfileCompleteness(updatedProfile);

    res.json({
      message: "Applicant profile updated successfully.",
      applicant: { ...applicant.toObject(), completeness },
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update applicant.", details: error.message });
  }
};

// Delete applicant
export const deleteApplicant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: jobId, applicantId } = req.params;

    const job = await Job.findOne({ _id: jobId, recruiterId: req.userId });
    if (!job) { res.status(404).json({ error: "Job not found." }); return; }

    await Applicant.findOneAndDelete({ _id: applicantId, jobId });
    res.json({ message: "Applicant deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete applicant.", details: error.message });
  }
};