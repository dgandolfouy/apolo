import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';
import { Icons } from '../ui/Icons';
import { getProjectProgress } from '../../utils/helpers';
import { PROJECT_THEMES, PROJECT_COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../ui/ConfirmModal';

export const ProjectsList: React.FC = () => {
    const ctx = useContext(AppContext);
    const { signOut } = useAuth();
    const [isEditingSubtitle, setIsEditingSubtitle] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; projectId: string | null }>({ isOpen: false, projectId: null });

    if (!ctx) return null;

    const handleLogout = async () => {
        try {
            ctx.logout(); // Clear local state immediately for UI feedback
            await signOut(); // Clear Supabase session
            window.location.reload(); // Force reload to clear any residual state/cache
        } catch (error) {
            console.error("Logout failed:", error);
            window.location.reload(); // Fallback
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        setConfirmDelete({ isOpen: true, projectId });
    };

    const confirmDeletion = () => {
        if (confirmDelete.projectId) {
            ctx.deleteProject(confirmDelete.projectId);
            setConfirmDelete({ isOpen: false, projectId: null });
        }
    };

    const filteredProjects = ctx.state.projects.filter(p =>
        p.title.toLowerCase().includes(ctx.searchQuery.toLowerCase()) ||
        p.subtitle?.toLowerCase().includes(ctx.searchQuery.toLowerCase())
    );

    return (
        <div className="container mx-auto px-6 py-8 max-w-7xl animate-fade-in text-gray-200">
            {/* Header / Dashboard Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h2 className="text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
                        Mis Proyectos
                        {ctx.isSyncing && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full animate-pulse border border-yellow-500/30">
                                ⏳ Guardando...
                            </span>
                        )}
                    </h2>
                    <p className="text-gray-400">Gestiona tus proyectos e ideas.</p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative group w-full md:w-64">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-indigo-400 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar proyectos..."
                            value={ctx.searchQuery}
                            onChange={(e) => ctx.setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                        />
                    </div>

                    {/* Features Toolbar */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                            onClick={ctx.openAIModal}
                            className={`p-2 rounded-full transition-all ${ctx.showAI ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                            title="Asistente IA"
                        >
                            <Icons.Bot size={20} />
                        </button>
                        <button
                            onClick={ctx.openStatsModal}
                            className={`p-2 rounded-full transition-all ${ctx.showStats ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                            title="Estadísticas"
                        >
                            <Icons.Chart size={20} />
                        </button>
                        <button
                            className="relative p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            title="Notificaciones"
                        >
                            <Icons.Bell size={20} />
                            {ctx.unreadCount > 0 && (
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#050505]"></span>
                            )}
                        </button>

                        <div className="w-px h-6 bg-white/10 mx-1"></div>

                        <div
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={ctx.openProfileModal}
                        >
                            {ctx.currentUser && <Avatar user={ctx.currentUser} size="w-6 h-6" />}
                        </div>
                        <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors" title="Cerrar Sesión">
                            <Icons.Close size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project, index) => {
                    const progress = getProjectProgress(project);
                    const theme = (project.color && PROJECT_COLORS[project.color as keyof typeof PROJECT_COLORS])
                        ? PROJECT_COLORS[project.color as keyof typeof PROJECT_COLORS]
                        : PROJECT_THEMES[index % PROJECT_THEMES.length];

                    return (
                        <div
                            key={project.id}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', project.id);
                                // Optional: set drag image or opacity
                            }}
                            onDragOver={(e) => {
                                e.preventDefault(); // Essential to allow dropping
                                e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const draggedId = e.dataTransfer.getData('text/plain');
                                if (draggedId && draggedId !== project.id) {
                                    ctx.moveProject(draggedId, project.id);
                                }
                            }}
                            onClick={() => ctx.setActiveProjectId(project.id)}
                            className={`group relative rounded-3xl cursor-grab active:cursor-grabbing transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden h-[260px] ${theme}`}
                        >
                            <div className="absolute inset-0 select-none">
                                {project.imageUrl ? (
                                    <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" />
                                ) : (
                                    <div className="w-full h-full opacity-60"></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none"></div>
                            </div>

                            <div className="absolute inset-0 p-6 flex flex-col justify-end select-none">
                                <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                                    {/* Future: Edit/Share buttons could go here */}
                                    <button
                                        onClick={(e) => handleDeleteClick(e, project.id)}
                                        className="p-2 bg-black/40 hover:bg-red-500/80 rounded-full text-white/70 hover:text-white backdrop-blur-md transition-all"
                                    >
                                        <Icons.Delete size={16} />
                                    </button>
                                </div>

                                <h3 className="text-2xl font-display font-bold text-white mb-1 shadow-black drop-shadow-md leading-tight line-clamp-2 overflow-hidden text-ellipsis pr-4 pointer-events-none">{project.title}</h3>
                                {isEditingSubtitle === project.id ? (
                                    <input
                                        type="text"
                                        defaultValue={project.subtitle}
                                        onBlur={(e) => {
                                            if (e.target.value !== project.subtitle) {
                                                ctx.updateProject(project.id, { subtitle: e.target.value });
                                            }
                                            setIsEditingSubtitle(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.currentTarget.blur();
                                            }
                                        }}
                                        autoFocus
                                        className="bg-transparent border-b border-white/20 text-white/70 text-sm font-medium tracking-wide mb-6 w-full focus:outline-none focus:border-indigo-500 pb-1"
                                    />
                                ) : (
                                    <p
                                        className="text-white/70 text-sm font-medium tracking-wide mb-6 pointer-events-auto line-clamp-3 overflow-hidden text-ellipsis cursor-pointer hover:text-white transition-colors"
                                        onClick={(e) => { e.stopPropagation(); setIsEditingSubtitle(project.id); }}
                                        title="Click para editar subtítulo"
                                    >
                                        {project.subtitle || "Sin descripción"}
                                    </p>
                                )}

                                <div className="flex items-end justify-between pointer-events-none">
                                    <div className="flex -space-x-2">
                                        {/* Profile Picture in Circle */}
                                        <div className="relative z-10">
                                            {(() => {
                                                const owner = ctx.users.find(u => u.id === project.createdBy)
                                                    || ctx.currentUser;
                                                const debugInfo = owner ? `Owner: ${owner.name}` : "Owner: Unknown";
                                                return (
                                                    <div title={debugInfo} className="contents">
                                                        <Avatar user={owner} size="w-8 h-8 border-2 border-[#1a1a1e]" />
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        {/* Placeholder for other members logic if needed later */}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-xl font-bold text-white tabular-nums">{progress}%</span>
                                    </div>
                                </div>
                                <div className="mt-4 w-full h-1.5 bg-white/20 rounded-full overflow-hidden pointer-events-none">
                                    <div className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                <button
                    onClick={() => ctx.requestInput("Nuevo Proyecto", (title) => ctx.addProject(title, "Nuevo proyecto"))}
                    className="group flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-300 h-[260px]"
                >
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all mb-4">
                        <Icons.Add size={32} />
                    </div>
                    <span className="text-gray-400 font-medium group-hover:text-indigo-300">Crear Nuevo Proyecto</span>
                </button>
            </div>

            {
                filteredProjects.length === 0 && ctx.state.projects.length > 0 && (
                    <div className="text-center py-20 opacity-50">
                        <Icons.Search size={48} className="mx-auto mb-4" />
                        <p>No se encontraron proyectos con "{ctx.searchQuery}"</p>
                    </div>
                )
            }

            {/* Footer */}
            <div className="mt-20 border-t border-white/5 pt-8 flex flex-col items-center justify-center text-center opacity-30 hover:opacity-100 transition-opacity duration-500">
                <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-medium mb-2">Apolo App</p>
                <p className="text-xs text-gray-500 mb-1">
                    &copy; {new Date().getFullYear()} Guten.uy. Todos los derechos reservados.
                </p>
                <p className="text-xs text-gray-500 mb-1">
                    v0.9.65 • Propiedad Intelectual Protegida
                </p>
            </div>

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onCancel={() => setConfirmDelete({ isOpen: false, projectId: null })}
                onConfirm={confirmDeletion}
                title="Eliminar Proyecto"
                message="¿Estás seguro de que deseas eliminar este proyecto y todas sus tareas? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    );
}
