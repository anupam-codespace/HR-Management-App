"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const trimmedEmail = email.trim();
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/auth/forgot-password`, { email: trimmedEmail });
      setSuccess(true);
    } catch (err: any) {
      const apiMessage = err.response?.data?.message;
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(', ')
        : (typeof apiMessage === 'string' ? apiMessage : "Something went wrong. Please try again.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl text-emerald-600 mb-4">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Forgot Password</h1>
          <p className="text-slate-500 text-sm mt-2">Enter your email and we'll send you a link to reset your password.</p>
        </div>

        {success ? (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex flex-col items-center text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <p className="text-sm font-medium">Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.</p>
            <Link href="/login" className="text-emerald-700 font-bold hover:underline mt-2 inline-block cursor-pointer">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-sm text-rose-500 bg-rose-50 p-3 rounded-md">{error}</div>}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <Input 
                type="email" 
                required 
                placeholder="you@company.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full"
              />
            </div>

            <Button type="submit" disabled={loading || !email} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center mt-6">
              <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center transition-colors cursor-pointer">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}