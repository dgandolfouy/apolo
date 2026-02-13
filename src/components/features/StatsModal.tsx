import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Icons } from '../ui/Icons';
import { Task, TaskStatus } from '../../types';

export const StatsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const ctx = useContext(AppContext);
    if (!ctx) return null;

    const totalProjects = ctx.state.projects.length;
    let totalTasks = 0;
    let completedTasks = 0;

    ctx.state.projects.forEach(p => {
        const countTasks = (tasks: Task[]) => {
            tasks.forEach(t => {
                totalTasks++;
                if (t.status === TaskStatus.COMPLETED) completedTasks++;
                countTasks(t.subtasks);
            });
        };
        countTasks(p.tasks);
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#111115] border border-emerald-500/30 rounded-2xl w-full max-w-lg p-8 shadow-2xl shadow-emerald-900/20 animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-display font-normal text-white flex items-center gap-3 tracking-wide">
                        <Icons.Chart className="text-emerald-400" />
                        Estadísticas Globales
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400"><Icons.Close /></button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                        <span className="text-4xl font-display font-bold text-white mb-2">{totalProjects}</span>
                        <span className="text-xs text-gray-400 uppercase tracking-widest">Proyectos</span>
                    </div>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                        <span className="text-4xl font-display font-bold text-emerald-400 mb-2">{completionRate}%</span>
                        <span className="text-xs text-gray-400 uppercase tracking-widest">Progreso Total</span>
                    </div>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center col-span-2">
                        <div className="flex justify-between w-full mb-2 text-sm text-gray-300">
                            <span>Tareas Completadas</span>
                            <span className="font-mono">{completedTasks}/{totalTasks}</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
