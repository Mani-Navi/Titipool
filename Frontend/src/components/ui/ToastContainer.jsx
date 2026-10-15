import React from "react";
import { AlertTriangle, CheckCircle, Info, XCircle, X } from "lucide-react";
import { useToastStore } from "../../stores/toast.store";

const ICONS = {
    error: XCircle,
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info,
};

const STYLES = {
    error: {
        border: "border-rose-500/40",
        bg: "bg-rose-950/40",
        iconColor: "text-rose-400",
        glow: "shadow-[0_0_20px_rgba(244,63,94,0.15)]",
        badge: "bg-rose-500/20 text-rose-300",
    },
    success: {
        border: "border-emerald-500/40",
        bg: "bg-emerald-950/40",
        iconColor: "text-emerald-400",
        glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
        badge: "bg-emerald-500/20 text-emerald-300",
    },
    warning: {
        border: "border-amber-500/40",
        bg: "bg-amber-950/40",
        iconColor: "text-amber-400",
        glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
        badge: "bg-amber-500/20 text-amber-300",
    },
    info: {
        border: "border-cyan-500/40",
        bg: "bg-cyan-950/40",
        iconColor: "text-cyan-400",
        glow: "shadow-[0_0_20px_rgba(6,182,212,0.15)]",
        badge: "bg-cyan-500/20 text-cyan-300",
    },
};

export const ToastContainer = () => {
    const toasts = useToastStore((state) => state.toasts);
    const removeToast = useToastStore((state) => state.removeToast);

    if (toasts.length === 0) return null;

    return (
        <aside
            aria-live="polite"
            aria-label="اعلان‌های سیستم"
            className="fixed top-5 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-6 z-[9999] flex flex-col gap-2.5 max-w-[90vw] sm:max-w-sm w-full pointer-events-none font-fa select-none"
            dir="rtl"
        >
            {toasts.map((item) => {
                const style = STYLES[item.type] || STYLES.error;
                const IconComp = ICONS[item.type] || ICONS.error;

                return (
                    <div
                        key={item.id}
                        role="status"
                        className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-950/90 backdrop-blur-xl border ${style.border} ${style.bg} ${style.glow} shadow-2xl transition-all animate-in fade-in slide-in-from-top-4 duration-200`}
                    >
                        <div className={`p-1.5 rounded-xl ${style.badge} shrink-0 mt-0.5`} aria-hidden="true">
                            <IconComp className={`w-4 h-4 ${style.iconColor}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-zinc-100 leading-tight mb-0.5">
                                {item.title}
                            </h5>
                            <p className="text-[11px] text-zinc-300 font-medium leading-relaxed break-words">
                                {item.message}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => removeToast(item.id)}
                            aria-label="بستن اعلان"
                            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                            title="بستن"
                        >
                            <X className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                    </div>
                );
            })}
        </aside>
    );
};

export default ToastContainer;