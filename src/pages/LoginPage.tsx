import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already logged in, redirect to upload
  if (user) return <Navigate to="/upload" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);

    if (mode === "signin") {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError);
      }
    } else {
      const { error: signUpError, needsConfirmation } = await signUp(email, password);
      if (signUpError) {
        setError(signUpError);
      } else if (needsConfirmation) {
        setSuccessMessage(
          "Account created. Click the confirmation link we emailed you — you can't sign in until you do.",
        );
      } else {
        setSuccessMessage("Account created! You can sign in now.");
      }
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      {/* App name */}
      <h1 className="text-[36px] font-bold text-[#1B2A4A] mb-2">Discharge Buddy</h1>
      <p className="text-[18px] text-[#1B2A4A]/70 mb-10 text-center max-w-xs">
        Your post-discharge care companion
      </p>

      {/* Auth card */}
      <div className="w-full max-w-md bg-[#F8F6F3] rounded-xl p-8 shadow-sm">
        {/* Mode tabs */}
        <div className="flex mb-8 bg-white rounded-full p-1 border border-[#1B2A4A]/10">
          <button
            onClick={() => {
              setMode("signin");
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 text-[18px] font-medium rounded-full transition-all ${
              mode === "signin"
                ? "bg-[#1B2A4A] text-white"
                : "text-[#1B2A4A]/60 hover:text-[#1B2A4A]"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode("signup");
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 text-[18px] font-medium rounded-full transition-all ${
              mode === "signup"
                ? "bg-[#1B2A4A] text-white"
                : "text-[#1B2A4A]/60 hover:text-[#1B2A4A]"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="block text-[18px] font-medium text-[#1B2A4A] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-[56px] px-5 text-[18px] rounded-full border border-[#1B2A4A]/15 bg-white text-[#1A1A1A] placeholder:text-[#1B2A4A]/30 outline-none focus:border-[#1B2A4A] transition-colors"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[18px] font-medium text-[#1B2A4A] mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-[56px] px-5 text-[18px] rounded-full border border-[#1B2A4A]/15 bg-white text-[#1A1A1A] placeholder:text-[#1B2A4A]/30 outline-none focus:border-[#1B2A4A] transition-colors"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <div className="bg-[#D14B4B]/10 text-[#D14B4B] text-[18px] px-5 py-3 rounded-xl">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-[#4A9E8E]/10 text-[#4A9E8E] text-[18px] px-5 py-3 rounded-xl">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-[56px] rounded-full bg-[#1B2A4A] text-white text-[20px] font-semibold
                       hover:bg-[#1B2A4A]/90 active:scale-[0.97] transition-all duration-150 ease-out
                       disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}