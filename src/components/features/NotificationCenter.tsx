import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Icons } from '../ui/Icons';

export const NotificationCenter: React.FC = () => {
    const ctx = useContext(AppContext);
    const [isOpen, setIsOpen] = useState(false);

    if (!ctx) return null;

    const unreadCount = ctx.unreadCount || 0;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors relative"
            >
                <Icons.Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-[#050505]"></span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 top-full mt-2 w-80 bg-[#1A1A1D] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in origin-top-right">
                        <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-white">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full">{unreadCount} nuevas</span>
                            )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {ctx.notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-xs">
                                    No tienes notificaciones
                                </div>
                            ) : (
                                <div>
                                    {ctx.notifications.map((notif: any) => (
                                        <div
                                            key={notif.id}
                                            className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!notif.is_read ? 'bg-indigo-500/5' : ''}`}
                                            onClick={() => ctx.markNotificationRead(notif.id)}
                                        >
                                            <div className="text-sm text-gray-200 mb-1">{notif.content}</div>
                                            <div className="text-[10px] text-gray-500">{new Date(notif.created_at).toLocaleDateString()}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
