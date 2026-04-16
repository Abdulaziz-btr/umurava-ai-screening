"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchApplicants, fetchJob } from "@/store/jobsSlice";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Brain, Zap, Loader2, Sliders, RefreshCw, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";

const DEFAULT_WEIGHTS = { skills: 40, experience: 30, education: 15, relevance: 15 };

const LOADING_MESSAGES = [
  "Parsing candidate profiles...",
  "Extracting skills and experience data...",
  "Cross-referencing skills against job requirements...",
  "Evaluating project portfolios as evidence...",
  "Calculating weighted scores...",
  "Comparing candidates head-to-head...",
  "Analyzing data completeness...",
  "Computing confidence scores...",
  "Drafting AI recommendations...",
  "Building ranked shortlist...",
  "Generating pool insights...",
  "Finalizing results...",
];

export default function ScreenPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { id } = useParams();
  const jobId = id as string;
  const { currentJob, applicants } = useSelector((state: RootState) => state.jobs);
  const [shortlistSize, setShortlistSize] = useState(10);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [loading, setLoading] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  useEffect(() => {
    dispatch(fetchJob(jobId));
    dispatch(fetchApplicants(jobId));
  }, [dispatch, jobId]);

  // Cycle through loading messages every 2.5 seconds
  useEffect(() => {
    if (!loading) return;
    setLoadingMsgIndex(0);
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  const total = weights.skills + weights.experience + weights.education + weights.relevance;
  const isValid = total === 100;

  const updateWeight = (key: keyof typeof weights, value: number) => {
    setWeights({ ...weights, [key]: value });
  };

  const resetWeights = () => setWeights(DEFAULT_WEIGHTS);

  const handleScreen = async () => {
    if (!isValid) {
      toast.error(`Weights must total 100% (currently ${total}%)`);
      return;
    }
    setErrorDetail(null);
    setLoading(true);
    try {
      await api.post(`/jobs/${jobId}/screen`, { shortlistSize, weights });
      toast.success("Screening completed!");
      router.push(`/dashboard/jobs/${jobId}/results`);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Screening failed";
      toast.error(msg, { duration: 8000 });
      setErrorDetail(msg);
    } finally {
      setLoading(false);
    }
  };

  const weightConfig = [
    { key: "skills" as const, label: "Skills match", desc: "Technical skill alignment with required skills" },
    { key: "experience" as const, label: "Experience", desc: "Years and relevance of work history" },
    { key: "education" as const, label: "Education", desc: "Academic background and degree fit" },
    { key: "relevance" as const, label: "Overall relevance", desc: "Projects, availability, and general fit" },
  ];

  // Full-screen loading overlay during AI processing
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md px-6"
        >
          {/* Animated brain */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-8 bg-purple-100 rounded-2xl flex items-center justify-center"
          >
            <Brain className="w-10 h-10 text-purple-600" />
          </motion.div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">AI is screening candidates</h2>
          <p className="text-sm text-gray-500 mb-6">{applicants.length} applicants · {currentJob?.title}</p>

          {/* Dynamic loading message */}
          <div className="h-8 mb-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingMsgIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-sm font-medium text-purple-700"
              >
                {LOADING_MESSAGES[loadingMsgIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {LOADING_MESSAGES.slice(0, 8).map((_, i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full ${i <= loadingMsgIndex ? "bg-purple-500" : "bg-gray-200"}`}
                animate={i === loadingMsgIndex ? { scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            ))}
          </div>

          <p className="text-xs text-gray-400">This typically takes 30–60 seconds</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-1.5 text-xs text-gray-500 mb-6"
      >
        <button onClick={() => router.push("/dashboard")} className="hover:text-gray-700 transition">Dashboard</button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => router.push("/dashboard/jobs")} className="hover:text-gray-700 transition">Jobs</button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => router.push(`/dashboard/jobs/${jobId}`)} className="hover:text-gray-700 transition truncate max-w-[200px]">{currentJob?.title || "Job"}</button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 font-medium">AI screening</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl border border-gray-200 p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI screening</h1>
            <p className="text-sm text-gray-500">Powered by Google Gemini · Human-in-the-loop</p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-600">Job</span><span className="font-medium text-gray-900">{currentJob?.title || "Loading..."}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-600">Total applicants</span><span className="font-medium text-gray-900">{applicants.length}</span></div>
        </div>

        {/* Shortlist size */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Shortlist size</label>
          <div className="flex gap-3">
            {[10, 20].map((size) => (
              <motion.button key={size} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShortlistSize(size)}
                className={`flex-1 py-3 rounded-lg border-2 font-medium text-sm transition ${
                  shortlistSize === size ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}>
                Top {size} candidates
              </motion.button>
            ))}
          </div>
        </div>

        {/* Weight controls */}
        <div className="mb-6 p-5 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-blue-900">Recruiter control · Adjust weights</h3>
            </div>
            <button onClick={resetWeights} className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900">
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>
          <div className="space-y-4">
            {weightConfig.map((w) => (
              <div key={w.key}>
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <label className="text-sm font-medium text-gray-800">{w.label}</label>
                    <p className="text-xs text-gray-500">{w.desc}</p>
                  </div>
                  <span className="text-sm font-bold text-blue-700 min-w-[40px] text-right">{weights[w.key]}%</span>
                </div>
                <input type="range" min={0} max={100} step={5} value={weights[w.key]}
                  onChange={(e) => updateWeight(w.key, parseInt(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
            ))}
          </div>
          <div className={`mt-4 p-2 rounded-lg text-sm font-medium text-center ${
            isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            Total: {total}% {isValid ? "✓" : "(must equal 100%)"}
          </div>
        </div>

        {/* What AI does */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">What the AI will do:</p>
          <ul className="space-y-1.5 text-sm text-gray-600">
            {[
              `Evaluate all ${applicants.length} applicants using YOUR weights`,
              "Calculate confidence scores based on data completeness",
              'Compare candidates ("why A beats B")',
              "Generate pool insights (skill gaps, averages)",
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-2"><Zap className="w-3.5 h-3.5 mt-0.5 text-blue-500" /> {text}</li>
            ))}
          </ul>
        </div>

        {/* Action button */}
        <motion.button
          whileHover={isValid ? { scale: 1.02 } : {}}
          whileTap={isValid ? { scale: 0.98 } : {}}
          onClick={handleScreen}
          disabled={applicants.length === 0 || !isValid}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-3 rounded-lg font-medium transition">
          <Brain className="w-5 h-5" /> Start AI screening
        </motion.button>

        {applicants.length === 0 && (
          <p className="text-center text-sm text-amber-600 mt-3">No applicants yet. Upload applicants before screening.</p>
        )}

        {errorDetail && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">Screening error:</p>
            <p className="text-sm text-red-700 mt-1">{errorDetail}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}