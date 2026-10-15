import React, { memo } from "react";
import { Link } from "react-router-dom";
import { Shield, FileText, Cookie, RotateCcw, Mail } from "lucide-react";

export const Footer = memo(() => {
    const currentYear = new Date().getFullYear();

    return (
        <footer
            className="w-full shrink-0 relative bg-gradient-to-b from-transparent via-[#090a0f]/80 to-[#090a0f] backdrop-blur-xl py-5 px-4 sm:px-8 mt-auto z-20 text-right"
            dir="rtl"
            role="contentinfo"
        >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-px bg-gradient-to-r from-transparent via-zinc-800/80 to-transparent pointer-events-none" aria-hidden="true" />

            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3.5 sm:gap-4 text-[11px] sm:text-xs">
                <div className="flex items-center gap-2 text-zinc-400">
                    <span className="font-bold tracking-wide text-zinc-300">
                        Titipool <span className="text-amber-400/90 font-mono text-[10px] font-normal">VTT</span>
                    </span>
                    <span className="text-zinc-700 select-none">•</span>
                    <span className="text-zinc-500 text-[10px] sm:text-[11px]">
                        © {currentYear} تمامی حقوق محفوظ است
                    </span>
                </div>

                <nav className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 text-zinc-400" aria-label="پیوندهای حقوقی">
                    <Link
                        to="/terms-of-service"
                        className="px-2.5 py-1 rounded-lg hover:text-amber-300 hover:bg-zinc-900/60 transition-all duration-150 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                    >
                        <FileText className="w-3 h-3 text-zinc-500" aria-hidden="true" />
                        <span>قوانین و شرایط</span>
                    </Link>

                    <Link
                        to="/privacy-policy"
                        className="px-2.5 py-1 rounded-lg hover:text-amber-300 hover:bg-zinc-900/60 transition-all duration-150 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                    >
                        <Shield className="w-3 h-3 text-zinc-500" aria-hidden="true" />
                        <span>حریم خصوصی</span>
                    </Link>

                    <Link
                        to="/cookie-policy"
                        className="px-2.5 py-1 rounded-lg hover:text-amber-300 hover:bg-zinc-900/60 transition-all duration-150 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                    >
                        <Cookie className="w-3 h-3 text-zinc-500" aria-hidden="true" />
                        <span>کوکی‌ها</span>
                    </Link>

                    <Link
                        to="/refund-policy"
                        className="px-2.5 py-1 rounded-lg hover:text-amber-300 hover:bg-zinc-900/60 transition-all duration-150 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                    >
                        <RotateCcw className="w-3 h-3 text-zinc-500" aria-hidden="true" />
                        <span>بازگشت وجه</span>
                    </Link>
                </nav>

                <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] sm:text-[11px] font-mono bg-zinc-900/40 border border-zinc-800/60 px-2.5 py-1 rounded-full">
                    <Mail className="w-3 h-3 text-amber-500/70" aria-hidden="true" />
                    <span>پشتیبانی:</span>
                    <a
                        href="mailto:support@titipool.ir"
                        className="text-zinc-300 hover:text-amber-400 transition-colors duration-150"
                    >
                        support@titipool.ir
                    </a>
                </div>
            </div>
        </footer>
    );
});

Footer.displayName = "Footer";
export default Footer;