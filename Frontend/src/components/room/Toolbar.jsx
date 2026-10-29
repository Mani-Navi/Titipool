import React, { useEffect, useCallback, useMemo, memo } from "react";
import {
  MousePointer,
  Hand,
  Pencil,
  EyeOff,
  Ruler,
  Crosshair,
  Image as ImageIcon,
  Settings,
  ZoomIn,
  ZoomOut,
  Type,
  User,
  Dices,
} from "lucide-react";
import { useCanvasStore } from "../../stores/canvas.store";
import { useSceneStore } from "../../stores/scene.store";
import { useAuthStore } from "../../stores/auth.store";
import { useDiceStore } from "../../features/dice/state/dice.store";
import { Tooltip } from "../ui/Tooltip";
import { DrawSubToolbar } from "./DrawSubToolbar.jsx";
import { TextSubToolbar } from "./TextSubToolbar.jsx";
import { FogSubToolbar } from "./FogSubToolbar.jsx";
import { TOOLS } from "../../constants/tools";
import { MIN_ZOOM, MAX_ZOOM } from "../../constants/canvas.js";
import { cn } from "../../utils/cn";

export const Toolbar = memo(({ isGM: propIsGM, permissions = {} }) => {
  const activeTool = useCanvasStore((state) => state.activeTool);
  const zoom = useCanvasStore((state) => state.zoom);

  const setActiveTool = useCanvasStore((state) => state.setActiveTool);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const resetView = useCanvasStore((state) => state.resetView);
  const focusOnCoordinates = useCanvasStore((state) => state.focusOnCoordinates);
  const toggleTokenSelection = useCanvasStore((state) => state.toggleTokenSelection);
  const toggleMenu = useCanvasStore((state) => state.toggleMenu);

  const isAssetOpen = useCanvasStore((state) => state.isAssetMenuOpen);
  const isSettingsOpen = useCanvasStore((state) => state.isSettingsMenuOpen);

  const hasActiveMap = useSceneStore((state) => Boolean(state.currentScene?.assetUrl || state.currentScene?.mapUrl));
  const sceneTokens = useSceneStore((state) => state.currentScene?.tokens);
  const mapW = useSceneStore((state) => state.currentScene?.mapWidth) || 2000;
  const mapH = useSceneStore((state) => state.currentScene?.mapHeight) || 1500;
  const addToken = useSceneStore((state) => state.addToken);
  const currentUser = useAuthStore((state) => state.user);

  const isGM = propIsGM ?? true;

  const currentUserId = String(currentUser?.id || currentUser?.userId || "").toLowerCase().trim();
  const currentUsername = String(currentUser?.username || "").toLowerCase().trim();
  const currentUserEmail = String(currentUser?.email || "").toLowerCase().trim();

  const myExistingToken = useMemo(() => {
    if (!sceneTokens) return null;
    return sceneTokens.find((t) => {
      const cb = String(t.controlledBy || "").toLowerCase().trim();
      const lbl = String(t.label || t.name || "").toLowerCase().trim();
      return (
          (cb && (cb === currentUserId || cb === currentUsername || cb === currentUserEmail)) ||
          (lbl && lbl === currentUsername)
      );
    });
  }, [sceneTokens, currentUserId, currentUsername, currentUserEmail]);

  const handleToolClick = useCallback(
      (toolId) => {
        if (!hasActiveMap) return;
        if (activeTool === toolId) {
          setActiveTool(TOOLS.SELECT);
        } else {
          setActiveTool(toolId);
        }
      },
      [activeTool, hasActiveMap, setActiveTool]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tagName = e.target.tagName.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || e.target.isContentEditable) {
        return;
      }

      const key = e.key.toUpperCase();

      if (e.key === "Escape") {
        setActiveTool(TOOLS.SELECT);
        return;
      }

      if (key === "B") {
        useDiceStore.getState().setOpen(!useDiceStore.getState().isOpen);
        return;
      }

      if (!hasActiveMap) return;

      switch (key) {
        case "V":
        case "S":
          handleToolClick(TOOLS.SELECT);
          break;
        case "H":
          handleToolClick(TOOLS.PAN);
          break;
        case "D":
          if (isGM || permissions?.canDrawing !== false) {
            handleToolClick(TOOLS.DRAW);
          }
          break;
        case "T":
          if (isGM || permissions?.canText !== false) {
            handleToolClick(TOOLS.TEXT);
          }
          break;
        case "F":
          if (isGM || permissions?.canFog === true) {
            handleToolClick(TOOLS.FOG);
          }
          break;
        case "R":
          if (isGM || permissions?.canRuler !== false) {
            handleToolClick(TOOLS.RULER);
          }
          break;
        case "L":
          handleToolClick(TOOLS.LASER);
          break;
        case "A":
          if (isGM || permissions?.canAssets) {
            toggleMenu("asset");
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasActiveMap, isGM, permissions, handleToolClick, setActiveTool, toggleMenu]);

  const handleMyCharacterClick = useCallback(() => {
    if (!hasActiveMap) return;

    if (myExistingToken) {
      toggleTokenSelection(myExistingToken.id);
      setActiveTool(TOOLS.SELECT);
      if (myExistingToken.x !== undefined && myExistingToken.y !== undefined) {
        focusOnCoordinates(myExistingToken.x, myExistingToken.y);
      }
      return;
    }

    const charName = currentUser?.username || "قهرمان من";
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
        charName
    )}&backgroundColor=b6e3f4`;

    addToken({
      name: charName,
      label: charName,
      avatarUrl: avatar,
      controlledBy: currentUserId || currentUsername,
      x: mapW / 2,
      y: mapH / 2,
      size: 1,
      hp: 20,
      maxHp: 20,
      ac: 14,
      isProp: false,
      showHp: true,
      showConditions: true,
      showAc: true,
    });
  }, [
    hasActiveMap,
    myExistingToken,
    currentUser?.username,
    mapW,
    mapH,
    addToken,
    currentUserId,
    currentUsername,
    toggleTokenSelection,
    setActiveTool,
    focusOnCoordinates,
  ]);

  const primaryTools = [
    {
      id: TOOLS.SELECT,
      label: "Select",
      labelFa: "انتخاب و جابجایی",
      icon: MousePointer,
      shortcut: "V",
      allowed: true,
    },
    {
      id: TOOLS.PAN,
      label: "Pan",
      labelFa: "حرکت در نقشه",
      icon: Hand,
      shortcut: "H",
      allowed: true,
    },
    {
      id: TOOLS.DRAW,
      label: "Draw",
      labelFa: "قلم و اشکال هندسی",
      icon: Pencil,
      shortcut: "D",
      allowed: isGM || permissions?.canDrawing !== false,
    },
    {
      id: TOOLS.TEXT,
      label: "Text",
      labelFa: "نوشت‌افزار",
      icon: Type,
      shortcut: "T",
      allowed: isGM || permissions?.canText !== false,
    },
    {
      id: TOOLS.FOG,
      label: "Fog of War",
      labelFa: "مه جنگ و تاریکی",
      icon: EyeOff,
      shortcut: "F",
      allowed: isGM || permissions?.canFog === true,
    },
    {
      id: TOOLS.RULER,
      label: "Ruler",
      labelFa: "خط‌کش اندازه‌گیری",
      icon: Ruler,
      shortcut: "R",
      allowed: isGM || permissions?.canRuler !== false,
    },
    {
      id: TOOLS.LASER,
      label: "Laser Pointer",
      labelFa: "نشانگر لیزری",
      icon: Crosshair,
      shortcut: "L",
      allowed: true,
    },
  ];

  const hasSubToolbarOpen =
      hasActiveMap &&
      (activeTool === TOOLS.DRAW || activeTool === TOOLS.TEXT || activeTool === TOOLS.FOG);

  return (
      <>
        <div className="fixed bottom-[max(0.65rem,env(safe-area-inset-bottom))] sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-auto max-w-[96vw] overflow-visible">
          {hasActiveMap && (
              <div className="w-full flex justify-center overflow-visible z-50 animate-fade-in-up">
                <DrawSubToolbar />
                <TextSubToolbar />
                <FogSubToolbar />
              </div>
          )}

          <div
              role="toolbar"
              aria-label="نوار ابزار اصلی میز بازی"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1.5 sm:py-2 bg-zinc-950/92 border border-zinc-800/80 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)] backdrop-blur-2xl text-zinc-200 transition-all max-w-[96vw] overflow-x-auto sm:overflow-visible no-scrollbar"
          >
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              {primaryTools.map((t) => {
                if (!t.allowed) return null;
                const Icon = t.icon;
                const isActive = activeTool === t.id && hasActiveMap;
                const isDisabled = !hasActiveMap;

                return (
                    <Tooltip
                        key={t.id}
                        content={t.label}
                        subContent={isDisabled ? "ابتدا نقشه را بارگذاری کنید" : `${t.labelFa} (${t.shortcut})`}
                        shortcut={isDisabled ? undefined : t.shortcut}
                    >
                      <button
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleToolClick(t.id)}
                          aria-label={`${t.labelFa} (کلید ${t.shortcut})`}
                          aria-pressed={isActive}
                          className={cn(
                              "w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0",
                              isDisabled
                                  ? "text-zinc-600 opacity-40 cursor-not-allowed"
                                  : isActive
                                      ? "bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/25 scale-[1.03] cursor-pointer ring-1 ring-amber-400/50"
                                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 active:scale-95 cursor-pointer"
                          )}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                      </button>
                    </Tooltip>
                );
              })}
            </div>

            <div className="h-5 sm:h-6 w-px bg-zinc-800/80 mx-0.5 sm:mx-1 shrink-0" aria-hidden="true" />
            <Tooltip content="3D Dice" subContent="پرتاب تاس سه‌بعدی فیزیکی (B)" shortcut="B">
              <button
                  type="button"
                  onClick={() => useDiceStore.getState().setOpen(true)}
                  aria-label="پرتاب تاس سه‌بعدی فیزیکی (کلید B)"
                  className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 active:scale-95 transition-all duration-150 cursor-pointer shrink-0 shadow-sm shadow-amber-500/5"
              >
                <Dices className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              </button>
            </Tooltip>

            {!isGM && hasActiveMap && (
                <>
                  <div className="h-5 sm:h-6 w-px bg-zinc-800/80 mx-0.5 sm:mx-1 shrink-0" aria-hidden="true" />
                  <Tooltip
                      content="My Character"
                      subContent={
                        myExistingToken
                            ? "نمایش و فوکوس روی کاراکتر شما"
                            : "افزودن کاراکتر من به نقشه"
                      }
                  >
                    <button
                        type="button"
                        onClick={handleMyCharacterClick}
                        aria-label={myExistingToken ? "نمایش و تمرکز بر کاراکتر شما" : "افزودن کاراکتر من به نقشه"}
                        className={cn(
                            "w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 active:scale-95",
                            myExistingToken
                                ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20"
                                : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40 shadow-sm"
                        )}
                    >
                      <User className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                    </button>
                  </Tooltip>
                </>
            )}

            <div className="h-5 sm:h-6 w-px bg-zinc-800/80 mx-0.5 sm:mx-1 shrink-0" aria-hidden="true" />

            {(isGM || permissions?.canAssets) && (
                <Tooltip content="Asset Library" subContent="کتابخانه منابع و نقشه‌ها (A)" shortcut="A">
                  <button
                      type="button"
                      onClick={() => toggleMenu("asset")}
                      aria-label="کتابخانه منابع و نقشه‌ها (کلید A)"
                      aria-expanded={isAssetOpen}
                      className={cn(
                          "w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 active:scale-95",
                          isAssetOpen
                              ? "bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/25"
                              : !hasActiveMap
                                  ? "text-amber-400 bg-amber-500/10 border border-amber-500/40"
                                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                      )}
                  >
                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                  </button>
                </Tooltip>
            )}

            {isGM && (
                <Tooltip content="Room Settings" subContent="تنظیمات اتاق و گرید">
                  <button
                      type="button"
                      onClick={() => toggleMenu("settings")}
                      aria-label="تنظیمات اتاق و گرید نقشه"
                      aria-expanded={isSettingsOpen}
                      className={cn(
                          "w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 active:scale-95",
                          isSettingsOpen
                              ? "bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/25"
                              : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                      )}
                  >
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                  </button>
                </Tooltip>
            )}
          </div>
        </div>

        {/* نوار کنترل بزرگ‌نمایی با جابجایی هوشمند در موبایل هنگام باز شدن زیرمنوها */}
        <div
            role="toolbar"
            aria-label="کنترل بزرگ‌نمایی نقشه"
            className={cn(
                "fixed right-2.5 sm:right-6 sm:bottom-6 z-30 flex items-center gap-0.5 sm:gap-1 p-1 sm:p-1.5 bg-zinc-950/85 border border-zinc-800/80 rounded-xl shadow-[0_8px_25px_rgba(0,0,0,0.5)] backdrop-blur-xl text-xs text-zinc-300 transition-all duration-200",
                hasSubToolbarOpen
                    ? "bottom-[calc(7.75rem+env(safe-area-inset-bottom,0px))]"
                    : "bottom-[calc(4.35rem+env(safe-area-inset-bottom,0px))]"
            )}
        >
          <button
              type="button"
              disabled={!hasActiveMap}
              onClick={() => setZoom((z) => Math.max(z - 0.15, MIN_ZOOM))}
              className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150",
                  !hasActiveMap
                      ? "text-zinc-700 cursor-not-allowed"
                      : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100 active:scale-90 cursor-pointer"
              )}
              title="کوچک‌نمایی"
              aria-label="کوچک‌نمایی نقشه"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
          </button>
          <button
              type="button"
              disabled={!hasActiveMap}
              onClick={resetView}
              className={cn(
                  "px-1.5 sm:px-2 h-8 rounded-lg font-mono text-[10px] sm:text-xs transition-all duration-150",
                  !hasActiveMap
                      ? "text-zinc-700 cursor-not-allowed"
                      : "text-zinc-300 hover:bg-zinc-800/80 hover:text-amber-400 active:scale-95 cursor-pointer font-bold"
              )}
              title="بازنشانی بزرگ‌نمایی به ۱۰۰ درصد"
              aria-label={`بزرگ‌نمایی کنونی ${Math.round(zoom * 100)} درصد، کلیک برای بازنشانی`}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
              type="button"
              disabled={!hasActiveMap}
              onClick={() => setZoom((z) => Math.min(z + 0.15, MAX_ZOOM))}
              className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150",
                  !hasActiveMap
                      ? "text-zinc-700 cursor-not-allowed"
                      : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100 active:scale-90 cursor-pointer"
              )}
              title="بزرگ‌نمایی"
              aria-label="بزرگ‌نمایی نقشه"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
          </button>
        </div>
      </>
  );
});

Toolbar.displayName = "Toolbar";
export default Toolbar;