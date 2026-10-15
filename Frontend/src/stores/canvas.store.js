import { create } from "zustand";
import { TOOLS, DRAW_MODES, FOG_ACTIONS, FOG_BRUSH_SHAPES } from "../constants/tools";
import { MIN_ZOOM, MAX_ZOOM } from "../constants/canvas.js";
import { useSceneStore } from "./scene.store";

export const useCanvasStore = create((set, get) => ({
    activeTool: TOOLS.SELECT,
    activeDrawShape: DRAW_MODES.MARKER,
    drawStrokeColor: "#f59e0b",
    drawStrokeWidth: 4,
    drawFillColor: "rgba(245, 158, 11, 0.2)",
    isDrawGMLayer: false,

    inputMode: "AUTO",
    zoomSensitivity: 1.0,
    shapeSnapSensitivity: 0.5,
    gmFogBlend: 0.45,

    textFontFamily: "Vazirmatn",
    textFontSize: 24,
    textColor: "#f59e0b",
    textIsBold: false,
    textIsItalic: false,
    textHeading: "normal",
    textHasStroke: false,
    textStrokeColor: "#000000",
    textStrokeWidth: 2,
    pendingEmoji: null,

    fogBrushShape: FOG_BRUSH_SHAPES.CIRCLE,
    fogAction: FOG_ACTIONS.HIDE,
    fogBrushRadius: 75,
    isFogRevealedGlobally: false,

    zoom: 1.0,
    stageX: 0,
    stageY: 0,

    selectedTokenIds: [],
    selectedDrawingId: null,
    selectedFogId: null,
    isTokenEditorOpen: false,
    editingTokenId: null,

    isAssetMenuOpen: false,
    isSettingsMenuOpen: false,
    isDiceRollerOpen: false,

    laserPosition: null,
    remoteLasers: {},

    rulerType: "dnd5e_5105",
    rulerUnit: "ft",
    measurement: null,
    remoteMeasurements: {},

    resetCanvasStore: () =>
        set({
            activeTool: TOOLS.SELECT,
            zoom: 1.0,
            stageX: 0,
            stageY: 0,
            selectedTokenIds: [],
            selectedDrawingId: null,
            selectedFogId: null,
            isTokenEditorOpen: false,
            editingTokenId: null,
            isAssetMenuOpen: false,
            isSettingsMenuOpen: false,
            isDiceRollerOpen: false,
            laserPosition: null,
            remoteLasers: {},
            measurement: null,
            remoteMeasurements: {},
            isFogRevealedGlobally: false,
        }),

    setInputMode: (mode) => set({ inputMode: mode }),
    setZoomSensitivity: (val) => set({ zoomSensitivity: Number(val) || 1.0 }),
    setShapeSnapSensitivity: (val) => set({ shapeSnapSensitivity: Number(val) || 0.5 }),
    setGmFogBlend: (val) => set({ gmFogBlend: Number(val) || 0.45 }),

    setActiveTool: (tool) =>
        set((state) => {
            if (state.activeTool === tool && state.selectedDrawingId === null && state.selectedFogId === null && state.laserPosition === null) {
                return state;
            }
            return {
                activeTool: tool,
                selectedDrawingId: null,
                selectedFogId: null,
                laserPosition: null,
            };
        }),
    toggleActiveTool: (tool) =>
        set((state) => ({
            activeTool: state.activeTool === tool ? TOOLS.SELECT : tool,
            selectedDrawingId: null,
            selectedFogId: null,
            laserPosition: null,
        })),
    setActiveDrawShape: (shape) =>
        set({ activeDrawShape: shape, selectedDrawingId: null, selectedFogId: null }),
    setDrawStrokeColor: (color) => set({ drawStrokeColor: color }),
    setDrawStrokeWidth: (width) => set({ drawStrokeWidth: width }),
    setDrawFillColor: (color) => set({ drawFillColor: color }),
    setIsDrawGMLayer: (isGM) => set({ isDrawGMLayer: isGM }),

    setTextFontFamily: (fontFamily) => set({ textFontFamily }),
    setTextFontSize: (size) => set({ textFontSize: size }),
    setTextColor: (color) => set({ textColor: color }),
    setTextIsBold: (isBold) =>
        set((state) => ({
            textIsBold: typeof isBold === "function" ? isBold(state.textIsBold) : isBold,
        })),
    setTextIsItalic: (isItalic) =>
        set((state) => ({
            textIsItalic: typeof isItalic === "function" ? isItalic(state.textIsItalic) : isItalic,
        })),
    setTextHeading: (heading) => {
        set((state) => {
            const nextHeading = state.textHeading === heading ? "normal" : heading;
            let nextSize = 24;
            if (nextHeading === "h1") nextSize = 38;
            else if (nextHeading === "h2") nextSize = 28;
            return { textHeading: nextHeading, textFontSize: nextSize };
        });
    },
    setTextHasStroke: (hasStroke) =>
        set((state) => ({
            textHasStroke: typeof hasStroke === "function" ? hasStroke(state.textHasStroke) : hasStroke,
        })),
    setTextStrokeColor: (color) => set({ textStrokeColor: color }),
    setTextStrokeWidth: (width) => set({ textStrokeWidth: width }),
    setPendingEmoji: (emoji) => set({ pendingEmoji: emoji }),

    setFogBrushShape: (shape) => set({ fogBrushShape: shape }),
    setFogAction: (action) => set({ fogAction: action }),
    setFogBrushRadius: (radius) => set({ fogBrushRadius: radius }),
    toggleFogGlobalReveal: () =>
        set((state) => ({ isFogRevealedGlobally: !state.isFogRevealedGlobally })),
    setFogGlobalReveal: (val) => set({ isFogRevealedGlobally: Boolean(val) }),

    setRulerType: (type) => set({ rulerType: type }),
    setRulerUnit: (unit) => set({ rulerUnit: unit }),

    setZoom: (zoom) =>
        set((state) => {
            const nextZoom = typeof zoom === "function" ? zoom(state.zoom) : zoom;
            if (state.zoom === nextZoom) return state;
            return { zoom: nextZoom };
        }),
    setStagePos: (stageX, stageY) =>
        set((state) => {
            if (state.stageX === stageX && state.stageY === stageY) return state;
            return { stageX, stageY };
        }),

    fitToMap: (mapW = null, mapH = null, containerW = null, containerH = null) => {
        let screenW = containerW;
        let screenH = containerH;

        if (!screenW || screenW <= 300) {
            if (typeof document !== "undefined") {
                const container = document.getElementById("vtt-game-canvas-container");
                if (container && container.clientWidth > 300) {
                    screenW = container.clientWidth;
                    screenH = container.clientHeight;
                }
            }
        }
        if (!screenW || screenW <= 300) {
            screenW = typeof window !== "undefined" ? window.innerWidth : 1920;
            screenH = typeof window !== "undefined" ? window.innerHeight : 1080;
        }

        const sceneState = useSceneStore.getState().currentScene;
        const targetW = mapW && Number(mapW) > 50 ? Number(mapW) : sceneState?.mapWidth || 2000;
        const targetH = mapH && Number(mapH) > 50 ? Number(mapH) : sceneState?.mapHeight || 1500;

        const paddingX = Math.min(screenW * 0.08, 90);
        const paddingY = Math.min(screenH * 0.1, 90);

        const availW = Math.max(screenW - paddingX * 2, 200);
        const availH = Math.max(screenH - paddingY * 2, 200);

        const scaleX = availW / targetW;
        const scaleY = availH / targetH;
        const optimalScale = Math.min(scaleX, scaleY);
        const clampedScale = Math.max(MIN_ZOOM, Math.min(optimalScale, MAX_ZOOM));

        const stageX = (screenW - targetW * clampedScale) / 2;
        const stageY = (screenH - targetH * clampedScale) / 2;

        set({
            zoom: Number(clampedScale.toFixed(3)),
            stageX: Math.round(stageX),
            stageY: Math.round(stageY),
        });
    },

    resetView: () => {
        get().fitToMap();
    },

    focusOnCoordinates: (targetX, targetY) => {
        const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1920;
        const windowHeight = typeof window !== "undefined" ? window.innerHeight : 1080;
        set((state) => ({
            stageX: Math.round(windowWidth / 2 - targetX * state.zoom),
            stageY: Math.round(windowHeight / 2 - targetY * state.zoom),
        }));
    },

    toggleTokenSelection: (tokenId, isMulti = false) => {
        set((state) => {
            if (isMulti) {
                return {
                    selectedTokenIds: state.selectedTokenIds.includes(tokenId)
                        ? state.selectedTokenIds.filter((id) => id !== tokenId)
                        : [...state.selectedTokenIds, tokenId],
                    selectedDrawingId: null,
                    selectedFogId: null,
                };
            }
            return {
                selectedTokenIds: [tokenId],
                selectedDrawingId: null,
                selectedFogId: null,
            };
        });
    },

    setSelectedDrawingId: (id) =>
        set({ selectedDrawingId: id, selectedTokenIds: [], selectedFogId: null }),
    setSelectedFogId: (id) =>
        set({ selectedFogId: id, selectedDrawingId: null, selectedTokenIds: [] }),
    clearSelection: () =>
        set({ selectedTokenIds: [], selectedDrawingId: null, selectedFogId: null }),

    openTokenEditor: (tokenId) => set({ isTokenEditorOpen: true, editingTokenId: tokenId }),
    closeTokenEditor: () => set({ isTokenEditorOpen: false, editingTokenId: null }),

    closeAllMenus: () =>
        set((state) => {
            if (!state.isAssetMenuOpen && !state.isSettingsMenuOpen && !state.isDiceRollerOpen) {
                return state;
            }
            return { isAssetMenuOpen: false, isSettingsMenuOpen: false, isDiceRollerOpen: false };
        }),

    toggleMenu: (menuName) => {
        set((state) => {
            if (menuName === "asset") {
                return {
                    isAssetMenuOpen: !state.isAssetMenuOpen,
                    isSettingsMenuOpen: false,
                    isDiceRollerOpen: false,
                };
            }
            if (menuName === "settings") {
                return {
                    isSettingsMenuOpen: !state.isSettingsMenuOpen,
                    isAssetMenuOpen: false,
                    isDiceRollerOpen: false,
                };
            }
            if (menuName === "dice") {
                return {
                    isDiceRollerOpen: !state.isDiceRollerOpen,
                    isAssetMenuOpen: false,
                    isSettingsMenuOpen: false,
                };
            }
            return state;
        });
    },

    startMeasurement: (x, y) => {
        set({
            measurement: {
                startX: x,
                startY: y,
                currentX: x,
                currentY: y,
                waypoints: [],
            },
        });
    },

    updateMeasurement: (x, y) => {
        set((state) => {
            if (!state.measurement) return state;
            if (state.measurement.currentX === x && state.measurement.currentY === y) return state;
            return {
                measurement: {
                    ...state.measurement,
                    currentX: x,
                    currentY: y,
                },
            };
        });
    },

    addMeasurementWaypoint: (x, y) => {
        set((state) => {
            if (!state.measurement) return state;
            return {
                measurement: {
                    ...state.measurement,
                    waypoints: [...state.measurement.waypoints, { x, y }],
                },
            };
        });
    },

    endMeasurement: () => set({ measurement: null }),

    updateRemoteMeasurement: (data) => {
        if (!data || !data.userId) return;
        const key = String(data.userId);
        set((state) => ({
            remoteMeasurements: {
                ...state.remoteMeasurements,
                [key]: {
                    ...data,
                    timestamp: Date.now(),
                },
            },
        }));
    },

    clearRemoteMeasurement: (userId) => {
        if (!userId) return;
        const key = String(userId);
        set((state) => {
            if (!state.remoteMeasurements[key]) return state;
            const next = { ...state.remoteMeasurements };
            delete next[key];
            return { remoteMeasurements: next };
        });
    },

    setLaserPosition: (pos) => set({ laserPosition: pos }),

    updateRemoteLaser: (laserData) => {
        if (!laserData) return;
        const key = String(laserData.userId || laserData.userName || "laser-user");
        set((state) => ({
            remoteLasers: {
                ...state.remoteLasers,
                [key]: {
                    ...laserData,
                    userId: key,
                    timestamp: Date.now(),
                },
            },
        }));
    },

    clearRemoteLaser: (userId) => {
        if (!userId) return;
        const key = String(userId);
        set((state) => {
            if (!state.remoteLasers[key]) return state;
            const next = { ...state.remoteLasers };
            delete next[key];
            return { remoteLasers: next };
        });
    },
}));