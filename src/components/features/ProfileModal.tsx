import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';
import { Icons } from '../ui/Icons';
import { fileToBase64 } from '../../utils/helpers';

export const ProfileModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const ctx = useContext(AppContext);
    const [name, setName] = useState(ctx?.currentUser?.name || '');
    const [uploading, setUploading] = useState(false);

    if (!ctx || !ctx.currentUser) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploading(true);
            try {
                const base64 = await fileToBase64(e.target.files[0]);
                ctx.updateCurrentUser({ avatarUrl: base64 });
            } catch (e) {
                alert("Error al procesar la imagen. Intenta con una más pequeña.");
            }
            setUploading(false);
        }
    };

    const handleSave = () => {
        if (name.trim()) ctx.updateCurrentUser({ name });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#111115] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl animate-slide-up flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-display font-normal text-white mb-6 tracking-wide">Editar Perfil</h3>

                <div className="relative group cursor-pointer mb-6">
                    <Avatar user={ctx.currentUser} size="w-24 h-24" />
                    <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploading ? <div className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full"></div> : <Icons.Camera className="text-white" size={24} />}
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                </div>

                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 mb-6"
                />

                <div className="flex w-full gap-3">
                    <button onClick={onClose} className="flex-1 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors">Guardar</button>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 w-full flex justify-center">

                </div>
            </div>
        </div>
    );
};
