import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { RotateCcw, Sparkles, Trash2, Dices, Zap, ChevronDown, ChevronUp } from 'lucide-react';

import { GsapHeadingReveal } from './GsapHeadingReveal';
import { DiceCanvas } from '../../features/dice/components/DiceCanvas';
import { useDiceStore } from '../../features/dice/state/dice.store';
import { DICE_THEMES } from '../../features/dice/engine/textureGenerator';
import { diceAudio } from '../../features/dice/engine/diceAudio';

const DICE_TYPES = Object.freeze([
    { type: 'd100', label: 'D100', maxVal: 100 },
    { type: 'd20', label: 'D20', maxVal: 20 },
    { type: 'd12', label: 'D12', maxVal: 12 },
    { type: 'd10', label: 'D10', maxVal: 9 },
    { type: 'd8', label: 'D8', maxVal: 8 },
    { type: 'd6', label: 'D6', maxVal: 6 },
    { type: 'd4', label: 'D4', maxVal: 4 },
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
    const [poolCounts, setPoolCounts] = useState({});
    const [lastRollTypes, setLastRollTypes] = useState(['d12']);
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const playedCritAudioRef = useRef(false);

    // بررسی رخ دادن کریتیکال (Max Die)
    const isAnyCritical = useMemo(() => {
        if (results.length === 0 || isRolling) return false;
        return results.some((r) => {
            const config = DICE_TYPES.find((d) => d.type === r.type);
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

    // پرتاب خودکار یک تاس D12 در ورود به بخش و پاکسازی کامل استور در زمان ترک لندینگ
    useEffect(() => {
        const timer = setTimeout(() => {
            triggerRoll(['d12']);
        }, 800);

        return () => {
            clearTimeout(timer);
            clearDice();
            setOpen(false);
        };
    }, [triggerRoll, clearDice, setOpen]);

    const handleQuickRoll = useCallback((type) => {
        const diceToRoll = type === 'd100' ? ['d100', 'd10'] : [type];
        setLastRollTypes(diceToRoll);
        triggerRoll(diceToRoll);
    }, [triggerRoll]);

    const handleAddToPool = useCallback((type) => {
        setPoolCounts((prev) => ({
            ...prev,
            [type]: (prev[type] || 0) + 1,
        }));
    }, []);

    const handleRemoveFromPool = useCallback((type, e) => {
        e.stopPropagation();
        setPoolCounts((prev) => {
            const current = prev[type] || 0;
            if (current <= 1) {
                const next = { ...prev };
                delete next[type];
                return next;
            }
            return { ...prev, [type]: current - 1 };
        });
    }, []);

    const handleRollPool = useCallback(() => {
        const diceToRoll = [];
        Object.entries(poolCounts).forEach(([type, count]) => {
            for (let i = 0; i < count; i++) {
                if (type === 'd100') {
                    diceToRoll.push('d100', 'd10');
                } else {
                    diceToRoll.push(type);
                }
            }
        });

        if (diceToRoll.length === 0) return;
        setLastRollTypes(diceToRoll);
        triggerRoll(diceToRoll);
    }, [poolCounts, triggerRoll]);

    const handleReRoll = useCallback(() => {
        if (lastRollTypes.length > 0) {
            triggerRoll(lastRollTypes);
        } else {
            triggerRoll(['d12']);
        }
    }, [lastRollTypes, triggerRoll]);

    const handleContainerPointerLeave = useCallback(() => {
        try {
            window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
        } catch {}
    }, []);

    const totalPoolCount = useMemo(() => {
        return Object.values(poolCounts).reduce((a, b) => a + b, 0);
    }, [poolCounts]);

    return (
        <section id="dice" className="py-14 sm:py-28 px-3 sm:px-8 overflow-hidden w-full" dir="rtl">
            <div className="max-w-6xl mx-auto">
                <GsapHeadingReveal
                    eyebrow="موتور فیزیک سه‌بعدی · REAL 3D RAPIER PHYSICS"
                    lines={['پرتاب واقعی،', 'درست مثل دور میز نبرد.']}
                    subtitle="با ماوس یا لمس صفحه تاس‌ها را بردارید و پرتاب کنید. فیزیک واقعی قطعی، صداگذاری چوب و بافت مرمر دست‌ساز."
                    containerClassName="max-w-2xl mx-auto mb-8 sm:mb-14"
                />

                <div
                    onPointerLeave={handleContainerPointerLeave}
                    className="relative rounded-3xl bg-[#090a10] border border-[#242738] shadow-[0_30px_90px_rgba(0,0,0,0.25)] h-[520px] sm:h-[580px] overflow-hidden select-none isolate"
                >
                    {/* کانواس سه‌بعدی ایزوله‌شده */}
                    <div
                        className="absolute inset-0"
                        style={{ touchAction: 'none' }}
                    >
                        <DiceCanvas />
                    </div>

                    {/* بنر نتیجه نهایی */}
                    {results.length > 0 && (
                        <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-1 z-20 w-auto max-w-[94%] animate-fade-in-up">
                            <div
                                className={`flex items-center gap-2 sm:gap-3.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl backdrop-blur-2xl transition-all duration-300 shadow-2xl ${
                                    isAnyCritical
                                        ? "bg-gradient-to-r from-amber-950/90 via-zinc-950/95 to-amber-950/90 border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.45)]"
                                        : "bg-zinc-950/90 border border-amber-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.7)]"
                                }`}
                            >
                                {isAnyCritical && (
                                    <div className="flex items-center gap-1 text-amber-300 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/50 animate-pulse whitespace-nowrap">
                                        <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
                                        <span>کریتیکال!</span>
                                    </div>
                                )}

                                <span className="text-zinc-400 text-xs font-semibold whitespace-nowrap">مجموع:</span>

                                <span
                                    className={`text-2xl sm:text-3xl font-black font-mono tracking-tight transition-all ${
                                        isRolling
                                            ? "text-zinc-500 animate-pulse"
                                            : isAnyCritical
                                                ? "text-amber-300 drop-shadow-[0_0_14px_rgba(252,211,77,0.8)]"
                                                : "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                                    }`}
                                >
                                    {totalSum}
                                </span>

                                <div className="flex items-center gap-1 border-r border-zinc-800 pr-2 mr-0.5">
                                    {results.map((r, i) => (
                                        <span
                                            key={i}
                                            className="text-[10px] sm:text-xs px-2 py-0.5 rounded-lg font-mono font-bold bg-zinc-900 border border-zinc-700 text-amber-200"
                                        >
                                            {r.value}
                                        </span>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleReRoll}
                                    className="p-1.5 text-zinc-400 hover:text-amber-300 rounded-xl hover:bg-zinc-900 active:scale-90 transition-all cursor-pointer"
                                    title="پرتاب مجدد"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* داک کنترل کنسولی مجهز به دکمه جمع و باز شدن */}
                    <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-1.5 z-20 w-full px-2.5 sm:px-4 max-w-xl transition-all duration-300">

                        <button
                            type="button"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="px-3 py-1 rounded-full bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-zinc-300 hover:text-amber-400 text-[10px] font-bold flex items-center gap-1 shadow-lg backdrop-blur-md active:scale-95 transition-all cursor-pointer"
                        >
                            <span>{isMenuOpen ? 'بستن منو' : 'باز کردن منوی تاس'}</span>
                            {isMenuOpen ? <ChevronDown className="w-3 h-3 text-amber-400" /> : <ChevronUp className="w-3 h-3 text-amber-400" />}
                        </button>

                        {isMenuOpen && (
                            <div className="w-full flex flex-col gap-1.5 animate-fade-in-up">
                                {mode === 'pool' && totalPoolCount > 0 && (
                                    <div className="bg-zinc-950/95 border border-amber-500/30 p-2 rounded-2xl shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-2 w-full">
                                        <div className="flex items-center gap-1 flex-wrap overflow-x-auto max-w-[70%]">
                                            {Object.entries(poolCounts).map(([type, count]) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={(e) => handleRemoveFromPool(type, e)}
                                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-amber-300 text-xs font-mono font-bold cursor-pointer shrink-0"
                                                >
                                                    <span>{count}×</span>
                                                    <span className="uppercase">{type}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setPoolCounts({})}
                                                className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-900"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleRollPool}
                                                className="px-3 py-1.5 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs shadow-md active:scale-95 flex items-center gap-1 cursor-pointer"
                                            >
                                                <Dices className="w-3.5 h-3.5" />
                                                <span>پرتاب ({totalPoolCount})</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="w-full bg-zinc-950/95 border border-zinc-800/90 p-2 rounded-2xl shadow-[0_15px_45px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col gap-2">
                                    <div className="grid grid-cols-7 gap-1 w-full">
                                        {DICE_TYPES.map((d) => {
                                            const inPool = poolCounts[d.type] || 0;
                                            return (
                                                <button
                                                    key={d.type}
                                                    type="button"
                                                    onClick={() => {
                                                        if (mode === 'quick') {
                                                            handleQuickRoll(d.type);
                                                        } else {
                                                            handleAddToPool(d.type);
                                                        }
                                                    }}
                                                    className="relative py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 text-amber-300 font-mono text-[11px] sm:text-xs font-bold transition-all active:scale-90 cursor-pointer shadow-sm flex items-center justify-center"
                                                >
                                                    <span>{d.label}</span>
                                                    {mode === 'pool' && inPool > 0 && (
                                                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-zinc-950 text-[9px] font-sans font-black rounded-full flex items-center justify-center">
                                                            {inPool}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center justify-between pt-1 border-t border-zinc-850 px-0.5">
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    clearDice();
                                                    setPoolCounts({});
                                                }}
                                                className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-xl bg-zinc-900/90 border border-zinc-800 active:scale-90 transition-all cursor-pointer"
                                                title="پاکسازی میز"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>

                                            <div className="flex items-center bg-zinc-900/90 p-0.5 rounded-xl border border-zinc-800">
                                                <button
                                                    type="button"
                                                    onClick={() => setMode('quick')}
                                                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                                                        mode === 'quick'
                                                            ? "bg-amber-500 text-zinc-950"
                                                            : "text-zinc-400"
                                                    }`}
                                                    title="پرتاب تکی"
                                                >
                                                    <Zap className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMode('pool')}
                                                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                                                        mode === 'pool'
                                                            ? "bg-amber-500 text-zinc-950"
                                                            : "text-zinc-400"
                                                    }`}
                                                    title="پرتاب چندتایی"
                                                >
                                                    <Dices className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
                                            {Object.values(DICE_THEMES).map((t) => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setSelectedTheme(t.id)}
                                                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-transform active:scale-75 ${
                                                        selectedTheme === t.id
                                                            ? "ring-2 ring-amber-400 scale-110"
                                                            : "opacity-60 hover:opacity-100"
                                                    }`}
                                                    style={{
                                                        background: `linear-gradient(135deg, ${t.bgCenter} 0%, ${t.bgEdge} 100%)`,
                                                        border: `1px solid ${t.borderColor || '#ca8a04'}`,
                                                    }}
                                                />
                                            ))}
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