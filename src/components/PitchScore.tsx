import { motion } from "framer-motion";
import { Snowflake, Flame, Thermometer } from "lucide-react";

interface ScoreBreakdown {
  clarity: number;
  specificity: number;
  structure: number;
  differentiation: number;
  impact: number;
}

interface PitchScoreProps {
  score: number;
  breakdown?: ScoreBreakdown;
}

function getScoreMeta(score: number) {
  if (score <= 15) return { label: "Freezing", emoji: "❄️", icon: Snowflake, gradient: "from-blue-600 to-blue-400", textColor: "text-blue-300", barColor: "bg-blue-500", bgTint: "bg-blue-950/40" };
  if (score <= 35) return { label: "Cold", emoji: "🧊", icon: Snowflake, gradient: "from-blue-400 to-cyan-300", textColor: "text-cyan-300", barColor: "bg-cyan-400", bgTint: "bg-cyan-950/30" };
  if (score <= 50) return { label: "Lukewarm", emoji: "🌡️", icon: Thermometer, gradient: "from-gray-400 to-gray-300", textColor: "text-gray-300", barColor: "bg-gray-400", bgTint: "bg-gray-900/30" };
  if (score <= 70) return { label: "Warm", emoji: "🔥", icon: Flame, gradient: "from-orange-400 to-yellow-400", textColor: "text-orange-300", barColor: "bg-orange-400", bgTint: "bg-orange-950/30" };
  if (score <= 85) return { label: "Hot", emoji: "🔥", icon: Flame, gradient: "from-orange-500 to-red-400", textColor: "text-orange-200", barColor: "bg-orange-500", bgTint: "bg-orange-950/40" };
  return { label: "On Fire", emoji: "🔥", icon: Flame, gradient: "from-red-500 to-red-400", textColor: "text-red-300", barColor: "bg-red-500", bgTint: "bg-red-950/40" };
}

const dimensionLabels: Record<keyof ScoreBreakdown, string> = {
  clarity: "Clarity",
  specificity: "Specificity",
  structure: "Structure",
  differentiation: "Differentiation",
  impact: "Impact",
};

const PitchScore = ({ score, breakdown }: PitchScoreProps) => {
  const meta = getScoreMeta(score);
  const Icon = meta.icon;

  return (
    <motion.div
      className={`w-full max-w-sm rounded-xl border border-border ${meta.bgTint} p-5`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Score header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${meta.textColor}`} />
          <span className={`text-sm font-semibold ${meta.textColor}`}>{meta.label}</span>
        </div>
        <motion.span
          className={`text-3xl font-bold font-serif ${meta.textColor}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {score}
          <span className="text-base font-normal text-muted-foreground">/100</span>
        </motion.span>
      </div>

      {/* Main bar */}
      <div className="w-full h-3 rounded-full bg-muted overflow-hidden mb-4">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${meta.gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Breakdown */}
      {breakdown && (
        <div className="space-y-2">
          {(Object.keys(dimensionLabels) as Array<keyof ScoreBreakdown>).map((key, i) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-28 shrink-0">
                {dimensionLabels[key]}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${meta.barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(breakdown[key] / 20) * 100}%` }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">
                {breakdown[key]}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default PitchScore;
