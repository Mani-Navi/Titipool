import React, { useEffect, useState, useRef, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../stores/auth.store';
import { isTokenExpired } from '../../utils/jwt';
import { usePageTitle } from '../../hooks/usePageTitle';

import { Navbar } from '../../components/landing/Navbar';
import { Hero } from '../../components/landing/Hero';
import { BigStatement } from '../../components/landing/BigStatement';
import { TestimonialsSection } from '../../components/landing/TestimonialsSection';
import { GameMasterSection } from '../../components/landing/GameMasterSection';
import { PlayerSection } from '../../components/landing/PlayerSection';
import { FeaturesSequence } from '../../components/landing/FeaturesSequence';
import { HowItWorks } from '../../components/landing/HowItWorks';
import { PersianBrandSection } from '../../components/landing/PersianBrandSection';
import { FaqSection } from '../../components/landing/FaqSection';
import { FinalCta } from '../../components/landing/FinalCta';
import { Footer } from '../../components/landing/Footer';
import { StickyMobileCTA } from '../../components/landing/StickyMobileCTA';

const DiceSection = lazy(() =>
    import('../../components/landing/DiceSection').then((m) => ({
        default: m.DiceSection || m.default,
    }))
);

export default function LandingPage() {
    usePageTitle("میز مجازی بازی‌های رومیزی و D&D");
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);

    const [shouldLoadDice, setShouldLoadDice] = useState(false);
    const diceTriggerRef = useRef(null);

    const isSessionValid = Boolean(isAuthenticated && token && !isTokenExpired(token));

    useEffect(() => {
        if (token && isTokenExpired(token)) {
            useAuthStore.getState().logout?.();
        }
    }, [token]);

    useEffect(() => {
        if (document.body.classList.contains('overflow-hidden')) {
            document.body.classList.remove('overflow-hidden');
        }
    }, []);

    // بارگذاری ماژول سه‌بعدی فقط با اسکرول کاربر یا کلیک روی کارت پیش‌نمایش
    useEffect(() => {
        if (shouldLoadDice) return;

        let loaded = false;
        const triggerLoad = () => {
            if (loaded) return;
            loaded = true;
            setShouldLoadDice(true);
            cleanup();
        };

        const onFirstScrollOrTouch = () => {
            if (window.scrollY > 40) {
                triggerLoad();
            }
        };

        const cleanup = () => {
            window.removeEventListener('scroll', onFirstScrollOrTouch);
            window.removeEventListener('touchmove', triggerLoad);
        };

        window.addEventListener('scroll', onFirstScrollOrTouch, { passive: true });
        window.addEventListener('touchmove', triggerLoad, { passive: true, once: true });

        return cleanup;
    }, [shouldLoadDice]);

    const handleStartGame = () => {
        if (isSessionValid) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    const handleOpenAuth = () => {
        navigate('/login');
    };

    const handleOpenProfile = () => {
        navigate('/profile');
    };

    const handleOpenRoomCode = () => {
        if (isSessionValid) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    const handleDiceExplore = () => {
        setShouldLoadDice(true);
        setTimeout(() => {
            const el = document.getElementById('dice');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    };

    return (
        <div className="w-full min-h-screen bg-white text-[#121316] flex flex-col items-center justify-start overflow-x-hidden selection:bg-[#f59e0b] selection:text-black pb-14 md:pb-0">
            <div className="w-full flex flex-col relative">
                <Navbar
                    onOpenAuth={handleOpenAuth}
                    onOpenProfile={handleOpenProfile}
                    onOpenRoomCode={handleOpenRoomCode}
                    onStartGame={handleStartGame}
                    user={isSessionValid ? user : null}
                />

                <main id="main-content" role="main" className="w-full flex flex-col items-center">
                    <Hero
                        user={isSessionValid ? user : null}
                        onStartGame={handleStartGame}
                        onExploreMore={handleDiceExplore}
                        onDiceClick={handleDiceExplore}
                    />

                    <BigStatement />

                    <div ref={diceTriggerRef} id="dice" className="w-full">
                        {shouldLoadDice ? (
                            <Suspense
                                fallback={
                                    <div className="w-full h-96 flex items-center justify-center bg-[#090a10] text-amber-400 font-bold text-xs rounded-3xl max-w-6xl mx-auto my-8" dir="rtl">
                                        در حال آماده‌سازی استیج ۳بعدی تاس...
                                    </div>
                                }
                            >
                                <DiceSection />
                            </Suspense>
                        ) : (
                            <div
                                onClick={() => setShouldLoadDice(true)}
                                className="w-full max-w-6xl mx-auto my-12 px-4 cursor-pointer"
                                dir="rtl"
                            >
                                <div className="w-full h-64 rounded-3xl bg-[#090a10] border border-[#242738] flex flex-col items-center justify-center gap-3 text-center p-6 shadow-xl">
                                    <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">REAL 3D RAPIER PHYSICS</span>
                                    <h3 className="text-xl sm:text-2xl font-black text-white">میز پرتاب تاس سه‌بعدی فیزیکی</h3>
                                    <span className="px-5 py-2 rounded-full bg-amber-500 text-zinc-950 font-bold text-xs shadow-md">
                                        برای فعال‌سازی استیج سه‌بعدی اسکرول یا کلیک کنید
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <TestimonialsSection />

                    <GameMasterSection />

                    <PlayerSection />

                    <FeaturesSequence />

                    <HowItWorks onStartGame={handleStartGame} />

                    <PersianBrandSection />

                    <FaqSection />

                    <FinalCta
                        onStartGame={handleStartGame}
                        onOpenAuth={handleOpenAuth}
                    />
                </main>

                <Footer />

                <StickyMobileCTA
                    isSessionValid={isSessionValid}
                    onStartGame={handleStartGame}
                    onLogin={handleOpenAuth}
                />
            </div>
        </div>
    );
}