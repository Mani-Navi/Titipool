import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function NotFoundPage() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "صفحه پیدا نشد — Persian VTT";
    }, []);

    return (
        <main
            className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center text-center px-4 select-none"
            dir="rtl"
        >
            <div className="relative mb-6">
                <div className="text-8xl sm:text-9xl font-black text-amber-400 tracking-widest drop-shadow-[0_0_25px_rgba(251,191,36,0.25)]">
                    ۴۰۴
                </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-3">
                صفحه مورد نظر پیدا نشد
            </h1>
            <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-md leading-relaxed">
                مسیر یا صفحه‌ای که به دنبال آن هستید وجود ندارد، حذف شده یا به آدرس دیگری منتقل شده است.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-6 py-2.5 rounded-full border border-gray-700 hover:border-amber-400 text-gray-300 hover:text-amber-400 transition-all cursor-pointer font-medium text-sm"
                >
                    بازگشت به صفحه قبل
                </button>
                <Link
                    to="/"
                    className="px-6 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-bold transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:scale-105 text-sm"
                >
                    صفحه اصلی میز بازی
                </Link>
            </div>
        </main>
    );
}