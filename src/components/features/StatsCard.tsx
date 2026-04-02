import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  positive?: boolean;
  color?: "blue" | "purple" | "green" | "orange";
}

const colorMap = {
  blue: {
    icon: "bg-blue-500/15 text-blue-400",
    glow: "hover:shadow-blue-500/10",
    border: "hover:border-blue-500/20",
  },
  purple: {
    icon: "bg-purple-500/15 text-purple-400",
    glow: "hover:shadow-purple-500/10",
    border: "hover:border-purple-500/20",
  },
  green: {
    icon: "bg-emerald-500/15 text-emerald-400",
    glow: "hover:shadow-emerald-500/10",
    border: "hover:border-emerald-500/20",
  },
  orange: {
    icon: "bg-orange-500/15 text-orange-400",
    glow: "hover:shadow-orange-500/10",
    border: "hover:border-orange-500/20",
  },
};

export default function StatsCard({
  label,
  value,
  icon: Icon,
  change,
  positive = true,
  color = "blue",
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 border border-white/5 transition-all duration-300",
        "hover:bg-white/5 hover:shadow-lg",
        colors.glow,
        colors.border
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              positive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            )}
          >
            {positive ? "+" : ""}{change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
