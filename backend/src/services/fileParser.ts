import fs from "fs";
import csvParser from "csv-parser";
import * as XLSX from "xlsx";
import pdf from "pdf-parse";

interface ParsedApplicant {
  fullName: string;
  email: string;
  phone: string;
  skills: string[];
  experienceYears: number;
  education: string;
  summary: string;
  workHistory: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
}

/**
 * Parse a CSV file into applicant records
 */
export const parseCSV = (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row: any) => {
        // Parse skills: "React:Expert:5,Next.js:Advanced:3"
        const skills = (row.skills || "").split("|").filter(Boolean).map((s: string) => {
  const [name, level, years] = s.trim().split(":");
  return { name, level: level || "Intermediate", yearsOfExperience: parseInt(years) || 1 };
});

        results.push({
          firstName: row.firstName || row.first_name || "Unknown",
          lastName: row.lastName || row.last_name || "",
          email: row.email || "",
          headline: row.headline || "Candidate",
          bio: row.bio || "",
          location: row.location || "Unknown",
          skills,
          languages: [],
          experience: row.company ? [{
            company: row.company,
            role: row.role || "",
            startDate: row.startDate || "",
            endDate: row.endDate || "Present",
            description: row.description || "",
            technologies: (row.technologies || "").split("|").map((t: string) => t.trim()).filter(Boolean),
            isCurrent: row.endDate === "Present" || !row.endDate,
          }] : [],
          education: row.institution ? [{
            institution: row.institution,
            degree: row.degree || "",
            fieldOfStudy: row.fieldOfStudy || "",
            startYear: parseInt(row.startYear) || 2020,
            endYear: parseInt(row.endYear) || 2024,
          }] : [],
          projects: [],
          availability: { status: "Available", type: "Full-time" },
        });
      })
      .on("end", () => resolve(results))
      .on("error", reject);
  });
};

/**
 * Parse an Excel file into applicant records
 */
export const parseExcel = (filePath: string): ParsedApplicant[] => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  return rows.map((row) => ({
    fullName: row.fullName || row.full_name || row.name || "Unknown",
    email: row.email || "",
    phone: String(row.phone || row.phone_number || ""),
    skills: row.skills
      ? String(row.skills)
          .split(",")
          .map((s: string) => s.trim())
      : [],
    experienceYears: parseInt(
      row.experienceYears || row.experience_years || row.experience || "0",
      10
    ),
    education: row.education || row.degree || "",
    summary: row.summary || row.about || row.bio || "",
    workHistory: [],
  }));
};

/**
 * Parse a PDF resume into an applicant record
 * Uses basic text extraction — can be enhanced with Gemini for smarter parsing
 */
export const parsePDF = async (filePath: string): Promise<ParsedApplicant> => {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdf(dataBuffer);
  const text = pdfData.text;

  // Basic extraction — extract what we can from the raw text
  const lines = text.split("\n").filter((l: string) => l.trim());

  // Try to extract email
  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  const email = emailMatch ? emailMatch[0] : "";

  // Try to extract phone
  const phoneMatch = text.match(
    /[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]{7,15}/
  );
  const phone = phoneMatch ? phoneMatch[0].trim() : "";

  // Name is usually first non-empty line
  const fullName = lines[0] || "Unknown";

  return {
    fullName,
    email,
    phone,
    skills: [], // Will be enhanced by AI parsing later
    experienceYears: 0,
    education: "",
    summary: text.substring(0, 1000), // First 1000 chars as summary
    workHistory: [],
  };
};
