import React, { useState, useEffect, useRef, memo } from "react";
import {
    Eye,
    EyeOff,
    Square,
    Circle,
    Triangle,
    Hexagon,
    Scissors,
    Maximize2,
    Trash2,
    Crop,
    Layers,
    Minimize2,
    ChevronDown,
    Check,
    PenTool,
} from "lucide-react";
import { useCanvasStore } from "../../stores/canvas.store";
import { useSceneStore } from "../../stores/scene.store";
import { TOOLS, FOG_ACTIONS, FOG_BRUSH_SHAPES } from "../../constants/tools";
import { Tooltip } from "../ui/Tooltip";
import { cn } from "../../utils/cn";
import { wsService } from "../../services/websocket.service";
import { WS_EVENTS } from "../../constants/wsEvents.js";

const FIT_OPTIONS = Object.freeze([
    {
        key: "fit",
        label: "Fit (انطباق به اندازه نقشه)",
        shortLabel: "Fit",
        icon: Maximize2,
        colorClass: "text-amber-400",
        bgClass: "bg-amber-500/10 border-amber-500/30",
    },
    {
        key: "trim",
        label: "Trim (برش بخش‌های اضافه)",
        shortLabel: "Trim",
        icon: Crop,
        colorClass: "text-cyan-400",
        bgClass: "bg-cyan-500/10 border-cyan-500/30",
    },
    {
        key: "join",
        label: "Join (ادغام تمام نواحی)",
        shortLabel: "Join",
        icon: Minimize2,
        colorClass: "text-emerald-400",
        bgClass: "bg-emerald-500/10 border-emerald-500/30",
    },
    {
        key: "overlay",
        label: "Overlay (لایه رویی بدون تخریب)",
        shortLabel: "Overlay",
        icon: Layers,
        colorClass: "text-purple-400",
        bgClass: "bg-purple-500/10 border-purple-500/30",
    },
]);

