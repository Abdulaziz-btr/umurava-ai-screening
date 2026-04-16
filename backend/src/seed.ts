import mongoose from "mongoose";
import { config } from "./config";
import { User } from "./models/User";
import { Job } from "./models/Job";
import { Applicant } from "./models/Applicant";

const seedData = async () => {
  await mongoose.connect(config.mongoUri);
  await User.deleteMany({});
  await Job.deleteMany({});
  await Applicant.deleteMany({});

  const user = new User({ email: "recruiter@umurava.africa", passwordHash: "password123", fullName: "Jean Mugabo", company: "Umurava" });
  await user.save();

  const job = new Job({
    recruiterId: user._id,
    title: "Senior Frontend Developer",
    description: "Senior Frontend Developer to build Next.js apps and mentor juniors.",
    requirements: { skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Redux"], experienceYears: 3, education: "Bachelor's", other: "REST APIs and Git" },
    status: "active",
  });
  await job.save();

  // Helper to build a profile quickly
  const mk = (firstName: string, lastName: string, headline: string, skills: any[], exp: any[], edu: any[], projects: any[], avail = "Available") => ({
    firstName, lastName,
    email: `${firstName.toLowerCase()}@email.com`,
    headline,
    bio: headline,
    location: "Kigali, Rwanda",
    skills,
    languages: [{ name: "English", proficiency: "Fluent" }, { name: "Kinyarwanda", proficiency: "Native" }],
    experience: exp,
    education: edu,
    projects,
    availability: { status: avail, type: "Full-time" },
  });

  const S = (name: string, level: string, years: number) => ({ name, level, yearsOfExperience: years });
  const E = (company: string, role: string, start: string, end: string, tech: string[], current = false) => ({ company, role, startDate: start, endDate: end, description: `${role} at ${company}`, technologies: tech, isCurrent: current });
  const ED = (inst: string, deg: string, field: string, sy: number, ey: number) => ({ institution: inst, degree: deg, fieldOfStudy: field, startYear: sy, endYear: ey });
  const P = (name: string, desc: string, tech: string[], role: string) => ({ name, description: desc, technologies: tech, role, link: "https://github.com/" });

  const applicants = [
    mk("Alice", "Uwimana", "Senior Frontend Engineer — React & Next.js",
      [S("React","Expert",5), S("Next.js","Expert",4), S("TypeScript","Advanced",4), S("Tailwind CSS","Advanced",3), S("Redux","Advanced",3)],
      [E("FinTech Rwanda","Senior Frontend","2021-06","Present",["React","Next.js","TypeScript"],true)],
      [ED("University of Rwanda","Master's","Computer Science",2018,2022)],
      [P("FinTech Dashboard","Built analytics dashboard",["Next.js","React"],"Lead")]),
    mk("Bob", "Habimana", "Junior React Developer",
      [S("React","Beginner",2), S("JavaScript","Intermediate",2), S("CSS","Intermediate",2)],
      [E("WebShop","Junior Dev","2023-01","Present",["React","JavaScript"],true)],
      [ED("AUCA","Bachelor's","IT",2019,2023)],
      [P("Portfolio Site","Personal portfolio",["React"],"Solo")]),
    mk("Claire", "Ishimwe", "Frontend Developer — Vue & Angular",
      [S("Vue.js","Advanced",4), S("Angular","Advanced",3), S("TypeScript","Advanced",3)],
      [E("E-Shop","Frontend Lead","2020-03","Present",["Vue","Angular"],true)],
      [ED("UR","Bachelor's","Software Engineering",2016,2020)],
      [P("E-commerce UI","Built storefront",["Vue.js"],"Lead")]),
    mk("David", "Niyonzima", "Senior React/Next.js Engineer",
      [S("React","Expert",6), S("Next.js","Expert",5), S("TypeScript","Expert",5), S("Redux","Advanced",4), S("Jest","Advanced",4)],
      [E("HealthTech","Senior Frontend","2019-01","Present",["React","Next.js","TypeScript"],true)],
      [ED("KIST","Bachelor's","Computer Science",2014,2018)],
      [P("Patient Portal","Healthcare dashboard",["Next.js","React"],"Lead")]),
    mk("Emma", "Mukamana", "React & React Native Developer",
      [S("React","Advanced",3), S("TypeScript","Intermediate",2), S("Tailwind CSS","Advanced",3), S("React Native","Advanced",3)],
      [E("MobileCo","Frontend Dev","2021-06","Present",["React","React Native"],true)],
      [ED("UR","Bachelor's","Computer Science",2017,2021)],
      [P("Fitness App","Cross-platform app",["React Native"],"Solo")]),
    mk("Frank", "Ndayisaba", "Backend Python Engineer",
      [S("Python","Expert",4), S("Django","Advanced",4), S("SQL","Advanced",4)],
      [E("DataCo","Backend Eng","2020-01","Present",["Python","Django"],true)],
      [ED("UR","Master's","Data Science",2017,2019)],
      [P("Analytics API","REST API",["Django"],"Backend Lead")]),
    mk("Grace", "Ingabire", "Frontend Engineer — Design Systems",
      [S("React","Advanced",4), S("Next.js","Advanced",3), S("TypeScript","Advanced",3), S("Tailwind CSS","Expert",4), S("Redux","Advanced",3)],
      [E("SaaS Co","Frontend Eng","2020-09","Present",["React","Next.js","Tailwind"],true)],
      [ED("AUCA","Bachelor's","IT",2016,2020)],
      [P("Component Library","Reusable UI kit",["React","Storybook"],"Lead")]),
    mk("Henri", "Mugisha", "Full-Stack Web Developer",
      [S("React","Intermediate",4), S("JavaScript","Advanced",7), S("PHP","Advanced",5)],
      [E("WebAgency","Full-stack Dev","2017-01","Present",["React","PHP","MySQL"],true)],
      [ED("Self-taught","Diploma","Web Development",2015,2017)],
      [P("CMS Platform","Content management",["React","PHP"],"Full-stack")]),
    mk("Irene", "Uwase", "Senior Full-Stack Engineer — Next.js & AWS",
      [S("React","Expert",5), S("Next.js","Expert",5), S("TypeScript","Expert",4), S("Tailwind CSS","Advanced",3), S("AWS","Advanced",3)],
      [E("CloudCo","Senior Engineer","2020-01","Present",["Next.js","AWS","TypeScript"],true)],
      [ED("UR","Bachelor's","Computer Engineering",2016,2020)],
      [P("SaaS Platform","100K+ users",["Next.js","AWS"],"Lead")]),
    mk("Jacques", "Bizimana", "Junior Web Designer",
      [S("HTML","Intermediate",2), S("CSS","Intermediate",2), S("JavaScript","Beginner",1)],
      [E("Studio","Designer","2024-01","Present",["HTML","CSS","Figma"],true)],
      [ED("IPRC","Diploma","Web Design",2021,2023)],
      [P("Landing Pages","Marketing sites",["HTML","CSS"],"Designer")]),
    mk("Keza", "Umutoni", "Frontend Specialist — React & Next.js",
      [S("React","Expert",4), S("Next.js","Expert",4), S("TypeScript","Advanced",3), S("Redux","Expert",4), S("Tailwind CSS","Advanced",3)],
      [E("StartupX","Frontend Lead","2021-01","Present",["React","Next.js","Redux"],true)],
      [ED("UR","Bachelor's","Computer Science",2017,2021)],
      [P("Migration Project","jQuery to Next.js",["Next.js"],"Lead")]),
    mk("Leon", "Nsengiyumva", "Senior Angular Developer",
      [S("Angular","Expert",5), S("TypeScript","Expert",5), S("RxJS","Advanced",4)],
      [E("EnterpriseCo","Tech Lead","2019-06","Present",["Angular","TypeScript"],true)],
      [ED("KIST","Master's","Software Engineering",2015,2017)],
      [P("ERP Module","Enterprise dashboard",["Angular"],"Lead")]),
    mk("Marie", "Bayisenge", "Mid-level React Developer",
      [S("React","Advanced",2), S("Next.js","Intermediate",2), S("JavaScript","Advanced",3)],
      [E("ShopCo","React Dev","2022-06","Present",["React","Next.js"],true)],
      [ED("UR","Bachelor's","Computer Science",2018,2022)],
      [P("E-commerce Site","Online store",["React","Next.js"],"Frontend")]),
    mk("Olivier", "Tuyishime", "Full-Stack Next.js Developer",
      [S("React","Advanced",3), S("Next.js","Advanced",3), S("TypeScript","Advanced",3), S("Tailwind CSS","Advanced",3), S("Redux","Intermediate",2)],
      [E("DevStudio","Full-stack","2021-09","Present",["Next.js","Prisma"],true)],
      [ED("UR","Bachelor's","Information Systems",2017,2021)],
      [P("SaaS App","B2B platform",["Next.js","Prisma"],"Full-stack")]),
    mk("Patricia", "Nyiraneza", "Mobile Developer — Flutter & Swift",
      [S("Swift","Advanced",3), S("Flutter","Advanced",3), S("Dart","Advanced",3)],
      [E("MobileLab","Mobile Dev","2021-01","Present",["Swift","Flutter"],true)],
      [ED("UR","Bachelor's","Computer Science",2017,2021)],
      [P("iOS App","Native app",["Swift"],"Solo")]),
  ];

  await Applicant.insertMany(applicants.map((a) => ({ jobId: job._id, source: "umurava_profile", profileData: a, parsedAt: new Date() })));
  console.log(`Seeded ${applicants.length} applicants. Login: recruiter@umurava.africa / password123`);
  await mongoose.disconnect();
};

seedData().catch(console.error);