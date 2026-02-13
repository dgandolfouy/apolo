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
    moveProject: (draggedId: string, targetId: string) => void; // New
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
    }, [currentUser?.id]); // Stable dependency to prevent loop

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
                .order('position', { ascending: true, nullsFirst: false }) // RESTORED v8
                .order('created_at', { ascending: false });

            if (ownedError) throw ownedError;

            // 2. Fetch Shared Projects (Graceful fallback)
            let sharedProjects: any[] = [];
            try {
                // ... (Shared logic remains similar, but simplified if needed)
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
                        .order('position', { ascending: true }); // RESTORED v8
                    if (sharedData) sharedProjects = sharedData;
                }
            } catch (err) {
                console.warn("Shared projects fetch warning:", err);
            }

            // Merge and Sort
            let allProjectsRaw = [...(ownedProjects || []), ...sharedProjects];
            // Deduplicate just in case
            allProjectsRaw = Array.from(new Map(allProjectsRaw.map(p => [p.id, p])).values());

            // Sort by position (if available) or fallback to created_at
            allProjectsRaw.sort((a, b) => { // RESTORED v8 Logic
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
                // ... (Tree building remains same)
                const taskMap = new Map();
                const rootTasks: Task[] = [];

                rawTasks.forEach((t: any) => {
                    taskMap.set(t.id, {
                        ...t,
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
                    imageUrl: p.image_url, // MAP IMAGE URL HERE
                    position: p.position,   // MAP POSITION HERE
                    tasks: rootTasks
                };
            });

            setState({ projects });

            // 5. Fetch All Users (for Avatars)
            // 5. Fetch All Users (for Avatars) - FROM PROFILES (Where Google data lives)
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

                // Fix: Sync currentUser with Source of Truth (Database), overriding stale Auth Metadata
                const myProfile = mappedUsers.find((u: any) => u.id === currentUser.id);
                if (myProfile) {
                    // Only update if different to avoid loop? setUsers/setCurrentUser might trigger re-renders.
                    // But we need to ensure the view is correct.
                    // We merge with existing currentUser to keep ID/Email if missing in profile (unlikely now)
                    setCurrentUser(prev => prev ? { ...prev, name: myProfile.name, avatarUrl: myProfile.avatarUrl } : prev);
                }
            }

            // ... (Handle Invites)
            const urlParams = new URLSearchParams(window.location.search);
            const inviteProjectId = urlParams.get('invite');
            if (inviteProjectId && !projects.some(p => p.id === inviteProjectId)) {
                await joinProject(inviteProjectId);
            }

        } catch (error: any) {
            console.error("Critical Error fetching data:", error);
            // alert("Error de conexión..."); // Suppress alert for better UX if needed, or keep
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
                if (error.code === '23505') { // Unique violation
                    console.log("Already a member");
                } else {
                    throw error;
                }
            } else {
                alert("¡Te has unido al proyecto exitosamente!");
                fetchUserData(); // Refresh to show new project
            }
        } catch (e) {
            console.error("Error joining project:", e);
            alert("Error al unirse al proyecto. Verifica el enlace.");
        }
    };

    // --- Welcome Project Logic (Replaces Trigger) ---
    const createWelcomeProject = async () => {
        if (!currentUser) return;
        try {
            const { data: newProject, error } = await supabase.from('projects').insert({
                owner_id: currentUser.id,
                title: 'Proyecto de Ejemplo',
                subtitle: '¡Bienvenido a Apolo!',
                color: 'indigo',
                position: 1 // V7: Added position
            }).select().single();

            if (error || !newProject) throw error;

            await supabase.from('tasks').insert([
                { project_id: newProject.id, title: 'Explorar Apolo', status: 'pending', position: 1 },
                { project_id: newProject.id, title: 'Personalizar mi Perfil', status: 'pending', position: 2 },
            ]);

            // Refetch to populate UI
            fetchUserData();
        } catch (e) {
            console.error("Error creating welcome project:", e);
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
    }, [currentUser?.id]); // Stable dependency

    // --- CRUD Operations ---

    const addProject = useCallback(async (title: string, subtitle: string) => {
        if (!currentUser) return;
        setIsSyncing(true);
        const tempId = generateId();
        const color = getRandomColor();
        // Default position: End of list (roughly)
        const position = Date.now() / 1000;

        const newProject: Project = {
            id: tempId, title, subtitle, createdAt: Date.now(), createdBy: currentUser.id, tasks: [], color,
            position
        };

        // Optimistic
        setState(prev => ({ projects: [newProject, ...prev.projects] })); // Add to top for UI feedback? Or bottom?
        // Actually, if we sort by position asc, new ones with high position go to bottom.
        // Let's stick to user expectation: New projects usually appear at top or bottom?
        // If sorting by position ASC, larger number = bottom.
        // If we want new projects at TOP, give them smaller position.
        // Let's set position to -Date.now() if we want top? 
        // Or just let user manage it. Default behavior for now: Bottom.

        try {
            const { data, error } = await supabase.from('projects').insert({
                owner_id: currentUser.id, title, subtitle, color, position // RESTORED v8
            }).select().single();

            if (error) throw error; // Explicit throw

            if (data) {
                setState(prev => ({
                    projects: prev.projects.map(p => p.id === tempId ? { ...p, id: data.id } : p)
                }));
            }
        } catch (e: any) {
            console.error("Error adding project:", e);
            alert(`Error guardando proyecto: ${e.message}. Asegúrate de ejecutar el script SQL v8.`);
        } finally {
            setIsSyncing(false);
        }
    }, [currentUser]);

    const deleteProject = useCallback(async (id: string) => {
        setIsSyncing(true);
        const originalProjects = state.projects; // Backup for rollback

        // Optimistic
        setState(prev => ({ projects: prev.projects.filter(p => p.id !== id) }));
        if (activeProjectId === id) setActiveProjectId(null);

        try {
            // Database
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if (error) throw error;
        } catch (e: any) {
            console.error("Error deleting project:", e);
            // Rollback
            setState({ projects: originalProjects });
            alert(`Error al borrar: ${e.message || "Error desconocido"}. Verifica tu conexión o permisos.`);
        } finally {
            setIsSyncing(false);
        }
    }, [activeProjectId, state.projects]);

    const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
        setState(prev => ({ projects: prev.projects.map(p => p.id === id ? { ...p, ...updates } : p) }));
        // DB map
        const dbUpdates: any = {};
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.subtitle) dbUpdates.subtitle = updates.subtitle;
        if (updates.color) dbUpdates.color = updates.color;
        if (updates.imageUrl) dbUpdates.image_url = updates.imageUrl; // RESTORED v8
        if (updates.position !== undefined) dbUpdates.position = updates.position; // RESTORED v8

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

        // 1. Reorder Array Locally
        const [draggedProject] = currentProjects.splice(draggedIndex, 1);
        currentProjects.splice(targetIndex, 0, draggedProject);

        // 2. Calculate New Position
        // We need to find the neighbors of the new position to calculate the midpoint.
        // After splicing, the project is at `targetIndex`.
        const prevProject = targetIndex > 0 ? currentProjects[targetIndex - 1] : null;
        const nextProject = targetIndex < currentProjects.length - 1 ? currentProjects[targetIndex + 1] : null;

        let newPosition = 0;
        if (!prevProject) {
            // Moved to top: smaller than first
            newPosition = (nextProject?.position || Date.now() / 1000) - 1000;
        } else if (!nextProject) {
            // Moved to bottom: larger than last
            newPosition = (prevProject.position || 0) + 1000;
        } else {
            // In between
            newPosition = ((prevProject.position || 0) + (nextProject.position || 0)) / 2;
        }

        // Update local state immediately (UI feels fast)
        // We only update the dragged project's position in memory for sorting?
        // Actually, since we map projects, we should update the valid object.
        draggedProject.position = newPosition; // Direct mutation for local state consistency
        setState({ projects: currentProjects });

        // 3. Persist to DB
        try {
            await supabase.from('projects').update({ position: newPosition }).eq('id', draggedId);
        } catch (e) {
            console.error("Error moving project:", e);
            // Revert state? For now, we assume success or user reloads.
        }
    }, [state.projects]);

    // TASKS
    const addTask = useCallback(async (parentId: string | null, title: string) => {
        if (!currentUser || !activeProjectId) return;
        const tempId = generateId();
        const newTask: Task = {
            id: tempId, title, status: TaskStatus.PENDING, attachments: [], tags: [], subtasks: [], expanded: true, createdBy: currentUser.id,
            activity: []
        };

        modifyActiveProject(p => {
            if (!parentId) return { ...p, tasks: [...p.tasks, newTask] };
            return { ...p, tasks: findTaskAndAddSubtask(p.tasks, parentId, newTask) };
        });

        // Database
        try {
            const { data } = await supabase.from('tasks').insert({
                project_id: activeProjectId,
                parent_id: parentId,
                title,
                status: 'pending'
            }).select().single();

            if (data) {
                // We rely on refresh or just assume success. 
                // Updating ID locally is hard in deep tree without full refresh.
                // For Stability: trigger silent background refresh
                fetchUserData();
            }
        } catch (e) { console.error(e); }

    }, [currentUser, activeProjectId, modifyActiveProject, fetchUserData]);

    const deleteTask = useCallback(async (taskId: string) => {
        modifyActiveProject(p => ({ ...p, tasks: findTaskAndDelete(p.tasks, taskId) }));
        await supabase.from('tasks').delete().eq('id', taskId);
    }, [modifyActiveProject]);

    const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
        modifyActiveProject(p => ({ ...p, tasks: findTaskAndUpdate(p.tasks, taskId, t => ({ ...t, ...updates })) }));

        const dbUpdates: any = {};
        if (updates.title) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description; // Added v10
        if (updates.status) dbUpdates.status = updates.status === TaskStatus.COMPLETED ? 'completed' : 'pending';
        if (updates.expanded !== undefined) dbUpdates.expanded = updates.expanded;

        if (Object.keys(dbUpdates).length > 0) {
            await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
        }
    }, [modifyActiveProject]);

    const toggleTaskStatus = useCallback((taskId: string) => {
        if (!activeProjectId) return;
        // Find task to toggle
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

        // 1. Optimistic Update
        let draggedTask: Task | null = null;
        let newParentId: string | null = null;
        let newPosition: number = 0;

        const newStateProjects = state.projects.map(p => {
            if (p.id !== activeProjectId) return p;

            // Deep clone to avoid mutation issues
            const clonedTasks = JSON.parse(JSON.stringify(p.tasks));

            // Helper to find and remove
            const removeTask = (list: Task[]): boolean => {
                const idx = list.findIndex(t => t.id === draggedId);
                if (idx !== -1) {
                    draggedTask = list[idx];
                    list.splice(idx, 1);
                    return true;
                }
                return list.some(t => removeTask(t.subtasks));
            };

            // Helper to find target and insert
            const insertTask = (list: Task[], parent: string | null = null): boolean => {
                const idx = list.findIndex(t => t.id === targetId);
                if (idx !== -1) {
                    if (position === 'inside') {
                        // Insert as first subtask
                        // Position logic for 'inside':
                        // If list is empty, use default (e.g. 1000).
                        // If not empty, take first item's position / 2?
                        // For simplicity, we just put it at 0 index locally.
                        const firstChild = list[idx].subtasks[0];
                        newPosition = firstChild ? (firstChild.position || 0) / 2 : 1000;

                        list[idx].subtasks.unshift(draggedTask!);
                        list[idx].expanded = true;
                        newParentId = targetId;
                    } else {
                        const insertIdx = position === 'before' ? idx : idx + 1;

                        // Calculate Position Logic v0.9.64
                        const prevItem = list[insertIdx - 1];
                        const nextItem = list[insertIdx]; //Item at insertIdx is the one that will be shifted right, or null if end

                        const prevPos = prevItem ? (prevItem.position || 0) : 0;
                        const nextPos = nextItem ? (nextItem.position || 0) : (prevPos + 2000); // If no next, add buffer

                        // New Position is average
                        newPosition = (prevPos + nextPos) / 2;

                        // Safety check for collision (if precision loss makes them equal)
                        if (newPosition === prevPos || newPosition === nextPos) {
                            newPosition = prevPos + 0.001; // Tiny offset fallback
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
                // Update local task object with new position
                draggedTask.position = newPosition;
            }

            return { ...p, tasks: clonedTasks };
        });

        setState({ projects: newStateProjects });

        // Fix v0.9.64: Immediate State Cleanup to remove "Moving..." placeholder
        setDraggedTaskId(null);

        // 2. Database Update
        if (draggedTask) {
            const updates: any = {};
            if (newParentId !== undefined) updates.parent_id = newParentId;
            // Fix v0.9.64: Persist Position
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

        // Optimistic
        modifyActiveProject(p => ({
            ...p,
            tasks: findTaskAndUpdate(p.tasks, taskId, t => ({
                ...t,
                activity: [...t.activity, newLog]
            }))
        }));

        // Database (Append to JSONB)
        const { data } = await supabase.from('tasks').select('activity').eq('id', taskId).single();
        if (data) {
            const current = data.activity || [];
            await supabase.from('tasks').update({ activity: [...current, newLog] }).eq('id', taskId);
        }
    }, [currentUser, activeProjectId, modifyActiveProject]);

    const updateActivity = useCallback(async (taskId: string, logId: string, newContent: string) => {
        if (!activeProjectId) return;

        // Optimistic
        modifyActiveProject(p => ({
            ...p,
            tasks: findTaskAndUpdate(p.tasks, taskId, t => ({
                ...t,
                activity: t.activity.map(a => a.id === logId ? { ...a, content: newContent } : a)
            }))
        }));

        // Database
        const { data } = await supabase.from('tasks').select('activity').eq('id', taskId).single();
        if (data) {
            const current = data.activity || [];
            const updated = current.map((a: ActivityLog) => a.id === logId ? { ...a, content: newContent } : a);
            await supabase.from('tasks').update({ activity: updated }).eq('id', taskId);
        }
    }, [activeProjectId, modifyActiveProject]);

    const deleteActivity = useCallback(async (taskId: string, logId: string) => {
        if (!activeProjectId) return;

        // Optimistic
        modifyActiveProject(p => ({
            ...p,
            tasks: findTaskAndUpdate(p.tasks, taskId, t => ({
                ...t,
                activity: t.activity.filter(a => a.id !== logId)
            }))
        }));

        // Database
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

        // Optimistic
        modifyActiveProject(p => ({
            ...p,
            tasks: findTaskAndUpdate(p.tasks, taskId, t => ({
                ...t,
                attachments: [...t.attachments, newAtt]
            }))
        }));

        // Database (Append to JSONB)
        const { data } = await supabase.from('tasks').select('attachments').eq('id', taskId).single();
        if (data) {
            const current = data.attachments || [];
            await supabase.from('tasks').update({ attachments: [...current, newAtt] }).eq('id', taskId);
        }
    }, [currentUser, activeProjectId, modifyActiveProject]);

    const toggleExpand = useCallback((taskId: string) => {
        modifyActiveProject(p => ({
            ...p,
            tasks: findTaskAndUpdate(p.tasks, taskId, t => ({ ...t, expanded: !t.expanded }))
        }));
    }, [modifyActiveProject]);

    const updateCurrentUser = useCallback(async (updates: Partial<User>) => {
        if (!currentUser) {
            alert("Debug: No currentUser found.");
            return;
        }

        // Local Optimistic Update
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

            // Debug Payload
            console.log(`Debug: User Email: ${currentUser.email}`);
            const size = JSON.stringify(payload).length;
            console.log(`Debug: Sending payload size: ${size} bytes`);

            // alert(`Debug: Iniciando guardado... (Size: ${Math.round(size/1024)}KB)`); 

            // Fix: Use upsert on 'profiles' table
            const { error, data } = await (supabase as any).from('profiles').upsert(payload).select();

            if (error) {
                throw error;
            } else {
                console.log("Debug: Saved successfully", data);
                // Alert removed as per v0.9.48 - Database write confirmed working
                if (!data || data.length === 0) {
                    console.warn("Aviso: La base de datos no retornó datos, pero no lanzó error.");
                }
            }

        } catch (e: any) {
            console.error("Error updating user:", e);
            alert(`Error Critical: ${e.message || JSON.stringify(e)}`);
        }
    }, [currentUser]);

    return (
        <AppContext.Provider value={{
            state, currentUser, users, activeProjectId, setActiveProjectId,
            addProject, updateProject, deleteProject, moveProject,
            addTask, updateTask, deleteTask, toggleTaskStatus,
            moveTask, addActivity, updateActivity, deleteActivity, addAttachment, toggleExpand,
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
