import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { RotateCcw, Sparkles, Trash2, Dices, Zap, ChevronDown, ChevronUp, Coins, User, X } from 'lucide-react';

import { GsapHeadingReveal } from './GsapHeadingReveal';
import { DiceCanvas } from '../../features/dice/components/DiceCanvas';
import { useDiceStore } from '../../features/dice/state/dice.store';
import { DICE_THEMES } from '../../features/dice/engine/textureGenerator';
import { diceAudio } from '../../features/dice/engine/diceAudio';
import { cn } from '../../utils/cn';

const ALL_DICE_LANDING = Object.freeze([
    { type: 'd2', label: 'D2 سکه', maxVal: 2, icon: Coins },
    { type: 'd4', label: 'D4', maxVal: 4 },
    { type: 'd6', label: 'D6', maxVal: 6 },
    { type: 'fudge', label: 'Fudge', maxVal: 1 },
    { type: 'd8', label: 'D8', maxVal: 8 },
    { type: 'd10', label: 'D10', maxVal: 9 },
    { type: 'd12', label: 'D12', maxVal: 12 },
    { type: 'd20', label: 'D20', maxVal: 20 },
    { type: 'd100', label: 'D100', maxVal: 100 },
    { type: 'd1000', label: 'D1000', maxVal: 900 },
]);

