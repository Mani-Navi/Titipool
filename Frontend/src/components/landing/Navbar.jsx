import React, { useState, useEffect, memo } from 'react';
import { Dices, Key, ArrowUpRight, Menu, X } from 'lucide-react';
import { sound } from '../../utils/tableAudio';
import { RpgAvatar } from '../profile/RpgAvatar';

const NAV_LINKS = Object.freeze([
    { id: 'reveal', label: 'محصول' },
    { id: 'dice', label: 'تاس‌ها' },
    { id: 'scenarios', label: 'سناریوها' },
    { id: 'features', label: 'امکانات' },
    { id: 'how-it-works', label: 'نحوه کار' },
]);

const SECTIONS_TO_CHECK = Object.freeze([
    'hero',
    'reveal',
    'statement',
    'dice',
    'scenarios',
    'gm',
    'features',
    'how-it-works',
]);

export const Navbar = memo(({
                                onOpenAuth,
                                onOpenProfile,
                                onOpenRoomCode,
                                onStartGame,
                                user,
                            }) => {
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('hero');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        let ticking = false;

        const updateScrollState = () => {
            const isScrolled = window.scrollY > 40;
            setScrolled(isScrolled);

            for (let i = 0; i < SECTIONS_TO_CHECK.length; i++) {
                const sectionId = SECTIONS_TO_CHECK[i];
                const el = document.getElementById(sectionId);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top <= 200 && rect.bottom >= 200) {
                        setActiveSection(sectionId);
                        break;
                    }
                }
            }
            ticking = false;
        };

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(updateScrollState);
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const displayName = user
        ? (user.displayName || user.username || user.name || (user.email ? user.email.split('@')[0] : 'کاربر'))
        : '';

    const handleMobileNavClick = (id) => {
        sound.playTokenClick();
        setIsMobileMenuOpen(false);
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <header
            className="sticky top-2 sm:top-5 z-40 w-full transition-all duration-300 px-2.5 sm:px-6"
            dir="rtl"
        >
            <div
                className={`max-w-[1240px] mx-auto rounded-2xl sm:rounded-full transition-all duration-300 flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 ${
                    scrolled
                        ? 'bg-white/95 backdrop-blur-md border border-neutral-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
                        : 'bg-white/70 backdrop-blur-sm border border-neutral-200/50'
                }`}
            >
                {/* لوگو و نام پلتفرم با برچسب استاندارد دسترسی‌پذیری */}
                <a
                    href="#hero"
                    onClick={() => sound.playTokenClick()}
                    aria-label="صفحه اصلی Titipool VTT"
                    className="flex items-center gap-2 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg"
                >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0e1017] border border-[#262835] flex items-center justify-center text-[#f59e0b] shadow-sm transition-transform duration-200 group-hover:scale-105" aria-hidden="true">
                        <Dices className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-sm sm:text-lg font-black tracking-tight text-neutral-900">
                            Titipool
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#ea580c] uppercase">
                            VTT
                        </span>
                    </div>
                </a>

                {/* منوی ناوبری دسکتاپ */}
                <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-neutral-700" aria-label="ناوبری اصلی">
                    {NAV_LINKS.map((link) => {
                        const isActive = activeSection === link.id;
                        return (
                            <a
                                key={link.id}
                                href={`#${link.id}`}
                                onClick={() => sound.playTokenClick()}
                                className={`transition-colors relative py-1 ${
                                    isActive ? 'text-neutral-950 font-bold' : 'hover:text-neutral-950'
                                }`}
                            >
                                {link.label}
                                {isActive && (
                                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#f59e0b] rounded-full" />
                                )}
                            </a>
                        );
                    })}
                </nav>

                {/* دکمه‌های اکشن */}
                <div className="flex items-center gap-1.5 sm:gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            sound.playTokenClick();
                            onOpenRoomCode();
                        }}
                        aria-label="ورود به اتاق با کد دعوت"
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100/80 transition-colors cursor-pointer"
                        title="ورود مستقیم به اتاق با کد"
                    >
                        <Key className="w-3.5 h-3.5 text-[#f59e0b]" aria-hidden="true" />
                        <span>ورود با کد</span>
                    </button>

                    {user ? (
                        <button
                            type="button"
                            onClick={() => {
                                sound.playTokenClick();
                                onOpenProfile();
                            }}
                            className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 pr-1 sm:pr-1.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-xs font-bold text-neutral-800 transition-colors cursor-pointer border border-neutral-200/70 shadow-sm active:scale-95"
                            aria-label={`پروفایل ${displayName}`}
                            title={`پروفایل ${displayName}`}
                        >
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden bg-zinc-900 border border-amber-500/40 shrink-0 flex items-center justify-center">
                                <RpgAvatar avatarId={user.avatarUrl || "cowboy"} className="w-full h-full object-cover" />
                            </div>
                            <span className="max-w-[70px] sm:max-w-[120px] truncate font-bold text-neutral-900 text-[11px] sm:text-xs">
                                {displayName}
                            </span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                sound.playTokenClick();
                                onOpenAuth();
                            }}
                            aria-label="ورود به حساب کاربری"
                            className="text-xs font-bold text-neutral-800 hover:text-neutral-950 px-2 py-1.5 transition-colors cursor-pointer"
                        >
                            ورود
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            sound.playDiceRoll();
                            onStartGame();
                        }}
                        aria-label="شروع بازی در میز مجازی"
                        className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs sm:text-[13px] shadow-[0_2px_12px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.18)] transition-all cursor-pointer group active:scale-[0.96]"
                    >
                        <span>شروع بازی</span>
                        <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            sound.playTokenClick();
                            setIsMobileMenuOpen(!isMobileMenuOpen);
                        }}
                        className="md:hidden w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 flex items-center justify-center text-neutral-800 transition-colors active:scale-95"
                        aria-label={isMobileMenuOpen ? "بستن منوی سایت" : "باز کردن منوی سایت"}
                    >
                        {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden mt-2 p-4 rounded-2xl bg-white/95 backdrop-blur-2xl border border-neutral-200/80 shadow-2xl animate-fade-in-up text-right">
                    <nav className="flex flex-col space-y-1 pb-3 border-b border-neutral-100" aria-label="منوی ناوبری موبایل">
                        {NAV_LINKS.map((link) => (
                            <button
                                key={link.id}
                                type="button"
                                onClick={() => handleMobileNavClick(link.id)}
                                className="w-full py-2.5 px-3 rounded-xl text-right text-xs font-bold text-neutral-800 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
                            >
                                {link.label}
                            </button>
                        ))}
                    </nav>

                    <div className="pt-3">
                        <button
                            type="button"
                            onClick={() => {
                                sound.playTokenClick();
                                setIsMobileMenuOpen(false);
                                onOpenRoomCode();
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-bold flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                        >
                            <span className="flex items-center gap-2">
                                <Key className="w-3.5 h-3.5 text-[#f59e0b]" />
                                <span>ورود مستقیم به اتاق با کد</span>
                            </span>
                            <span className="text-[10px] text-amber-700">سریع</span>
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
});

Navbar.displayName = "Navbar";
export default Navbar;