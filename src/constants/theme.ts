export const TASK_THEMES = [
    { name: 'Indigo', border: 'border-indigo-500/30', bg: 'bg-indigo-500/5', hover: 'hover:border-indigo-500/50', text: 'text-indigo-400' },
    { name: 'Emerald', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', hover: 'hover:border-emerald-500/50', text: 'text-emerald-400' },
    { name: 'Rose', border: 'border-rose-500/30', bg: 'bg-rose-500/5', hover: 'hover:border-rose-500/50', text: 'text-rose-400' },
    { name: 'Amber', border: 'border-amber-500/30', bg: 'bg-amber-500/5', hover: 'hover:border-amber-500/50', text: 'text-amber-400' },
    { name: 'Cyan', border: 'border-cyan-500/30', bg: 'bg-cyan-500/5', hover: 'hover:border-cyan-500/50', text: 'text-cyan-400' },
];

export const PROJECT_COLORS = {
    indigo: "bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.1)]",
    emerald: "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.1)]",
    rose: "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.1)]",
    amber: "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.1)]",
    cyan: "bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.1)]",
    violet: "bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20 hover:border-violet-500/40 shadow-[0_0_30px_rgba(139,92,246,0.1)]",
    fuchsia: "bg-fuchsia-500/10 border-fuchsia-500/20 hover:bg-fuchsia-500/20 hover:border-fuchsia-500/40 shadow-[0_0_30px_rgba(217,70,239,0.1)]",
};

export const PROJECT_THEMES = Object.values(PROJECT_COLORS);

// SAFELIST FOR RECURSIVE TASKS (Forces Tailwind to generate these classes)
// Root: /10, Subtask: /5, Deep: /[0.02]
export const TAILWIND_SAFELIST = [
    // Indigo
    "bg-indigo-500/10", "bg-indigo-500/5", "bg-indigo-500/[0.02]",
    // Emerald
    "bg-emerald-500/10", "bg-emerald-500/5", "bg-emerald-500/[0.02]",
    // Rose
    "bg-rose-500/10", "bg-rose-500/5", "bg-rose-500/[0.02]",
    // Amber
    "bg-amber-500/10", "bg-amber-500/5", "bg-amber-500/[0.02]",
    // Cyan
    "bg-cyan-500/10", "bg-cyan-500/5", "bg-cyan-500/[0.02]",
];