export const DiceSection = memo(() => {
    const isRolling = useDiceStore((s) => s.isRolling);
    const results = useDiceStore((s) => s.results);
    const totalSum = useDiceStore((s) => s.totalSum);
    const triggerRoll = useDiceStore((s) => s.triggerRoll);
    const clearDice = useDiceStore((s) => s.clearDice);
    const setOpen = useDiceStore((s) => s.setOpen);
    const selectedTheme = useDiceStore((s) => s.selectedTheme);
    const setSelectedTheme = useDiceStore((s) => s.setSelectedTheme);

    const [mode, setMode] = useState('quick');
    const [dicePool, setDicePool] = useState([]);
    const [lastRollSpecs, setLastRollSpecs] = useState([{ type: 'd12', theme: selectedTheme }]);
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const playedCritAudioRef = useRef(false);

    const isAnyCritical = useMemo(() => {
        if (results.length === 0 || isRolling) return false;
        return results.some((r) => {
            const config = ALL_DICE_LANDING.find((d) => d.type === r.type);
            if (!config) return false;
            if (r.type === 'd10') return r.value === 0 || r.value === 9;
            return r.value === config.maxVal;
        });
    }, [results, isRolling]);

    useEffect(() => {
        if (isAnyCritical && !playedCritAudioRef.current) {
            diceAudio.playCriticalSuccess();
            playedCritAudioRef.current = true;
        }
        if (isRolling) {
            playedCritAudioRef.current = false;
        }
    }, [isAnyCritical, isRolling]);

    useEffect(() => {
        const timer = setTimeout(() => {
            triggerRoll([{ type: 'd12', theme: selectedTheme }]);
        }, 800);

        return () => {
            clearTimeout(timer);
            clearDice();
            setOpen(false);
        };
    }, [triggerRoll, clearDice, setOpen, selectedTheme]);

    const handleQuickRoll = useCallback((type) => {
        let specs = [];
        if (type === 'd100') {
            specs = [
                { type: 'd100', theme: selectedTheme },
                { type: 'd10', theme: selectedTheme },
            ];
        } else {
            specs = [{ type, theme: selectedTheme }];
        }
        setLastRollSpecs(specs);
        triggerRoll(specs);
    }, [selectedTheme, triggerRoll]);

    const handleAddDieToPool = useCallback((type) => {
        setDicePool((prev) => [
            ...prev,
            {
                id: `landing-pool-${Date.now()}-${Math.random()}`,
                type,
                theme: selectedTheme,
            },
        ]);
    }, [selectedTheme]);

    const handleRemoveDieFromPool = useCallback((index, e) => {
        e.stopPropagation();
        setDicePool((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleClearPool = useCallback(() => {
        setDicePool([]);
    }, []);

    const handleRollPool = useCallback(() => {
        if (dicePool.length === 0) return;
        setLastRollSpecs(dicePool);
        triggerRoll(dicePool);
    }, [dicePool, triggerRoll]);

    const handleReRoll = useCallback(() => {
        if (lastRollSpecs.length > 0) {
            triggerRoll(lastRollSpecs);
        } else {
            triggerRoll([{ type: 'd12', theme: selectedTheme }]);
        }
    }, [lastRollSpecs, selectedTheme, triggerRoll]);

    const handleContainerPointerLeave = useCallback(() => {
        try {
            window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
        } catch {}
    }, []);

    const formatDieDisplayValue = (r) => {
        if (r.type === 'd2') return r.value === 1 ? '1' : '2';
        if (r.type === 'fudge') {
            if (r.value > 0) return '+';
            if (r.value < 0) return '−';
            return '0';
        }
        if (r.type === 'd1000') return String(r.value).padStart(3, '0');
        return r.value;
    };

    return (
        <section id="dice" className="py-14 sm:py-28 px-3 sm:px-8 overflow-hidden w-full" dir="rtl">
            <div className="max-w-6xl mx-auto">
                <GsapHeadingReveal
                    eyebrow="موتور فیزیک سه‌بعدی · REAL 3D RAPIER PHYSICS"
                    lines={['پرتاب واقعی،', 'درست مثل دور میز نبرد.']}
                    subtitle="با ماوس یا لمس صفحه تاس‌ها را بردارید و پرتاب کنید. فیزیک قطعی، صداگذاری چوب و بافت مرمر دست‌ساز."
                    containerClassName="max-w-2xl mx-auto mb-8 sm:mb-14"
                />

                <div
                    onPointerLeave={handleContainerPointerLeave}
                    className="relative rounded-3xl bg-[#090a10] border border-[#242738] shadow-[0_30px_90px_rgba(0,0,0,0.25)] h-[520px] sm:h-[580px] overflow-hidden select-none isolate"
                >
                    <div className="absolute inset-0" style={{ touchAction: 'none' }}>
                        <DiceCanvas />
                    </div>

                    {/* بنر نتایج چندستونه و بدون تداخل رقم و متن */}
                    {results.length > 0 && (
                        <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-1.5 z-20 max-w-[95vw] sm:max-w-xl w-auto animate-fade-in-up">
                            <div
                                className={cn(
                                    "flex flex-col gap-2 p-3 sm:p-3.5 rounded-3xl backdrop-blur-2xl transition-all duration-300 shadow-2xl w-full border",
                                    isAnyCritical
                                        ? "bg-gradient-to-b from-amber-950/95 via-zinc-950/95 to-zinc-950/95 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.45)]"
                                        : "bg-zinc-950/95 border-zinc-800 shadow-[0_12px_45px_rgba(0,0,0,0.8)]"
                                )}
                            >
                                <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 pb-2">
                                    <div className="flex items-center gap-2">
                                        {isAnyCritical && (
                                            <div className="flex items-center gap-1 text-amber-300 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/50 animate-pulse">
                                                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                                                <span>کریتیکال!</span>
                                            </div>
                                        )}

                                        <span className="text-zinc-400 text-xs font-semibold">مجموع امتیاز:</span>

                                        <span
                                            className={cn(
                                                "text-2xl font-black font-mono tracking-tight",
                                                isRolling
                                                    ? "text-zinc-500 animate-pulse"
                                                    : isAnyCritical
                                                        ? "text-amber-300 drop-shadow-[0_0_15px_rgba(252,211,77,0.85)]"
                                                        : "text-amber-400"
                                            )}
                                        >
                                            {totalSum}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={handleReRoll}
                                            className="p-1.5 text-zinc-400 hover:text-amber-300 rounded-xl hover:bg-zinc-900 active:scale-90 transition-all cursor-pointer"
                                            title="پرتاب مجدد"
                                            aria-label="پرتاب مجدد"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => clearDice()}
                                            className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-xl hover:bg-zinc-900 active:scale-90 transition-all cursor-pointer"
                                            title="بستن"
                                            aria-label="بستن نتایج"
                                        >
                                            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
                                    {results.map((r) => {
                                        const themeCfg = DICE_THEMES[r.theme] || DICE_THEMES.midnight;
                                        return (
                                            <div
                                                key={r.id}
                                                dir="ltr"
                                                className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 text-xs gap-2"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                                                        style={{ background: themeCfg.bgCenter }}
                                                    />
                                                    <span className="font-mono font-bold text-[10px] text-zinc-400 uppercase bg-zinc-950 px-1.5 py-0.5 rounded">
                                                        {r.type}
                                                    </span>
                                                </div>

                                                <span className="font-mono font-black text-sm text-amber-300">
                                                    {formatDieDisplayValue(r)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* داک کنترل کنسولی مجهز به دکمه جمع و باز شدن */}
                    <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-1.5 z-20 w-full px-2.5 sm:px-4 max-w-xl transition-all duration-300">
                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="px-3.5 py-1 rounded-full bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-zinc-300 hover:text-amber-400 text-[10px] font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md active:scale-95 transition-all cursor-pointer"
                        >
                            <span>{isMenuOpen ? 'بستن منو' : 'باز کردن منوی تاس'}</span>
                            {isMenuOpen ? <ChevronDown className="w-3.5 h-3.5 text-amber-400" /> : <ChevronUp className="w-3.5 h-3.5 text-amber-400" />}
                        </button>

                        {isMenuOpen && (
                            <div className="w-full flex flex-col gap-1.5 animate-fade-in-up">
                                {/* استخر تاس‌های چندرنگ */}
                                {mode === 'pool' && dicePool.length > 0 && (
                                    <div className="bg-zinc-950/95 border border-amber-500/30 p-2 sm:p-2.5 rounded-2xl shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-3 w-full">
                                        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto max-h-24 pr-1 custom-scrollbar" dir="ltr">
                                            {dicePool.map((item, idx) => {
                                                const tCfg = DICE_THEMES[item.theme] || DICE_THEMES.midnight;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        dir="ltr"
                                                        onClick={(e) => handleRemoveDieFromPool(idx, e)}
                                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono font-bold cursor-pointer"
                                                    >
                                                        <span
                                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                                            style={{ background: tCfg.bgCenter }}
                                                        />
                                                        <span className="uppercase text-[11px]">{item.type}</span>
                                                        <span className="text-[10px] text-zinc-500 font-sans ml-0.5">×</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 border-r border-zinc-800 pr-2">
                                            <button
                                                type="button"
                                                onClick={handleClearPool}
                                                className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-900"
                                                aria-label="پاکسازی استخر"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleRollPool}
                                                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-black text-xs shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer border border-amber-300"
                                            >
                                                <Dices className="w-4 h-4" />
                                                <span>پرتاب ({dicePool.length})</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* داک دو سطری */}
                                <div className="w-full bg-zinc-950/95 border border-zinc-800/90 p-2 sm:p-2.5 rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col gap-2">
                                    {/* سطر اول: کپسول‌های ۱۰گانه تاس */}
                                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5" dir="ltr">
                                        {ALL_DICE_LANDING.map((d) => {
                                            const inPool = dicePool.filter((item) => item.type === d.type).length;
                                            const IconComp = d.icon;
                                            return (
                                                <button
                                                    key={d.type}
                                                    type="button"
                                                    onClick={() => {
                                                        if (mode === 'quick') {
                                                            handleQuickRoll(d.type);
                                                        } else {
                                                            handleAddDieToPool(d.type);
                                                        }
                                                    }}
                                                    className="relative py-2 px-2.5 sm:px-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 text-amber-300 font-mono text-[11px] sm:text-xs font-bold transition-all active:scale-90 cursor-pointer shadow-sm flex items-center gap-1 shrink-0"
                                                >
                                                    <span>{d.label}</span>
                                                    {IconComp && <IconComp className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                                                    {mode === 'pool' && inPool > 0 && (
                                                        <span className="w-3.5 h-3.5 bg-amber-500 text-zinc-950 text-[9px] font-sans font-black rounded-full flex items-center justify-center -mr-1 shadow-sm">
                                                            {inPool}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* سطر دوم: تم‌ها و کنترل‌ها */}
                                    <div className="flex items-center justify-between pt-1 border-t border-zinc-850 px-1" dir="ltr">
                                        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800">
                                            {Object.values(DICE_THEMES).map((t) => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setSelectedTheme(t.id)}
                                                    className={cn(
                                                        "w-5 h-5 rounded-full transition-transform active:scale-75 cursor-pointer",
                                                        selectedTheme === t.id ? "ring-2 ring-amber-400 scale-110 shadow-sm" : "opacity-60 hover:opacity-100"
                                                    )}
                                                    style={{
                                                        background: `linear-gradient(135deg, ${t.bgCenter} 0%, ${t.bgEdge} 100%)`,
                                                        border: `1.5px solid ${t.borderColor || '#ca8a04'}`,
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-xl border border-zinc-800">
                                                <button
                                                    type="button"
                                                    onClick={() => setMode('quick')}
                                                    className={cn(
                                                        "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95",
                                                        mode === 'quick' ? "bg-amber-500 text-zinc-950" : "text-zinc-400"
                                                    )}
                                                    title="پرتاب تکی"
                                                >
                                                    <Zap className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMode('pool')}
                                                    className={cn(
                                                        "p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95",
                                                        mode === 'pool' ? "bg-amber-500 text-zinc-950" : "text-zinc-400"
                                                    )}
                                                    title="پرتاب چندتایی"
                                                >
                                                    <Dices className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    clearDice();
                                                    setDicePool([]);
                                                }}
                                                className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-xl bg-zinc-900/90 border border-zinc-800 active:scale-90 transition-all cursor-pointer"
                                                title="پاکسازی میز"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
});

DiceSection.displayName = "DiceSection";
export default DiceSection;