import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw, AlertCircle, HelpCircle } from "lucide-react";
import { Footer } from "../../components/layout/Footer.jsx";
import { usePageTitle } from "../../hooks/usePageTitle";

export const RefundPolicyPage = () => {
    usePageTitle("شرایط بازگشت وجه");
    return (
        <div className="min-h-screen w-full bg-[#090a0f] text-zinc-100 flex flex-col font-fa select-text" dir="rtl">
            <header className="h-16 shrink-0 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-amber-400" aria-hidden="true" />
                    <span className="font-bold text-sm text-zinc-200">شرایط و ضوابط بازگشت وجه (Refund Policy)</span>
                </div>
                <Link
                    to="/"
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 rounded px-2 py-1"
                >
                    <span>بازگشت</span>
                    <ArrowRight className="w-4 h-4 rotate-180" aria-hidden="true" />
                </Link>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6 text-zinc-300 text-xs sm:text-sm leading-relaxed" role="main">
                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 space-y-1">
                    <h1 className="font-bold text-sm sm:text-base text-zinc-100">سیاست استرداد مبالغ و اشتراک‌ها</h1>
                    <p className="text-[11px] text-zinc-400">شفافیت کامل در حوزه تعهدات مالی و خدمات پلتفرم.</p>
                </div>

                <section className="space-y-2">
                    <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                        ۱. وضعیت خدمات رایگان فعلی (فاز جاری)
                    </h2>
                    <p>
                        در فاز فعلی، کلیه امکانات پلتفرم Titipool (شامل ساخت اتاق، ابزارهای GM، تاس‌های سه‌بعدی و سرور مکالمه زنده SFU) به صورت کاملاً رایگان ارائه می‌شود و هیچ‌گونه دریافت وجهی از کاربران صورت نمی‌پذیرد؛ بنابراین استرداد وجه در این مرحله موضوعیت ندارد.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        ۲. قوانین اشتراک‌های آتی و ارتقای فضا
                    </h2>
                    <p>
                        در صورت افزوده شدن پلن‌های تجاری یا خرید فضای ذخیره‌سازی بیشتر، ضوابط زیر حاکم خواهد بود:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pr-2 text-zinc-400 text-xs">
                        <li><strong>لغو در بازه ۱۴ روز نخست:</strong> در صورت بروز مشکل فنی در ارائه خدمات که توسط تیم پشتیبانی قابل رفع نباشد، استرداد کامل وجه ظرف مدت ۵ تا ۱۰ روز کاری انجام می‌پذیرد.</li>
                        <li><strong>پس از بازه ۱۴ روز:</strong> انصراف از اشتراک تمدید بعدی را لغو خواهد کرد و استرداد دوره مصرف‌شده مقدور نخواهد بود.</li>
                    </ul>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default RefundPolicyPage;