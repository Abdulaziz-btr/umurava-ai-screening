import csvParser from "csv-parser";
import fs from "fs";
import * as XLSX from "xlsx";
import pdf from "pdf-parse";

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

// Parse technologies from pipe-separated format
function parseTechString(techStr: string): string[] {
  if (!techStr || typeof techStr !== "string") return [];
  return techStr.split("|").map((t: string) => t.trim()).filter((t) => t.length > 0);
}

// Map a CSV/Excel row to the Umurava schema
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

// Normalize a JSON profile to ensure all fields exist
function normalizeJsonProfile(raw: any): any {
  return {
    firstName: raw.firstName || "",
    lastName: raw.lastName || "",
    email: raw.email || "",
    headline: raw.headline || "",
    bio: raw.bio || raw.summary || "",
    location: raw.location || "",
    skills: Array.isArray(raw.skills) ? raw.skills.map((s: any) => ({
      name: s.name || "",
      level: s.level || "Intermediate",
      yearsOfExperience: s.yearsOfExperience || 0,
    })) : [],
    languages: Array.isArray(raw.languages) ? raw.languages : [],
    experience: Array.isArray(raw.experience) ? raw.experience : [],
    education: Array.isArray(raw.education) ? raw.education : [],
    certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    availability: raw.availability || { status: "Available", type: "Full-time" },
    socialLinks: raw.socialLinks || {},
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

// JSON Parser — supports array of candidates or single candidate
export function parseJSON(filePath: string): any[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  const candidates = Array.isArray(parsed) ? parsed : [parsed];
  return candidates
    .map((c: any) => normalizeJsonProfile(c))
    .filter((c: any) => c.firstName || c.lastName || c.email);
}

// PDF Parser
export async function parsePDF(filePath: string): Promise<any> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  const text = data.text;
  const lines = text.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);

  const nameLine = lines[0] || "";
  const nameParts = nameLine.split(/\s+/);

  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const email = emailMatch ? emailMatch[0] : "";

  const locationMatch = text.match(/(?:Location|Address|City)[\s:]*([^\n]+)/i) ||
                        text.match(/(Kigali[^,\n]*(?:,\s*Rwanda)?)/i);
  const location = locationMatch ? locationMatch[1]?.trim() || "" : "";

  let headline = "";
  const summaryMatch = text.match(/(?:PROFESSIONAL\s*SUMMARY|SUMMARY|OBJECTIVE|ABOUT)[\s\n]*([^\n]+(?:\n[^\n]+)?)/i);
  if (summaryMatch) {
    headline = summaryMatch[1]?.trim().substring(0, 100) || "";
  }

  const skills: any[] = [];
  const skillsMatch = text.match(/(?:SKILLS|TECHNICAL\s*SKILLS|CORE\s*SKILLS)[\s\n]*([\s\S]*?)(?=\n(?:WORK|EXPERIENCE|EDUCATION|PROJECTS|CERTIF|AVAIL|\n\n))/i);
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

  const experience: any[] = [];
  const expMatch = text.match(/(?:WORK\s*EXPERIENCE|EXPERIENCE|EMPLOYMENT)[\s\n]*([\s\S]*?)(?=\n(?:EDUCATION|PROJECTS|CERTIF|SKILLS|AVAIL|\n\n))/i);
  if (expMatch) {
    const expText = expMatch[1];
    const rolePattern = /(?:^|\n)\s*(.+?)\s*[-\u2013\u2014]\s*(.+?)(?:\n|$)/gm;
    let expM;
    while ((expM = rolePattern.exec(expText)) !== null) {
      const part1 = expM[1]?.trim() || "";
      const part2 = expM[2]?.trim() || "";
      if (part1.length > 2 && part2.length > 2) {
        experience.push({ company: part2, role: part1, startDate: "", endDate: "", description: "", technologies: [], isCurrent: false });
      }
    }
  }

  const education: any[] = [];
  const eduMatch = text.match(/(?:EDUCATION|ACADEMIC)[\s\n]*([\s\S]*?)(?=\n(?:PROJECTS|CERTIF|SKILLS|AVAIL|REFERENCE|\n\n))/i);
  if (eduMatch) {
    const eduText = eduMatch[1];
    const degreeMatch = eduText.match(/(Bachelor|Master|PhD|Diploma|Certificate|Associate)(?:'s|s)?\s*(?:of\s*\w+\s*)?(?:in\s+)?([^\n]*)/i);
    const instMatch = eduText.match(/(?:University|Institute|College|School|IPRC|AUCA)\s*[^\n]*/i);
    const yearMatch = eduText.match(/(\d{4})\s*(?:to|-|\u2013)\s*(\d{4})/);
    if (degreeMatch || instMatch) {
      education.push({
        institution: instMatch ? instMatch[0].trim() : "",
        degree: degreeMatch ? degreeMatch[1].trim() : "",
        fieldOfStudy: degreeMatch && degreeMatch[2] ? degreeMatch[2].trim() : "",
        startYear: yearMatch ? parseInt(yearMatch[1]) : 0,
        endYear: yearMatch ? parseInt(yearMatch[2]) : 0,
      });
    }
  }

  return {
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
    email, headline, bio: headline, location, skills, languages: [],
    experience, education, certifications: [], projects: [],
    availability: { status: "Available", type: "Full-time" }, socialLinks: {},
  };
}