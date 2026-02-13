import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const DbInspector: React.FC = () => {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);

    const inspect = async () => {
        setLoading(true);
        try {
            // 1. Get Projects
            const { data: projects, error: projError } = await supabase.from('projects').select('*');

            // 2. Get Members
            const { data: members, error: membError } = await supabase.from('project_members').select('*');

            // 3. Get first 5 tasks
            const { data: tasks, error: tasksError } = await supabase.from('tasks').select('id, title, project_id').limit(5);

            setData({
                projects: { data: projects, error: projError },
                members: { data: members, error: membError },
                tasks: { data: tasks, error: tasksError },
                user_id: user?.id
            });
        } catch (e) {
            setData({ error: e });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            <button
                onClick={() => { setVisible(!visible); if (!visible) inspect(); }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
            >
                {visible ? 'Ocultar Inspector' : '🔍 DB Inspector'}
            </button>

            {visible && (
                <div className="mt-2 w-80 md:w-96 bg-gray-900 border border-purple-500 rounded-lg shadow-2xl p-4 text-xs font-mono text-gray-300 max-h-[80vh] overflow-auto">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-purple-400">DATABASE SNAPSHOT</h4>
                        <button onClick={inspect} className="text-xs underline text-gray-400">Refresh</button>
                    </div>

                    {loading && <div>Cargando datos crudos...</div>}

                    {!loading && data && (
                        <div className="space-y-4">
                            <div>
                                <strong className="text-white block border-b border-gray-700 pb-1">Usuario Actual:</strong>
                                <div className="break-all text-[10px] text-gray-500">{data.user_id}</div>
                            </div>

                            <div>
                                <strong className="text-green-400 block border-b border-gray-700 pb-1">Projects ({data.projects.data?.length ?? 0}):</strong>
                                {data.projects.error ? (
                                    <div className="text-red-500 p-1 bg-red-900/20">{JSON.stringify(data.projects.error)}</div>
                                ) : (
                                    <pre className="max-h-32 overflow-auto bg-black/30 p-1 rounded">
                                        {JSON.stringify(data.projects.data, null, 2)}
                                    </pre>
                                )}
                            </div>

                            <div>
                                <strong className="text-blue-400 block border-b border-gray-700 pb-1">Project Members:</strong>
                                {data.members.error ? (
                                    <div className="text-red-500 p-1 bg-red-900/20">{JSON.stringify(data.members.error)}</div>
                                ) : (
                                    <pre className="max-h-24 overflow-auto bg-black/30 p-1 rounded">
                                        {JSON.stringify(data.members.data, null, 2)}
                                    </pre>
                                )}
                            </div>

                            <div>
                                <strong className="text-yellow-400 block border-b border-gray-700 pb-1">Tasks (Sample):</strong>
                                {data.tasks.error ? (
                                    <div className="text-red-500 p-1 bg-red-900/20">{JSON.stringify(data.tasks.error)}</div>
                                ) : (
                                    <pre className="max-h-24 overflow-auto bg-black/30 p-1 rounded">
                                        {JSON.stringify(data.tasks.data, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
