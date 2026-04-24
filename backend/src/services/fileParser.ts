import csvParser from "csv-parser";
import fs from "fs";
import * as XLSX from "xlsx";
import pdf from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config";

// Parse skills from pipe-separated format: "React:Expert:5|Node.js:Advanced:3"
function parseSkillsString(skillsStr: string): any[] {
  if (!skillsStr || typeof skillsStr !== "string") return [];
  return skillsStr
    .split("|")
    .map((s: string) => {
      const parts = s.trim().split(":");
      return {
        name: parts[0]?.trim() || "",
        level: parts[1]?.trim() || "Intermediate",
        yearsOfExperience: parseInt(parts[2]?.trim()) || 0,
      };
    })
    .filter((s) => s.name.length > 0);
}

function parseTechString(techStr: string): string[] {
  if (!techStr || typeof techStr !== "string") return [];
  return techStr.split("|").map((t: string) => t.trim()).filter((t) => t.length > 0);
}

function mapRowToProfile(row: any): any {
  return {
    firstName: (row.firstName || row.first_name || "").toString().trim(),
    lastName: (row.lastName || row.last_name || "").toString().trim(),
    email: (row.email || "").toString().trim(),
    headline: (row.headline || "").toString().trim(),
    bio: (row.bio || row.summary || "").toString().trim(),
    location: (row.location || "").toString().trim(),
    skills: parseSkillsString((row.skills || "").toString()),
    languages: [],
    experience: (row.experience_company && row.experience_company.toString().trim()) ? [{
      company: (row.experience_company || "").toString().trim(),
      role: (row.experience_role || "").toString().trim(),
      startDate: (row.experience_startDate || "").toString().trim(),
      endDate: (row.experience_endDate || "").toString().trim(),
      description: (row.experience_description || "").toString().trim(),
      technologies: parseTechString((row.experience_technologies || "").toString()),
      isCurrent: (row.experience_endDate || "").toString().toLowerCase().includes("present"),
    }] : [],
    education: (row.education_institution && row.education_institution.toString().trim()) ? [{
      institution: (row.education_institution || "").toString().trim(),
      degree: (row.education_degree || "").toString().trim(),
      fieldOfStudy: (row.education_fieldOfStudy || "").toString().trim(),
      startYear: parseInt(row.education_startYear) || 0,
      endYear: parseInt(row.education_endYear) || 0,
    }] : [],
    certifications: [],
    projects: (row.projects_name && row.projects_name.toString().trim()) ? [{
      name: (row.projects_name || "").toString().trim(),
      description: (row.projects_description || "").toString().trim(),
      role: (row.projects_role || "").toString().trim(),
      technologies: [],
      link: "",
    }] : [],
    availability: {
      status: (row.availability_status || "Available").toString().trim(),
      type: (row.availability_type || "Full-time").toString().trim(),
    },
    socialLinks: {},
  };
}

// CSV Parser
export function parseCSV(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row: any) => {
        const profile = mapRowToProfile(row);
        if (profile.firstName || profile.lastName || profile.email) {
          results.push(profile);
        }
      })
      .on("end", () => resolve(results))
      .on("error", (err: Error) => reject(err));
  });
}

// Excel Parser
export function parseExcel(filePath: string): any[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const results: any[] = [];
  for (const row of rows) {
    const profile = mapRowToProfile(row);
    if (profile.firstName || profile.lastName || profile.email) {
      results.push(profile);
    }
  }
  return results;
}

// JSON Parser
export function parseJSON(filePath: string): any[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  const candidates = Array.isArray(parsed) ? parsed : [parsed];
  return candidates
    .map((c: any) => ({
      firstName: c.firstName || "",
      lastName: c.lastName || "",
      email: c.email || "",
      headline: c.headline || "",
      bio: c.bio || "",
      location: c.location || "",
      skills: Array.isArray(c.skills) ? c.skills : [],
      languages: Array.isArray(c.languages) ? c.languages : [],
      experience: Array.isArray(c.experience) ? c.experience : [],
      education: Array.isArray(c.education) ? c.education : [],
      certifications: Array.isArray(c.certifications) ? c.certifications : [],
      projects: Array.isArray(c.projects) ? c.projects : [],
      availability: c.availability || { status: "Available", type: "Full-time" },
      socialLinks: c.socialLinks || {},
    }))
    .filter((c: any) => c.firstName || c.lastName || c.email);
}

