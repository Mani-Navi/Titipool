import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Database, Lock, Eye, Trash2, Mail } from "lucide-react";
import { Footer } from "../../components/layout/Footer.jsx";
import { usePageTitle } from "../../hooks/usePageTitle";

export const PrivacyPolicyPage = () => {
    usePageTitle("حریم خصوصی");
    return (
        <div className="min-h-screen w-full bg-[#090a0f] text-zinc-100 flex flex-col font-fa select-text" dir="rtl">
            <header className="h-16 shrink-0 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" aria-hidden="true" />
                    <span className="font-bold text-sm text-zinc-200">سیاست حفظ حریم خصوصی (Privacy Policy)</span>
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
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
                    <h1 className="font-bold text-sm sm:text-base">سیاست حفظ حریم خصوصی کاربران Titipool</h1>
                    <p className="text-[11px] text-amber-400/80">آخرین بروزرسانی: اسفند ۱۴۰۳ (مطابق با استانداردهای GDPR و قوانین ناظر بر حریم خصوصی داده‌ها)</p>
                </div>

                <section className="space-y-2">
                    <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                        <Database className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        ۱. اطلاعاتی که جمع‌آوری می‌کنیم
                    </h2>
                    <p>
                        برای ارائه خدمات بستر میز مجازی، حداقل داده‌های فنی و هویتی زیر جمع‌آوری و نگهداری می‌شوند:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pr-2 text-zinc-400 text-xs">
                        <li><strong>اطلاعات حساب کاربری:</strong> نام کاربری، آدرس ایمیل و هش یک‌طرفه رمز عبور (توسط الگوریتم BCrypt بدون امکان دسترسی به رمز خام).</li>
                        <li><strong>داده‌های فنی اتصال:</strong> آدرس IP، شناسه نشست، و زمان آخرین فعالیت به منظور پایش امنیت سرور و جلوگیری از حملات DoS/Brute-force.</li>
                        <li><strong>داده‌های بازی و محتوا:</strong> نقشه‌ها، یادداشت‌های اتاق، توکن‌ها و نقاشی‌های رسم‌شده روی بوم مجازی.</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        ۲. امنیت و رمزنگاری داده‌ها
                    </h2>
                    <p>
                        ارتباطات بر بستر پروتکل رمزنگاری‌شده TLS/HTTPS و WebSocket ایمن (WSS) انجام می‌پذیرد. احراز هویت از طریق توکن‌های امضا‌شده JWT بر مبنای استاندارد RFC 7519 صورت می‌گیرد و اطلاعات اعتبارسنجی کاربران در برابر دسترسی‌های غیرمجاز محافظت می‌شوند.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        ۳. پردازش صوت و اشخاص ثالث
                    </h2>
                    <p>
                        پلتفرم Titipool از سرور مستقل SFU صوت (LiveKit) استفاده می‌نماید. استریم‌های صوتی به هیچ‌وجه روی سرورها ذخیره یا ضبط نمی‌گردند و صرفاً در زمان واقعی بین اعضای اتاق بازپخش می‌شوند. هیچ‌گونه ابزار تحلیلی ردیابی شخص ثالث (مانند Google Analytics یا بازاریابی تجاری) در پلتفرم فعال نیست.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        ۴. حقوق کاربر و حذف داده‌ها (Right to be Forgotten)
                    </h2>
                    <p>
                        مطابق با اصول GDPR و حقوق کاربران، شما در هر زمان حق دارید حساب کاربری خود، تمامی اتاق‌های ایجادشده و فایل‌های آپلودی را به طور دائم از سرورهای سیستم حذف نمایید. جهت اعمال حق درخواست حذف مستقیم، می‌توانید از طریق بخش پروفایل یا ایمیل پشتیبانی اقدام نمایید.
                    </p>
                </section>

                <section className="space-y-2 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                    <h2 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        ۵. تماس با مسئول حفاظت از داده‌ها (DPO)
                    </h2>
                    <p className="text-xs text-zinc-400">
                        برای هرگونه سوال، استعلام یا اعمال حقوق حریم خصوصی و حذف اطلاعات، می‌توانید مستقیماً با آدرس پشتیبانی ما در تماس باشید:
                    </p>
                    <div className="pt-1">
                        <a
                            href="mailto:support@titipool.ir"
                            className="text-amber-400 hover:text-amber-300 font-mono font-bold text-xs inline-flex items-center gap-1.5"
                            dir="ltr"
                        >
                            <span>support@titipool.ir</span>
                        </a>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default PrivacyPolicyPage;