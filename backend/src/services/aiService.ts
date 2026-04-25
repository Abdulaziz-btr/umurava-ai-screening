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

function buildPrompt(job: any, applicants: any[], shortlistSize: number, weights: any): string {
  // THE FIX: Cap the shortlist size so we never ask for more candidates than we actually have!
  const targetSize = Math.min(shortlistSize, applicants.length);

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
      availability: a.profileData.availability,
      dataCompleteness: completeness,
    };
  });

  return `You are an expert HR screening specialist for Umurava. Produce a ranked shortlist with decision intelligence.

JOB:
Title: ${job.title}
Description: ${job.description}
Required skills: ${job.requirements.skills.join(", ")}
Min experience: ${job.requirements.experienceYears} years
Education: ${job.requirements.education}

RECRUITER-DEFINED WEIGHTS:
- Skills match: ${weights.skills}%
- Experience relevance: ${weights.experience}%
- Education: ${weights.education}%
- Overall relevance: ${weights.relevance}%

CANDIDATES (${applicants.length}):
${JSON.stringify(profiles, null, 2)}

## INSTRUCTIONS

1. Evaluate ALL ${applicants.length} candidates using the recruiter-defined weights above.
2. Score each dimension 0-100, then compute weighted matchScore.
3. CRITICAL: You MUST return EXACTLY ${targetSize} candidates ranked by matchScore. Rank the top ${targetSize} from all ${applicants.length} candidates. Include weak fits at the bottom. Do NOT return fewer than ${targetSize}.
4. For each of the ${targetSize} shortlisted candidates, provide:
   - 2-4 specific strengths citing actual profile data (skill levels, company names, project titles)
   - 1-3 specific gaps or risks
   - A written recommendation (2-3 sentences)
   - A "fitLevel" classification: "Strong Fit" | "Moderate Fit" | "Weak Fit"
   - A "confidenceScore" (0-100) reflecting how confident you are given data quality
   - A "vsNextCandidate" explaining WHY this candidate ranks ABOVE the next one (null for last candidate)

5. Projects are CRITICAL — they are evidence that verifies skill claims.
6. Never use names, gender, or demographics — only qualifications.
7. REMINDER: The shortlist array MUST contain EXACTLY ${targetSize} entries — one per rank from 1 to ${targetSize}.

Return ONLY valid JSON (no markdown, no backticks, no explanation):

{
  "shortlist": [
    {
      "applicantId": "<id>",
      "rank": 1,
      "matchScore": 87,
      "skillsScore": 90,
      "experienceScore": 85,
      "educationScore": 80,
      "relevanceScore": 88,
      "strengths": ["Expert React (5 yrs) matches requirement", "Led FinTech project with Next.js"],
      "gaps": ["No AWS certification"],
      "recommendation": "Strong candidate with proven React leadership experience.",
      "fitLevel": "Strong Fit",
      "confidenceScore": 92,
      "vsNextCandidate": "Alice ranks above Bob because she has 3 more years of React and led a production project, while Bob only has learning projects."
    }
  ]
}

Return ONLY valid JSON.`;
}

export async function screenCandidates(
  job: any,
  applicants: any[],
  shortlistSize: number,
  weights: any = DEFAULT_WEIGHTS
) {
  if (!config.geminiApiKey) throw new Error("Gemini API key is not configured.");

  // Make sure we never ask for more candidates than exist
  const targetSize = Math.min(shortlistSize, applicants.length);

  console.log(`[AI] Starting screening for "${job.title}" with ${applicants.length} applicants`);

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);

  // FIX 1: Enforce valid JSON and raise token limit to 8192.
  // This fixes the "9 candidates" issue and stops the error notifications!
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
      temperature: 0.2, // Keeps AI strictly focused
    }
  });

  const prompt = buildPrompt(job, applicants, shortlistSize, weights);
  const poolInsights = buildPoolInsights(applicants, job);

  try {
    let result;
    let lastError;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[AI] Attempt ${attempt}/3...`);
        result = await model.generateContent(prompt);
        break;
      } catch (err: any) {
        lastError = err;
        if (err.message?.includes("503") || err.message?.includes("overloaded")) {
          console.log(`[AI] Gemini overloaded, waiting 5 seconds...`);
          await new Promise((r) => setTimeout(r, 5000));
        } else {
          throw err;
        }
      }
    }

    if (!result) throw lastError || new Error("All retries failed");

    let text = result.response.text();
    console.log(`[AI] Response length: ${text.length}`);

    // FIX 2: Bulletproof JSON parsing to prevent crashes
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const startIndex = text.indexOf("{");
    const endIndex = text.lastIndexOf("}");
    if (startIndex === -1 || endIndex === -1) {
         throw new Error("AI failed to return valid JSON format. Please try again.");
    }

    const cleanJson = text.substring(startIndex, endIndex + 1);
    const parsed = JSON.parse(cleanJson);

    if (!parsed.shortlist || !Array.isArray(parsed.shortlist)) {
      throw new Error("Invalid AI response: missing shortlist array");
    }

    // Clean up AI response: deduplicate, sort, limit
    const seenIds = new Set<string>();
    const cleaned = parsed.shortlist
      .filter((c: any) => {
        if (!c.applicantId || seenIds.has(c.applicantId)) return false;
        seenIds.add(c.applicantId);
        return true;
      })
      .map((c: any) => ({
        ...c,
        matchScore: Math.min(100, Math.max(0, c.matchScore || 0)),
      }))
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, targetSize);

    const candidates = cleaned.map((c: any, index: number) => {
      const applicant = applicants.find((a) => a._id.toString() === c.applicantId);
      const completeness = applicant ? calculateCompleteness(applicant.profileData) : { score: 0, level: "Unknown", missing: [] };
      return {
        applicantId: c.applicantId,
        rank: index + 1,
        matchScore: Math.min(100, Math.max(0, c.matchScore || 0)),
        skillsScore: Math.min(100, Math.max(0, c.skillsScore || 0)),
        experienceScore: Math.min(100, Math.max(0, c.experienceScore || 0)),
        educationScore: Math.min(100, Math.max(0, c.educationScore || 0)),
        relevanceScore: Math.min(100, Math.max(0, c.relevanceScore || 0)),
        strengths: c.strengths || [],
        gaps: c.gaps || [],
        recommendation: c.recommendation || "No recommendation provided.",
        fitLevel: c.fitLevel || "Moderate Fit",
        confidenceScore: Math.min(100, Math.max(0, c.confidenceScore || 70)),
        vsNextCandidate: c.vsNextCandidate || null,
        dataCompleteness: completeness,
      };
    });

    console.log(`[AI] Successfully ranked ${candidates.length} candidates`);

    return {
      candidates,
      modelVersion: MODEL_NAME,
      promptUsed: prompt,
      weights,
      poolInsights,
    };
  } catch (error: any) {
    console.error("[AI] ERROR:", error.message);
    throw new Error(`AI screening failed: ${error.message}`);
  }
}