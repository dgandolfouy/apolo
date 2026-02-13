import React from 'react';
import { Icons } from './Icons';

export const ProgressRing: React.FC<{ progress: number; size?: number; stroke?: number; colorClass?: string }> = ({ progress, size = 32, stroke = 4, colorClass = 'text-primary' }) => {
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90 w-full h-full">
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={stroke} fill="transparent" className="text-white/10" />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke="currentColor" strokeWidth={stroke} fill="transparent"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    className={`transition-all duration-500 ease-out ${progress === 100 ? 'text-green-400' : colorClass}`}
                    strokeLinecap="round"
                />
            </svg>
            {progress > 0 && progress < 100 && (
                <span className="absolute text-[10px] font-bold text-white">{progress}</span>
            )}
            {progress === 100 && <Icons.Check size={size / 1.5} className="absolute text-green-400" />}
        </div>
    );
};
