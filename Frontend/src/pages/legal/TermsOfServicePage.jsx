import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, FileText, AlertTriangle, ShieldAlert, Award, Mail } from "lucide-react";
import { Footer } from "../../components/layout/Footer.jsx";
import { usePageTitle } from "../../hooks/usePageTitle";

export const TermsOfServicePage = () => {
    usePageTitle("شرایط و قوانین استفاده");
    return (
        <div className="min-h-screen w-full bg-[#090a0f] text-zinc-100 flex flex-col font-fa select-text" dir="rtl">
            <header className="h-16 shrink-0 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-400" aria-hidden="true" />
                    <span className="font-bold text-sm text-zinc-200">شرایط و قوانین استفاده (Terms of Service)</span>
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
                    <h1 className="font-bold text-sm sm:text-base text-zinc-100">توافق‌نامه شرایط خدمات پلتفرم Titipool</h1>
                    <p className="text-[11px] text-zinc-400">ثبت‌نام و ورود به محیط بازی به منزله پذیرش بدون قید و شرط این توافق‌نامه است.</p>
                </div>

                <section className="space-y-2">
                    <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        ۱. مالکیت محتوا و حق کپی‌رایت
                    </h2>
                    <p className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-200 font-medium">
                        کاربر مسئولیت کامل محتوایی که بر روی پلتفرم آپلود می‌نماید (تصاویر نقشه، آواتار و فایل‌های ضمیمه) را شخصاً می‌پذیرد. آپلود هرگونه محتوای دارای کپی‌رایت بدون اخذ مجوز مالک ممنوع است و Titipool حق حذف محتوای گزارش‌شده را بدون اطلاع قبلی برای خود محفوظ می‌دارد.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        ۲. قوانین رفتاری و استفاده مجاز
                    </h2>
                    <ul className="list-disc list-inside space-y-1 pr-2 text-zinc-400 text-xs">
                        <li>هرگونه آزار کلامی، توهین، نشر محتوای غیراخلاقی یا اخلال در ارتباطات صوتی و متنی اتاق‌ها ممنوع است.</li>
                        <li>دانجن‌مستر (GM) مدیریت محتوایی و دسترسی اعضا در اتاق اختصاصی خود را بر عهده دارد و حق حذف اعضای متخلف با وی است.</li>
                        <li>هرگونه اقدام جهت نفوذ، حملات مهندسی معکوس، یا سوءاستفاده از پروتکل‌های وب‌سوکت منجر به مسدودسازی دائمی حساب کاربری خواهد شد.</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        ۳. سلب مسئولیت و پایداری سرویس
                    </h2>
                    <p>
                        سرویس به صورت «همان‌گونه که هست» (AS-IS) ارائه می‌شود. تیم توسعه نهایت تلاش خود را برای پایداری ۲۴/۷ و نگهداری فایل‌ها مبذول می‌دارد، اما هیچ‌گونه ضمانت اجرایی در برابر اختلالات موقت شبکه، فیلترینگ یا قطعی‌های زیرساخت ابری ارائه نمی‌شود.
                    </p>
                </section>

                <section className="space-y-2 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                    <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        ۴. ارتباط با واحد امور حقوقی و گزارش تخلف
                    </h2>
                    <p className="text-xs text-zinc-400">
                        جهت ارسال گزارش نقض قوانین، کپی‌رایت یا مکاتبات رسمی حقوقی:
                    </p>
                    <div className="pt-1">
                        <a
                            href="mailto:legal@titipoolgames.ir"
                            className="text-amber-400 hover:text-amber-300 font-mono font-bold text-xs inline-flex items-center gap-1.5"
                            dir="ltr"
                        >
                            <span>legal@titipoolgames.ir</span>
                        </a>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default TermsOfServicePage;