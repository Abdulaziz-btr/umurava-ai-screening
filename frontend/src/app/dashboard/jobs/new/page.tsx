"use client";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { createJob } from "@/store/jobsSlice";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function NewJobPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { loading } = useSelector((state: RootState) => state.jobs);

  const [form, setForm] = useState({
    title: "", description: "", skills: "" as string,
    experienceYears: 0, education: "", other: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
    const result = await dispatch(createJob({
      title: form.title,
      description: form.description,
      requirements: {
        skills: skillsArray,
        experienceYears: form.experienceYears,
        education: form.education,
        other: form.other,
      },
    }));
    if (createJob.fulfilled.match(result)) {
      toast.success("Job created successfully!");
      router.push(`/dashboard/jobs/${(result.payload as any)._id}`);
    } else {
      toast.error("Failed to create job");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.button
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl border border-gray-200 p-8"
      >
        <h1 className="text-xl font-bold text-gray-900 mb-1">Create new job posting</h1>
        <p className="text-sm text-gray-500 mb-6">Fill in the job details. You can add applicants after creating the job.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { label: "Job title *", type: "input", field: "title", placeholder: "e.g. Senior Frontend Developer", required: true },
            { label: "Job description *", type: "textarea", field: "description", placeholder: "Describe the role, responsibilities, and what you're looking for...", required: true },
            { label: "Required skills (comma-separated) *", type: "input", field: "skills", placeholder: "React, TypeScript, Node.js, MongoDB", required: true },
          ].map((f, i) => (
            <motion.div
              key={f.field}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea required={f.required} rows={5} value={(form as any)[f.field]}
                  onChange={(e) => setForm({ ...form, [f.field]: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder={f.placeholder} />
              ) : (
                <input type="text" required={f.required} value={(form as any)[f.field]}
                  onChange={(e) => setForm({ ...form, [f.field]: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={f.placeholder} />
              )}
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min. experience (years)</label>
              <input type="number" min={0} max={20} value={form.experienceYears}
                onChange={(e) => setForm({ ...form, experienceYears: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education requirement</label>
              <select value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white">
                <option value="">Any</option>
                <option value="High School">High School</option>
                <option value="Bachelor's">Bachelor&apos;s Degree</option>
                <option value="Master's">Master&apos;s Degree</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-1">Other requirements (optional)</label>
            <textarea rows={2} value={form.other}
              onChange={(e) => setForm({ ...form, other: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Remote-friendly, portfolio required, etc." />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-end gap-3 pt-4 border-t border-gray-100"
          >
            <button type="button" onClick={() => router.back()}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition">
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit" disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition"
            >
              {loading ? "Creating..." : "Create job"}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
