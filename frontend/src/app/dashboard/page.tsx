"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchJobs } from "@/store/jobsSlice";
import { useRouter } from "next/navigation";
import { Briefcase, Clock, CheckCircle, Brain, Plus, ArrowRight, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { jobs } = useSelector((state: RootState) => state.jobs);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { dispatch(fetchJobs()); }, [dispatch]);

  if (!mounted) return null;

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j: any) => j.status === "active").length;
  const screenedJobs = jobs.filter((j: any) => j.status === "screened").length;
  const recentJobs = [...jobs].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const stats = [
    { label: "Total jobs", value: totalJobs, icon: Briefcase, color: "blue" },
    { label: "Active jobs", value: activeJobs, icon: Clock, color: "amber" },
    { label: "Screened", value: screenedJobs, icon: CheckCircle, color: "green" },
    { label: "AI screenings", value: screenedJobs, icon: Brain, color: "purple" },
  ];

  const colorMap: any = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };

  const statusBadge = (status: string) => {
    if (status === "screened") return "bg-green-100 text-green-700";
    if (status === "active") return "bg-blue-100 text-blue-700";
    if (status === "archived") return "bg-gray-100 text-gray-500";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.fullName?.split(" ")[0] || "Recruiter"}</h1>
        <p className="text-sm text-gray-500 mt-1">Here&apos;s an overview of your recruitment pipeline.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {stats.map((stat, i) => (
          <motion.div key={stat.label}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <div className={`p-1.5 rounded-lg ${colorMap[stat.color]}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <motion.div
          initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          onClick={() => router.push("/dashboard/jobs/new")}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-5 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Plus className="w-5 h-5" />
                <h3 className="font-semibold">Create new job</h3>
              </div>
              <p className="text-blue-100 text-sm">Post a new position and start screening with AI.</p>
            </div>
            <ArrowRight className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
          onClick={() => router.push("/dashboard/jobs")}
          className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-5 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-gray-900">View all jobs</h3>
              </div>
              <p className="text-gray-500 text-sm">Manage postings, applicants, and screening results.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 opacity-60 group-hover:translate-x-1 transition" />
          </div>
        </motion.div>
      </div>

      {/* Recent jobs */}
      {recentJobs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent jobs</h2>
          <div className="space-y-2">
            {recentJobs.map((job: any, i: number) => (
              <motion.div key={job._id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.05 }}
                onClick={() => router.push(`/dashboard/jobs/${job._id}`)}
                className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:shadow-sm hover:border-gray-300 transition"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{job.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{job.requirements?.skills?.join(", ")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadge(job.status)}`}>
                    {job.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}