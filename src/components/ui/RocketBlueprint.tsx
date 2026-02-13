import React, { useEffect, useState } from 'react';

export const RocketBlueprint: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
    const [drawDone, setDrawDone] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDrawDone(true);
            if (onComplete) onComplete();
        }, 2500); // Animation duration
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <svg
                width="120"
                height="120"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-all duration-1000 ${drawDone ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : ''}`}
            >
                {/* Rocket Path */}
                <path
                    d="M12 2.5C12 2.5 15.5 8 15.5 13C15.5 16.5 13.5 18.5 12 21.5C10.5 18.5 8.5 16.5 8.5 13C8.5 8 12 2.5 12 2.5Z"
                    stroke="white"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-draw-path"
                />
                <path
                    d="M12 10C12 10 12 8 12 8"
                    stroke="white"
                    strokeWidth="1"
                    className="animate-draw-path-delayed-1"
                />
                <path
                    d="M12 13C13.1046 13 14 12.1046 14 11C14 9.89543 13.1046 9 12 9C10.8954 9 10 9.89543 10 11C10 12.1046 10.8954 13 12 13Z"
                    stroke="white"
                    strokeWidth="1"
                    className="animate-draw-path-delayed-1"
                />
                <path
                    d="M8.5 16C7 17.5 5 18 5 18C5 18 6 15 8.5 13"
                    stroke="white"
                    strokeWidth="1"
                    className="animate-draw-path-delayed-2"
                />
                <path
                    d="M15.5 16C17 17.5 19 18 19 18C19 18 18 15 15.5 13"
                    stroke="white"
                    strokeWidth="1"
                    className="animate-draw-path-delayed-2"
                />
                <path
                    d="M12 21.5V23"
                    stroke="white"
                    strokeWidth="1"
                    className="animate-draw-path-delayed-3"
                />
            </svg>
            <style>{`
                .animate-draw-path {
                    stroke-dasharray: 100;
                    stroke-dashoffset: 100;
                    animation: dash 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                .animate-draw-path-delayed-1 {
                    stroke-dasharray: 50;
                    stroke-dashoffset: 50;
                    animation: dash 2s cubic-bezier(0.4, 0, 0.2, 1) 0.5s forwards;
                    opacity: 0;
                }
                 .animate-draw-path-delayed-2 {
                    stroke-dasharray: 50;
                    stroke-dashoffset: 50;
                    animation: dash 2s cubic-bezier(0.4, 0, 0.2, 1) 1s forwards;
                    opacity: 0;
                }
                 .animate-draw-path-delayed-3 {
                    stroke-dasharray: 20;
                    stroke-dashoffset: 20;
                    animation: dash 1s cubic-bezier(0.4, 0, 0.2, 1) 1.5s forwards;
                    opacity: 0;
                }

                @keyframes dash {
                    to {
                        stroke-dashoffset: 0;
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};
