"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchScreeningResults, fetchJob } from "@/store/jobsSlice";
import { useRouter, useParams } from "next/navigation";
import { Trophy, ChevronDown, ChevronUp, Star, AlertTriangle, MessageSquare, Shield, BarChart3, GitCompare, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function ResultsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { id } = useParams();
  const jobId = id as string;
  const { currentJob, screeningResults, loading } = useSelector((state: RootState) => state.jobs);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true); // Added to prevent 'No Results' flash

  useEffect(() => {
    const fetchAllData = async () => {
      setIsInitializing(true);
      await Promise.all([
        dispatch(fetchJob(jobId)),
        dispatch(fetchScreeningResults(jobId))
      ]);
      setIsInitializing(false);
    };

    fetchAllData();
  }, [dispatch, jobId]);

  const results = Array.isArray(screeningResults) ? screeningResults[0] : screeningResults;
  const allCandidates = results?.candidates || [];
  const candidates = allCandidates
    .filter((c: any) => {
      const a = c.applicantId;
      return typeof a === "object" && a?.profileData?.firstName;
    })
    .map((c: any, i: number) => ({ ...c, rank: i + 1 }));
  const poolInsights = results?.poolInsights;
  const weights = results?.weights;

  // Assume standard target sizes are 10 or 20. Default to 10 for warning logic.
  const targetSize = results?.shortlistSize || 10; 

  const scoreColor = (s: number) => s >= 80 ? "text-green-600 bg-green-50" : s >= 60 ? "text-blue-600 bg-blue-50" : s >= 40 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
  const fitColor = (f: string) => f === "Strong Fit" ? "bg-green-100 text-green-800" : f === "Moderate Fit" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";
  const confColor = (s: number) => s >= 80 ? "text-green-600" : s >= 60 ? "text-blue-600" : "text-amber-600";
  const completenessColor = (l: string) => l === "Complete" ? "bg-green-100 text-green-700" : l === "Partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";

  const getCandidateInfo = (c: any) => {
    const a = c.applicantId;
    if (typeof a === "object" && a?.profileData) {
      return {
        name: `${a.profileData.firstName || ""} ${a.profileData.lastName || ""}`.trim() || `Candidate #${c.rank}`,
        headline: a.profileData.headline || "",
        initials: `${a.profileData.firstName?.[0] || "?"}${a.profileData.lastName?.[0] || ""}`,
      };
    }
    return { name: `Candidate #${c.rank}`, headline: "", initials: "?" };
  };

  if (loading || isInitializing) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-24">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-lg text-gray-600 font-medium text-center">Fetching AI results...</p>
        </motion.div>
      </div>
    );
  }

  if (!results || !candidates.length) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
          <button onClick={() => router.push("/dashboard")} className="hover:text-gray-700">Dashboard</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => router.push("/dashboard/jobs")} className="hover:text-gray-700">Jobs</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 font-medium">Results</span>
        </div>
        <div className="text-center py-16">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No screening results yet</h3>
          <button onClick={() => router.push(`/dashboard/jobs/${jobId}/screen`)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium mt-4">
            Run AI screening
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <button onClick={() => router.push("/dashboard")} className="hover:text-gray-700 transition">Dashboard</button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => router.push("/dashboard/jobs")} className="hover:text-gray-700 transition">Jobs</button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => router.push(`/dashboard/jobs/${jobId}`)} className="hover:text-gray-700 transition truncate max-w-[200px]">{currentJob?.title || "Job"}</button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 font-medium">Screening results</span>
      </motion.div>

      {/* Sticky Header */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-md rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><Trophy className="w-5 h-5 text-green-600" /></div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Screening results</h1>
              <p className="text-xs text-gray-500">{currentJob?.title} · Top {candidates.length} candidates</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/dashboard/jobs/${jobId}/screen`)}
              className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-medium transition"
            >
              Re-screen with new weights
            </button>
          </div>
        </div>
      </motion.div>

      {/* Pool Insights */}
      {poolInsights && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Pool insights</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Total applicants</p>
              <p className="text-2xl font-bold text-gray-900">{poolInsights.totalApplicants}</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Avg experience</p>
              <p className="text-2xl font-bold text-gray-900">{poolInsights.avgExperienceYears} yrs</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Top skill gap</p>
              <p className="text-sm font-semibold text-amber-700 mt-2">{poolInsights.topSkillGap}</p>
            </div>
          </div>
          {poolInsights.skillCoverage?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Skill coverage across pool</p>
              <div className="flex flex-wrap gap-2">
                {poolInsights.skillCoverage.map((s: any) => (
                  <span key={s.skill} className="px-2 py-1 bg-white text-xs rounded-md border border-purple-100">
                    <span className="font-medium text-gray-700">{s.skill}</span>
                    <span className="text-purple-600 ml-1">· {s.percentage}%</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Weights used */}
      {weights && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-600">
          <span className="font-medium">Weights used:</span> Skills {weights.skills}% · Experience {weights.experience}% · Education {weights.education}% · Relevance {weights.relevance}%
        </div>
      )}

      {/* --- PROFESSIONAL NOTIFICATION BANNER START --- */}
      {candidates.length > 0 && poolInsights?.totalApplicants > 0 && (
        candidates.length < Math.min(targetSize, poolInsights.totalApplicants) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900">
                Showing {candidates.length} of {Math.min(targetSize, poolInsights.totalApplicants)} requested candidates
              </h4>
              <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                To maintain strict data integrity, our system automatically filtered out duplicate profiles or invalid formatting from the AI's output. You can review these verified candidates below, or run a fresh screening to generate a complete list.
              </p>
            </div>
            
            <button 
              onClick={() => router.push(`/dashboard/jobs/${jobId}/screen`)}
              className="flex items-center gap-1.5 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-2 rounded-lg font-medium transition whitespace-nowrap"
            >
              <RefreshCw className="w-3 h-3" />
              Re-screen
            </button>
          </motion.div>
        )
      )}
      {/* --- PROFESSIONAL NOTIFICATION BANNER END --- */}

      {/* Candidates */}
      <div className="space-y-3">
        {[...candidates].sort((a: any, b: any) => a.rank - b.rank).map((c: any, index: number) => {
          const { name, headline, initials } = getCandidateInfo(c);
          const isExpanded = expandedId === (c.applicantId?._id || c.applicantId);

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              key={c.applicantId?._id || c.applicantId}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition"
            >
              {/* Summary row */}
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : (c.applicantId?._id || c.applicantId))}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  c.rank === 1 ? "bg-yellow-100 text-yellow-700" : c.rank === 2 ? "bg-gray-200 text-gray-700" :
                  c.rank === 3 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-500"
                }`}>#{c.rank}</div>

                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-blue-700">{initials.toUpperCase()}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">{name}</p>
                    {c.fitLevel && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${fitColor(c.fitLevel)}`}>{c.fitLevel}</span>
                    )}
                  </div>
                  {headline && <p className="text-xs text-gray-500 mt-0.5 truncate">{headline}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${c.matchScore}%` }}
                          transition={{ duration: 1, delay: 0.3 + index * 0.08 }} className="h-1.5 bg-blue-500 rounded-full" />
                      </div>
                      <span className="text-gray-500">{c.matchScore}/100</span>
                    </div>
                    {c.confidenceScore != null && (
                      <div className="flex items-center gap-1">
                        <Shield className={`w-3 h-3 ${confColor(c.confidenceScore)}`} />
                        <span className={confColor(c.confidenceScore)}>Confidence: {c.confidenceScore}%</span>
                      </div>
                    )}
                    {c.dataCompleteness && (
                      <span className={`px-1.5 py-0.5 text-xs rounded ${completenessColor(c.dataCompleteness.level)}`}>
                        Data: {c.dataCompleteness.level}
                      </span>
                    )}
                  </div>
                </div>

                <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${scoreColor(c.matchScore)}`}>{c.matchScore}%</div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  className="px-5 pb-5 pt-0 border-t border-gray-100">
                  {/* Score breakdown */}
                  <div className="grid grid-cols-4 gap-2 mt-4 mb-4">
                    {[
                      { label: "Skills", score: c.skillsScore },
                      { label: "Experience", score: c.experienceScore },
                      { label: "Education", score: c.educationScore },
                      { label: "Relevance", score: c.relevanceScore || 0 },
                    ].map((d) => (
                      <div key={d.label} className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 mb-1">{d.label}</p>
                        <p className="text-lg font-bold text-gray-900">{d.score}</p>
                        <div className="h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${d.score}%` }}
                            transition={{ duration: 0.8 }} className="h-1 bg-blue-500 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comparison — HIGHLIGHTED as killer feature */}
                  {c.vsNextCandidate && (
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <GitCompare className="w-4 h-4 text-purple-600" />
                        <p className="text-sm font-bold text-purple-900">Why #{c.rank} ranks above next candidate</p>
                      </div>
                      <p className="text-sm text-purple-800">{c.vsNextCandidate}</p>
                    </div>
                  )}

                  {/* Strengths */}
                  {c.strengths?.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Star className="w-4 h-4 text-green-500" />
                        <p className="text-sm font-semibold text-gray-700">Strengths</p>
                      </div>
                      <ul className="space-y-1 ml-6">
                        {c.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-gray-600 list-disc">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Gaps */}
                  {c.gaps?.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <p className="text-sm font-semibold text-gray-700">Gaps / Risks</p>
                      </div>
                      <ul className="space-y-1 ml-6">
                        {c.gaps.map((g: string, i: number) => (
                          <li key={i} className="text-sm text-gray-600 list-disc">{g}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Missing data warning */}
                  {c.dataCompleteness?.missing?.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1">Missing profile data (may affect accuracy):</p>
                      <p className="text-xs text-amber-700">{c.dataCompleteness.missing.join(", ")}</p>
                    </div>
                  )}

                  {/* AI recommendation */}
                  {c.recommendation && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        <p className="text-sm font-semibold text-blue-800">AI recommendation</p>
                      </div>
                      <p className="text-sm text-blue-700">{c.recommendation}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}