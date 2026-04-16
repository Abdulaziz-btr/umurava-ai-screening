"use client";
import { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { uploadApplicantFile, fetchApplicants } from "@/store/jobsSlice";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Upload, Check, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ApplicantsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { id } = useParams();
  const jobId = id as string;
  const { applicants, loading } = useSelector((state: RootState) => state.jobs);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  useEffect(() => { dispatch(fetchApplicants(jobId)); }, [dispatch, jobId]);

  const handleFile = async (file: File) => {
    const validTypes = [
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Use CSV, Excel, or PDF.");
      return;
    }
    const result = await dispatch(uploadApplicantFile({ jobId, file }));
    if (uploadApplicantFile.fulfilled.match(result)) {
      toast.success(`Uploaded: ${file.name}`);
      setUploadedFiles((prev) => [...prev, file.name]);
      dispatch(fetchApplicants(jobId));
    } else {
      toast.error("Upload failed. Check file format.");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.button
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push(`/dashboard/jobs/${jobId}`)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to job
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-xl border border-gray-200 p-8 mb-6"
      >
        <h1 className="text-xl font-bold text-gray-900 mb-1">Upload applicants</h1>
        <p className="text-sm text-gray-500 mb-6">Upload CSV, Excel, or PDF resumes to add candidates.</p>

        <motion.div
          whileHover={{ scale: 1.01 }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <motion.div animate={dragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}>
            <Upload className={`w-10 h-10 mx-auto mb-3 ${dragActive ? "text-blue-500" : "text-gray-400"}`} />
          </motion.div>
          <p className="text-gray-700 font-medium mb-1">
            {loading ? "Uploading..." : "Drag and drop your file here"}
          </p>
          <p className="text-sm text-gray-500 mb-4">CSV, Excel (.xlsx), or PDF resume</p>
          <motion.label
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium cursor-pointer transition"
          >
            Browse files
            <input type="file" className="hidden" accept=".csv,.xlsx,.xls,.pdf" onChange={handleChange} />
          </motion.label>
        </motion.div>

        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadedFiles.map((name, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 bg-green-50 rounded-lg"
                >
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">{name}</span>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Current applicants */}
      {applicants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              {applicants.length} applicant{applicants.length !== 1 ? "s" : ""}
            </h2>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {applicants.map((a: any, i: number) => (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Avatar with initials */}
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-blue-700">
                      {(a.profileData?.firstName?.[0] || "?")}{(a.profileData?.lastName?.[0] || "")}
                    </span>
                  </div>
                  {/* Candidate info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {a.profileData?.firstName || "Unknown"} {a.profileData?.lastName || ""}
                    </p>
                    {a.profileData?.headline && (
                      <p className="text-xs text-gray-600 mt-0.5 truncate">{a.profileData.headline}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      {a.profileData?.email || "No email"}
                      {a.profileData?.location && ` · ${a.profileData.location}`}
                    </p>
                    {/* Skills with levels */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.profileData?.skills?.slice(0, 4).map((s: any, idx: number) => (
                        <span
                          key={`${s.name}-${idx}`}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md font-medium"
                        >
                          {s.name}
                          {s.level && <span className="text-blue-500 ml-1">· {s.level}</span>}
                        </span>
                      ))}
                      {a.profileData?.skills?.length > 4 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-md">
                          +{a.profileData.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/dashboard/jobs/${jobId}/screen`)}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-medium transition"
          >
            Proceed to AI screening
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}