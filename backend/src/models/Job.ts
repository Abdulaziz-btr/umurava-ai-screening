import mongoose, { Document, Schema, Types } from "mongoose";

export interface IJobRequirements {
  skills: string[];
  experienceYears: number;
  education: string;
  other: string;
}

export interface IJob extends Document {
  recruiterId: Types.ObjectId;
  title: string;
  description: string;
  requirements: IJobRequirements;
  status: "draft" | "active" | "screened" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    recruiterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: {
      skills: { type: [String], default: [] },
      experienceYears: { type: Number, default: 0 },
      education: { type: String, default: "" },
      other: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["draft", "active", "screened", "archived"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

export const Job = mongoose.model<IJob>("Job", jobSchema);
