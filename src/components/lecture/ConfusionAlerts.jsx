import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ArrowRight, GitCompare } from 'lucide-react';

export default function ConfusionAlerts({ lecture }) {
  const [selected, setSelected] = useState(null);
  const alerts = lecture.confusion_alerts || [];

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <GitCompare className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
        <p className="text-muted-foreground">No confusion points detected in this lecture.</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold">Confusion Detection</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">The AI detected concepts that students commonly confuse. Review these comparisons to avoid mistakes.</p>

      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass rounded-xl p-5 border-l-2 border-amber-500/50 cursor-pointer hover:bg-secondary/30 transition-all"
            onClick={() => setSelected(alert)}
          >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {alert.concepts && alert.concepts.map((concept, j) => (
                <React.Fragment key={j}>
                  {j > 0 && <ArrowRight className="w-3.5 h-3.5 text-amber-400" />}
                  <span className="text-sm font-semibold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {concept}
                  </span>
                </React.Fragment>
              ))}
              {alert.timestamp && (
                <span className="text-xs font-mono text-muted-foreground ml-auto">{alert.timestamp}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{alert.explanation}</p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-strong rounded-2xl max-w-lg w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold">Concept Comparison</h3>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {selected.concepts && selected.concepts.map((concept, j) => (
                  <React.Fragment key={j}>
                    {j > 0 && <ArrowRight className="w-4 h-4 text-amber-400" />}
                    <span className="text-base font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {concept}
                    </span>
                  </React.Fragment>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{selected.explanation}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}