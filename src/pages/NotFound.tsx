import { useNavigate } from "react-router-dom";
import { Rocket, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center animate-fade-in max-w-md">
        {/* Animated Icon */}
        <div className="relative mx-auto mb-8 w-fit">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center mx-auto">
            <Rocket className="w-12 h-12 text-blue-400 animate-float" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
            <span className="text-xs font-bold text-red-400">!</span>
          </div>
        </div>

        <h1 className="text-7xl font-extrabold gradient-text mb-4">404</h1>
        <p className="text-xl font-bold mb-2">Page Not Found</p>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          This page has been lost in the deploy pipeline. It may have been deleted, moved, or never existed.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 glass border border-white/10 hover:border-white/20 rounded-xl text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
