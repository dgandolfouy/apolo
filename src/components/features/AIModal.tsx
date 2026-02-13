import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Icons } from '../ui/Icons';
import { getStrategicAdvice } from '../../services/geminiService';

export const AIModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const ctx = useContext(AppContext);

    if (!ctx) return null;

    const activeProject = ctx.state.projects.find(p => p.id === ctx.activeProjectId);
    const contextStr = activeProject
        ? `Proyecto Activo: ${activeProject.title} (${activeProject.subtitle}). Tareas actuales: ${activeProject.tasks.map(t => t.title).join(', ')}.`
        : "Sin proyecto activo seleccionado en el dashboard.";

    const handleAsk = async () => {
        if (!query.trim()) return;
        setLoading(true);
        const res = await getStrategicAdvice(contextStr, query);
        setResponse(res);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#111115] border border-indigo-500/30 rounded-2xl w-full max-w-2xl p-6 shadow-2xl shadow-indigo-900/20 animate-slide-up flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-display font-normal text-white flex items-center gap-3 tracking-wide">
                        <Icons.Bot className="text-indigo-400" />
                        Consultor Estratégico
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400"><Icons.Close /></button>
                </div>

                <div className="flex-1 overflow-y-auto mb-6 pr-2">
                    {response ? (
                        <div className="prose prose-invert prose-sm max-w-none bg-white/5 p-4 rounded-xl border border-white/5">
                            {response.split('\n').map((line, i) => <p key={i} className="mb-2 last:mb-0">{line}</p>)}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Icons.Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>Modos: Inversor Escéptico, Analista Técnico (MSP/Niza) o Calculadora PYME.</p>
                            <p className="text-sm mt-2">"¿En qué proyecto trabajamos hoy: TAOASIS o GUTEN?"</p>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                        placeholder="Ej: ¿Cuál es el Landed Cost de este producto?"
                        className="w-full bg-black/30 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-white focus:outline-none focus:border-indigo-500/50"
                        disabled={loading}
                    />
                    <button
                        onClick={handleAsk}
                        disabled={loading || !query.trim()}
                        className="absolute right-2 top-2 p-2 bg-indigo-600 rounded-lg text-white disabled:opacity-50 hover:bg-indigo-500 transition-colors"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Icons.ArrowRight size={20} />}
                    </button>
                </div>
            </div>
        </div>
    )
}