export const FogSubToolbar = memo(() => {
    const activeTool = useCanvasStore((state) => state.activeTool);
    const fogAction = useCanvasStore((state) => state.fogAction);
    const fogBrushShape = useCanvasStore((state) => state.fogBrushShape);
    const isFogRevealedGlobally = useCanvasStore((state) => state.isFogRevealedGlobally);
    const selectedFogId = useCanvasStore((state) => state.selectedFogId);

    const setFogAction = useCanvasStore((state) => state.setFogAction);
    const setFogBrushShape = useCanvasStore((state) => state.setFogBrushShape);
    const setFogGlobalReveal = useCanvasStore((state) => state.setFogGlobalReveal);

    const currentScene = useSceneStore((state) => state.currentScene);
    const setScene = useSceneStore((state) => state.setScene);
    const updateFogShape = useSceneStore((state) => state.updateFogShape);
    const clearFog = useSceneStore((state) => state.clearFog);
    const fillFog = useSceneStore((state) => state.fillFog);

    const [isFitMenuOpen, setIsFitMenuOpen] = useState(false);
    const [selectedFitOptionKey, setSelectedFitOptionKey] = useState("fit");
    const fitMenuRef = useRef(null);

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (fitMenuRef.current && !fitMenuRef.current.contains(e.target)) {
                setIsFitMenuOpen(false);
            }
        };
        if (isFitMenuOpen) {
            document.addEventListener("mousedown", handleOutsideClick);
            document.addEventListener("touchstart", handleOutsideClick);
        }
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("touchstart", handleOutsideClick);
        };
    }, [isFitMenuOpen]);

    if (activeTool !== TOOLS.FOG) return null;

    const isFogFilled = Boolean(currentScene?.fogFilled);
    const currentOption = FIT_OPTIONS.find((o) => o.key === selectedFitOptionKey) || FIT_OPTIONS[0];
    const CurrentOptionIcon = currentOption.icon;

    const handleToggleGlobalReveal = () => {
        const nextState = !isFogRevealedGlobally;
        useCanvasStore.getState().setSelectedFogId(null);
        setFogGlobalReveal(nextState);

        wsService.send("FOG_GLOBAL_REVEAL", {
            sceneId: currentScene?.id,
            isRevealed: nextState,
        });
    };

    const handleToggleFillFog = () => {
        if (!currentScene) return;

        if (isFogFilled) {
            handleClearAll();
        } else {
            fillFog();

            const payload = {
                sceneId: currentScene.id,
                type: "FILL_ALL",
                fogFilled: true,
                isCover: true,
                mode: "fill_all",
                points: { mode: "fill_all", isCover: true },
            };

            wsService.send(WS_EVENTS.FOG_UPDATED || "FOG_UPDATE", payload);
            wsService.send("FOG_FILL", payload);
        }
    };

    const handleClearAll = () => {
        if (!currentScene) return;
        clearFog();

        const payload = {
            sceneId: currentScene.id,
            type: "CLEAR_ALL",
            fogFilled: false,
            mode: "clear_all",
            points: { type: "CLEAR_ALL" },
        };

        wsService.send("FOG_CLEAR", payload);
        wsService.send(WS_EVENTS.FOG_UPDATED || "FOG_UPDATE", payload);
    };

    const handleFitOptionSelect = (optionKey) => {
        setSelectedFitOptionKey(optionKey);
        setIsFitMenuOpen(false);

        if (!currentScene) return;

        const mapWidth = currentScene.mapWidth || 2000;
        const mapHeight = currentScene.mapHeight || 1500;
        const fogShapes = currentScene.fogShapes || [];
        const selectedShape = fogShapes.find((f) => String(f.id) === String(selectedFogId));

        if (optionKey === "fit") {
            if (selectedShape) {
                const fittedShape = {
                    ...selectedShape,
                    type: "rect",
                    x: 0,
                    y: 0,
                    width: mapWidth,
                    height: mapHeight,
                };
                updateFogShape(selectedShape.id, fittedShape);
                wsService.send(WS_EVENTS.FOG_UPDATED || "FOG_UPDATE", {
                    ...fittedShape,
                    sceneId: currentScene.id,
                    type: fittedShape.isCover ? "HIDE" : "REVEAL",
                    points: fittedShape,
                });
            } else {
                handleToggleFillFog();
            }
        } else if (optionKey === "trim") {
            if (selectedShape) {
                const trimmedX = Math.max(0, selectedShape.x || 0);
                const trimmedY = Math.max(0, selectedShape.y || 0);
                const trimmedW = Math.min(mapWidth - trimmedX, selectedShape.width || mapWidth);
                const trimmedH = Math.min(mapHeight - trimmedY, selectedShape.height || mapHeight);

                const trimmedShape = {
                    ...selectedShape,
                    x: trimmedX,
                    y: trimmedY,
                    width: Math.max(20, trimmedW),
                    height: Math.max(20, trimmedH),
                };
                updateFogShape(selectedShape.id, trimmedShape);
                wsService.send(WS_EVENTS.FOG_UPDATED || "FOG_UPDATE", {
                    ...trimmedShape,
                    sceneId: currentScene.id,
                    type: trimmedShape.isCover ? "HIDE" : "REVEAL",
                    points: trimmedShape,
                });
            } else {
                setFogAction(FOG_ACTIONS.SLICE);
                setFogBrushShape(FOG_BRUSH_SHAPES.RECTANGLE);
            }
        } else if (optionKey === "join") {
            if (fogShapes.length > 1) {
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                fogShapes.forEach((s) => {
                    const x = s.x || 0;
                    const y = s.y || 0;
                    const w = s.width || (s.radius ? s.radius * 2 : 100);
                    const h = s.height || (s.radius ? s.radius * 2 : 100);

                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x + w);
                    maxY = Math.max(maxY, y + h);
                });

                const joinedShape = {
                    id: `fog-joined-${Date.now()}`,
                    type: "rect",
                    mode: "hide",
                    x: Math.max(0, minX),
                    y: Math.max(0, minY),
                    width: Math.min(mapWidth, maxX - minX),
                    height: Math.min(mapHeight, maxY - minY),
                    isCover: true,
                };

                const updated = {
                    ...currentScene,
                    fogShapes: [joinedShape],
                };
                setScene(updated);

                wsService.send("FOG_CLEAR", { sceneId: currentScene.id, type: "CLEAR_ALL", points: {} });
                setTimeout(() => {
                    wsService.send(WS_EVENTS.FOG_UPDATED || "FOG_UPDATE", {
                        ...joinedShape,
                        sceneId: currentScene.id,
                        type: "HIDE",
                        points: joinedShape,
                    });
                }, 100);
            }
        } else if (optionKey === "overlay") {
            const overlayShape = {
                id: `fog-overlay-${Date.now()}`,
                type: "rect",
                mode: "overlay",
                x: 0,
                y: 0,
                width: mapWidth,
                height: mapHeight,
                isCover: true,
            };

            const updated = {
                ...currentScene,
                fogShapes: [...(currentScene.fogShapes || []), overlayShape],
            };
            setScene(updated);

            wsService.send(WS_EVENTS.FOG_UPDATED || "FOG_UPDATE", {
                ...overlayShape,
                sceneId: currentScene.id,
                type: "HIDE",
                points: overlayShape,
            });
        }
    };

    return (
        <div
            ref={fitMenuRef}
            className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 p-2 sm:px-3 sm:py-1.5 bg-zinc-950/95 border border-zinc-800/90 rounded-2xl shadow-2xl backdrop-blur-2xl text-zinc-100 max-w-[95vw] sm:max-w-none overflow-visible"
            dir="rtl"
        >
            {/* ردیف اول در موبایل / بخش اول در دسکتاپ: حالت‌های عملکرد مه */}
            <div className="flex items-center justify-between sm:justify-start gap-1.5">
                <div className="flex items-center gap-1 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800/80 flex-1 sm:flex-initial justify-around sm:justify-start">
                    <Tooltip
                        content={isFogRevealedGlobally ? "Disable Global Reveal" : "Enable Global Reveal"}
                        subContent={
                            isFogRevealedGlobally
                                ? "غیرفعال‌سازی آشکارساز (نمایش مجدد مه برای بازیکنان)"
                                : "فعال‌سازی آشکارساز (پنهان کردن موقت مه نقشه)"
                        }
                    >
                        <button
                            type="button"
                            onClick={handleToggleGlobalReveal}
                            className={cn(
                                "flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer select-none active:scale-95 whitespace-nowrap",
                                isFogRevealedGlobally
                                    ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25 ring-1 ring-amber-400/50"
                                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                            )}
                        >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                            <span>آشکارساز</span>
                        </button>
                    </Tooltip>

                    <Tooltip content="Hide Fog" subContent="پوشاندن نقشه با تاریکی">
                        <button
                            type="button"
                            onClick={() => setFogAction(FOG_ACTIONS.HIDE)}
                            className={cn(
                                "flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer select-none active:scale-95 whitespace-nowrap",
                                fogAction === FOG_ACTIONS.HIDE
                                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-400/50"
                                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                            )}
                        >
                            <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                            <span>پوشاندن</span>
                        </button>
                    </Tooltip>

                    <Tooltip content="Slice Fog" subContent="برش دقیق بخشی از مه با شکل یا خودنویس">
                        <button
                            type="button"
                            onClick={() => setFogAction(FOG_ACTIONS.SLICE)}
                            className={cn(
                                "flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer select-none active:scale-95 whitespace-nowrap",
                                fogAction === FOG_ACTIONS.SLICE
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400/50"
                                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                            )}
                        >
                            <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                            <span>برش</span>
                        </button>
                    </Tooltip>
                </div>

                {/* دکمه حذف کل مه در موبایل کنار حالت‌ها قرار می‌گیرد تا ردیف دوم فشرده‌تر شود */}
                <button
                    type="button"
                    onClick={handleClearAll}
                    aria-label="حذف کامل تمام مه جنگ نقشه"
                    className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-rose-400 bg-zinc-900/90 border border-zinc-800 active:scale-90 transition-all cursor-pointer shrink-0"
                    title="حذف کامل مه جنگ"
                >
                    <Trash2 className="w-4 h-4 stroke-[2]" />
                </button>
            </div>

            <div className="hidden sm:block h-6 w-px bg-zinc-800/80 mx-0.5 shrink-0" aria-hidden="true" />

            {/* ردیف دوم در موبایل / ادامه در دسکتاپ: اشکال قلم مه + Fill + Fit */}
            <div className="flex items-center justify-between sm:justify-start gap-1.5">
                <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 bg-zinc-900/50 rounded-xl border border-zinc-800/50 shrink-0">
                    <Tooltip content="Circle Fog" subContent="دایره">
                        <button
                            type="button"
                            onClick={() => setFogBrushShape(FOG_BRUSH_SHAPES.CIRCLE)}
                            aria-label="قلم مه دایره‌ای"
                            className={cn(
                                "w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95",
                                fogBrushShape === FOG_BRUSH_SHAPES.CIRCLE
                                    ? "bg-zinc-800 text-amber-400 border border-amber-500/50 shadow-md font-bold"
                                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                            )}
                        >
                            <Circle className="w-4 h-4 stroke-[2]" />
                        </button>
                    </Tooltip>

                    <Tooltip content="Rectangle Fog" subContent="مستطیل">
                        <button
                            type="button"
                            onClick={() => setFogBrushShape(FOG_BRUSH_SHAPES.RECTANGLE)}
                            aria-label="قلم مه مستطیلی"
                            className={cn(
                                "w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95",
                                fogBrushShape === FOG_BRUSH_SHAPES.RECTANGLE
                                    ? "bg-zinc-800 text-amber-400 border border-amber-500/50 shadow-md font-bold"
                                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                            )}
                        >
                            <Square className="w-4 h-4 stroke-[2]" />
                        </button>
                    </Tooltip>

                    <Tooltip content="Triangle Fog" subContent="مثلث">
                        <button
                            type="button"
                            onClick={() => setFogBrushShape(FOG_BRUSH_SHAPES.TRIANGLE)}
                            aria-label="قلم مه مثلثی"
                            className={cn(
                                "w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95",
                                fogBrushShape === FOG_BRUSH_SHAPES.TRIANGLE
                                    ? "bg-zinc-800 text-amber-400 border border-amber-500/50 shadow-md font-bold"
                                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                            )}
                        >
                            <Triangle className="w-4 h-4 stroke-[2]" />
                        </button>
                    </Tooltip>

                    <Tooltip content="Hexagon Fog" subContent="شش‌ضلعی">
                        <button
                            type="button"
                            onClick={() => setFogBrushShape(FOG_BRUSH_SHAPES.HEXAGON)}
                            aria-label="قلم مه شش‌ضلعی"
                            className={cn(
                                "w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95",
                                fogBrushShape === FOG_BRUSH_SHAPES.HEXAGON
                                    ? "bg-zinc-800 text-amber-400 border border-amber-500/50 shadow-md font-bold"
                                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                            )}
                        >
                            <Hexagon className="w-4 h-4 stroke-[2]" />
                        </button>
                    </Tooltip>

                    <Tooltip content="Pen / Polygon Fog" subContent="خودنویس چندضلعی نقطه‌به‌نقطه">
                        <button
                            type="button"
                            onClick={() => setFogBrushShape(FOG_BRUSH_SHAPES.POLYGON)}
                            aria-label="قلم مه چندضلعی نقطه‌به‌نقطه"
                            className={cn(
                                "w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95",
                                fogBrushShape === FOG_BRUSH_SHAPES.POLYGON
                                    ? "bg-zinc-800 text-amber-400 border border-amber-500/50 shadow-md font-bold"
                                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                            )}
                        >
                            <PenTool className="w-4 h-4 stroke-[2]" />
                        </button>
                    </Tooltip>
                </div>

                <div className="hidden sm:block h-6 w-px bg-zinc-800/80 mx-0.5 shrink-0" aria-hidden="true" />

                <div className="flex items-center gap-1.5 shrink-0">
                    <Tooltip
                        content="Fill Fog"
                        subContent={isFogFilled ? "خالی کردن مه کل نقشه" : "پوشاندن کل نقشه با مه"}
                    >
                        <button
                            type="button"
                            onClick={handleToggleFillFog}
                            className={cn(
                                "flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-[11px] sm:text-xs shadow-md transition-all cursor-pointer active:scale-95 whitespace-nowrap",
                                isFogFilled
                                    ? "bg-rose-600 text-white shadow-rose-600/30 border border-rose-400/40"
                                    : "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80"
                            )}
                        >
                            <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
                            <span>{isFogFilled ? "خالی کردن" : "Fill"}</span>
                        </button>
                    </Tooltip>

                    <div className="sm:relative">
                        <button
                            type="button"
                            onClick={() => setIsFitMenuOpen((prev) => !prev)}
                            className={cn(
                                "flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-[11px] sm:text-xs transition-all cursor-pointer shadow-sm active:scale-95 border whitespace-nowrap",
                                isFitMenuOpen
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500"
                                    : "bg-zinc-900/90 border-amber-500/40 hover:border-amber-500 text-amber-400 hover:bg-zinc-850"
                            )}
                        >
                            <CurrentOptionIcon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]", currentOption.colorClass)} />
                            <span>{currentOption.shortLabel}</span>
                            <ChevronDown
                                className={cn(
                                    "w-3.5 h-3.5 transition-transform duration-200 opacity-80",
                                    isFitMenuOpen ? "rotate-180" : ""
                                )}
                            />
                        </button>

                        {isFitMenuOpen && (
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 w-64 max-w-[90vw] bg-zinc-950/98 border border-zinc-800/90 rounded-2xl p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-[100] flex flex-col gap-1 animate-fade-in-up">
                                {FIT_OPTIONS.map((opt) => {
                                    const OptionIcon = opt.icon;
                                    const isSelected = selectedFitOptionKey === opt.key;
                                    return (
                                        <button
                                            key={opt.key}
                                            type="button"
                                            onClick={() => handleFitOptionSelect(opt.key)}
                                            className={cn(
                                                "flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-[0.98]",
                                                isSelected
                                                    ? "bg-zinc-900 text-zinc-100 border border-zinc-700/60 shadow-sm"
                                                    : "hover:bg-zinc-900/70 text-zinc-400 hover:text-zinc-200"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className={cn("p-1.5 rounded-lg border", opt.bgClass)}>
                                                    <OptionIcon className={cn("w-3.5 h-3.5", opt.colorClass)} />
                                                </div>
                                                <span>{opt.label}</span>
                                            </div>
                                            {isSelected && <Check className="w-4 h-4 text-amber-400 stroke-[2.5]" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="hidden sm:block h-6 w-px bg-zinc-800/80 mx-0.5 shrink-0" aria-hidden="true" />

            <Tooltip content="Clear Fog" subContent="حذف کامل تمام مه جنگ نقشه">
                <button
                    type="button"
                    onClick={handleClearAll}
                    aria-label="حذف کامل تمام مه جنگ نقشه"
                    className="hidden sm:flex w-8.5 h-8.5 rounded-xl items-center justify-center text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 active:scale-90 transition-all cursor-pointer shrink-0"
                >
                    <Trash2 className="w-4 h-4 stroke-[2]" />
                </button>
            </Tooltip>
        </div>
    );
});

FogSubToolbar.displayName = "FogSubToolbar";
export default FogSubToolbar;