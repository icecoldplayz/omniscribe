import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, AlertTriangle, Globe, ListTree, Clock } from 'lucide-react';

const MASTERY_COLORS = {
  mastered: '#10B981',
  partial: '#F59E0B',
  weak: '#EF4444',
  unknown: '#64748B',
};

export default function ConceptDetail({ concept, onClose }) {
  if (!concept) return null;

  const masteryColor = MASTERY_COLORS[concept.mastery_level] || MASTERY_COLORS.unknown;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 350, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 350, opacity: 0 }}
        className="w-80 glass-strong border-l border-border overflow-auto flex-shrink-0"
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: masteryColor, boxShadow: `0 0 6px ${masteryColor}` }} />
                <span className="text-xs font-medium" style={{ color: masteryColor }}>
                  {concept.mastery_level}
                </span>
              </div>
              <h3 className="text-lg font-bold">{concept.name}</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {concept.importance && (
            <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 mb-4">
              {concept.importance} importance
            </span>
          )}

          {concept.definition && (
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <h4 className="text-xs text-muted-foreground tracking-widest uppercase">Definition</h4>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{concept.definition}</p>
            </div>
          )}

          {(concept.timestamp_start || concept.timestamp_end) && (
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <h4 className="text-xs text-muted-foreground tracking-widest uppercase">Timeline</h4>
              </div>
              <p className="text-sm font-mono text-accent">
                {concept.timestamp_start || '--:--'} {concept.timestamp_end ? `— ${concept.timestamp_end}` : ''}
              </p>
            </div>
          )}

          {concept.confusion_risk && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <h4 className="text-xs text-red-400 tracking-widest uppercase">Confusion Risk</h4>
              </div>
              <p className="text-sm text-muted-foreground">{concept.confusion_reason}</p>
              {concept.commonly_confused_with && (
                <p className="text-sm text-red-400 mt-2">
                  Often confused with: <span className="font-semibold">{concept.commonly_confused_with}</span>
                </p>
              )}
            </div>
          )}

          {concept.real_world_applications && concept.real_world_applications.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <h4 className="text-xs text-muted-foreground tracking-widest uppercase">Why Learn This?</h4>
              </div>
              <div className="space-y-1.5">
                {concept.real_world_applications.map((app, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-emerald-400 mt-0.5">▸</span>
                    {app}
                  </div>
                ))}
              </div>
            </div>
          )}

          {concept.prerequisites && concept.prerequisites.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <ListTree className="w-3.5 h-3.5 text-accent" />
                <h4 className="text-xs text-muted-foreground tracking-widest uppercase">Prerequisites</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {concept.prerequisites.map((pre, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-lg bg-accent/10 text-accent border border-accent/20">
                    {pre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}