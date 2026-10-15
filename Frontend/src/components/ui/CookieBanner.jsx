import React, { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";

export const CookieBanner = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        try {
            const consent = localStorage.getItem("vtt_cookie_ack");
            if (!consent) {
                const timer = setTimeout(() => setIsOpen(true), 1500);
                return () => clearTimeout(timer);
            }
        } catch {
            // در صورت محدود بودن دسترسی به localStorage
        }
    }, []);

    const handleAcknowledge = () => {
        try {
            localStorage.setItem("vtt_cookie_ack", "true");
        } catch {}
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <aside
            role="region"
            aria-label="اطلاعیه نگهداری داده‌های فنی و کوکی‌ها"
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-zinc-950/95 border border-zinc-800/90 rounded-2xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl text-zinc-300 font-fa select-none text-xs flex flex-col gap-2.5 animate-fade-in-up"
            dir="rtl"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-zinc-100 font-bold text-xs sm:text-sm">
                    <Cookie className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                    <span>داده‌های فنی و نشست بازی</span>
                </div>
                <button
                    type="button"
                    onClick={handleAcknowledge}
                    className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer active:scale-90"
                    aria-label="بستن اطلاعیه"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed">
                این میز بازی برای حفظ ورود و نگهداری تنظیمات بوم صرفاً از حافظه ضروری مرورگر استفاده می‌کند و فاقد هرگونه کوکی ردیاب تبلیغاتی است.{" "}
                <a
                    href="/cookie-policy"
                    className="text-amber-400 hover:text-amber-300 underline underline-offset-2 font-medium"
                >
                    مطالعه جزئیات
                </a>
            </p>

            <div className="flex justify-end gap-2 pt-1 border-t border-zinc-900">
                <button
                    type="button"
                    onClick={handleAcknowledge}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                >
                    متوجه شدم
                </button>
            </div>
        </aside>
    );
};

export default CookieBanner;