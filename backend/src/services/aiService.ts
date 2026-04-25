import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config";

const MODEL_NAME = "gemini-2.5-flash-lite";

// Default weights — can be overridden by recruiter
const DEFAULT_WEIGHTS = { skills: 40, experience: 30, education: 15, relevance: 15 };

// Calculate data completeness for a candidate
function calculateCompleteness(profileData: any): { score: number; level: string; missing: string[] } {
  const required = [
    { field: "skills", check: () => profileData.skills?.length > 0 },
    { field: "experience", check: () => profileData.experience?.length > 0 },
    { field: "education", check: () => profileData.education?.length > 0 },
    { field: "projects", check: () => profileData.projects?.length > 0 },
    { field: "headline", check: () => !!profileData.headline },
    { field: "location", check: () => !!profileData.location },
    { field: "availability", check: () => !!profileData.availability?.status },
    { field: "bio", check: () => !!profileData.bio },
  ];
  const missing = required.filter((r) => !r.check()).map((r) => r.field);
  const score = Math.round(((required.length - missing.length) / required.length) * 100);
  const level = score >= 80 ? "Complete" : score >= 50 ? "Partial" : "Minimal";
  return { score, level, missing };
}

// Build pool insights (batch analytics)
function buildPoolInsights(applicants: any[], job: any) {
  const total = applicants.length;
  const requiredSkills = job.requirements.skills.map((s: string) => s.toLowerCase());
  const skillCounts: Record<string, number> = {};
  let totalExpYears = 0;
  let expCount = 0;

  applicants.forEach((a) => {
    const skills = a.profileData?.skills || [];
    skills.forEach((s: any) => {
      const name = (s.name || "").toLowerCase();
      skillCounts[name] = (skillCounts[name] || 0) + 1;
    });
    const exp = a.profileData?.experience || [];
    if (exp.length > 0) {
      const firstExp = exp[0];
      if (firstExp.startDate) {
        const startYear = parseInt(firstExp.startDate.split("-")[0]);
        if (!isNaN(startYear)) {
          totalExpYears += (new Date().getFullYear() - startYear);
          expCount++;
        }
      }
    }
  });

  const skillCoverage = requiredSkills.map((skill: string) => ({
    skill,
    count: skillCounts[skill] || 0,
    percentage: Math.round(((skillCounts[skill] || 0) / total) * 100),
  }));

  const avgExperience = expCount > 0 ? (totalExpYears / expCount).toFixed(1) : "0";
  const topSkillGap = skillCoverage.sort((a: any, b: any) => a.percentage - b.percentage)[0];

  return {
    totalApplicants: total,
    avgExperienceYears: avgExperience,
    skillCoverage,
    topSkillGap: topSkillGap ? `${topSkillGap.skill} (only ${topSkillGap.percentage}% have it)` : "None",
  };
}

function buildPrompt(job: any, applicants: any[], weights: any): string {
  const profiles = applicants.map((a) => {
    const completeness = calculateCompleteness(a.profileData);
    return {
      id: a._id.toString(),
      name: `${a.profileData.firstName} ${a.profileData.lastName}`,
      headline: a.profileData.headline,
      location: a.profileData.location,
      skills: a.profileData.skills,
      experience: a.profileData.experience,
      education: a.profileData.education,
      projects: a.profileData.projects,
    };
  });

  return `You are an expert HR screening specialist for Umurava. 

JOB:
Title: ${job.title}
Description: ${job.description}
Required skills: ${job.requirements.skills.join(", ")}
Min experience: ${job.requirements.experienceYears} years

WEIGHTS: Skills (${weights.skills}%), Experience (${weights.experience}%), Education (${weights.education}%), Relevance (${weights.relevance}%)

CANDIDATES:
${JSON.stringify(profiles, null, 2)}

## INSTRUCTIONS
1. You MUST evaluate EVERY SINGLE candidate provided in the list.
2. There are ${applicants.length} candidates. Your JSON MUST contain EXACTLY ${applicants.length} evaluation objects. Do NOT skip anyone. Do NOT sort them.
3. For each candidate, provide:
   - matchScore (0-100)
   - skillsScore, experienceScore, educationScore, relevanceScore (0-100)
   - strengths (2-3 bullet points)
   - gaps (1-2 bullet points)
   - recommendation (1-2 sentences)
   - fitLevel ("Strong Fit" | "Moderate Fit" | "Weak Fit")
   - confidenceScore (0-100)
   - vsNextCandidate (Leave as null)

Return ONLY valid JSON (no markdown, no backticks):
{
  "evaluations": [
    {
      "applicantId": "<id>",
      "matchScore": 87,
      "skillsScore": 90,
      "experienceScore": 85,
      "educationScore": 80,
      "relevanceScore": 88,
      "strengths": ["Expert React (5 yrs)"],
      "gaps": ["No AWS"],
      "recommendation": "Strong candidate.",
      "fitLevel": "Strong Fit",
      "confidenceScore": 92,
      "vsNextCandidate": null
    }
  ]
}`;
}

