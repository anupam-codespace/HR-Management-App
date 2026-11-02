"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// We wrap the main content in a component so we can use <Suspense> 
// which is required by Next.js when using useSearchParams()
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/auth/reset-password`, { 
        token, 
        password 
      });
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } catch (err: any) {
      const apiMessage = err.response?.data?.message;
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(', ')
        : (typeof apiMessage === 'string' ? apiMessage : "Failed to reset password. The token may have expired.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-rose-500 font-medium">Invalid or missing reset token.</p>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-2">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Password Reset Complete</h2>
        <p className="text-slate-500 text-sm">Your password has been changed successfully. Redirecting you to login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-sm text-rose-500 bg-rose-50 p-3 rounded-md">{error}</div>}
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">New Password</label>
        <Input 
          type="password" 
          required 
          placeholder="••••••••" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
        <Input 
          type="password" 
          required 
          placeholder="••••••••" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
        />
      </div>

      <Button type="submit" disabled={loading || !password || !confirmPassword} className="w-full bg-slate-900 hover:bg-slate-800 text-white mt-2 cursor-pointer">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {loading ? "Resetting..." : "Save New Password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl text-indigo-600 mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>
          <p className="text-slate-500 text-sm mt-2">Please enter your new password below.</p>
        </div>

        <Suspense fallback={<div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}