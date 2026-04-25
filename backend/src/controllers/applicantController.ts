import { Response } from "express";
import { Applicant, Job } from "../models";
import { AuthRequest } from "../middleware/auth";
import { parseCSV, parseExcel, parsePDF, parseJSON } from "../services/fileParser";


function checkProfileCompleteness(profileData: any) {
  const checks = [
    { section: "Basic Info", fields: ["firstName", "lastName", "email", "headline", "location"], status: "missing" as string, details: [] as string[], optional: false },
    { section: "Skills", fields: ["skills"], status: "missing" as string, details: [] as string[], optional: false },
    { section: "Experience", fields: ["experience"], status: "missing" as string, details: [] as string[], optional: false },
    { section: "Education", fields: ["education"], status: "missing" as string, details: [] as string[], optional: false },
    { section: "Certifications", fields: ["certifications"], status: "missing" as string, details: [] as string[], optional: true },
    { section: "Projects", fields: ["projects"], status: "missing" as string, details: [] as string[], optional: false },
    { section: "Availability", fields: ["availability"], status: "missing" as string, details: [] as string[], optional: false },
    { section: "Social Links", fields: ["socialLinks"], status: "missing" as string, details: [] as string[], optional: true },
  ];

  checks.forEach((check) => {
    const missing: string[] = [];
    check.fields.forEach((field) => {
      const value = profileData?.[field];
      if (!value) { missing.push(field); }
      else if (Array.isArray(value) && value.length === 0) { missing.push(field + " (empty)"); }
      else if (typeof value === "object" && !Array.isArray(value)) {
        const hasValues = Object.values(value).some((v) => v !== null && v !== undefined && v !== "");
        if (!hasValues) missing.push(field + " (empty)");
      }
    });
    check.status = missing.length === 0 ? "complete" : missing.length < check.fields.length ? "partial" : "missing";
    check.details = missing;
  });

  const required = checks.filter((c) => !c.optional);
  const completed = required.filter((c) => c.status === "complete").length;
  const total = required.length;
  const score = Math.round((completed / total) * 100);
  const alerts: string[] = [];
  checks.forEach((c) => {
    if (c.status === "missing" && !c.optional) alerts.push("Missing: " + c.section);
    else if (c.status === "partial") alerts.push("Incomplete: " + c.section + " (" + c.details.join(", ") + ")");
  });
  return { score, completed, total, sections: checks, alerts };
}


function hasMinimumData(profileData: any): boolean {
  return !!(profileData?.firstName || profileData?.lastName || profileData?.fullName);
}


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

function getSourceFromMime(mimetype: string, ext: string): string {
  if (mimetype === "application/pdf") return "pdf_resume";
  if (mimetype === "application/json" || ext === ".json") return "json_upload";
  return "csv_upload";
}


export const addApplicants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: jobId } = req.params;
    const { applicants } = req.body;
   
    const job = await Job.findOne({ _id: jobId, recruiterId: req.userId });
    if (!job) { res.status(404).json({ error: "Job not found." }); return; }

    let skipped = 0;
    const bulkOps = [];

  
    for (const a of applicants) {
      const profile = normalizeProfile(a);
      if (!hasMinimumData(profile)) { skipped++; continue; }

      if (profile.email) {
        bulkOps.push({
          updateOne: {
            filter: { jobId, "profileData.email": profile.email },
            update: { 
              $set: { profileData: profile, parsedAt: new Date() },
              $setOnInsert: { source: "umurava_profile", jobId }
            },
            upsert: true // Updates if exists, creates if new
          }
        });
      } else {
        bulkOps.push({
          insertOne: {
            document: { jobId, source: "umurava_profile", profileData: profile, parsedAt: new Date() }
          }
        });
      }
    }

    let added = 0, updated = 0;
    if (bulkOps.length > 0) {
      const result = await Applicant.bulkWrite(bulkOps as any);
      added = result.upsertedCount + (result.insertedCount || 0);
      updated = result.modifiedCount;
    }

    res.status(201).json({ message: `${added} added, ${updated} updated, ${skipped} skipped.`, added, updated, skipped });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add applicants.", details: error.message });
  }
};

