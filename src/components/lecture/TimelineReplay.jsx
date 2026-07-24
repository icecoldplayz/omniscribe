import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, BookOpen, Lightbulb, AlertTriangle, HelpCircle, CheckCircle, Flag } from 'lucide-react';

const TYPE_ICONS = {
  introduction: BookOpen,
  concept: Lightbulb,
  example: Play,
  problem: Flag,
  mistake: AlertTriangle,
  quiz: HelpCircle,
  conclusion: CheckCircle,
};

const TYPE_COLORS = {
  introduction: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  concept: 'text-primary bg-primary/10 border-primary/20',
  example: 'text-accent bg-accent/10 border-accent/20',
  problem: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  mistake: 'text-red-400 bg-red-500/10 border-red-500/20',
  quiz: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  conclusion: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

export default function TimelineReplay({ lecture, concepts }) {
  const [selectedSegment, setSelectedSegment] = useState(null);
  const segments = lecture.timeline_segments || [];

  if (segments.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No timeline segments extracted.</p>
      </div>
    );
  }

  const segmentConcepts = (seg) => {
    if (!seg) return [];
    return concepts.filter(c => c.timestamp_start === seg.timestamp || c.name.toLowerCase().includes(seg.topic?.toLowerCase() || '___'));
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto p-6">
        <h3 className="text-lg font-semibold mb-1">Lecture Timeline</h3>
        <p className="text-sm text-muted-foreground mb-6">Click any segment to see concepts, transcript, and details</p>

        <div className="relative">
          <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-accent/30 to-transparent" />
          <div className="space-y-2">
            {segments.map((seg, i) => {
              const Icon = TYPE_ICONS[seg.type] || BookOpen;
              const colorClass = TYPE_COLORS[seg.type] || TYPE_COLORS.concept;
              const isSelected = selectedSegment?.timestamp === seg.timestamp;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedSegment(seg)}
                  className={`relative flex gap-4 p-3 rounded-xl cursor-pointer transition-all ml-7 ${
                    isSelected ? 'glass-strong glow-sm-primary' : 'hover:bg-secondary/40'
                  }`}
                >
                  <div className={`absolute -left-7 top-3 w-6 h-6 rounded-full flex items-center justify-center border ${colorClass}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-accent">{seg.timestamp}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colorClass} capitalize`}>{seg.type}</span>
                    </div>
                    <p className="text-sm font-medium">{seg.topic}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{seg.summary}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedSegment && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-96 glass-strong border-l border-border overflow-auto flex-shrink-0"
        >
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-accent" />
              <span className="font-mono text-sm text-accent">{selectedSegment.timestamp}</span>
            </div>
            <h4 className="text-lg font-bold mb-2">{selectedSegment.topic}</h4>
            <span className={`inline-block text-[10px] px-2 py-0.5 rounded border capitalize mb-4 ${TYPE_COLORS[selectedSegment.type] || TYPE_COLORS.concept}`}>
              {selectedSegment.type}
            </span>
            <p className="text-sm text-muted-foreground mb-6">{selectedSegment.summary}</p>

            <div className="space-y-3">
              <h5 className="text-xs text-muted-foreground tracking-widest uppercase">Related Concepts</h5>
              {segmentConcepts(selectedSegment).length > 0 ? (
                segmentConcepts(selectedSegment).map(c => (
                  <div key={c.id} className="glass rounded-lg p-3">
                    <p className="text-sm font-medium text-primary">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.definition}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No specific concepts mapped to this segment.</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}