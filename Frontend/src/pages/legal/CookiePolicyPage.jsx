import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Cookie, CheckCircle, Info } from "lucide-react";
import { Footer } from "../../components/layout/Footer.jsx";
import { usePageTitle } from "../../hooks/usePageTitle";

export const CookiePolicyPage = () => {
    usePageTitle("سیاست کوکی‌ها");
    return (
        <div className="min-h-screen w-full bg-[#090a0f] text-zinc-100 flex flex-col font-fa select-text" dir="rtl">
            <header className="h-16 shrink-0 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-2">
                    <Cookie className="w-5 h-5 text-amber-400" aria-hidden="true" />
                    <span className="font-bold text-sm text-zinc-200">سیاست کوکی‌ها (Cookie Policy)</span>
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
                    <h1 className="font-bold text-sm sm:text-base text-zinc-100">خط مشی ذخیره‌سازی داده‌های محلی و کوکی‌ها</h1>
                    <p className="text-[11px] text-zinc-400">شفافیت کامل در نگهداری نشست‌ها و تنظیمات میز بازی.</p>
                </div>

                <section className="space-y-3">
                    <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                        کوکی‌های ضروری و ذخیره‌سازی محلی (Local Storage)
                    </h2>
                    <p>
                        پلتفرم Titipool فاقد هرگونه کوکی تبلیغاتی یا کوکی‌های ردیاب شخص ثالث است. داده‌های ذخیره‌شده بر روی مرورگر شما صرفاً جنبه فنی داشته و بدون آن‌ها امکان ورود به بازی وجود ندارد:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1">
                            <span className="font-mono text-amber-400 font-bold text-xs">vtt_jwt (Local Storage)</span>
                            <p className="text-[11px] text-zinc-400">شناسه نشست و توکن ورود جهت باز ماندن حساب کاربری شما بین دفعات ورود.</p>
                        </div>
                        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1">
                            <span className="font-mono text-cyan-400 font-bold text-xs">room_camera / dice_prefs</span>
                            <p className="text-[11px] text-zinc-400">تنظیمات رابط کاربری شامل آخرین موقعیت دوربین کانواس و حالت پرتاب تاس‌ها.</p>
                        </div>
                    </div>
                </section>

                <section className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-850 space-y-2 text-zinc-400 text-xs">
                    <h3 className="font-bold text-zinc-200 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        نحوه پاکسازی اطلاعات
                    </h3>
                    <p>
                        در صورت خروج از حساب کاربری (Logout)، توکن‌های محلی بلافاصله حذف خواهند شد. همچنین می‌توانید در هر لحظه کش و داده‌های محلی مرورگر خود را به طور کامل پاک کنید.
                    </p>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default CookiePolicyPage;