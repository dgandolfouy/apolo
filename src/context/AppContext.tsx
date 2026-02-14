import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppState, User, Task, Project, ActivityLog, Attachment, TaskStatus, USERS } from '../types';
import { generateId, findTaskAndAddSubtask, findTaskAndUpdate, findTaskAndDelete, getRandomColor } from '../utils/helpers';
import { supabase } from '../lib/supabase';

interface AppContextType {
    state: AppState;
    currentUser: User | null;
    users: User[];
    activeProjectId: string | null;
    draggedTaskId: string | null;
    setDraggedTaskId: (id: string | null) => void;
    setActiveProjectId: (id: string | null) => void;
    addProject: (title: string, subtitle: string) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    moveProject: (draggedId: string, targetId: string) => void;
    deleteProject: (id: string) => void;
    updateCurrentUser: (updates: Partial<User>) => void;
    logout: () => void;
    toggleTaskStatus: (taskId: string) => void;
    addTask: (parentId: string | null, title: string) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    moveTask: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
    addActivity: (taskId: string, content: string, type: ActivityLog['type']) => void;
    updateActivity: (taskId: string, logId: string, newContent: string) => void;
    deleteActivity: (taskId: string, logId: string) => void;
    addAttachment: (taskId: string, type: Attachment['type'], name: string, url: string) => void;
    deleteAttachment: (taskId: string, attachmentId: string) => void;
    toggleExpand: (taskId: string) => void;
    openTaskDetail: (task: Task) => void;
    activeTask: Task | null;
    setActiveTask: (task: Task | null) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    requestInput: (title: string, callback: (val: string) => void) => void;
    modalConfig: { title: string, callback: (val: string) => void } | null;
    setModalConfig: (config: { title: string, callback: (val: string) => void } | null) => void;
    openAIModal: () => void;
    showAI: boolean;
    setShowAI: (show: boolean) => void;
    openStatsModal: () => void;
    showStats: boolean;
    setShowStats: (show: boolean) => void;
    openProfileModal: () => void;
    showProfile: boolean;
    setShowProfile: (show: boolean) => void;
    setCurrentUser: (user: User | null) => void;
    notifications: any[];
    markNotificationRead: (id: string) => void;
    unreadCount: number;
    isSyncing: boolean;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initial State
    const [state, setState] = useState<AppState>({ projects: [] });
    const [users, setUsers] = useState<User[]>(USERS);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [modalConfig, setModalConfig] = useState<{ title: string, callback: (val: string) => void } | null>(null);

    // UI State
    const [showAI, setShowAI] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        let isMounted = true;

        const initData = async () => {
            if (!currentUser?.id) return;

            try {
                // 1. Fetch Notifications
                if (isMounted) {
                    const { data } = await supabase.from('notifications')
                        .select('*')
                        .eq('user_id', currentUser.id)
                        .order('created_at', { ascending: false })
                        .limit(20);
                    if (data && isMounted) setNotifications(data);
                }
            } catch (e) {
                console.error("Error fetching notifications:", e);
            }
        };

        initData();

