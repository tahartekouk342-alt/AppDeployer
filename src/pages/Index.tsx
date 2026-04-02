import { useNavigate } from "react-router-dom";
import {
  Rocket,
  Globe,
  Smartphone,
  GitBranch,
  Shield,
  Zap,
  Download,
  Eye,
  ChevronRight,
  CheckCircle,
  Star,
  ArrowRight,
  Package,
  Upload,
} from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

export default function Index() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Globe,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      title: "Web Hosting",
      desc: "Upload a ZIP file and get a live preview URL instantly. Static sites, React apps, and more.",
    },
    {
      icon: Smartphone,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      title: "APK Hosting",
      desc: "Professional download pages for your Android apps with install instructions and security badges.",
    },
    {
      icon: GitBranch,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
      title: "GitHub CI/CD",
      desc: "Connect repositories and deploy automatically on every push with GitHub Actions integration.",
    },
    {
      icon: Shield,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      title: "Security Scanning",
      desc: "Every uploaded file is scanned for malware and threats before going live. Zero compromise.",
    },
    {
      icon: Zap,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      title: "Instant Deploy",
      desc: "Files go live in under 30 seconds. No configuration, no server setup, no waiting.",
    },
    {
      icon: Eye,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      title: "Analytics Dashboard",
      desc: "Track views, downloads, and traffic in real-time. Know who is downloading your apps.",
    },
  ];

  const stats = [
    { value: "12,000+", label: "Developers" },
    { value: "98,000+", label: "Files Deployed" },
    { value: "99.9%", label: "Uptime" },
    { value: "< 30s", label: "Deploy Time" },
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/mo",
      desc: "For personal projects",
      features: ["5 Projects", "1 GB Storage", "APK + ZIP hosting", "Basic analytics", "Community support"],
      cta: "Start Free",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$12",
      period: "/mo",
      desc: "For serious developers",
      features: ["50 Projects", "50 GB Storage", "GitHub CI/CD", "Advanced analytics", "Priority support", "Custom domains", "Team access (3 seats)"],
      cta: "Get Pro",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "$49",
      period: "/mo",
      desc: "For teams & agencies",
      features: ["Unlimited Projects", "500 GB Storage", "Unlimited GitHub repos", "Custom analytics API", "24/7 Dedicated support", "SSO & SAML", "Unlimited seats"],
      cta: "Contact Sales",
      highlight: false,
    },
  ];

  const testimonials = [
    {
      name: "Sara M.",
      role: "Android Developer",
      text: "AppDeployer cut my APK distribution time from hours to seconds. The download pages look super professional.",
      rating: 5,
      avatar: "S",
      color: "from-blue-500 to-cyan-500",
    },
    {
      name: "Khalid R.",
      role: "Full-Stack Dev",
      text: "I use it for every client project. Push to GitHub, done. My clients are always impressed with the speed.",
      rating: 5,
      avatar: "K",
      color: "from-purple-500 to-pink-500",
    },
    {
      name: "Lena P.",
      role: "Freelance Designer",
      text: "Finally a tool that handles the boring deployment stuff so I can focus on design. Love the security scans.",
      rating: 5,
      avatar: "L",
      color: "from-emerald-500 to-teal-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">AppDeployer</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
              <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/auth")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25"
              >
                Get Started
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <img
          src={heroBanner}
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 py-24 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
            <Zap className="w-3 h-3" />
            Deploy in under 30 seconds
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Deploy{" "}
            <span className="gradient-text">Anything</span>
            <br />
            Instantly.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload ZIP files to host websites, share APKs with professional download pages,
            and connect GitHub repos for auto-deployment — all with enterprise-grade security.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/auth")}
              className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-2xl text-base transition-all hover:shadow-xl hover:shadow-blue-500/30 w-full sm:w-auto justify-center"
            >
              <Rocket className="w-5 h-5" />
              Start Deploying — It's Free
            </button>
            <button
              onClick={() => navigate("/download/demo")}
              className="flex items-center gap-2 px-7 py-3.5 glass border border-white/10 hover:border-white/20 rounded-2xl text-base font-medium transition-all w-full sm:w-auto justify-center"
            >
              <Smartphone className="w-5 h-5 text-purple-400" />
              See APK Page Demo
            </button>
          </div>

          {/* Mini Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-2xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-extrabold gradient-text">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-4">
              <Package className="w-4 h-4 text-blue-400" />
              Everything you need
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              One Platform, All Your <span className="gradient-text">Deployments</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Stop juggling multiple services. AppDeployer handles web hosting, APK distribution, and CI/CD in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="glass rounded-2xl border border-white/5 p-6 hover:border-white/12 hover:bg-white/4 transition-all duration-300 group animate-fade-in"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border mb-4 ${f.bg} group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-muted-foreground">Deploy in 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-blue-500/30" />
            {[
              { step: "01", icon: Upload, title: "Upload Your File", desc: "Drag & drop a ZIP or APK file, or connect your GitHub repo.", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
              { step: "02", icon: Shield, title: "Security Scan", desc: "We automatically scan for malware and threats before publishing.", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
              { step: "03", icon: Rocket, title: "Go Live", desc: "Get a shareable URL instantly. Share it, embed it, done.", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            ].map((s) => (
              <div key={s.step} className="text-center animate-fade-in">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border mx-auto mb-4 ${s.bg}`}>
                  <s.icon className={`w-7 h-7 ${s.color}`} />
                </div>
                <div className={`text-xs font-mono font-bold mb-2 ${s.color}`}>{s.step}</div>
                <h3 className="font-bold text-base mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Simple, <span className="gradient-text">Transparent</span> Pricing
            </h2>
            <p className="text-muted-foreground">Start free, scale when you need to</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 border flex flex-col animate-fade-in ${
                  plan.highlight
                    ? "glass-strong border-blue-500/40 glow-blue"
                    : "glass border-white/8"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-xs font-bold text-white whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <div className="mb-5">
                  <div className="font-bold text-lg mb-1">{plan.name}</div>
                  <div className="text-muted-foreground text-sm mb-3">{plan.desc}</div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm mb-1">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/auth")}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlight
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:shadow-lg hover:shadow-blue-500/25"
                      : "glass border border-white/10 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Loved by <span className="gradient-text">Developers</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="glass rounded-2xl border border-white/8 p-6 animate-fade-in">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-sm font-bold text-white`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-3xl border border-white/8 p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-transparent" />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                Ready to <span className="gradient-text">Deploy?</span>
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Join 12,000+ developers who use AppDeployer to ship faster. No credit card required.
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-2xl text-base transition-all hover:shadow-xl hover:shadow-blue-500/30"
              >
                <Download className="w-5 h-5" />
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Rocket className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold gradient-text">AppDeployer</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Contact</span>
            </div>
            <div className="text-xs text-muted-foreground">
              © 2026 AppDeployer. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
