import React, { useEffect, useRef } from "react";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { useConfirmStore } from "../../stores/confirm.store";
import { uiAudio } from "../../utils/uiAudio";

export const ConfirmModal = () => {
    const {
        isOpen,
        title,
        message,
        confirmText,
        cancelText,
        variant,
        handleConfirm,
        handleCancel,
    } = useConfirmStore();

    const isDanger = variant === "danger";
    const modalRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        uiAudio.playRoomAlert();

        const previousActiveElement = document.activeElement;

        const timer = setTimeout(() => {
            const confirmBtn = modalRef.current?.querySelector('button[data-confirm="true"]');
            confirmBtn?.focus();
        }, 50);

        const handleEscape = (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                handleCancel();
            }
        };

        window.addEventListener("keydown", handleEscape);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("keydown", handleEscape);
            if (previousActiveElement && typeof previousActiveElement.focus === "function") {
                previousActiveElement.focus();
            }
        };
    }, [isOpen, handleCancel]);

    const handleKeyDown = (e) => {
        if (e.key !== "Tab" || !modalRef.current) return;

        const focusableElements = modalRef.current.querySelectorAll(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in-up font-fa select-none"
            dir="rtl"
            onClick={handleCancel}
        >
            <div
                ref={modalRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                aria-describedby="confirm-modal-desc"
                onKeyDown={handleKeyDown}
                className="relative w-full max-w-md glass-card border border-zinc-800/90 rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] p-5 sm:p-6 overflow-hidden animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20 ${
                        isDanger ? "bg-rose-500" : "bg-amber-500"
                    }`}
                    aria-hidden="true"
                />

                <div className="flex items-start gap-3 sm:gap-4">
                    <div
                        className={`p-3 rounded-2xl shrink-0 ${
                            isDanger
                                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                                : "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                        }`}
                        aria-hidden="true"
                    >
                        {isDanger ? (
                            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                        <h4 id="confirm-modal-title" className="text-sm sm:text-base font-black text-zinc-100 mb-1 leading-snug">
                            {title}
                        </h4>
                        <p id="confirm-modal-desc" className="text-xs text-zinc-400 leading-relaxed font-medium">
                            {message}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleCancel}
                        aria-label="بستن پنجره تایید"
                        className="p-1 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 active:scale-90 transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                    >
                        <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                </div>

                <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-zinc-800/80">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-700/80 text-zinc-300 hover:text-zinc-100 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        data-confirm="true"
                        onClick={handleConfirm}
                        className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 ${
                            isDanger
                                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30"
                                : "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/30"
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;