        // 2. Realtime Subscription (Only if user exists)
        let channel: any = null;
        if (currentUser?.id) {
            channel = supabase
                .channel('notifications')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
                    payload => {
                        if (isMounted) setNotifications(prev => [payload.new, ...prev]);
                    })
                .subscribe();
        }

        return () => {
            isMounted = false;
            if (channel) supabase.removeChannel(channel);
        };
    }, [currentUser?.id]);

    const markNotificationRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // --- Helpers ---
    const requestInput = useCallback((title: string, callback: (val: string) => void) => { setModalConfig({ title, callback }); }, []);

    const modifyActiveProject = useCallback((updater: (p: Project) => Project) => {
        if (!activeProjectId) return;
        setState(prev => ({ projects: prev.projects.map(p => p.id === activeProjectId ? updater(p) : p) }));
    }, [activeProjectId]);

    // --- Data Fetching ---
    const fetchUserData = useCallback(async () => {
        if (!currentUser) return;

        console.log("AppContext: fetchUserData started for", currentUser.id);
        setIsLoading(true);
        try {
            // 1. Fetch Owned Projects
            const { data: ownedProjects, error: ownedError } = await supabase
                .from('projects')
                .select('*')
                .eq('owner_id', currentUser.id)
                .order('position', { ascending: true, nullsFirst: false })
                .order('created_at', { ascending: false });

            if (ownedError) throw ownedError;

            // 2. Fetch Shared Projects (Graceful fallback)
            let sharedProjects: any[] = [];
            try {
                const { data: sharedIds } = await supabase
                    .from('project_members')
                    .select('project_id')
                    .eq('user_id', currentUser.id);

                if (sharedIds && sharedIds.length > 0) {
                    const ids = sharedIds.map((item: any) => item.project_id);
                    const { data: sharedData } = await supabase
                        .from('projects')
                        .select('*')
                        .in('id', ids)
                        .order('position', { ascending: true });
                    if (sharedData) sharedProjects = sharedData;
                }
            } catch (err) {
                console.warn("Shared projects fetch warning:", err);
            }

            // Merge and Sort
            let allProjectsRaw = [...(ownedProjects || []), ...sharedProjects];
            allProjectsRaw = Array.from(new Map(allProjectsRaw.map(p => [p.id, p])).values());

            allProjectsRaw.sort((a, b) => {
                const posA = a.position !== null ? a.position : 0;
                const posB = b.position !== null ? b.position : 0;
                if (posA !== posB) return posA - posB;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            // 3. Fetch Tasks
            const projectIds = allProjectsRaw.map(p => p.id);
            let tasksData: any[] = [];

            if (projectIds.length > 0) {
                const { data: tasks } = await supabase
                    .from('tasks')
                    .select('*')
                    .in('project_id', projectIds)
                    .order('position', { ascending: true });
                if (tasks) tasksData = tasks;
            }

            // 4. Process Data
            const projects: Project[] = allProjectsRaw.map((p: any) => {
                const rawTasks = tasksData.filter((t: any) => t.project_id === p.id);
                
                const taskMap = new Map();
                const rootTasks: Task[] = [];

                rawTasks.forEach((t: any) => {
                    taskMap.set(t.id, {
                        ...t,
                        createdBy: t.owner_id, // Usamos owner_id como creador
                        createdAt: new Date(t.created_at).getTime(),
                        subtasks: [],
                        attachments: t.attachments || [],
                        activity: t.activity || [],
                        tags: t.tags || [],
                        expanded: t.expanded ?? true
                    });
                });

                rawTasks.forEach((t: any) => {
                    const task = taskMap.get(t.id);
                    if (t.parent_id && taskMap.has(t.parent_id)) {
                        taskMap.get(t.parent_id).subtasks.push(task);
                    } else {
                        rootTasks.push(task);
                    }
                });

                return {
                    id: p.id,
                    title: p.title,
                    subtitle: p.subtitle,
                    color: p.color,
                    createdBy: p.owner_id,
                    createdAt: new Date(p.created_at).getTime(),
                    imageUrl: p.image_url,
                    position: p.position,
                    tasks: rootTasks
                };
            });

            setState({ projects });

            // 5. Fetch All Users (for Avatars)
            const { data: allUsers } = await (supabase as any).from('profiles').select('*');
            if (allUsers) {
                const mappedUsers = allUsers.map((u: any) => ({
                    id: u.id,
                    name: u.full_name || u.email,
                    email: u.email,
                    avatarUrl: u.avatar_url,
                    avatarColor: `bg-${getRandomColor()}-500`
                }));
                setUsers(mappedUsers);

                const myProfile = mappedUsers.find((u: any) => u.id === currentUser.id);
                if (myProfile) {
                    setCurrentUser(prev => prev ? { ...prev, name: myProfile.name, avatarUrl: myProfile.avatarUrl } : prev);
                }
            }

            // Handle Invites
            const urlParams = new URLSearchParams(window.location.search);
            const inviteProjectId = urlParams.get('invite');
            if (inviteProjectId && !projects.some(p => p.id === inviteProjectId)) {
                await joinProject(inviteProjectId);
            }

        } catch (error: any) {
            console.error("Critical Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.id]);

    const joinProject = async (projectId: string) => {
        if (!currentUser) return;
        try {
            const { error } = await supabase.from('project_members').insert({
                project_id: projectId,
                user_id: currentUser.id,
                role: 'editor'
            });

            if (error) {
                if (error.code === '23505') {
                    console.log("Already a member");
                } else {
                    throw error;
                }
            } else {
                alert("¡Te has unido al proyecto exitosamente!");
                fetchUserData();
            }
        } catch (e) {
            console.error("Error joining project:", e);
            alert("Error al unirse al proyecto. Verifica el enlace.");
        }
    };

    // --- Effect: Load Data ---
    useEffect(() => {
        if (currentUser) {
            fetchUserData();
        } else {
            setState({ projects: [] });
            setActiveProjectId(null);
        }
    }, [currentUser?.id]);

    // --- CRUD Operations ---

    const addProject = useCallback(async (title: string, subtitle: string) => {
        if (!currentUser) return;
        setIsSyncing(true);
        const tempId = generateId();
        const color = getRandomColor();
        const position = Date.now() / 1000;

        const newProject: Project = {
            id: tempId, title, subtitle, createdAt: Date.now(), createdBy: currentUser.id, tasks: [], color,
            position
        };

        // Optimistic Update
        setState(prev => ({ projects: [newProject, ...prev.projects] }));

        try {
            const { data, error } = await supabase.from('projects').insert({
                owner_id: currentUser.id, 
                title, 
                subtitle, 
                color, 
                position
            }).select().single();

            if (error) throw error;

            if (data) {
                setState(prev => ({
                    projects: prev.projects.map(p => p.id === tempId ? { ...p, id: data.id } : p)
                }));
            }
        } catch (e: any) {
            console.error("Error adding project:", e);
            alert(`Error al crear proyecto: ${e.message || "Verifica tu conexión"}`);
        } finally {
            setIsSyncing(false);
        }
    }, [currentUser]);

    const deleteProject = useCallback(async (id: string) => {
        setIsSyncing(true);
        const originalProjects = state.projects;

        setState(prev => ({ projects: prev.projects.filter(p => p.id !== id) }));
        if (activeProjectId === id) setActiveProjectId(null);

        try {
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if (error) throw error;
        } catch (e: any) {
            console.error("Error deleting project:", e);
            setState({ projects: originalProjects });
            alert(`Error al borrar: ${e.message}. Verifica permisos.`);
        } finally {
            setIsSyncing(false);
        }
    }, [activeProjectId, state.projects]);

    const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
        setState(prev => ({ projects: prev.projects.map(p => p.id === id ? { ...p, ...updates } : p) }));
        
        const dbUpdates: any = {};
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.subtitle) dbUpdates.subtitle = updates.subtitle;
        if (updates.color) dbUpdates.color = updates.color;
        if (updates.imageUrl) dbUpdates.image_url = updates.imageUrl;
        if (updates.position !== undefined) dbUpdates.position = updates.position;

        if (Object.keys(dbUpdates).length > 0) {
            await supabase.from('projects').update(dbUpdates).eq('id', id);
        }
    }, []);

    const moveProject = useCallback(async (draggedId: string, targetId: string) => {
        if (draggedId === targetId) return;

        const currentProjects = [...state.projects];
        const draggedIndex = currentProjects.findIndex(p => p.id === draggedId);
        const targetIndex = currentProjects.findIndex(p => p.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [draggedProject] = currentProjects.splice(draggedIndex, 1);
        currentProjects.splice(targetIndex, 0, draggedProject);

        const prevProject = targetIndex > 0 ? currentProjects[targetIndex - 1] : null;
        const nextProject = targetIndex < currentProjects.length - 1 ? currentProjects[targetIndex + 1] : null;

        let newPosition = 0;
        if (!prevProject) {
            newPosition = (nextProject?.position || Date.now() / 1000) - 1000;
        } else if (!nextProject) {
            newPosition = (prevProject.position || 0) + 1000;
        } else {
            newPosition = ((prevProject.position || 0) + (nextProject.position || 0)) / 2;
        }

        draggedProject.position = newPosition;
        setState({ projects: currentProjects });

        try {
            await supabase.from('projects').update({ position: newPosition }).eq('id', draggedId);
        } catch (e) {
            console.error("Error moving project:", e);
        }
    }, [state.projects]);

    // TASKS
    const addTask = useCallback(async (parentId: string | null, title: string) => {
        if (!currentUser || !activeProjectId) return;
        const currentTasks = state.projects.find(p => p.id === activeProjectId)?.tasks || [];
        const maxPos = currentTasks.reduce((max, t) => Math.max(max, t.position || 0), 0);

        const tempTaskId = generateId();

        const newTask: Task = {
            id: tempTaskId, title, status: TaskStatus.PENDING, attachments: [], tags: [], subtasks: [], expanded: true, createdBy: currentUser.id,
            activity: [],
            position: maxPos + 1000
        };

        modifyActiveProject(p => {
            if (!parentId) return { ...p, tasks: [...p.tasks, newTask] };
            return { ...p, tasks: findTaskAndAddSubtask(p.tasks, parentId, newTask) };
        });

        // Database
        try {
            const { data, error } = await supabase.from('tasks').insert({
                project_id: activeProjectId,
                parent_id: parentId,
                title,
                status: 'pending',
                // created_by REMOVIDO para evitar el error de columna inexistente
                owner_id: currentUser.id, 
                position: maxPos + 1000
            }).select().single();

            if (error) throw error;

            if (data) {
                 fetchUserData();
            }
        } catch (e: any) { 
            console.error("Error adding task:", e);
            alert(`Error al guardar tarea: ${e.message}`);
        }

    }, [currentUser, activeProjectId, modifyActiveProject, fetchUserData]);

    const deleteTask = useCallback(async (taskId: string) => {
        modifyActiveProject(p => ({ ...p, tasks: findTaskAndDelete(p.tasks, taskId) }));
        await supabase.from('tasks').delete().eq('id', taskId);
    }, [modifyActiveProject]);

    const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
        modifyActiveProject(p => ({ ...p, tasks: findTaskAndUpdate(p.tasks, taskId, t => ({ ...t, ...updates })) }));

        const dbUpdates: any = {};
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.status) dbUpdates.status = updates.status === TaskStatus.COMPLETED ? 'completed' : 'pending';
        if (updates.expanded !== undefined) dbUpdates.expanded = updates.expanded;

        if (Object.keys(dbUpdates).length > 0) {
            await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
        }
    }, [modifyActiveProject]);

    const toggleTaskStatus = useCallback((taskId: string) => {
        if (!activeProjectId) return;
        const project = state.projects.find(p => p.id === activeProjectId);
        if (!project) return;

        const findStatus = (tasks: Task[]): TaskStatus | null => {
            for (const t of tasks) {
                if (t.id === taskId) return t.status;
                const s = findStatus(t.subtasks);
                if (s) return s;
            }
            return null;
        };
        const current = findStatus(project.tasks);
        if (current) {
            updateTask(taskId, { status: current === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED });
        }
    }, [activeProjectId, state.projects, updateTask]);

    // --- MOVE TASK (Drag & Drop) ---
    const moveTask = useCallback(async (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
        if (!activeProjectId) return;
        const project = state.projects.find(p => p.id === activeProjectId);
        if (!project) return;

        let draggedTask: Task | null = null;
        let newParentId: string | null = null;
        let newPosition: number = 0;

        const newStateProjects = state.projects.map(p => {
            if (p.id !== activeProjectId) return p;
            const clonedTasks = JSON.parse(JSON.stringify(p.tasks));

            const removeTask = (list: Task[]): boolean => {
                const idx = list.findIndex(t => t.id === draggedId);
                if (idx !== -1) {
                    draggedTask = list[idx];
                    list.splice(idx, 1);
                    return true;
                }
                return list.some(t => removeTask(t.subtasks));
            };

            const insertTask = (list: Task[], parent: string | null = null): boolean => {
                const idx = list.findIndex(t => t.id === targetId);
                if (idx !== -1) {
                    if (position === 'inside') {
                        const firstChild = list[idx].subtasks[0];
                        newPosition = firstChild ? (firstChild.position || 0) / 2 : 1000;
                        list[idx].subtasks.unshift(draggedTask!);
                        list[idx].expanded = true;
                        newParentId = targetId;
                    } else {
                        const insertIdx = position === 'before' ? idx : idx + 1;
                        const prevItem = list[insertIdx - 1];
                        const nextItem = list[insertIdx]; 
                        const prevPos = prevItem ? (prevItem.position || 0) : 0;
                        const nextPos = nextItem ? (nextItem.position || 0) : (prevPos + 2000); 
                        newPosition = (prevPos + nextPos) / 2;
                        if (newPosition === prevPos || newPosition === nextPos) {
                            newPosition = prevPos + 0.001;
                        }
                        list.splice(insertIdx, 0, draggedTask!);
                        newParentId = parent;
                    }
                    return true;
                }
                return list.some(t => insertTask(t.subtasks, t.id));
            };

            removeTask(clonedTasks);
            if (draggedTask) {
                insertTask(clonedTasks);
                draggedTask.position = newPosition;
            }
            return { ...p, tasks: clonedTasks };
        });

        setState({ projects: newStateProjects });
        setDraggedTaskId(null);

        if (draggedTask) {
            const updates: any = {};
            if (newParentId !== undefined) updates.parent_id = newParentId;
            if (newPosition !== undefined) updates.position = newPosition;
            await supabase.from('tasks').update(updates).eq('id', draggedId);
        }
    }, [activeProjectId, state.projects]);

    // --- ATTACHMENTS & ACTIVITY ---
    const addActivity = useCallback(async (taskId: string, content: string, type: ActivityLog['type']) => {
        if (!currentUser || !activeProjectId) return;

        const newLog: ActivityLog = {
            id: generateId(),
            type,
            content,
            timestamp: Date.now(),
            createdBy: currentUser.id
        };

        modifyActiveProject(p => ({
            ...p,
            tasks: findTaskAndUpdate(p.tasks, taskId, t => ({
                ...t,
                activity: [...t.activity, newLog]
            }))
        }));

        const { data } = await supabase.from('tasks').select('activity').eq('id', taskId).single();
        if (data) {
            const current = data.activity || [];
            await supabase.from('tasks').update({ activity: [...current, newLog] }).eq('id', taskId);
        }
    }, [currentUser, activeProjectId, modifyActiveProject]);

    const updateActivity = useCallback(async (taskId: string, logId: string, newContent: string) => {
        if (!activeProjectId) return;
        modifyActiveProject(p => ({
            ...p,
            tasks: findTaskAndUpdate(p.tasks, taskId, t => ({
                ...t,
                activity: t.activity.map(a => a.id === logId ? { ...a, content: newContent } : a)
            }))
        }));
        const { data } = await supabase.from('tasks').select('activity').eq('id', taskId).single();
        if (data) {
            const current = data.activity || [];
            const updated = current.map((a: ActivityLog) => a.id === logId ? { ...a, content: newContent } : a);
            await supabase.from('tasks').update({ activity: updated }).eq('id', taskId);
        }
    }, [activeProjectId, modifyActiveProject]);

    const deleteActivity = useCallback(async (taskId: string, logId: string) => {
        if (!activeProjectId) return;
        modifyActiveProject(p => ({
            ...p,
            tasks: findTaskAndUpdate(p.tasks, taskId, t => ({
                ...t,
                activity: t.activity.filter(a => a.id !== logId)
            }))
        }));
        const { data } = await supabase.from('tasks').select('activity').eq('id', taskId).single();
        if (data) {
            const current = data.activity || [];
            const updated = current.filter((a: ActivityLog) => a.id !== logId);
            await supabase.from('tasks').update({ activity: updated }).eq('id', taskId);
        }
    }, [activeProjectId, modifyActiveProject]);

    const addAttachment = useCallback(async (taskId: string, type: Attachment['type'], name: string, url: string) => {
        if (!currentUser || !activeProjectId) return;
        const newAtt: Attachment = {
            id: generateId(),
            name,
            type,
            url,
            createdAt: Date.now(),
            createdBy: currentUser.id
        };
        modifyActiveProject(p => ({
            ...p,
            tasks: findTaskAndUpdate(p.tasks, taskId, t => ({
                ...t,
                attachments: [...t.attachments, newAtt]
            }))
        }));
        const { data } = await supabase.from('tasks').select('attachments').eq('id', taskId).single();
        if (data) {
            const current = data.attachments || [];
            await supabase.from('tasks').update({ attachments: [...current, newAtt] }).eq('id', taskId);
        }
    }, [currentUser, activeProjectId, modifyActiveProject]);

    const deleteAttachment = useCallback(async (taskId: string, attachmentId: string) => {
        if (!activeProjectId) return;
        modifyActiveProject(p => ({
            ...p,
            tasks: findTaskAndUpdate(p.tasks, taskId, t => ({
                ...t,
                attachments: t.attachments.filter(a => a.id !== attachmentId)
            }))
        }));
        const { data } = await supabase.from('tasks').select('attachments').eq('id', taskId).single();
        if (data) {
            const current = data.attachments || [];
            const updated = current.filter((a: Attachment) => a.id !== attachmentId);
            await supabase.from('tasks').update({ attachments: updated }).eq('id', taskId);
        }
    }, [activeProjectId, modifyActiveProject]);

    const toggleExpand = useCallback((taskId: string) => {
        modifyActiveProject(p => ({
            ...p,
            tasks: findTaskAndUpdate(p.tasks, taskId, t => ({ ...t, expanded: !t.expanded }))
        }));
    }, [modifyActiveProject]);

    const updateCurrentUser = useCallback(async (updates: Partial<User>) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...updates };
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

        try {
            const payload = {
                id: currentUser.id,
                email: currentUser.email,
                full_name: updates.name || currentUser.name,
                avatar_url: updates.avatarUrl || currentUser.avatarUrl,
                updated_at: new Date().toISOString()
            };
            const { error, data } = await (supabase as any).from('profiles').upsert(payload).select();
            if (error) throw error;
        } catch (e: any) {
            console.error("Error updating user:", e);
            alert(`Error: ${e.message}`);
        }
    }, [currentUser]);

    return (
        <AppContext.Provider value={{
            state, currentUser, users, activeProjectId, setActiveProjectId,
            addProject, updateProject, deleteProject, moveProject,
            addTask, updateTask, deleteTask, toggleTaskStatus,
            moveTask, addActivity, updateActivity, deleteActivity, addAttachment, deleteAttachment, toggleExpand,
            draggedTaskId, setDraggedTaskId,
            openTaskDetail: setActiveTask, activeTask, setActiveTask,
            searchQuery, setSearchQuery,
            requestInput, modalConfig, setModalConfig,
            openAIModal: () => setShowAI(true), showAI, setShowAI,
            openStatsModal: () => setShowStats(true), showStats, setShowStats,
            openProfileModal: () => setShowProfile(true), showProfile, setShowProfile,
            updateCurrentUser,
            logout: () => { setCurrentUser(null); setState({ projects: [] }); },
            setCurrentUser,
            notifications,
            markNotificationRead,
            unreadCount,
            isSyncing
        }}>
            {children}
        </AppContext.Provider>
    );
};