// PDF Parser — POWERED BY GEMINI AI
export async function parsePDF(filePath: string): Promise<any> {
  // Step 1: Extract raw text from PDF
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  const rawText = data.text;

  console.log("[PDF Parser] Extracted text length:", rawText.length);

  // Step 2: If text is too short, return minimal profile
  if (rawText.length < 20) {
    console.log("[PDF Parser] Too little text extracted");
    return {
      firstName: "", lastName: "", email: "", headline: "", bio: "", location: "",
      skills: [], languages: [], experience: [], education: [],
      certifications: [], projects: [],
      availability: { status: "Available", type: "Full-time" },
      socialLinks: {},
    };
  }

  // Step 3: Try Gemini AI extraction (best quality)
  if (config.geminiApiKey) {
    try {
      console.log("[PDF Parser] Using Gemini AI for smart extraction...");
      const genAI = new GoogleGenerativeAI(config.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

      const prompt = `You are a resume parser. Extract structured candidate data from this resume text.

RESUME TEXT:
${rawText.substring(0, 8000)}

Extract ALL information into this EXACT JSON format. Be thorough - extract every skill, every job, every degree you can find. For skills, estimate the proficiency level (Beginner/Intermediate/Advanced/Expert) based on context and years mentioned.

Return ONLY valid JSON (no markdown, no backticks):
{
  "firstName": "",
  "lastName": "",
  "email": "",
  "headline": "Professional title or summary in under 80 characters",
  "bio": "2-3 sentence professional summary",
  "location": "",
  "skills": [
    { "name": "skill name", "level": "Beginner|Intermediate|Advanced|Expert", "yearsOfExperience": 0 }
  ],
  "languages": [
    { "name": "language", "proficiency": "Basic|Conversational|Fluent|Native" }
  ],
  "experience": [
    {
      "company": "",
      "role": "",
      "startDate": "YYYY-MM format",
      "endDate": "YYYY-MM or Present",
      "description": "What they did in this role",
      "technologies": ["tech1", "tech2"],
      "isCurrent": false
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "Bachelor's|Master's|PhD|Diploma|Certificate",
      "fieldOfStudy": "",
      "startYear": 0,
      "endYear": 0
    }
  ],
  "certifications": [
    { "name": "", "issuer": "", "issueDate": "YYYY-MM" }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": [],
      "role": "",
      "link": ""
    }
  ],
  "availability": { "status": "Available", "type": "Full-time" },
  "socialLinks": {
    "linkedin": "",
    "github": "",
    "portfolio": ""
  }
}

Rules:
- Extract real data from the resume, do not invent information
- If a field cannot be found, use empty string or empty array
- For skills, estimate level from context (e.g., "5 years React" = Expert)
- For dates, convert to YYYY-MM format when possible
- Extract ALL skills mentioned, not just technical ones
- Extract ALL work experiences, not just the latest
- Extract ALL education entries
- Look for project descriptions and extract them
- Look for LinkedIn, GitHub, portfolio URLs in the text`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("[PDF Parser] Gemini extracted:", parsed.firstName, parsed.lastName, "with", parsed.skills?.length || 0, "skills");

        // Ensure all fields exist with defaults
        return {
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || "",
          email: parsed.email || "",
          headline: parsed.headline || "",
          bio: parsed.bio || "",
          location: parsed.location || "",
          skills: Array.isArray(parsed.skills) ? parsed.skills : [],
          languages: Array.isArray(parsed.languages) ? parsed.languages : [],
          experience: Array.isArray(parsed.experience) ? parsed.experience : [],
          education: Array.isArray(parsed.education) ? parsed.education : [],
          certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
          projects: Array.isArray(parsed.projects) ? parsed.projects : [],
          availability: parsed.availability || { status: "Available", type: "Full-time" },
          socialLinks: parsed.socialLinks || {},
        };
      }
    } catch (err: any) {
      console.log("[PDF Parser] Gemini extraction failed:", err.message);
      console.log("[PDF Parser] Falling back to basic extraction...");
    }
  }

  // Step 4: Fallback — basic regex extraction (if Gemini fails or no API key)
  console.log("[PDF Parser] Using basic text extraction...");
  const lines = rawText.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
  const nameLine = lines[0] || "";
  const nameParts = nameLine.split(/\s+/);

  const emailMatch = rawText.match(/[\w.-]+@[\w.-]+\.\w+/);
  const email = emailMatch ? emailMatch[0] : "";

  const locationMatch = rawText.match(/(?:Location|Address|City)[\s:]*([^\n]+)/i) ||
                        rawText.match(/(Kigali[^,\n]*(?:,\s*Rwanda)?)/i);
  const location = locationMatch ? locationMatch[1]?.trim() || "" : "";

  let headline = "";
  const summaryMatch = rawText.match(/(?:PROFESSIONAL\s*SUMMARY|SUMMARY|OBJECTIVE|ABOUT)[\s\n]*([^\n]+)/i);
  if (summaryMatch) headline = summaryMatch[1]?.trim().substring(0, 100) || "";

  const skills: any[] = [];
  const skillsMatch = rawText.match(/(?:SKILLS|TECHNICAL\s*SKILLS|CORE\s*SKILLS)[\s\n]*([\s\S]*?)(?=\n(?:WORK|EXPERIENCE|EDUCATION|PROJECTS|CERTIF|AVAIL|\n\n))/i);
  if (skillsMatch) {
    const skillsText = skillsMatch[1];
    const skillPattern = /(\w[\w\s.#+]*?)\s*\((\w+),?\s*(\d+)\s*years?\)/gi;
    let match;
    while ((match = skillPattern.exec(skillsText)) !== null) {
      skills.push({ name: match[1].trim(), level: match[2].trim(), yearsOfExperience: parseInt(match[3]) || 0 });
    }
    if (skills.length === 0) {
      const simpleSkills = skillsText.split(/[,|•\n]/).map((s: string) => s.trim()).filter((s: string) => s.length > 1 && s.length < 30);
      simpleSkills.forEach((s: string) => {
        skills.push({ name: s, level: "Intermediate", yearsOfExperience: 0 });
      });
    }
  }

  return {
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    email, headline, bio: headline, location, skills, languages: [],
    experience: [], education: [], certifications: [], projects: [],
    availability: { status: "Available", type: "Full-time" }, socialLinks: {},
  };
}