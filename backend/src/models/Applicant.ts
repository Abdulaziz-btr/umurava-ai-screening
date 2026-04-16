import mongoose, { Document, Schema, Types } from "mongoose";

export interface IApplicant extends Document {
  jobId: Types.ObjectId;
  source: string;
  profileData: any;
  rawResumeUrl?: string;
  parsedAt: Date;
}

const applicantSchema = new Schema<IApplicant>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["umurava_profile", "csv_upload", "pdf_resume", "url_scrape"],
      required: true,
    },
    profileData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    rawResumeUrl: { type: String },
    parsedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export const Applicant = mongoose.model<IApplicant>("Applicant", applicantSchema);