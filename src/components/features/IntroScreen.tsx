import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icons } from '../ui/Icons';

export const IntroScreen: React.FC = () => {
    const { signInWithGoogle, loading } = useAuth();

    return (
        <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center p-4">
            <div className="text-center mb-16 animate-fade-in">
                {/* Minimalist Title */}
                <h1 className="text-5xl md:text-7xl font-display font-bold text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    APOLO
                </h1>
                <p className="text-gray-500 mt-4 font-sans font-light tracking-[0.4em] text-[10px] md:text-xs">
                    SISTEMA OPERATIVO v0.9.65
                </p>
            </div>

            <div className="flex flex-col gap-5 w-full max-w-[300px] animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <button
                    onClick={signInWithGoogle}
                    disabled={loading}
                    className="group relative flex items-center justify-center gap-4 px-8 py-4 rounded-full bg-transparent border border-white/20 hover:bg-white/5 hover:border-white/40 transition-all duration-300 hover:scale-105"
                >
                    <Icons.Google className="w-5 h-5 text-white" />
                    <span className="text-white/80 font-medium group-hover:text-white tracking-wide text-sm">Continuar con Google</span>
                </button>

                <button
                    disabled={true}
                    className="group relative flex items-center justify-center gap-4 px-8 py-4 rounded-full bg-transparent border border-white/10 opacity-40 cursor-not-allowed"
                >
                    <Icons.Apple className="w-5 h-5 text-white" />
                    <span className="text-white/80 font-medium tracking-wide text-sm">Continuar con Apple</span>
                </button>
            </div>

            <div className="mt-20 opacity-0 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <p className="text-gray-700 text-[10px] tracking-widest uppercase">
                    Designed by Daniel Gandolfo
                </p>
            </div>
        </div>
    )
}
