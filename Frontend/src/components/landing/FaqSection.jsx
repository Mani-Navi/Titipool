import React, { memo } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { GsapHeadingReveal } from "./GsapHeadingReveal";

const FAQ_ITEMS = Object.freeze([
    {
        q: "میز مجازی تیتی‌پول (Titipool VTT) چیست و چه تفاوتی با Roll20 دارد؟",
        a: "تیتی‌پول اولین میز بازی مجازی (Virtual Tabletop) است که از ریشه برای زبان فارسی (RTL) مهندسی شده است. برخلاف Roll20 که منوهای پیچیده و سنگینی دارد، تیتی‌پول با الهام از سادگی Owlbear Rodeo طراحی شده تا در کمتر از ۳۰ ثانیه بتوانید نقشه بارگذاری کنید، توکن بچینید، تاس سه‌بعدی بیندازید و با صدای زنده بازی کنید.",
    },
    {
        q: "آیا استفاده از تیتی‌پول رایگان است و نیاز به نصب برنامه دارد؟",
        a: "بله، استفاده از تیتی‌پول کاملاً رایگان است و مستقیماً داخل مرورگر (روی کامپیوتر، تبلت و موبایل) اجرا می‌شود؛ بنابراین نیازی به دانلود یا نصب هیچ نرم‌افزار سنگینی ندارید.",
    },
    {
        q: "چگونه می‌توانم به عنوان بازیکن وارد اتاق دانجن‌مستر (GM) شوم؟",
        a: "کافی است کد دعوت ۶ کاراکتری اتاق (مثلاً 75B4EE) یا لینک مستقیم دعوت را از دانجن‌مستر خود بگیرید و در داشبورد روی دکمه «ورود با کد» کلیک کنید تا مستقیماً وارد میز بازی شوید.",
    },
    {
        q: "آیا برای چت صوتی حین بازی نیاز به دیسکورد یا نرم‌افزار جانبی داریم؟",
        a: "خیر؛ تیتی‌پول دارای سیستم چت صوتی داخلی مبتنی بر LiveKit SFU و کدک کم‌مصرف Opus است. در داخل اتاق بازی تنها با نگه‌داشتن یا زدن کلید Space می‌توانید بدون تاخیر با هم‌تیمی‌های خود صحبت کنید.",
    },
    {
        q: "سیستم پرتاب تاس سه‌بعدی و خط‌کش تیتی‌پول از چه قوانینی پشتیبانی می‌کند؟",
        a: "موتور تاس سه‌بعدی از تمام تاس‌های استاندارد نقش‌آفرینی (D2، D4، D6، Fudge، D8، D10، D12، D20، D100 و D1000) با فیزیک واقعی برخورد پشتیبانی می‌کند. همچنین ابزار خط‌کش دارای ۴ حالت محاسبه مسافت شامل قانون استاندارد D&D 5e (۵-۱۰-۵ فوت)، قانون D&D 3.5e، اقلیدسی و منهتن است.",
    },
]);

export const FaqSection = memo(() => {
    return (
        <section id="faq" className="py-16 sm:py-24 px-4 sm:px-8 w-full max-w-4xl mx-auto" dir="rtl">
            <GsapHeadingReveal
                eyebrow="پاسخ به پرسش‌های پرتکرار · FAQ"
                lines={["هر آنچه باید درباره", "میز مجازی تیتی‌پول بدانید."]}
                subtitle="پاسخ صریح به سوالات متداول دانجن‌مسترها و بازیکنان تازه‌وارد."
                containerClassName="max-w-2xl mx-auto mb-10 sm:mb-14 text-center"
            />

            <div className="space-y-3 text-right">
                {FAQ_ITEMS.map((item, idx) => (
                    <details
                        key={idx}
                        className="group rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/90 p-4 sm:p-5 transition-all"
                    >
                        <summary className="flex items-center justify-between gap-3 cursor-pointer list-none font-bold text-xs sm:text-sm text-neutral-900">
                            <span className="flex items-center gap-2.5">
                                <HelpCircle className="w-4 h-4 text-[#f59e0b] shrink-0" aria-hidden="true" />
                                <span>{item.q}</span>
                            </span>
                            <ChevronDown className="w-4 h-4 text-neutral-500 transition-transform duration-200 group-open:rotate-180 shrink-0" />
                        </summary>
                        <p className="mt-3 pt-3 border-t border-neutral-200/70 text-xs sm:text-sm text-neutral-700 leading-relaxed pr-6">
                            {item.a}
                        </p>
                    </details>
                ))}
            </div>
        </section>
    );
});

FaqSection.displayName = "FaqSection";
export default FaqSection;