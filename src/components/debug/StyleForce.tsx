import React from 'react';

// This component forces the Tailwind CDN to generate specific classes 
// that are used dynamically in the codebase (e.g. recursive opacity).
// It is hidden from view but visible to the CDN scanner.

export const StyleForce: React.FC = () => {
    return (
        <div className="hidden pointer-events-none fixed opacity-0 w-0 h-0 overflow-hidden">
            {/* Background Opacities for Recursive Tasks */}
            {/* Indigo */}
            <div className="bg-indigo-500/10 bg-indigo-500/5 bg-indigo-500/[0.02]"></div>
            <div className="border-indigo-500/30 border-indigo-500/20 border-indigo-500/10"></div>
            <div className="text-indigo-400"></div>

            {/* Emerald */}
            <div className="bg-emerald-500/10 bg-emerald-500/5 bg-emerald-500/[0.02]"></div>
            <div className="border-emerald-500/30 border-emerald-500/20 border-emerald-500/10"></div>
            <div className="text-emerald-400"></div>

            {/* Rose */}
            <div className="bg-rose-500/10 bg-rose-500/5 bg-rose-500/[0.02]"></div>
            <div className="border-rose-500/30 border-rose-500/20 border-rose-500/10"></div>
            <div className="text-rose-400"></div>

            {/* Amber */}
            <div className="bg-amber-500/10 bg-amber-500/5 bg-amber-500/[0.02]"></div>
            <div className="border-amber-500/30 border-amber-500/20 border-amber-500/10"></div>
            <div className="text-amber-400"></div>

            {/* Cyan */}
            <div className="bg-cyan-500/10 bg-cyan-500/5 bg-cyan-500/[0.02]"></div>
            <div className="border-cyan-500/30 border-cyan-500/20 border-cyan-500/10"></div>
            <div className="text-cyan-400"></div>

            {/* Tooltip & Layout Helpers */}
            <div className="contents"></div>
        </div>
    );
};
