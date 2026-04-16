import mongoose, { Document, Schema, Types } from "mongoose";

export interface IScreeningResult extends Document {
  jobId: Types.ObjectId;
  recruiterId: Types.ObjectId;
  shortlistSize: number;
  candidates: any[];
  aiModelVersion: string;
  promptUsed: string;
  weights?: any;
  poolInsights?: any;
  completedAt: Date;
}

const screeningResultSchema = new Schema<IScreeningResult>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    recruiterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    shortlistSize: { type: Number, required: true, enum: [10, 20] },
    candidates: [{
      applicantId: { type: Schema.Types.ObjectId, ref: "Applicant", required: true },
      rank: { type: Number, required: true },
      matchScore: { type: Number, required: true, min: 0, max: 100 },
      skillsScore: { type: Number, required: true, min: 0, max: 100 },
      experienceScore: { type: Number, required: true, min: 0, max: 100 },
      educationScore: { type: Number, required: true, min: 0, max: 100 },
      relevanceScore: { type: Number, min: 0, max: 100 },
      strengths: { type: [String], default: [] },
      gaps: { type: [String], default: [] },
      recommendation: { type: String, required: true },
      fitLevel: { type: String, enum: ["Strong Fit", "Moderate Fit", "Weak Fit"] },
      confidenceScore: { type: Number, min: 0, max: 100 },
      vsNextCandidate: { type: String },
      dataCompleteness: {
        score: Number,
        level: String,
        missing: [String],
      },
    }],
    aiModelVersion: { type: String, required: true },
    promptUsed: { type: String, required: true },
    weights: { type: Schema.Types.Mixed },
    poolInsights: { type: Schema.Types.Mixed },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, strict: false }
);

export const ScreeningResult = mongoose.model<IScreeningResult>("ScreeningResult", screeningResultSchema);