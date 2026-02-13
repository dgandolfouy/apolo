import React from 'react';
import { Icons } from './Icons';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = 'danger'
}) => {
    if (!isOpen) return null;

    const colors: Record<string, { icon: string; bgIcon: string; button: string; border: string }> = {
        danger: {
            icon: 'text-rose-500',
            bgIcon: 'bg-rose-500/10',
            button: 'bg-rose-500 hover:bg-rose-600',
            border: 'border-rose-500/20'
        },
        warning: {
            icon: 'text-amber-500',
            bgIcon: 'bg-amber-500/10',
            button: 'bg-amber-500 hover:bg-amber-600',
            border: 'border-amber-500/20'
        },
        info: {
            icon: 'text-indigo-500',
            bgIcon: 'bg-indigo-500/10',
            button: 'bg-indigo-500 hover:bg-indigo-600',
            border: 'border-indigo-500/20'
        }
    };

    const variantStyles = colors[variant];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className={`
                relative w-full max-w-md bg-[#0a0a0b] border ${variantStyles.border} 
                rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100
                flex flex-col
            `}>
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${variantStyles.bgIcon} ${variantStyles.icon}`}>
                            {variant === 'danger' && <Icons.AlertTriangle size={24} />}
                            {variant === 'warning' && <Icons.AlertCircle size={24} />}
                            {variant === 'info' && <Icons.Info size={24} />}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white/5 flex items-center justify-end gap-3 border-t border-white/5">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg text-sm font-medium text-white shadow-lg transition-all transform hover:scale-105 ${variantStyles.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
