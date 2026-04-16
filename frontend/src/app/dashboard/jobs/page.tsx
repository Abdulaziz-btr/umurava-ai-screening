"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchJobs } from "@/store/jobsSlice";
import { useRouter } from "next/navigation";
import { Briefcase, Brain, Plus, ArrowRight, Clock, CheckCircle, FileText } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.1 } }),
};

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { jobs, loading } = useSelector((state: RootState) => state.jobs);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => { dispatch(fetchJobs()); }, [dispatch]);

  const activeJobs = jobs.filter((j) => j.status === "active").length;
  const screenedJobs = jobs.filter((j) => j.status === "screened").length;

  return (
    <div>
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.fullName?.split(" ")[0] || "Recruiter"}
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s an overview of your recruitment pipeline.</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: "Total jobs", value: jobs.length, icon: Briefcase, bg: "bg-blue-50", text: "text-blue-600" },
          { label: "Active jobs", value: activeJobs, icon: Clock, bg: "bg-amber-50", text: "text-amber-600" },
          { label: "Screened", value: screenedJobs, icon: CheckCircle, bg: "bg-green-50", text: "text-green-600" },
          { label: "AI screenings", value: screenedJobs, icon: Brain, bg: "bg-purple-50", text: "text-purple-600" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            variants={fadeUp}
            custom={i}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-white rounded-xl border border-gray-200 p-5 cursor-default"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{s.label}</span>
              <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`w-4 h-4 ${s.text}`} /></div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          onClick={() => router.push("/dashboard/jobs/new")}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Create new job</h3>
              </div>
              <p className="text-blue-100 text-sm">Post a new position and start screening with AI.</p>
            </div>
            <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 transition" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          onClick={() => router.push("/dashboard/jobs")}
          className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-6 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">View all jobs</h3>
              </div>
              <p className="text-gray-500 text-sm">Manage postings, applicants, and screening results.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition" />
          </div>
        </motion.div>
      </div>

      {/* Recent jobs */}
      {jobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent jobs</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {jobs.slice(0, 5).map((job, i) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                onClick={() => router.push(`/dashboard/jobs/${job._id}`)}
                className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition ${
                  i < Math.min(jobs.length, 5) - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div>
                  <p className="font-medium text-gray-900">{job.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{job.requirements?.skills?.slice(0, 3).join(", ") || "No skills"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    job.status === "screened" ? "bg-green-50 text-green-700" :
                    job.status === "active" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"
                  }`}>{job.status}</span>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && jobs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
          <p className="text-gray-500 mb-6">Create your first job posting to get started.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/dashboard/jobs/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
          >
            Create your first job
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
