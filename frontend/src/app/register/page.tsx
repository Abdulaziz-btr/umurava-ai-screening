"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { registerUser, clearError } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brain, Mail, Lock, User, Building, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", company: "" });
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { loading, error, token } = useSelector((state: RootState) => state.auth);

  useEffect(() => { if (token) router.push("/dashboard"); }, [token, router]);
  useEffect(() => { return () => { dispatch(clearError()); }; }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(registerUser(form));
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-blue-600 p-12 flex-col justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">UmuravaAI</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Join thousands of<br />smart recruiters
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            Create your free account and start screening candidates with AI in minutes.
          </p>
          <div className="mt-8 space-y-3">
            {["AI-powered candidate ranking", "Transparent scoring & reasoning", "CSV, Excel, and PDF support"].map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center gap-2 text-blue-100"
              >
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-sm">{f}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <p className="text-blue-200 text-sm">Umurava AI Hackathon 2026 &middot; Kigali, Rwanda</p>
      </motion.div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">UmuravaAI</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-gray-500 mb-8">Start screening candidates with AI</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { field: "fullName", label: "Full name", icon: User, placeholder: "Jean Mugabo", type: "text", required: true },
              { field: "email", label: "Email", icon: Mail, placeholder: "you@company.com", type: "email", required: true },
              { field: "company", label: "Company", icon: Building, placeholder: "Umurava", type: "text", required: false, extra: "(optional)" },
              { field: "password", label: "Password", icon: Lock, placeholder: "Min. 6 characters", type: "password", required: true },
            ].map((f, i) => (
              <motion.div
                key={f.field}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {f.label} {f.extra && <span className="text-gray-400 font-normal">{f.extra}</span>}
                </label>
                <div className="relative">
                  <f.icon className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type={f.type}
                    required={f.required}
                    minLength={f.field === "password" ? 6 : undefined}
                    value={(form as any)[f.field]}
                    onChange={update(f.field)}
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                    placeholder={f.placeholder}
                  />
                </div>
              </motion.div>
            ))}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg transition text-sm"
            >
              {loading ? "Creating account..." : "Create account"}
            </motion.button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
