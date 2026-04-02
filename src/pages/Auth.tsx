import { useState } from "react";
import { Rocket, Eye, EyeOff, Loader2, Github, Globe, Smartphone, Shield, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import heroBanner from "@/assets/hero-banner.jpg";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister: (name: string, email: string, password: string) => Promise<boolean>;
  sendOtp?: (email: string) => Promise<void>;
  verifyOtpAndSetPassword?: (email: string, token: string, password: string, name: string) => Promise<any>;
}

type AuthStep = "input" | "otp" | "set_password";

// Google SVG icon
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthPage({ onLogin, onRegister, sendOtp, verifyOtpAndSetPassword }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<AuthStep>("input");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const resetForm = () => {
    setStep("input");
    setOtp("");
    setPassword("");
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: "offline", prompt: "consent" },
        skipBrowserRedirect: false,
      },
    });
    if (error) {
      toast.error(error.message || "Google sign-in failed");
      setGoogleLoading(false);
    }
    // On success, Supabase redirects automatically — no state update needed
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      toast.error(err.message || "Invalid email or password");
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email"); return; }
    if (mode === "register" && !name) { toast.error("Please enter your name"); return; }
    setLoading(true);
    try {
      if (sendOtp) {
        await sendOtp(email);
        setStep("otp");
        toast.success("Verification code sent to your email");
      } else {
        await onRegister(name, email, "temp123");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification code");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) { toast.error("Please enter the 4-digit code"); return; }
    setStep("set_password");
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      if (verifyOtpAndSetPassword) {
        const user = await verifyOtpAndSetPassword(email, otp, password, name);
        if (user) toast.success("Account created successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid verification code");
      setLoading(false);
    }
  };

  const features = [
    { icon: Globe,      label: "Web Hosting",   desc: "Deploy ZIP sites instantly" },
    { icon: Smartphone, label: "APK Hosting",   desc: "Professional download pages" },
    { icon: Github,     label: "GitHub CI/CD",  desc: "Auto-deploy on every push" },
    { icon: Shield,     label: "Security Scan", desc: "Automatic virus protection" },
  ];

  // Only show Google button on the "input" step (not during OTP / set-password)
  const showSocialLogin = step === "input";

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Hero Panel ── */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        <img src={heroBanner} alt="AppDeployer Hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-2xl gradient-text">AppDeployer</span>
          </div>
          <div>
            <h1 className="text-5xl font-extrabold leading-tight mb-4">
              Deploy <span className="gradient-text">Anything</span>,<br />Instantly.
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-md">
              Upload ZIP files, host APKs, and connect GitHub repos for seamless auto-deployment with enterprise security.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {features.map((f) => (
                <div key={f.label} className="glass rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <f.icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{f.label}</div>
                    <div className="text-xs text-muted-foreground">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-background flex items-center justify-center text-xs font-bold text-white">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span>Trusted by <strong className="text-foreground">12,000+</strong> developers</span>
          </div>
        </div>
      </div>

      {/* ── Right: Auth Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">AppDeployer</span>
          </div>

          {/* Mode Tabs */}
          <div className="flex rounded-xl overflow-hidden border border-white/8 mb-6 p-1 glass">
            <button
              onClick={() => { setMode("login"); resetForm(); }}
              className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                mode === "login" ? "bg-blue-600 text-white shadow" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("register"); resetForm(); }}
              className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                mode === "register" ? "bg-blue-600 text-white shadow" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Register
            </button>
          </div>

          {/* ── Google OAuth Button (shown on input step only) ── */}
          {showSocialLogin && (
            <div className="mb-5 animate-fade-in">
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 glass border border-white/12 hover:border-white/20 hover:bg-white/5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {googleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : (
                  <GoogleIcon className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-foreground">
                  {googleLoading
                    ? "Redirecting..."
                    : mode === "login"
                      ? "Continue with Google"
                      : "Sign up with Google"
                  }
                </span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-xs text-muted-foreground font-medium px-1">or</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>
            </div>
          )}

          {/* ── LOGIN FLOW ── */}
          {mode === "login" && (
            <>
              <div className="mb-5">
                <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
                <p className="text-muted-foreground text-sm">Sign in with email and password</p>
              </div>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-muted-foreground"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {loading ? "Signing in..." : "Sign In with Email"}
                </button>
              </form>
            </>
          )}

          {/* ── REGISTER: Step 1 — email + name ── */}
          {mode === "register" && step === "input" && (
            <>
              <div className="mb-5">
                <h2 className="text-2xl font-bold mb-1">Create account</h2>
                <p className="text-muted-foreground text-sm">We'll send a verification code to your email</p>
              </div>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Full Name</label>
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Ahmed Al-Amri"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {loading ? "Sending code..." : "Send Verification Code"}
                </button>
              </form>
            </>
          )}

          {/* ── REGISTER: Step 2 — OTP ── */}
          {mode === "register" && step === "otp" && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Check your email</h2>
                <p className="text-muted-foreground text-sm">
                  Enter the 4-digit code sent to <strong className="text-foreground">{email}</strong>
                </p>
              </div>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Verification Code</label>
                  <input
                    type="text" value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="0000" maxLength={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-muted-foreground placeholder:tracking-normal"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  Verify Code
                </button>
                <button
                  type="button" onClick={() => setStep("input")}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              </form>
            </>
          )}

          {/* ── REGISTER: Step 3 — set password ── */}
          {mode === "register" && step === "set_password" && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">Set your password</h2>
                <p className="text-muted-foreground text-sm">Choose a secure password for your account</p>
              </div>
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-muted-foreground"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing, you agree to our{" "}
            <span className="text-blue-400 cursor-pointer hover:underline">Terms of Service</span>{" "}
            and{" "}
            <span className="text-blue-400 cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