export async function screenCandidates(
  job: any,
  applicants: any[],
  shortlistSize: number,
  weights: any = DEFAULT_WEIGHTS
) {
  if (!config.geminiApiKey) throw new Error("Gemini API key is not configured.");

  const targetSize = Math.min(shortlistSize, applicants.length);
  console.log(`[AI] Starting evaluation for ${applicants.length} applicants`);

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
      temperature: 0.1, // Lower temperature forces stricter adherence to the count
    }
  });

  // Notice we don't pass targetSize to the prompt anymore!
  const prompt = buildPrompt(job, applicants, weights);
  const poolInsights = buildPoolInsights(applicants, job);

  try {
    let result;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await model.generateContent(prompt);
        break;
      } catch (err: any) {
        if (err.message?.includes("503") || err.message?.includes("overloaded")) {
          await new Promise((r) => setTimeout(r, 5000));
        } else {
          throw err;
        }
      }
    }

    if (!result) throw new Error("AI retries failed");

    let text = result.response.text();
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    const startIndex = text.indexOf("{");
    const endIndex = text.lastIndexOf("}");
    const cleanJson = text.substring(startIndex, endIndex + 1);
    const parsed = JSON.parse(cleanJson);

    const evaluationArray = parsed.evaluations || parsed.shortlist;
    if (!evaluationArray || !Array.isArray(evaluationArray)) {
      throw new Error("Invalid AI response: missing array");
    }

    // THIS IS THE MAGIC: Node.js does the sorting and slicing securely!
    const seenIds = new Set<string>();
    const cleaned = evaluationArray
      .filter((c: any) => {
        if (!c.applicantId || seenIds.has(c.applicantId)) return false;
        seenIds.add(c.applicantId);
        return true;
      })
      .map((c: any) => ({
        ...c,
        matchScore: Math.min(100, Math.max(0, c.matchScore || 0)),
      }))
      // Node.js sorts them perfectly
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      // Node.js slices the exact Top 10 or Top 20
      .slice(0, targetSize);

    // Re-map to ensure data completeness is attached
    const candidates = cleaned.map((c: any, index: number) => {
      const applicant = applicants.find((a) => a._id.toString() === c.applicantId);
      const completeness = applicant ? calculateCompleteness(applicant.profileData) : { score: 0, level: "Unknown", missing: [] };
      
      // Calculate vsNextCandidate dynamically in code!
      let vsNext = null;
      if (index < cleaned.length - 1) {
          const nextScore = cleaned[index + 1].matchScore;
          vsNext = `Ranks higher due to a superior overall match score (${c.matchScore} vs ${nextScore}).`;
      }

      return {
        applicantId: c.applicantId,
        rank: index + 1,
        matchScore: c.matchScore,
        skillsScore: c.skillsScore,
        experienceScore: c.experienceScore,
        educationScore: c.educationScore,
        relevanceScore: c.relevanceScore,
        strengths: c.strengths || [],
        gaps: c.gaps || [],
        recommendation: c.recommendation || "No recommendation provided.",
        fitLevel: c.fitLevel || "Moderate Fit",
        confidenceScore: c.confidenceScore || 70,
        vsNextCandidate: vsNext,
        dataCompleteness: completeness,
      };
    });

    console.log(`[AI] Successfully mapped and ranked ${candidates.length} candidates`);

    return { candidates, modelVersion: MODEL_NAME, promptUsed: prompt, weights, poolInsights };
  } catch (error: any) {
    console.error("[AI] ERROR:", error.message);
    throw new Error(`AI screening failed: ${error.message}`);
  }
}