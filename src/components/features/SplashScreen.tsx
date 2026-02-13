import React, { useEffect, useState } from 'react';
import { Icons } from '../ui/Icons';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        // Sequence:
        // 0s: Start
        // 0-2s: Rocket rising (parallax stars)
        // 2s: Fade out splash, show login/app
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(onComplete, 500); // Wait for exit animation
        }, 2200);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className={`fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

            {/* Stars Background - Parallax Effect */}
            <div className="absolute inset-0 z-0">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full opacity-0 animate-star-fall"
                        style={{
                            width: Math.random() * 2 + 1 + 'px',
                            height: Math.random() * 2 + 1 + 'px',
                            left: Math.random() * 100 + '%',
                            top: -10 + '%',
                            animationDuration: (Math.random() * 1 + 0.5) + 's',
                            animationDelay: (Math.random() * 2) + 's',
                            animationIterationCount: 'infinite'
                        }}
                    ></div>
                ))}
            </div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Rocket Container */}
                <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8 animate-rocket-shake flex items-center justify-center">
                    {/* Rocket Icon (Vector) */}
                    <div className="p-10 rounded-full border-4 border-white/10 shadow-[0_0_50px_rgba(99,102,241,0.3)] animate-pulse-slow bg-black relative z-10 transition-transform duration-1000 ease-in-out scale-100 animate-pulse">
                        <Icons.Rocket size={100} className="text-white fill-white/10 -rotate-45" strokeWidth={1.5} />
                    </div>

                    {/* Thrust Effect */}
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-6 h-24 bg-gradient-to-t from-transparent via-orange-500 to-yellow-300 blur-md animate-thrust z-0"></div>
                </div>

                <h1 className="text-4xl md:text-6xl font-display font-medium text-white mb-3 tracking-widest animate-cinematic bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-500">
                    APOLO
                </h1>
                <p className="text-gray-400 text-[10px] md:text-xs tracking-[0.3em] font-light opacity-80 animate-fade-in-delayed">
                    App de Productividad
                </p>
            </div>

            <style>{`
        @keyframes star-fall {
            0% { transform: translateY(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes rocket-shake {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(1px) rotate(1deg); }
            75% { transform: translateY(-1px) rotate(-1deg); }
        }
        @keyframes thrust {
            0%, 100% { height: 40px; opacity: 0.8; }
            50% { height: 60px; opacity: 1; }
        }
        @keyframes pulse-slow {
            0%, 100% { box-shadow: 0 0 50px rgba(99,102,241,0.3); }
            50% { box-shadow: 0 0 80px rgba(99,102,241,0.6); }
        }
        @keyframes cinematic {
            0% { letter-spacing: 0.5em; opacity: 0; transform: scale(0.9); filter: blur(4px); }
            100% { letter-spacing: 0.2em; opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes fade-in-delayed {
            0% { opacity: 0; }
            80% { opacity: 0; }
            100% { opacity: 1; }
        }
        .animate-star-fall { animation-name: star-fall; animation-timing-function: linear; }
        .animate-rocket-shake { animation: rocket-shake 0.1s infinite; }
        .animate-thrust { animation: thrust 0.1s infinite; }
        .animate-pulse-slow { animation: pulse-slow 2s infinite; }
        .animate-cinematic { animation: cinematic 2s ease-out forwards; }
        .animate-fade-in-delayed { animation: fade-in-delayed 2s forwards; }
      `}</style>
        </div>
    );
};
