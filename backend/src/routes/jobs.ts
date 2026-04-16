import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
} from "../controllers/jobController";
import {
  addApplicants,
  uploadApplicants,
  getApplicants,
} from "../controllers/applicantController";
import {
  triggerScreening,
  getScreeningResults,
} from "../controllers/screeningController";
import { upload } from "../middleware/upload";

const router = Router();

// All job routes require authentication
router.use(authMiddleware);

// Job CRUD
router.post("/", createJob);
router.get("/", getJobs);
router.get("/:id", getJobById);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

// Applicant management
router.post("/:id/applicants", addApplicants);
router.post("/:id/applicants/upload", upload.single("file"), uploadApplicants);
router.get("/:id/applicants", getApplicants);

// AI Screening
router.post("/:id/screen", triggerScreening);
router.get("/:id/screening-results", getScreeningResults);

export default router;
