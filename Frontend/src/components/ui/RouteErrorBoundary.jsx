import React, { useState } from "react";
import { useRouteError, useNavigate } from "react-router-dom";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Dices } from "lucide-react";
import { Button } from "./Button";

export const RouteErrorBoundary = () => {
    const error = useRouteError();
    const navigate = useNavigate();
    const [showDetails, setShowDetails] = useState(false);

    const errorMessage =
        error?.statusText ||
        error?.message ||
        "خطایی غیرمنتظره در بارگذاری این صفحه رخ داده است.";

    return (
        <div
            className="min-h-screen w-full bg-[#090a0f] text-zinc-100 flex flex-col items-center justify-center p-4 font-fa select-none relative overflow-hidden"
            dir="rtl"
        >
            {/* هاله نور پس‌زمینه */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-[130px] pointer-events-none" />

            <main className="relative z-10 w-full max-w-lg glass-card border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] text-center animate-fade-in-up">
                {/* آیکون هشدار نئونی */}
                <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center mb-5 shadow-[0_0_25px_rgba(244,63,94,0.2)] animate-pulse">
                    <AlertTriangle className="w-8 h-8" />
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight mb-2">
                    وقفه در بارگذاری صفحه
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto mb-6">
                    متأسفانه در پردازش این بخش خطایی رخ داده است. می‌توانید صفحه را تازه‌سازی کنید یا به داشبورد بازگردید.
                </p>

                {/* دکمه‌های اکشن */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    <Button
                        variant="amber"
                        onClick={() => window.location.reload()}
                        className="text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95"
                    >
                        <RefreshCw className="w-4 h-4 ml-1.5" />
                        تلاش مجدد
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => navigate("/dashboard", { replace: true })}
                        className="text-xs font-bold px-4 py-2.5 rounded-xl active:scale-95"
                    >
                        <Home className="w-4 h-4 ml-1.5" />
                        داشبورد بازی
                    </Button>
                </div>

                {/* بخش جزییات فنی برای دیباگ (آکاردئونی و پنهان از دید کاربر عادی) */}
                <div className="pt-4 border-t border-zinc-800/80 text-right">
                    <button
                        type="button"
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center justify-between w-full text-[11px] text-zinc-500 hover:text-zinc-300 font-medium py-1 transition-colors cursor-pointer"
                    >
                        <span>مشاهده جزئیات فنی خطا (Debug Info)</span>
                        {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showDetails && (
                        <div className="mt-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-rose-400 text-left overflow-x-auto max-h-36 custom-scrollbar animate-fade-in-up" dir="ltr">
                            {errorMessage}
                        </div>
                    )}
                </div>
            </main>

            <footer className="relative z-10 mt-6 flex items-center gap-2 text-xs text-zinc-600">
                <Dices className="w-4 h-4 text-amber-500/60" />
                <span>پلتفرم میز مجازی Titipool</span>
            </footer>
        </div>
    );
};

export default RouteErrorBoundary;