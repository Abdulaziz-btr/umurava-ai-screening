"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchJob, fetchApplicants } from "@/store/jobsSlice";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Users, Brain, Upload, Clock, Tag, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

export default function JobDetailPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { id } = useParams();
  const { currentJob, applicants } = useSelector((state: RootState) => state.jobs);

  useEffect(() => {
    if (id) {
      dispatch(fetchJob(id as string));
      dispatch(fetchApplicants(id as string));
    }
  }, [dispatch, id]);

  if (!currentJob) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    active: "bg-blue-50 text-blue-700 border-blue-200",
    screened: "bg-green-50 text-green-700 border-green-200",
    draft: "bg-gray-50 text-gray-600 border-gray-200",
  };

  const actions = [
    {
      href: `/dashboard/jobs/${id}/applicants`,
      icon: Upload, title: "Upload applicants", color: "blue",
      desc: "Add candidates via CSV, Excel, or PDF resumes.",
      badge: `${applicants.length} applicant${applicants.length !== 1 ? "s" : ""} added`,
      enabled: true,
    },
    {
      href: `/dashboard/jobs/${id}/screen`,
      icon: Brain, title: "AI screening", color: "purple",
      desc: "Run Gemini AI to rank and shortlist top candidates.",
      badge: applicants.length === 0 ? "Add applicants first" : null,
      enabled: applicants.length > 0,
    },
    {
      href: `/dashboard/jobs/${id}/results`,
      icon: Users, title: "View results", color: "green",
      desc: "See the ranked shortlist with AI reasoning.",
      badge: currentJob.status !== "screened" ? "Run screening first" : null,
      enabled: currentJob.status === "screened",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.button
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push("/dashboard/jobs")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </motion.button>

      {/* Job header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{currentJob.title}</h1>
            <p className="text-sm text-gray-500 mt-1">Created {new Date(currentJob.createdAt).toLocaleDateString()}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusColor[currentJob.status] || statusColor.draft}`}>
            {currentJob.status}
          </span>
        </div>

        <p className="text-gray-700 mb-4 whitespace-pre-wrap">{currentJob.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Tag className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Skills</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentJob.requirements?.skills?.map((s: string) => (
                  <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md">{s}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Experience</p>
              <p className="text-sm text-gray-700 mt-1">{currentJob.requirements?.experienceYears || 0}+ years</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <GraduationCap className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Education</p>
              <p className="text-sm text-gray-700 mt-1">{currentJob.requirements?.education || "Any"}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {actions.map((a, i) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.12 }}
            whileHover={a.enabled ? { y: -4, transition: { duration: 0.2 } } : {}}
            onClick={() => a.enabled && router.push(a.href)}
            className={`bg-white rounded-xl border border-gray-200 p-5 transition ${
              a.enabled ? "cursor-pointer hover:border-blue-300 hover:shadow-sm" : "opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${
                a.color === "blue" ? "bg-blue-50" : a.color === "purple" ? "bg-purple-50" : "bg-green-50"
              }`}>
                <a.icon className={`w-5 h-5 ${
                  a.color === "blue" ? "text-blue-600" : a.color === "purple" ? "text-purple-600" : "text-green-600"
                }`} />
              </div>
              <h3 className="font-semibold text-gray-900">{a.title}</h3>
            </div>
            <p className="text-sm text-gray-500">{a.desc}</p>
            {a.badge && (
              <p className={`text-sm font-medium mt-3 ${a.enabled ? "text-blue-600" : "text-amber-600"}`}>
                {a.badge}
              </p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
