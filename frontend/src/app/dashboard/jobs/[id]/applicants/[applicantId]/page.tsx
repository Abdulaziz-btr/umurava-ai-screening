"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { applicantsAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { ArrowLeft, ChevronRight, Edit3, Save, X, AlertTriangle, CheckCircle, User, Briefcase, GraduationCap, Code, Award, FolderOpen, Clock, Link2, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const AVAILABILITY_STATUS = ["Available", "Open to Opportunities", "Not Available"];
const AVAILABILITY_TYPE = ["Full-time", "Part-time", "Contract"];

export default function ApplicantProfilePage() {
  const router = useRouter();
  const { id: jobId, applicantId } = useParams() as { id: string; applicantId: string };
  const [applicant, setApplicant] = useState<any>(null);
  const [completeness, setCompleteness] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplicant();
  }, [jobId, applicantId]);

  const loadApplicant = async () => {
    try {
      setLoading(true);
      const res = await applicantsAPI.getById(jobId, applicantId);
      setApplicant(res.data.applicant);
      setCompleteness(res.data.applicant.completeness);
    } catch (err) {
      toast.error("Failed to load applicant profile");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    setEditData(JSON.parse(JSON.stringify(applicant.profileData)));
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditData(null);
    setEditing(false);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await applicantsAPI.update(jobId, applicantId, editData);
      setApplicant(res.data.applicant);
      setCompleteness(res.data.applicant.completeness);
      setEditing(false);
      setEditData(null);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (path: string, value: any) => {
    const copy = { ...editData };
    const keys = path.split(".");
    let obj: any = copy;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setEditData({ ...copy });
  };

  const addArrayItem = (field: string, template: any) => {
    const copy = { ...editData };
    if (!copy[field]) copy[field] = [];
    copy[field] = [...copy[field], template];
    setEditData({ ...copy });
  };

  const removeArrayItem = (field: string, index: number) => {
    const copy = { ...editData };
    copy[field] = copy[field].filter((_: any, i: number) => i !== index);
    setEditData({ ...copy });
  };

  const updateArrayItem = (field: string, index: number, key: string, value: any) => {
    const copy = { ...editData };
    copy[field] = [...copy[field]];
    copy[field][index] = { ...copy[field][index], [key]: value };
    setEditData({ ...copy });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!applicant) {
    return <div className="text-center py-16 text-gray-500">Applicant not found.</div>;
  }

  const profile = editing ? editData : applicant.profileData;
  const sectionIcon = (status: string) => {
    if (status === "complete") return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === "partial") return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <AlertTriangle className="w-4 h-4 text-red-500" />;
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none";
  const labelClass = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <button onClick={() => router.push("/dashboard")} className="hover:text-gray-700">Dashboard</button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => router.push("/dashboard/jobs")} className="hover:text-gray-700">Jobs</button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => router.push(`/dashboard/jobs/${jobId}`)} className="hover:text-gray-700">Job</button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => router.push(`/dashboard/jobs/${jobId}/applicants`)} className="hover:text-gray-700">Applicants</button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 font-medium">{profile.firstName} {profile.lastName}</span>
      </div>

      {/* Header with completeness */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xl font-bold text-blue-700">
                {profile.firstName?.[0] || "?"}{profile.lastName?.[0] || ""}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{profile.firstName} {profile.lastName}</h1>
              {profile.headline && <p className="text-sm text-gray-600 mt-0.5">{profile.headline}</p>}
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                {profile.email && <span>{profile.email}</span>}
                {profile.location && <span>· {profile.location}</span>}
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                  applicant.source === "pdf_resume" ? "bg-purple-100 text-purple-700" :
                  applicant.source === "csv_upload" ? "bg-amber-100 text-amber-700" :
                  "bg-blue-100 text-blue-700"
                }`}>{applicant.source?.replace("_", " ")}</span>
              </div>
            </div>
          </div>

          {/* Edit / Save buttons */}
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button onClick={saveEdit} disabled={saving}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:bg-blue-400">
                  <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save changes"}
                </button>
              </>
            ) : (
              <button onClick={startEdit}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                <Edit3 className="w-4 h-4" /> Edit profile
              </button>
            )}
          </div>
        </div>

        {/* Completeness bar */}
        {completeness && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Profile completeness</span>
              <span className={`text-xs font-bold ${
                completeness.score >= 80 ? "text-green-600" : completeness.score >= 50 ? "text-amber-600" : "text-red-600"
              }`}>{completeness.score}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-2 rounded-full transition-all ${
                completeness.score >= 80 ? "bg-green-500" : completeness.score >= 50 ? "bg-amber-500" : "bg-red-500"
              }`} style={{ width: `${completeness.score}%` }} />
            </div>
            {completeness.alerts?.length > 0 && (
              <div className="mt-2 space-y-1">
                {completeness.alerts.map((alert: string, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-amber-700">
                    <AlertTriangle className="w-3 h-3" /> {alert}
                    {editing && <span className="text-blue-600 ml-1">(edit below to fix)</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Schema sections */}
      <div className="space-y-4">

        {/* Section 1: Basic Info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Basic information</h2>
            {completeness && sectionIcon(completeness.sections[0]?.status)}
          </div>
          {editing ? (
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>First name *</label><input className={inputClass} value={editData.firstName || ""} onChange={(e) => updateField("firstName", e.target.value)} /></div>
              <div><label className={labelClass}>Last name *</label><input className={inputClass} value={editData.lastName || ""} onChange={(e) => updateField("lastName", e.target.value)} /></div>
              <div><label className={labelClass}>Email *</label><input className={inputClass} value={editData.email || ""} onChange={(e) => updateField("email", e.target.value)} /></div>
              <div><label className={labelClass}>Location *</label><input className={inputClass} value={editData.location || ""} onChange={(e) => updateField("location", e.target.value)} /></div>
              <div className="col-span-2"><label className={labelClass}>Headline *</label><input className={inputClass} value={editData.headline || ""} onChange={(e) => updateField("headline", e.target.value)} placeholder="e.g. Senior Frontend Engineer — React & Next.js" /></div>
              <div className="col-span-2"><label className={labelClass}>Bio</label><textarea className={inputClass} rows={3} value={editData.bio || ""} onChange={(e) => updateField("bio", e.target.value)} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div><span className="text-gray-500">Name:</span> <span className="text-gray-900 font-medium ml-1">{profile.firstName} {profile.lastName}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="text-gray-900 ml-1">{profile.email || "—"}</span></div>
              <div><span className="text-gray-500">Location:</span> <span className="text-gray-900 ml-1">{profile.location || "—"}</span></div>
              <div><span className="text-gray-500">Headline:</span> <span className="text-gray-900 ml-1">{profile.headline || "—"}</span></div>
              {profile.bio && <div className="col-span-2"><span className="text-gray-500">Bio:</span> <span className="text-gray-700 ml-1">{profile.bio}</span></div>}
            </div>
          )}
        </motion.div>

        {/* Section 2: Skills */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-gray-900">Skills & languages</h2>
              {completeness && sectionIcon(completeness.sections[1]?.status)}
            </div>
            {editing && (
              <button onClick={() => addArrayItem("skills", { name: "", level: "Intermediate", yearsOfExperience: 1 })}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <Plus className="w-3 h-3" /> Add skill
              </button>
            )}
          </div>
          {editing ? (
            <div className="space-y-2">
              {(editData.skills || []).map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <input className={`${inputClass} flex-1`} placeholder="Skill name" value={s.name || ""} onChange={(e) => updateArrayItem("skills", i, "name", e.target.value)} />
                  <select className={`${inputClass} w-36`} value={s.level || "Intermediate"} onChange={(e) => updateArrayItem("skills", i, "level", e.target.value)}>
                    {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <input className={`${inputClass} w-20`} type="number" min={0} max={30} placeholder="Yrs" value={s.yearsOfExperience || 0} onChange={(e) => updateArrayItem("skills", i, "yearsOfExperience", parseInt(e.target.value) || 0)} />
                  <button onClick={() => removeArrayItem("skills", i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profile.skills || []).map((s: any, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-800 text-sm rounded-lg border border-purple-100">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-purple-500 ml-1">· {s.level}</span>
                  <span className="text-purple-400 ml-1">· {s.yearsOfExperience} yrs</span>
                </span>
              ))}
              {(!profile.skills || profile.skills.length === 0) && <span className="text-sm text-gray-400 italic">No skills listed</span>}
            </div>
          )}
        </motion.div>

        {/* Section 3: Experience */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">Work experience</h2>
              {completeness && sectionIcon(completeness.sections[2]?.status)}
            </div>
            {editing && (
              <button onClick={() => addArrayItem("experience", { company: "", role: "", startDate: "", endDate: "", description: "", technologies: [], isCurrent: false })}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <Plus className="w-3 h-3" /> Add experience
              </button>
            )}
          </div>
          {editing ? (
            <div className="space-y-4">
              {(editData.experience || []).map((exp: any, i: number) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between"><span className="text-xs font-medium text-gray-500">Experience {i + 1}</span>
                    <button onClick={() => removeArrayItem("experience", i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button></div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className={inputClass} placeholder="Company" value={exp.company || ""} onChange={(e) => updateArrayItem("experience", i, "company", e.target.value)} />
                    <input className={inputClass} placeholder="Role" value={exp.role || ""} onChange={(e) => updateArrayItem("experience", i, "role", e.target.value)} />
                    <input className={inputClass} placeholder="Start (YYYY-MM)" value={exp.startDate || ""} onChange={(e) => updateArrayItem("experience", i, "startDate", e.target.value)} />
                    <input className={inputClass} placeholder="End (YYYY-MM or Present)" value={exp.endDate || ""} onChange={(e) => updateArrayItem("experience", i, "endDate", e.target.value)} />
                  </div>
                  <textarea className={inputClass} rows={2} placeholder="Description" value={exp.description || ""} onChange={(e) => updateArrayItem("experience", i, "description", e.target.value)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(profile.experience || []).map((exp: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{exp.role} <span className="font-normal text-gray-500">at {exp.company}</span></p>
                    <p className="text-xs text-gray-500">{exp.startDate} — {exp.endDate || "Present"} {exp.isCurrent && <span className="text-green-600 ml-1">(Current)</span>}</p>
                    {exp.description && <p className="text-sm text-gray-600 mt-1">{exp.description}</p>}
                    {exp.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exp.technologies.map((t: string, j: number) => (
                          <span key={j} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(!profile.experience || profile.experience.length === 0) && <span className="text-sm text-gray-400 italic">No experience listed</span>}
            </div>
          )}
        </motion.div>

        {/* Section 4: Education */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold text-gray-900">Education</h2>
              {completeness && sectionIcon(completeness.sections[3]?.status)}
            </div>
            {editing && (
              <button onClick={() => addArrayItem("education", { institution: "", degree: "", fieldOfStudy: "", startYear: 2020, endYear: 2024 })}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <Plus className="w-3 h-3" /> Add education
              </button>
            )}
          </div>
          {editing ? (
            <div className="space-y-3">
              {(editData.education || []).map((edu: any, i: number) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between mb-2"><span className="text-xs font-medium text-gray-500">Education {i + 1}</span>
                    <button onClick={() => removeArrayItem("education", i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button></div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className={inputClass} placeholder="Institution" value={edu.institution || ""} onChange={(e) => updateArrayItem("education", i, "institution", e.target.value)} />
                    <input className={inputClass} placeholder="Degree" value={edu.degree || ""} onChange={(e) => updateArrayItem("education", i, "degree", e.target.value)} />
                    <input className={inputClass} placeholder="Field of study" value={edu.fieldOfStudy || ""} onChange={(e) => updateArrayItem("education", i, "fieldOfStudy", e.target.value)} />
                    <div className="flex gap-2">
                      <input className={inputClass} type="number" placeholder="Start year" value={edu.startYear || ""} onChange={(e) => updateArrayItem("education", i, "startYear", parseInt(e.target.value) || 0)} />
                      <input className={inputClass} type="number" placeholder="End year" value={edu.endYear || ""} onChange={(e) => updateArrayItem("education", i, "endYear", parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(profile.education || []).map((edu: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{edu.degree} in {edu.fieldOfStudy}</p>
                    <p className="text-xs text-gray-500">{edu.institution} · {edu.startYear}–{edu.endYear}</p>
                  </div>
                </div>
              ))}
              {(!profile.education || profile.education.length === 0) && <span className="text-sm text-gray-400 italic">No education listed</span>}
            </div>
          )}
        </motion.div>

        {/* Section 5: Projects */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-teal-600" />
              <h2 className="font-semibold text-gray-900">Projects</h2>
              {completeness && sectionIcon(completeness.sections[5]?.status)}
            </div>
            {editing && (
              <button onClick={() => addArrayItem("projects", { name: "", description: "", technologies: [], role: "", link: "" })}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <Plus className="w-3 h-3" /> Add project
              </button>
            )}
          </div>
          {editing ? (
            <div className="space-y-3">
              {(editData.projects || []).map((proj: any, i: number) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between"><span className="text-xs font-medium text-gray-500">Project {i + 1}</span>
                    <button onClick={() => removeArrayItem("projects", i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button></div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className={inputClass} placeholder="Project name" value={proj.name || ""} onChange={(e) => updateArrayItem("projects", i, "name", e.target.value)} />
                    <input className={inputClass} placeholder="Your role" value={proj.role || ""} onChange={(e) => updateArrayItem("projects", i, "role", e.target.value)} />
                  </div>
                  <textarea className={inputClass} rows={2} placeholder="Description" value={proj.description || ""} onChange={(e) => updateArrayItem("projects", i, "description", e.target.value)} />
                  <input className={inputClass} placeholder="Link (optional)" value={proj.link || ""} onChange={(e) => updateArrayItem("projects", i, "link", e.target.value)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(profile.projects || []).map((proj: any, i: number) => (
                <div key={i} className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{proj.name}</p>
                      <p className="text-xs text-gray-500">Role: {proj.role}</p>
                    </div>
                    {proj.link && <a href={proj.link} target="_blank" className="text-teal-600 hover:text-teal-800"><Link2 className="w-4 h-4" /></a>}
                  </div>
                  {proj.description && <p className="text-sm text-gray-600 mt-1">{proj.description}</p>}
                  {proj.technologies?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {proj.technologies.map((t: string, j: number) => (
                        <span key={j} className="px-1.5 py-0.5 bg-teal-100 text-teal-700 text-xs rounded">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {(!profile.projects || profile.projects.length === 0) && <span className="text-sm text-gray-400 italic">No projects listed</span>}
            </div>
          )}
        </motion.div>

        {/* Section 6: Availability */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Availability</h2>
            {completeness && sectionIcon(completeness.sections[6]?.status)}
          </div>
          {editing ? (
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClass}>Status</label>
                <select className={inputClass} value={editData.availability?.status || ""} onChange={(e) => updateField("availability.status", e.target.value)}>
                  <option value="">Select</option>
                  {AVAILABILITY_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Type</label>
                <select className={inputClass} value={editData.availability?.type || ""} onChange={(e) => updateField("availability.type", e.target.value)}>
                  <option value="">Select</option>
                  {AVAILABILITY_TYPE.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                profile.availability?.status === "Available" ? "bg-green-100 text-green-800" :
                profile.availability?.status === "Open to Opportunities" ? "bg-blue-100 text-blue-800" :
                "bg-gray-100 text-gray-800"
              }`}>{profile.availability?.status || "Unknown"}</span>
              <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700">{profile.availability?.type || "Unknown"}</span>
            </div>
          )}
        </motion.div>

        {/* Section 7: Certifications (optional) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold text-gray-900">Certifications <span className="text-xs text-gray-400 font-normal">(optional)</span></h2>
            </div>
            {editing && (
              <button onClick={() => addArrayItem("certifications", { name: "", issuer: "", issueDate: "" })}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <Plus className="w-3 h-3" /> Add certification
              </button>
            )}
          </div>
          {editing ? (
            <div className="space-y-2">
              {(editData.certifications || []).map((cert: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <input className={`${inputClass} flex-1`} placeholder="Certification name" value={cert.name || ""} onChange={(e) => updateArrayItem("certifications", i, "name", e.target.value)} />
                  <input className={`${inputClass} w-32`} placeholder="Issuer" value={cert.issuer || ""} onChange={(e) => updateArrayItem("certifications", i, "issuer", e.target.value)} />
                  <input className={`${inputClass} w-28`} placeholder="YYYY-MM" value={cert.issueDate || ""} onChange={(e) => updateArrayItem("certifications", i, "issueDate", e.target.value)} />
                  <button onClick={() => removeArrayItem("certifications", i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {(profile.certifications || []).map((cert: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-gray-900">{cert.name}</span>
                  <span className="text-gray-500">by {cert.issuer}</span>
                  {cert.issueDate && <span className="text-gray-400">({cert.issueDate})</span>}
                </div>
              ))}
              {(!profile.certifications || profile.certifications.length === 0) && <span className="text-sm text-gray-400 italic">No certifications</span>}
            </div>
          )}
        </motion.div>

        {/* Section 8: Social Links (optional) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Social links <span className="text-xs text-gray-400 font-normal">(optional)</span></h2>
          </div>
          {editing ? (
            <div className="space-y-2">
              <div><label className={labelClass}>LinkedIn</label><input className={inputClass} placeholder="https://linkedin.com/in/..." value={editData.socialLinks?.linkedin || ""} onChange={(e) => updateField("socialLinks.linkedin", e.target.value)} /></div>
              <div><label className={labelClass}>GitHub</label><input className={inputClass} placeholder="https://github.com/..." value={editData.socialLinks?.github || ""} onChange={(e) => updateField("socialLinks.github", e.target.value)} /></div>
              <div><label className={labelClass}>Portfolio</label><input className={inputClass} placeholder="https://..." value={editData.socialLinks?.portfolio || ""} onChange={(e) => updateField("socialLinks.portfolio", e.target.value)} /></div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {profile.socialLinks?.linkedin && <a href={profile.socialLinks.linkedin} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100">LinkedIn</a>}
              {profile.socialLinks?.github && <a href={profile.socialLinks.github} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">GitHub</a>}
              {profile.socialLinks?.portfolio && <a href={profile.socialLinks.portfolio} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 text-sm rounded-lg hover:bg-teal-100">Portfolio</a>}
              {!profile.socialLinks?.linkedin && !profile.socialLinks?.github && !profile.socialLinks?.portfolio && <span className="text-sm text-gray-400 italic">No social links</span>}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}