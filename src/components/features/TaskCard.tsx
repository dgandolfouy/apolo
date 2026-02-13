
import React, { useContext, useState, memo } from 'react';
import { Task, TaskStatus } from '../../types';
import { AppContext } from '../../context/AppContext';
import { Icons } from '../ui/Icons';
import { Avatar } from '../ui/Avatar';
import { ProgressRing } from '../ui/ProgressRing';
import { getTaskProgress } from '../../utils/helpers';
import { TASK_THEMES } from '../../constants/theme';

export const TaskCard: React.FC<{ task: Task; depth: number; themeIndex?: number }> = memo(({ task, depth, themeIndex }) => {
    const ctx = useContext(AppContext);
    const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);

    // Deterministic Theme
    const deterministicIndex = React.useMemo(() => {
        if (themeIndex !== undefined) return themeIndex;
        return Math.abs(task.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % TASK_THEMES.length;
    }, [task.id, themeIndex]);

    const effectiveThemeIndex = React.useMemo(() => {
        if (depth === 0) return deterministicIndex;
        if (depth === 1) {
            // Level 1 Subtasks: Shift color by 1 from parent to ensure distinction
            // We use the parent's passed themeIndex (if available) and add 1
            if (themeIndex !== undefined) {
                return (themeIndex + 2) % TASK_THEMES.length;
            }
            // Fallback if no theme passed (shouldn't happen in tree)
            return (deterministicIndex + 2) % TASK_THEMES.length;
        }
        // Level 2+ Subtasks: Inherit the SAME theme as their Level 1 parent
        return themeIndex ?? deterministicIndex;
    }, [depth, task.id, themeIndex, deterministicIndex]);

    const theme = TASK_THEMES[effectiveThemeIndex];

    if (!ctx) return null;

    const isDragging = ctx.draggedTaskId === task.id;
    const progress = getTaskProgress(task);
    const isLeaf = task.subtasks.length === 0;
    const hasAttachments = task.attachments.length > 0;
    const hasComments = task.activity.length > 1;
    const hasSubtasks = task.subtasks.length > 0;

    const owner = ctx.users.find(u => u.id === task.createdBy) || (task.createdBy === ctx.currentUser?.id ? ctx.currentUser : undefined);

    let opacityValue;
    if (depth === 0) opacityValue = 25;
    else if (depth === 1) opacityValue = 40; // Slightly more opaque to stand out against parent
    else opacityValue = Math.max(10, 40 - ((depth - 1) * 5)); // Fade out slightly as we go deeper

    const colorBasename = theme.name.toLowerCase();

    // Fix: If dragging, use a ghost style but KEEP the structure so onDragEnd fires correctly
    const bgClass = isDragging
        ? `bg-${colorBasename}-500/5 border-dashed border-${colorBasename}-500/30`
        : `bg-${colorBasename}-500/${opacityValue === 5 ? '5' : opacityValue}`;

    const borderClass = isDragging
        ? ''
        : (depth === 0 ? theme.border : `border-${colorBasename}-500/10`);

    const dotColorClass = `bg-${colorBasename}-500`;

    const cardStyle = `${bgClass} ${borderClass} ${!isDragging && `hover:bg-${colorBasename}-500/${opacityValue + 5}`} transition-all`;

    const typeLabel = depth === 0 ? "Tarea" : "Subtarea";

    const getDropPositionFromEvent = (e: React.DragEvent): 'before' | 'after' | 'inside' => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const x = e.clientX - rect.left;
        const isTop = y < rect.height / 2;

        if (x > 60 && y > 10 && y < rect.height - 10) return 'inside';
        if (isTop) return 'before';
        return 'after';
    };

    const handleDragStart = (e: React.DragEvent) => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        // Delay to allow browser to snapshot element
        setTimeout(() => {
            ctx.setDraggedTaskId(task.id);
        }, 10);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.stopPropagation();
        ctx.setDraggedTaskId(null);
        setDropPosition(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDragging) return;
        e.dataTransfer.dropEffect = 'move';

        const pos = getDropPositionFromEvent(e);
        if (pos !== dropPosition) setDropPosition(pos);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.stopPropagation();
        setDropPosition(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId && draggedId !== task.id) {
            const pos = getDropPositionFromEvent(e);
            ctx.moveTask(draggedId, task.id, pos);
        }
        setDropPosition(null);
    };

    return (
        <div
            className={`relative group transition-all duration-300 ${depth > 0 ? 'ml-8 pl-4 py-2 border-l-2' : 'mb-4'} ${depth > 0 ? theme.border.replace('/30', '/10') : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onClick={() => ctx.openTaskDetail(task)}
                className={`
                    relative p-4 rounded-xl border backdrop-blur-md cursor-pointer transition-all duration-300 group-hover:scale-[1.01] 
                    outline-none focus:outline-none focus:ring-0 tap-highlight-transparent flex gap-4
                    ${cardStyle}
                    ${task.status === TaskStatus.COMPLETED ? 'opacity-60 grayscale-[0.5]' : ''}
                    ${isDragging ? 'opacity-50 scale-95' : ''} 
                `}
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                {/* Content Container - Flex row to accommodate Right Side Progress */}
                <div className="flex-1 min-w-0">

                    {/* Visual Indicators & Toggle */}
                    {hasSubtasks && (
                        <div
                            className="absolute -top-[1px] -right-[1px] z-20 cursor-pointer p-2 hover:scale-110 transition-transform"
                            onClick={(e) => {
                                e.stopPropagation();
                                ctx.toggleExpand(task.id);
                            }}
                            title={task.expanded ? "Contraer" : "Expandir"}
                        >
                            <div
                                className="absolute top-0 right-0 w-0 h-0 border-l-[24px] border-l-transparent border-t-[24px] pointer-events-none"
                                style={{ borderTopColor: 'currentColor', opacity: 0.1 }}
                            />
                            <Icons.Triangle
                                size={12}
                                className={`fill-current text-white transition-transform duration-300 ${task.expanded ? 'rotate-180' : 'rotate-90'}`}
                            />
                        </div>
                    )}

                    {/* Drop Indicators */}
                    {!isDragging && dropPosition === 'before' && <div className="absolute -top-2 left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-50 rounded-full pointer-events-none"></div>}
                    {!isDragging && dropPosition === 'after' && <div className="absolute -bottom-2 left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-50 rounded-full pointer-events-none"></div>}
                    {!isDragging && dropPosition === 'inside' && <div className="absolute inset-0 border-2 border-indigo-500 rounded-xl pointer-events-none bg-indigo-500/10 z-50 animate-pulse"></div>}

                    <div className="flex items-start gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); ctx.toggleTaskStatus(task.id); }}
                            className={`mt-1 min-w-[20px] h-5 rounded-full border-2 flex items-center justify-center transition-all ${task.status === TaskStatus.COMPLETED
                                ? 'bg-indigo-500 border-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                                : `border-white/20 hover:border-indigo-400`
                                }`}
                        >
                            {task.status === TaskStatus.COMPLETED && <Icons.Check size={12} strokeWidth={3} />}
                        </button>

                        <div className="flex-1 min-w-0">
                            {/* Header / Top Row */}
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[9px] uppercase tracking-widest font-bold opacity-50 ${theme.text}`}>
                                    {typeLabel}
                                </span>
                                {task.tags.map(tag => (
                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <h4 className={`text-sm font-medium truncate pr-6 ${task.status === TaskStatus.COMPLETED ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                {task.title}
                            </h4>

                            {task.description && (
                                <p className="text-xs text-gray-500 line-clamp-2 mb-3 mt-1 font-medium leading-relaxed">{task.description}</p>
                            )}

                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-3">
                                    {hasAttachments && <Icons.Link size={12} className="text-gray-500" />}
                                    {hasComments && (
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                            <span>Activo</span>
                                        </div>
                                    )}

                                    {/* Add Subtask Button (Restored) */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            ctx.addTask(task.id, "Nueva Subtarea");
                                            if (!task.expanded) ctx.toggleExpand(task.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded text-gray-400 hover:text-white"
                                        title="Agregar Subtarea"
                                    >
                                        <Icons.Add size={10} /> Subtarea
                                    </button>
                                </div>

                                {owner && owner.name && (
                                    <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                        POR: {owner.name.split(' ')[0]}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Progress Indicator (Redesigned) */}
                {!isLeaf && (
                    <div className="flex flex-col items-center justify-center pl-4 border-l border-white/5 gap-1 min-w-[60px]">
                        <ProgressRing size={36} stroke={3} progress={progress} />
                        <span className="text-[10px] font-bold text-gray-400">{Math.round(progress)}%</span>
                    </div>
                )}
                {/* Dot Indicator for Leaf Tasks (moved here to align with progress ring layout) */}
                {isLeaf && !hasSubtasks && (
                    <div className="flex items-center justify-center pl-4 border-l border-white/5 min-w-[60px]">
                        <div
                            className={`w-2 h-2 rounded-full ${dotColorClass} shadow-[0_0_8px_rgba(255,255,255,0.3)] opacity-50`}
                        />
                    </div>
                )}

            </div>

            {/* Recursive Subtasks*/}
            {task.expanded && hasSubtasks && (
                <div className="mt-4 space-y-3 pl-4 border-l-2 border-white/5">
                    {task.subtasks.map(subtask => (
                        <TaskCard
                            key={subtask.id}
                            task={subtask}
                            depth={depth + 1}
                            themeIndex={effectiveThemeIndex}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}); // Wrapped in memo for performance
