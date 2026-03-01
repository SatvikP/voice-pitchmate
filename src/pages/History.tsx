import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { getPitchHistory, type PitchHistoryEntry } from "@/services/api";

const History = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<PitchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const history = await getPitchHistory(user.id);
      setEntries(history);
      setLoading(false);
    };
    load();
  }, []);

  const chartData = entries
    .filter((e) => e.score !== null)
    .map((e) => ({
      pitch: `#${e.pitch_number}`,
      score: e.score,
    }));

  return (
    <div className="min-h-screen bg-background px-6 py-8 max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/pitch")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-sans">Back to pitch</span>
      </button>

      <motion.h1
        className="text-3xl font-serif font-medium text-foreground mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Your Progress
      </motion.h1>
      <p className="text-muted-foreground text-sm font-sans mb-8">
        Track how your pitch has improved over time.
      </p>

      {loading ? (
        <p className="text-muted-foreground text-sm font-sans">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-muted-foreground text-sm font-sans">No pitches yet. Go pitch first!</p>
      ) : (
        <>
          {/* Chart */}
          {chartData.length >= 2 && (
            <motion.div
              className="mb-10 p-4 rounded-xl bg-card border border-border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-sm font-sans text-muted-foreground mb-4">Score Trend</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="pitch" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                      fontSize: 13,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* List */}
          <div className="flex flex-col gap-3">
            {entries.map((entry, idx) => (
              <motion.div
                key={idx}
                className="p-4 rounded-xl bg-card border border-border cursor-pointer hover:border-primary/30 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx }}
                onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-sans font-medium text-foreground">
                    Pitch #{entry.pitch_number}
                  </span>
                  <div className="flex items-center gap-3">
                    {entry.created_at && (
                      <span className="text-xs text-muted-foreground font-sans">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    )}
                    {entry.score !== null && (
                      <span className="text-sm font-sans font-bold text-primary">
                        {entry.score}/100
                      </span>
                    )}
                  </div>
                </div>
                {expandedIdx === idx && (
                  <motion.div
                    className="mt-3 pt-3 border-t border-border"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className="text-xs text-muted-foreground font-sans mb-2 italic">
                      "{entry.transcript}"
                    </p>
                    <p className="text-sm text-card-foreground font-sans leading-relaxed">
                      {entry.roast}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default History;
