import React, { useState, useRef, useEffect } from 'react';

export const InputModal: React.FC<{ title: string; onClose: () => void; onSubmit: (val: string) => void }> = ({ title, onClose, onSubmit }) => {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (value.trim()) {
            onSubmit(value);
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-display font-normal text-white mb-4 tracking-wide">{title}</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Escribe aquí..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 mb-6"
                    />
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors">Cancelar</button>
                        <button type="submit" disabled={!value.trim()} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
