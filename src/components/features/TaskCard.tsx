import React, { useContext, useState, useMemo } from 'react';
import { Task, TaskStatus } from '../../types';
import { AppContext } from '../../context/AppContext';
// CORRECCIÓN: Usamos '../' porque 'ui' está hermano de 'features' dentro de 'components'
import { Icons } from '../ui/Icons'; 
import { ProgressRing } from '../ui/ProgressRing';
import { getTaskProgress } from '../../utils/helpers';
import { TASK_THEMES } from '../../constants/theme';

interface TaskCardProps { task: Task; depth: number; themeIndex?: number }

// Memoized to prevent recursive render loops
export const TaskCard: React.FC<TaskCardProps> = React.memo(({ task, depth, themeIndex }) => {
    const ctx = useContext(AppContext);
    const [isInside, setIsInside] = useState(false); // For drag UX
    const [isAdding, setIsAdding] = useState(false); // For subtask input

    // --- 1. LÓGICA DE COLORES ---
    const effectiveThemeIndex = React.useMemo(() => {
        if (themeIndex !== undefined) return themeIndex;
        return Math.abs(task.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % TASK_THEMES.length;
    }, [task.id, themeIndex]);

    const theme = TASK_THEMES[effectiveThemeIndex] || TASK_THEMES[0];

    // --- 2. LOGICA DRAG & DROP ---
    const handleDragStart = (e: React.DragEvent) => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        ctx?.setDraggedTaskId(task.id);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsInside(false);
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId !== task.id) {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            if (y < 10) ctx?.moveTask(draggedId, task.id, 'before');
            else if (y > rect.height - 10) ctx?.moveTask(draggedId, task.id, 'after');
            else ctx?.moveTask(draggedId, task.id, 'inside');
        }
        ctx?.setDraggedTaskId(null);
    };

    // --- 3. RENDERIZADO ---
    const progress = getTaskProgress(task);
    const isCompleted = task.status === TaskStatus.COMPLETED;

    return (
        <div 
            draggable 
            onDragStart={handleDragStart}
            onDragOver={(e) => { e.preventDefault(); setIsInside(true); }}
            onDragLeave={() => setIsInside(false)}
            onDrop={handleDrop}
            className={`
                relative p-4 rounded-xl border-l-4 transition-all duration-300 mb-3
                ${isCompleted ? 'bg-gray-900/30 opacity-60' : 'bg-[#1a1a1a]'}
                ${isInside ? 'ring-2 ring-indigo-500' : ''}
                hover:translate-y-[-2px] hover:shadow-lg
            `}
            style={{ 
                borderLeftColor: theme.color,
                marginLeft: `${depth * 1.5}rem` 
            }}
        >
            {/* Header de la Tarjeta */}
            <div className="flex items-start gap-3">
                
                {/* Checkbox Circular */}
                <button 
                    onClick={(e) => { e.stopPropagation(); ctx?.toggleTaskStatus(task.id); }}
                    className={`
                        mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                        ${isCompleted ? `bg-${theme.color} border-transparent` : 'border-gray-600 hover:border-white'}
                    `}
                >
                    {isCompleted && <Icons.Check size={14} className="text-black" />}
                </button>

                {/* Contenido Principal */}
                <div className="flex-1 min-w-0" onClick={() => ctx?.openTaskDetail(task)}>
                    <div className="flex justify-between items-start">
                        {/* Titulo */}
                        <h4 className={`text-base font-medium truncate pr-4 ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                            {task.title}
                        </h4>
                    </div>

                    {/* Descripción Corta */}
                    {task.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                    )}

                    {/* Footer de la tarjeta */}
                    <div className="flex items-center gap-4 mt-3">
                        {/* Botón Expandir/Colapsar */}
                        {task.subtasks.length > 0 && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); ctx?.toggleExpand(task.id); }}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-white/5"
                            >
                                {task.expanded ? <Icons.ChevronUp size={12}/> : <Icons.ChevronDown size={12}/>}
                                <span>{task.subtasks.length} sub</span>
                            </button>
                        )}
                        
                        {/* Adjuntos */}
                        {task.attachments?.length > 0 && (
                            <div className="flex items-center gap-1 text-gray-500">
                                <Icons.Paperclip size={12} />
                                <span className="text-xs">{task.attachments.length}</span>
                            </div>
                        )}

                        {/* Barra de Progreso */}
                        {task.subtasks.length > 0 && (
                            <div className="flex items-center gap-2 ml-auto">
                                <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="text-[10px] text-gray-400">{Math.round(progress)}%</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SECCIÓN SUBTAREAS */}
            {task.expanded && (
                <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                    {task.subtasks.map((sub, idx) => (
                        <TaskCard 
                            key={sub.id} 
                            task={sub} 
                            depth={depth + 1} 
                            themeIndex={effectiveThemeIndex + 1}
                        />
                    ))}

                    {/* BOTÓN AGREGAR SUBTAREA CORREGIDO */}
                    {!isAdding ? (
                        <button 
                            onClick={() => setIsAdding(true)}
                            className="
                                flex items-center gap-2 text-sm text-gray-400 
                                hover:text-indigo-400 hover:bg-white/5 
                                w-full py-2 px-3 rounded-lg transition-colors
                                ml-2 border border-dashed border-gray-700
                            "
                        >
                            <Icons.Plus size={16} />
                            <span>Añadir subtarea</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 ml-2 animate-fade-in">
                            <input 
                                autoFocus
                                type="text"
                                placeholder="Escribe y presiona Enter..."
                                className="flex-1 bg-black/40 border border-indigo-500/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        ctx?.addTask(task.id, e.currentTarget.value);
                                        e.currentTarget.value = '';
                                    }
                                    if (e.key === 'Escape') setIsAdding(false);
                                }}
                                onBlur={() => setIsAdding(false)}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
