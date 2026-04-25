"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Brain, Users, Zap, Shield, ArrowRight, CheckCircle, BarChart3, FileText, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import VantaBackground from "./VantaBackground"; // Make sure this path matches your file!


const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1 } }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function LandingPage() {
  const router = useRouter();
  const { token } = useSelector((state: RootState) => state.auth);
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

useEffect(() => {
  if (mounted && token) router.push("/dashboard");
}, [mounted, token, router]);

if (!mounted) return null;
if (token) return null;

  return (
    <VantaBackground>
      {/* CRUCIAL: bg-transparent allows the 3D dots to show through! 
      */}
      <div className="min-h-screen bg-transparent text-gray-900">
        
        {/* Navbar */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="border-b border-gray-200/50 px-6 py-4 bg-white/60 backdrop-blur-md"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">Umurava<span className="text-blue-600">AI</span></span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/login")}
                className="text-sm text-gray-700 hover:text-blue-600 font-medium px-4 py-2 transition">
                Sign in
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/register")}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-lg transition shadow-md"
              >
                Get started
              </motion.button>
            </div>
          </div>
        </motion.nav>

        {/* Hero */}
        <section className="px-6 pt-20 pb-16">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeUp} custom={0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-blue-700 border border-blue-100 text-sm font-medium rounded-full mb-6 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Powered by Google Gemini AI
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1}
              className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
              Screen candidates <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                10x faster
              </span> with AI
            </motion.h1>
            <motion.p variants={fadeUp} custom={2}
              className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium bg-white/50 backdrop-blur-sm p-4 rounded-2xl">
              Stop drowning in applications. Our AI-powered screening tool evaluates, scores,
              and ranks candidates in seconds — with transparent reasoning you can trust.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/register")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-4 rounded-xl text-lg transition shadow-xl shadow-blue-600/20"
              >
                Start screening free <ArrowRight className="w-5 h-5" />
              </motion.button>
              <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="text-gray-700 hover:text-blue-600 bg-white/60 backdrop-blur-sm hover:bg-white/90 font-medium px-6 py-4 rounded-xl transition shadow-sm border border-gray-200/50">
                See how it works
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* Stats bar */}
        <section className="border-y border-gray-200/50 bg-white/40 backdrop-blur-md px-6 py-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: "60s", label: "Average screening time" },
              { value: "100+", label: "Candidates per batch" },
              { value: "4", label: "Scoring dimensions" },
              { value: "100%", label: "Explainable decisions" },
            ].map((s, i) => (
              <motion.div key={s.label} variants={fadeUp} custom={i}>
                <p className="text-4xl font-extrabold text-blue-900">{s.value}</p>
                <p className="text-sm text-gray-700 font-semibold mt-2">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="px-6 py-24">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4">How it works</h2>
              <p className="text-gray-600 text-lg font-medium max-w-xl mx-auto bg-white/50 backdrop-blur-sm rounded-lg p-2">
                Three simple steps from job posting to shortlist.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {[
                { step: "01", icon: FileText, title: "Post your job", desc: "Define the role, required skills, experience level, and education. Set your ideal candidate profile.", color: "blue" },
                { step: "02", icon: Users, title: "Add candidates", desc: "Upload structured profiles, CSV spreadsheets, structured Json or individual PDF resumes. We parse everything automatically.", color: "purple" },
                { step: "03", icon: Brain, title: "AI screens & ranks", desc: "Gemini AI evaluates every candidate, scores them across 4 dimensions, and returns a ranked shortlist with clear reasoning.", color: "green" },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="relative bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition"
                >
                  <span className="text-7xl font-black text-gray-100/50 absolute top-4 right-6 pointer-events-none">{item.step}</span>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 relative z-10 ${
                    item.color === "blue" ? "bg-blue-100 text-blue-600" : item.color === "purple" ? "bg-purple-100 text-purple-600" : "bg-green-100 text-green-600"
                  }`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 relative z-10">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed font-medium relative z-10">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-24 bg-white/40 backdrop-blur-md border-y border-white">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4">Built for modern recruiters</h2>
              <p className="text-gray-600 text-lg font-medium max-w-xl mx-auto">
                Everything you need to screen candidates effectively and fairly.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[
                { icon: BarChart3, title: "Weighted scoring", desc: "Skills (40%), experience (30%), education (15%), relevance (15%) — customizable per job." },
                { icon: Shield, title: "Bias-free evaluation", desc: "AI evaluates based on qualifications only. No names, gender, or demographics considered." },
                { icon: Zap, title: "Batch processing", desc: "Screen 100+ candidates in a single run. Results in under 60 seconds." },
                { icon: CheckCircle, title: "Transparent reasoning", desc: "Every shortlisted candidate includes clear strengths, gaps, and a written recommendation." },
                { icon: FileText, title: "Multi-format intake", desc: "Structured profiles, CSV spreadsheets, Json, Excel files, and PDF resumes — all supported." },
                { icon: Users, title: "Human-in-the-loop", desc: "AI recommends, you decide. The final hiring decision always stays with the recruiter." },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                  className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                    <f.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">{f.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="px-6 py-24 bg-gradient-to-br from-blue-700 to-blue-900"
        >
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-extrabold text-white mb-6"
            >
              Ready to screen smarter?
            </motion.h2>
            <p className="text-blue-100 mb-10 text-xl max-w-2xl mx-auto">
              Create your free account and run your first AI screening in minutes.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push("/register")}
              className="bg-white text-blue-700 hover:bg-gray-50 font-bold px-10 py-4 rounded-xl text-lg transition shadow-2xl"
            >
              Get started free
            </motion.button>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="border-t border-gray-200/50 bg-white/80 backdrop-blur-md px-6 py-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold">UmuravaAI Screening</span>
            </div>
            <p className="text-sm text-gray-500 font-medium">Built for the Umurava AI Hackathon 2026 &middot; Kigali, Rwanda</p>
          </div>
        </footer>

      </div>
    </VantaBackground>
  );
}