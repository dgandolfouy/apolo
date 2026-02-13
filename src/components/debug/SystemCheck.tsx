import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export const SystemCheck: React.FC = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState<{
        config: string;
        auth: string;
        network: string;
        dbConnection: string;
        rlsInsert: string;
        lastError: string | null;
    }>({
        config: 'Checking...',
        auth: 'Checking...',
        network: 'Checking...',
        dbConnection: 'Checking...',
        rlsInsert: 'Waiting...',
        lastError: null
    });

    useEffect(() => {
        const checkSystem = async () => {
            // 0. Check Config (Validation)
            // @ts-ignore
            const rawUrl = supabase.supabaseUrl as string;
            // @ts-ignore
            const rawKey = supabase.supabaseKey as string;

            let confError = null;
            if (!rawUrl) confError = 'URL Missing';
            else if (!rawUrl.startsWith('https://')) confError = 'URL not https://';

            const configStatus = confError ? `Bad Config: ${confError}` : 'Config Valid';

            // 1. Check Auth
            const authStatus = user ? `Logged in` : 'Not Logged In';

            // 2. Raw Connectivity Test
            let netStatus = 'Testing...';
            try {
                if (rawUrl && rawKey) {
                    const res = await fetch(`${rawUrl}/rest/v1/projects?select=count`, {
                        method: 'GET',
                        headers: {
                            'apikey': rawKey,
                            'Authorization': `Bearer ${rawKey}`
                        }
                    });
                    netStatus = `HTTP ${res.status} ${res.statusText}`;
                } else {
                    netStatus = 'Skipped (No Config)';
                }
            } catch (e: any) {
                netStatus = `Network Error: ${e.message}`;
            }

            // 3. Client DB Connection
            let dbStatus = 'Unknown';
            let insertStatus = 'Skipped';
            let errorMsg = null;

            try {
                // Standard Authed Client Test
                const { count, error: selectError } = await supabase
                    .from('projects')
                    .select('*', { count: 'exact', head: true });

                if (selectError) {
                    dbStatus = `Client Failed`;
                    // Serialize FULL error object
                    errorMsg = JSON.stringify(selectError, Object.getOwnPropertyNames(selectError), 2);
                    if (errorMsg === '{}') errorMsg = JSON.stringify(selectError); // Fallback
                } else {
                    dbStatus = `OK (Count: ${count})`;
                }

                // 4. RLS Insert
                if (user && !selectError) {
                    const { error: insertError } = await supabase
                        .from('projects')
                        .insert({
                            owner_id: user.id,
                            title: 'System Check',
                            subtitle: 'Temporary diagnostic',
                            color: 'gray'
                        })
                        .select()
                        .single();
                    if (insertError) {
                        insertStatus = `Failed: ${insertError.message} (Code: ${insertError.code})`;
                        if (!errorMsg) errorMsg = insertError.message;
                    } else {
                        insertStatus = 'OK';
                        // Cleanup
                        await supabase.from('projects').delete().eq('title', 'System Check');
                    }
                } else if (user && selectError) {
                    insertStatus = 'Skipped (Read Failed)';
                }

            } catch (err: any) {
                dbStatus = `Exception`;
                errorMsg = err.message + '\n' + JSON.stringify(err);
            }

            setStatus({
                config: configStatus,
                auth: authStatus,
                network: netStatus,
                dbConnection: dbStatus,
                rlsInsert: insertStatus,
                lastError: errorMsg
            });
        };

        checkSystem();
    }, [user]);

    if (!user) return null;

    return (
        <div className="bg-black/90 border border-red-500/50 p-4 rounded-xl mb-8 font-mono text-xs md:text-sm text-red-200 shadow-2xl overflow-hidden max-w-2xl mx-auto">
            <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                <span className="animate-pulse">●</span> DIAGNOSTICO DE SISTEMA (v0.9.9)
            </h3>
            <div className="space-y-1">
                <div className="flex justify-between border-b border-red-500/20 pb-1">
                    <span>Configuración:</span>
                    <span className={status.config === 'Config Valid' ? 'text-green-400' : 'text-red-500 font-bold blink'}>{status.config}</span>
                </div>
                <div className="flex justify-between border-b border-red-500/20 pb-1">
                    <span className="text-gray-500">Key Prefix:</span>
                    <span className="text-gray-400">
                        {/* @ts-ignore */}
                        {(supabase.supabaseKey || '').substring(0, 5)}...
                    </span>
                </div>
                <div className="flex justify-between border-b border-red-500/20 pb-1">
                    <span>Usuario:</span>
                    <span className="text-white">{status.auth}</span>
                </div>
                <div className="flex justify-between border-b border-red-500/20 pb-1">
                    <span>Red (Raw Fetch):</span>
                    <span className={status.network.includes('200') || status.network.includes('404') ? 'text-green-400' : 'text-red-500 font-bold'}>{status.network}</span>
                </div>
                <div className="flex justify-between border-b border-red-500/20 pb-1">
                    <span>Cliente Supabase:</span>
                    <span className={status.dbConnection.includes('OK') ? 'text-green-400' : 'text-red-500 font-bold'}>
                        {status.dbConnection}
                    </span>
                </div>
                <div className="flex justify-between border-b border-red-500/20 pb-1">
                    <span>Permisos Escritura (RLS):</span>
                    <span className={status.rlsInsert.includes('OK') ? 'text-green-400' : 'text-red-500 font-bold'}>
                        {status.rlsInsert}
                    </span>
                </div>

                {status.lastError && (
                    <div className="mt-2 bg-red-950/50 p-2 rounded text-red-300 break-all border border-red-500/30 whitespace-pre-wrap">
                        <strong>DETALLE ERROR:</strong><br />{status.lastError}
                    </div>
                )}
                <div className="mt-1 text-gray-400 text-[10px]">
                    User: {user.email}
                </div>

                <button
                    onClick={async () => {
                        await supabase.auth.signOut();
                        localStorage.clear();
                        window.location.reload();
                    }}
                    className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white text-xs py-2 rounded font-bold transition-colors"
                >
                    ⚠️ CERRAR SESIÓN (FORCE) ⚠️
                </button>
            </div>
            <div className="mt-3 text-gray-500 text-[10px] text-center">
                Si "Red" está OK, usa el botón de cierre forzado.
            </div>
        </div>
    );
};
