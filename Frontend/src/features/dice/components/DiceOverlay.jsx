import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { DiceCanvas } from './DiceCanvas';
import { useDiceStore } from '../state/dice.store';
import { DICE_THEMES } from '../engine/textureGenerator';
import { diceAudio } from '../engine/diceAudio';
import { RotateCcw, X, Trash2, Dices, Zap, User, Sparkles } from 'lucide-react';
import { cn } from '../../../utils/cn';

const DICE_TYPES = Object.freeze([
    { type: 'd4', label: 'D4', maxVal: 4 },
    { type: 'd6', label: 'D6', maxVal: 6 },
    { type: 'd8', label: 'D8', maxVal: 8 },
    { type: 'd10', label: 'D10', maxVal: 9 },
    { type: 'd12', label: 'D12', maxVal: 12 },
    { type: 'd20', label: 'D20', maxVal: 20 },
    { type: 'd100', label: 'D100', maxVal: 100 },
]);

export function DiceOverlay() {
    const isOpen = useDiceStore((s) => s.isOpen);
    const isRolling = useDiceStore((s) => s.isRolling);
    const results = useDiceStore((s) => s.results);
    const totalSum = useDiceStore((s) => s.totalSum);
    const rollerName = useDiceStore((s) => s.rollerName);
    const isRemoteRoll = useDiceStore((s) => s.isRemoteRoll);
    const setOpen = useDiceStore((s) => s.setOpen);
    const triggerRoll = useDiceStore((s) => s.triggerRoll);
    const clearDice = useDiceStore((s) => s.clearDice);
    const activeDiceLength = useDiceStore((s) => s.activeDice.length);
    const selectedTheme = useDiceStore((s) => s.selectedTheme);
    const setSelectedTheme = useDiceStore((s) => s.setSelectedTheme);

    const [mode, setMode] = useState('quick');
    const [poolCounts, setPoolCounts] = useState({});
    const [lastRollTypes, setLastRollTypes] = useState(['d20']);
    const playedCritAudioRef = useRef(false);

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

    const handleClearPool = useCallback(() => {
        setPoolCounts({});
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

    const totalPoolDiceCount = useMemo(() => {
        return Object.values(poolCounts).reduce((a, b) => a + b, 0);
    }, [poolCounts]);

    const handleReRoll = useCallback(() => {
        if (lastRollTypes.length > 0) {
            triggerRoll(lastRollTypes);
        } else {
            triggerRoll(['d20']);
        }
    }, [lastRollTypes, triggerRoll]);

    if (!isOpen && activeDiceLength === 0) return null;

    return (
        <div className="fixed inset-0 z-[110] pointer-events-none select-none font-fa" dir="rtl">
            <div className="absolute inset-0">
                <DiceCanvas overlayMode={true} />
            </div>

            {results.length > 0 && (
                <div className="absolute top-14 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-1.5 animate-fade-in-up">
                    <div
                        className={cn(
                            "flex items-center gap-3.5 px-5 py-2.5 rounded-2xl backdrop-blur-2xl transition-all duration-300 shadow-2xl",
                            isAnyCritical
                                ? "bg-gradient-to-r from-amber-950/90 via-zinc-950/95 to-amber-950/90 border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.45)] scale-105"
                                : "bg-zinc-950/90 border border-amber-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.7)]"
                        )}
                    >
                        {isAnyCritical && (
                            <div className="flex items-center gap-1 text-amber-300 text-xs font-black px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 animate-pulse shadow-sm">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                                <span>کریتیکال!</span>
                            </div>
                        )}

                        {isRemoteRoll && rollerName ? (
                            <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-800 text-amber-300 text-xs font-bold">
                                <User className="w-3.5 h-3.5 text-amber-400" />
                                <span>{rollerName}:</span>
                            </div>
                        ) : (
                            <span className="text-zinc-400 text-xs font-semibold">مجموع:</span>
                        )}

                        <span
                            className={cn(
                                "text-3xl font-black font-mono tracking-tight transition-all",
                                isRolling
                                    ? "text-zinc-500 animate-pulse"
                                    : isAnyCritical
                                        ? "text-amber-300 text-4xl drop-shadow-[0_0_18px_rgba(252,211,77,0.85)] animate-bounce"
                                        : "text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]"
                            )}
                        >
                            {totalSum}
                        </span>

                        <div className="flex items-center gap-1.5 border-r border-zinc-800/80 pr-3.5 mr-1">
                            {results.map((r, i) => {
                                const cfg = DICE_TYPES.find((d) => d.type === r.type);
                                const isCritDie = cfg && (r.value === cfg.maxVal || (r.type === 'd10' && r.value === 0));

                                return (
                                    <span
                                        key={i}
                                        className={cn(
                                            "text-xs px-2.5 py-1 rounded-xl font-mono font-bold shadow-inner transition-all",
                                            isCritDie
                                                ? "bg-amber-400 text-zinc-950 font-black border border-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-110"
                                                : "bg-zinc-900 border border-zinc-700/80 text-amber-200/90"
                                        )}
                                    >
                                        {r.value}
                                    </span>
                                );
                            })}
                        </div>

                        {!isRemoteRoll && (
                            <button
                                type="button"
                                onClick={handleReRoll}
                                className="p-1.5 text-zinc-400 hover:text-amber-300 rounded-xl hover:bg-zinc-900 active:scale-90 transition-all cursor-pointer"
                                title="پرتاب مجدد"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        )}

                        {isRemoteRoll && (
                            <button
                                type="button"
                                onClick={() => clearDice()}
                                className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-xl hover:bg-zinc-900 active:scale-90 transition-all cursor-pointer"
                                title="بستن"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {isOpen && !isRemoteRoll && (
                <div className="absolute bottom-20 sm:bottom-6 left-3 sm:left-6 pointer-events-auto flex flex-col gap-2 animate-fade-in-up">
                    {mode === 'pool' && totalPoolDiceCount > 0 && (
                        <div className="bg-zinc-950/95 border border-amber-500/30 p-2 rounded-2xl shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-3 animate-fade-in-up">
                            <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                                {Object.entries(poolCounts).map(([type, count]) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={(e) => handleRemoveFromPool(type, e)}
                                        title="برای حذف کلیک کنید"
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-700 text-amber-300 text-xs font-mono font-bold hover:bg-rose-950/60 hover:border-rose-500/50 hover:text-rose-200 transition-all duration-150 active:scale-95 group cursor-pointer"
                                    >
                                        <span>{count}×</span>
                                        <span className="uppercase">{type}</span>
                                        <span className="text-[10px] text-zinc-500 group-hover:text-rose-300 mr-0.5">×</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={handleClearPool}
                                    className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-xl hover:bg-zinc-900 active:scale-90 transition-all cursor-pointer"
                                    title="پاکسازی استخر"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={handleRollPool}
                                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Dices className="w-3.5 h-3.5" />
                                    <span>پرتاب ({totalPoolDiceCount})</span>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5 bg-zinc-950/90 border border-zinc-800/80 p-1.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
                        <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80 ml-1">
                            {Object.values(DICE_THEMES).map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setSelectedTheme(t.id)}
                                    title={t.name}
                                    className={cn(
                                        "w-5 h-5 rounded-full transition-all duration-150 relative cursor-pointer active:scale-90",
                                        selectedTheme === t.id
                                            ? "ring-2 ring-amber-400 scale-110 shadow-[0_0_8px_rgba(251,191,36,0.6)] z-10"
                                            : "opacity-70 hover:opacity-100 hover:scale-105"
                                    )}
                                    style={{
                                        background: `linear-gradient(135deg, ${t.bgCenter} 0%, ${t.bgEdge} 100%)`,
                                        border: `1.5px solid ${t.borderColor || '#ca8a04'}`,
                                    }}
                                />
                            ))}
                        </div>

                        <div className="w-px h-5 bg-zinc-800/80 mx-0.5" />

                        <div className="flex items-center bg-zinc-900/80 p-0.5 rounded-xl border border-zinc-800/80 ml-1">
                            <button
                                type="button"
                                onClick={() => setMode('quick')}
                                className={cn(
                                    "p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95",
                                    mode === 'quick'
                                        ? "bg-amber-500 text-zinc-950 shadow-sm"
                                        : "text-zinc-400 hover:text-zinc-200"
                                )}
                                title="پرتاب سریع (تکی)"
                            >
                                <Zap className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('pool')}
                                className={cn(
                                    "p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95",
                                    mode === 'pool'
                                        ? "bg-amber-500 text-zinc-950 shadow-sm"
                                        : "text-zinc-400 hover:text-zinc-200"
                                )}
                                title="حالت استخر (چندتایی)"
                            >
                                <Dices className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="w-px h-5 bg-zinc-800/80 mx-0.5" />

                        {DICE_TYPES.map((d) => {
                            const inPoolCount = poolCounts[d.type] || 0;
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
                                    className="relative px-2.5 py-1.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/90 border border-zinc-800 hover:border-amber-500/50 text-amber-200/90 font-mono text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer shadow-sm"
                                >
                                    <span>{d.label}</span>
                                    {mode === 'pool' && inPoolCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-zinc-950 text-[10px] font-sans font-black rounded-full flex items-center justify-center shadow-md animate-fade-in-up">
                                            {inPoolCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}

                        <div className="w-px h-5 bg-zinc-800/80 mx-0.5" />

                        <button
                            type="button"
                            onClick={() => {
                                clearDice();
                                setOpen(false);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-xl hover:bg-zinc-900 active:scale-90 transition-all cursor-pointer"
                            title="بستن منو و پاکسازی تاس‌ها"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DiceOverlay;