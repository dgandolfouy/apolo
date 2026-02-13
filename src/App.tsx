import React, { useContext, useState, useEffect } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import { IntroScreen } from './components/features/IntroScreen';
import { ProjectsList } from './components/features/ProjectsList';
import { ProjectView } from './components/features/ProjectView';
import { InputModal } from './components/ui/InputModal';
import { AIModal } from './components/features/AIModal';
import { StatsModal } from './components/features/StatsModal';
import { ProfileModal } from './components/features/ProfileModal';
import { TaskDetailModal } from './components/features/TaskDetailModal';
import { findTask } from './utils/helpers';
import { SplashScreen } from './components/features/SplashScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StyleForce } from './components/debug/StyleForce';

const AppContent: React.FC = () => {
    const ctx = useContext(AppContext);
    const { user, loading } = useAuth();

    useEffect(() => {
        if (user && ctx) {
            // Fix: Only update if user ID changed (e.g. login/logout)
            // This prevents overwriting optimistic updates (name/avatar changes)
            if (ctx.currentUser?.id !== user.id) {
                ctx.setCurrentUser({
                    id: user.id,
                    email: user.email, // Fix: Pass email for legacy user persistence
                    name: user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0] || 'Usuario',
                    avatarUrl: user.user_metadata.avatar_url || user.user_metadata.picture,
                    avatarColor: 'bg-indigo-500'
                });
            }
        } else if (!user && ctx && !loading) {
            // If logged out, clear
            if (ctx.currentUser) ctx.setCurrentUser(null);
        }
    }, [user, loading, ctx]);

    const [isLongLoading, setIsLongLoading] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (loading) {
            timer = setTimeout(() => setIsLongLoading(true), 6000); // 6s threshold
        }
        return () => clearTimeout(timer);
    }, [loading]);

    if (loading) {
        if (isLongLoading) {
            return (
                <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                    <div className="text-red-400 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h2 className="text-xl font-bold text-white">Tiempo de espera excedido</h2>
                    </div>
                    <p className="text-gray-400 max-w-md mb-6">
                        La conexión con la base de datos está tardando demasiado. Esto suele ocurrir si las políticas de seguridad (RLS) están bloqueando el acceso.
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                            Reintentar
                        </button>
                        <button
                            onClick={async () => {
                                localStorage.clear();
                                sessionStorage.clear();
                                window.location.href = '/';
                            }}
                            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            Cerrar Sesión (Reset)
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!ctx?.currentUser) {
        return <IntroScreen />;
    }

    // Resolve active task for modal
    const activeTask = ctx.activeTask && ctx.activeProjectId && ctx.state.projects.find(p => p.id === ctx.activeProjectId)
        ? findTask(ctx.state.projects.find(p => p.id === ctx.activeProjectId)!.tasks, ctx.activeTask.id)
        : null;

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-indigo-500/30">
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '5s' }}></div>
            </div>
            <main className="relative z-10">
                {ctx.activeProjectId ? <ProjectView /> : <ProjectsList />}
                <StyleForce />
            </main>

            {ctx.modalConfig && (
                <InputModal
                    title={ctx.modalConfig.title}
                    onClose={() => ctx.setModalConfig(null)}
                    onSubmit={(val) => { ctx.modalConfig!.callback(val); ctx.setModalConfig(null); }}
                />
            )}

            {ctx.showAI && <AIModal onClose={() => ctx.setShowAI(false)} />}
            {ctx.showStats && <StatsModal onClose={() => ctx.setShowStats(false)} />}
            {ctx.showProfile && <ProfileModal onClose={() => ctx.setShowProfile(false)} />}

            {activeTask && (
                <TaskDetailModal task={activeTask} onClose={() => ctx.setActiveTask(null)} />
            )}
        </div>
    );
};

const App: React.FC = () => {
    // Check if we are returning from an OAuth redirect or have a session
    const isAuthCallback = window.location.hash.includes('access_token') ||
        window.location.hash.includes('type=recovery') ||
        window.location.search.includes('code');

    const [showSplash, setShowSplash] = useState(!isAuthCallback);

    return (
        <AuthProvider>
            <AppProvider>
                {showSplash ? (
                    <SplashScreen onComplete={() => setShowSplash(false)} />
                ) : (
                    <AppContent />
                )}
            </AppProvider>
        </AuthProvider>
    );
};

export default App;
