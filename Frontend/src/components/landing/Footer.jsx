import React from 'react';
import { Link } from 'react-router-dom';
import { Dices, Mail } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="border-t border-neutral-200/80 bg-white py-14 sm:py-20 px-6 sm:px-12 text-right" dir="rtl">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                    <div className="max-w-sm">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-[#0e1017] border border-[#262835] flex items-center justify-center text-[#f59e0b]">
                                <Dices className="w-4 h-4" />
                            </div>
                            <span className="text-lg font-black text-neutral-900 tracking-tight">
                                Titipool
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 leading-relaxed">
                            میز بازی مجازی برای تجربه بازی‌های نقش‌آفرینی فارسی. بدون نیاز به نصب، طراحی‌شده با استانداردهای مدرن وب.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-12 sm:gap-16 text-xs">
                        <div>
                            <h4 className="font-bold text-neutral-900 mb-3">پلتفرم</h4>
                            <ul className="space-y-2 text-neutral-500 font-medium">
                                <li>
                                    <a href="#hero" className="hover:text-neutral-900 transition-colors">
                                        خانه
                                    </a>
                                </li>
                                <li>
                                    <a href="#dice" className="hover:text-neutral-900 transition-colors">
                                        تاس‌ها
                                    </a>
                                </li>
                                <li>
                                    <a href="#scenarios" className="hover:text-neutral-900 transition-colors">
                                        سناریوها
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-neutral-900 mb-3">قوانین و امنیت</h4>
                            <ul className="space-y-2 text-neutral-500 font-medium">
                                <li>
                                    <Link to="/privacy-policy" className="hover:text-neutral-900 transition-colors">
                                        حریم خصوصی
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/terms-of-service" className="hover:text-neutral-900 transition-colors">
                                        شرایط استفاده
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/cookie-policy" className="hover:text-neutral-900 transition-colors">
                                        خط‌مشی کوکی‌ها
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/refund-policy" className="hover:text-neutral-900 transition-colors">
                                        قوانین بازگشت وجه
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-neutral-900 mb-3">ارتباط و پشتیبانی</h4>
                            <ul className="space-y-2 text-neutral-500 font-medium">
                                <li>
                                    <a
                                        href="mailto:support@titipool.ir"
                                        className="hover:text-neutral-900 transition-colors inline-flex items-center gap-1.5 font-mono text-[11px]"
                                        dir="ltr"
                                    >
                                        <Mail className="w-3.5 h-3.5 text-[#f59e0b]" />
                                        <span>support@titipool.ir</span>
                                    </a>
                                </li>
                                <li className="text-[11px] text-neutral-400">
                                    پاسخگویی روزهای کاری
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
                    <span>© 2026 Titipool . تمامی حقوق محفوظ است.</span>
                    <div className="flex items-center gap-4">
                        <span className="font-mono">پلتفرم امن بازی رومیزی</span>
                        <span>·</span>
                        <a href="mailto:support@titipool.ir" className="hover:underline font-mono">
                            support@titipool.ir
                        </a>
                        <span>·</span>
                        <span>ارتباط رمزنگاری‌شده سرتاسری</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;