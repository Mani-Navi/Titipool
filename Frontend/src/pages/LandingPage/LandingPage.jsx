import React, { useEffect, useState, useRef, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
import { FinalCta } from '../../components/landing/FinalCta';
import { Footer } from '../../components/landing/Footer';
import { StickyMobileCTA } from '../../components/landing/StickyMobileCTA';

// لود تنبل استیج سه‌بعدی تاس از مسیر لندینگ
const DiceSection = lazy(() =>
    import('../../components/landing/DiceSection').then((m) => ({
        default: m.DiceSection || m.default,
    }))
);

gsap.registerPlugin(ScrollTrigger);

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
        document.documentElement.style.overflowY = 'auto';
        document.documentElement.style.height = 'auto';
        document.body.style.overflowY = 'auto';
        document.body.style.height = 'auto';

        const timer = setTimeout(() => {
            ScrollTrigger.refresh();
        }, 250);

        return () => {
            clearTimeout(timer);
        };
    }, []);

    // مشاهده‌گر تقاطع برای استیج ۳بعدی
    useEffect(() => {
        if (!diceTriggerRef.current || shouldLoadDice) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setShouldLoadDice(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '400px' }
        );

        observer.observe(diceTriggerRef.current);
        return () => observer.disconnect();
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
        const el = document.getElementById('dice');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
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

                    <div ref={diceTriggerRef} className="w-full">
                        {shouldLoadDice ? (
                            <Suspense
                                fallback={
                                    <div className="w-full h-96 flex items-center justify-center bg-[#090a10] text-amber-400 font-bold text-xs" dir="rtl">
                                        در حال آماده‌سازی استیج ۳بعدی تاس...
                                    </div>
                                }
                            >
                                <DiceSection />
                            </Suspense>
                        ) : (
                            <div className="w-full h-32 bg-transparent pointer-events-none" />
                        )}
                    </div>

                    {/* سکشن جدید و جذاب نظرات ماجراجویان */}
                    <TestimonialsSection />

                    <GameMasterSection />

                    <PlayerSection />

                    <FeaturesSequence />

                    <HowItWorks onStartGame={handleStartGame} />

                    <PersianBrandSection />

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