export const uploadApplicants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: jobId } = req.params;
    
    // 1. Authenticate and validate upload request
    const job = await Job.findOne({ _id: jobId, recruiterId: req.userId });
    if (!job) { res.status(404).json({ error: "Job not found." }); return; }

    const file = req.file;
    if (!file) { res.status(400).json({ error: "No file uploaded." }); return; }

    let parsedApplicants: any[] = [];
    let extractionWarnings: string[] = [];
    const ext = file.originalname.toLowerCase().split(".").pop() || "";

    if (file.mimetype === "text/csv" || ext === "csv") {
      parsedApplicants = await parseCSV(file.path);
    } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.mimetype === "application/vnd.ms-excel" || ext === "xlsx" || ext === "xls") {
      parsedApplicants = parseExcel(file.path);
    } else if (file.mimetype === "application/json" || ext === "json") {
      parsedApplicants = parseJSON(file.path);
    } else if (file.mimetype === "application/pdf" || ext === "pdf") {
      const parsed = await parsePDF(file.path);
      parsedApplicants = [parsed];
      const p = parsed as any;

      if (!p.skills || p.skills.length === 0) extractionWarnings.push("Could not extract skills from PDF");
      if (!p.experience || p.experience.length === 0) extractionWarnings.push("Could not extract work experience from PDF");
      if (!p.education || p.education.length === 0) extractionWarnings.push("Could not extract education from PDF");
      if (!p.headline) extractionWarnings.push("Could not extract professional headline from PDF");
    } else {
      res.status(400).json({ error: "Unsupported file type. Use CSV, Excel, PDF, or JSON." });
      return;
    }

    let skipped = 0;
    const bulkOps = [];
    const source = getSourceFromMime(file.mimetype, "." + ext);

    for (const raw of parsedApplicants) {
      const profile = source === "json_upload" ? normalizeProfile(raw) : (raw.firstName ? normalizeProfile(raw) : raw);
      if (!hasMinimumData(profile)) { skipped++; continue; }

      if (profile.email) {
        bulkOps.push({
          updateOne: {
            filter: { jobId, "profileData.email": profile.email },
            update: { 
              $set: { profileData: profile, parsedAt: new Date() },
              $setOnInsert: { 
                jobId, 
                source, 
                rawResumeUrl: file.mimetype === "application/pdf" ? file.path : undefined 
              }
            },
            upsert: true
          }
        });
      } else {
        bulkOps.push({
          insertOne: {
            document: { 
              jobId, 
              source, 
              profileData: profile, 
              rawResumeUrl: file.mimetype === "application/pdf" ? file.path : undefined, 
              parsedAt: new Date() 
            }
          }
        });
      }
    }

    let added = 0, updated = 0;
    if (bulkOps.length > 0) {
      const bulkResult = await Applicant.bulkWrite(bulkOps as any);
      added = bulkResult.upsertedCount + (bulkResult.insertedCount || 0);
      updated = bulkResult.modifiedCount;
    }

    const finalApplicants = await Applicant.find({ jobId }).sort({ createdAt: -1 });

    const completenessResults = finalApplicants.map((a: any) => ({
      id: a._id, name: (a.profileData.firstName + " " + a.profileData.lastName).trim(),
      completeness: checkProfileCompleteness(a.profileData),
    }));
    const needsReview = completenessResults.filter((r: any) => r.completeness.score < 80);

    const parts: string[] = [];
    if (added > 0) parts.push(added + " new candidate" + (added > 1 ? "s" : "") + " added");
    if (updated > 0) parts.push(updated + " existing candidate" + (updated > 1 ? "s" : "") + " updated");
    if (skipped > 0) parts.push(skipped + " skipped (no name found)");

    res.status(201).json({
      message: parts.join(", ") + ".",
      added, updated, skipped, total: finalApplicants.length,
      applicants: finalApplicants,
      extractionWarnings: extractionWarnings.length > 0 ? extractionWarnings : undefined,
      needsReview: needsReview.length > 0 ? needsReview : undefined,
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to upload applicants.", details: error.message });
  }
};

export const getApplicants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: jobId } = req.params;
    const job = await Job.findOne({ _id: jobId, recruiterId: req.userId });
    if (!job) { res.status(404).json({ error: "Job not found." }); return; }
    
    const applicants = await Applicant.find({ jobId }).sort({ createdAt: -1 });
    const enriched = applicants.map((a: any) => ({ ...a.toObject(), completeness: checkProfileCompleteness(a.profileData) }));
    
    res.json({ applicants: enriched, count: enriched.length });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch applicants.", details: error.message });
  }
};

export const getApplicantById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: jobId, applicantId } = req.params;
    const job = await Job.findOne({ _id: jobId, recruiterId: req.userId });
    if (!job) { res.status(404).json({ error: "Job not found." }); return; }
    
    const applicant = await Applicant.findOne({ _id: applicantId, jobId });
    if (!applicant) { res.status(404).json({ error: "Applicant not found." }); return; }
    
    res.json({ applicant: { ...applicant.toObject(), completeness: checkProfileCompleteness(applicant.profileData) } });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch applicant.", details: error.message });
  }
};

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
    
    res.json({ message: "Profile updated.", applicant: { ...applicant.toObject(), completeness: checkProfileCompleteness(updatedProfile) } });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update applicant.", details: error.message });
  }
};

export const deleteApplicant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: jobId, applicantId } = req.params;
    const job = await Job.findOne({ _id: jobId, recruiterId: req.userId });
    if (!job) { res.status(404).json({ error: "Job not found." }); return; }
    
    await Applicant.findOneAndDelete({ _id: applicantId, jobId });
    res.json({ message: "Applicant deleted." });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete applicant.", details: error.message });
  }
};