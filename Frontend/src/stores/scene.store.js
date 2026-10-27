import { create } from "zustand";
import { sceneApi } from "../api/scene.api";
import { tokenApi } from "../api/token.api";
import { settingsApi } from "../api/settings.api";
import { wsService } from "../services/websocket.service";
import { useCanvasStore } from "./canvas.store";
import { snapToGrid } from "../utils/grid";

const matchDrawingId = (a, b) => {
    if (!a || !b) return false;
    const idA = String(a.clientDrawingId || a.id || a.drawingId || "").trim();
    const idB = String(b.clientDrawingId || b.id || b.drawingId || "").trim();
    if (idA && idB && idA === idB) return true;
    if (a.id && b.id && String(a.id) === String(b.id)) return true;
    if (a.clientDrawingId && b.clientDrawingId && String(a.clientDrawingId) === String(b.clientDrawingId)) return true;
    return false;
};

const matchFogId = (a, b) => {
    if (!a || !b) return false;
    const idA = String(a.id || a.fogId || (typeof a.points === "object" ? a.points?.id : "") || "").trim().toLowerCase();
    const idB = String(b.id || b.fogId || (typeof b.points === "object" ? b.points?.id : "") || "").trim().toLowerCase();
    return Boolean(idA && idB && idA === idB);
};

const normalizeFogRegion = (fog) => {
    if (!fog) return null;

    const rawType = String(fog.type || fog.mode || "").toUpperCase();
    if (rawType === "CLEAR_ALL" || rawType === "FILL_ALL") {
        return null;
    }

    let shapeObj = fog;
    if (fog.points && typeof fog.points === "object" && !Array.isArray(fog.points)) {
        shapeObj = {
            ...fog.points,
            id: fog.id || fog.points.id,
            isCover: fog.type === "HIDE" || fog.points.isCover,
        };
    }

    const isCover =
        shapeObj.isCover !== undefined
            ? Boolean(shapeObj.isCover)
            : String(fog.type).toUpperCase() === "HIDE";

    return {
        ...shapeObj,
        id: String(fog.id || shapeObj.id || `fog-${Date.now()}`),
        isCover: isCover,
        type: shapeObj.type || (shapeObj.radius ? "circle" : "rect"),
    };
};

const activePingTimers = new Set();

export const useSceneStore = create((set, get) => ({
    currentScene: null,
    scenes: [],
    pings: [],
    remoteLiveDrawing: null,
    remoteLiveFog: null,
    isLoading: false,
    availableConditions: [],
    roomSettings: null,
    currentRoomId: null,

    setScene: (sceneOrUpdater) => {
        set((state) => ({
            currentScene:
                typeof sceneOrUpdater === "function"
                    ? sceneOrUpdater(state.currentScene)
                    : sceneOrUpdater,
        }));
    },

    setRoomSettings: (settings) => {
        set({ roomSettings: settings });
    },

    resetSceneStore: () => {
        activePingTimers.forEach((timer) => clearTimeout(timer));
        activePingTimers.clear();
        set({
            currentScene: null,
            scenes: [],
            pings: [],
            remoteLiveDrawing: null,
            remoteLiveFog: null,
            isLoading: false,
            availableConditions: [],
            roomSettings: null,
            currentRoomId: null,
        });
    },

    setAvailableConditions: (conditions) => {
        set({ availableConditions: Array.isArray(conditions) ? conditions : [] });
    },

    addSceneFromSocket: (newScene) => {
        if (!newScene || !newScene.id) return;
        const targetId = String(newScene.id).toLowerCase();

        set((state) => {
            const idx = state.scenes.findIndex((s) => String(s.id).toLowerCase() === targetId);
            if (idx !== -1) {
                const nextScenes = [...state.scenes];
                nextScenes[idx] = { ...nextScenes[idx], ...newScene };
                return { scenes: nextScenes };
            }
            return {
                scenes: [...state.scenes, newScene],
            };
        });
    },

    setRemoteLiveDrawing: (drawData) => {
        set({ remoteLiveDrawing: drawData });
    },

    setRemoteLiveFog: (fogData) => {
        set({ remoteLiveFog: fogData });
    },

    addAvailableCondition: (conditionId, shouldBroadcast = true) => {
        const state = get();
        if (state.availableConditions.includes(conditionId)) return;
        const nextList = [...state.availableConditions, conditionId];
        set({ availableConditions: nextList });

        if (shouldBroadcast) {
            wsService.send("CONDITION_POOL_UPDATE", { availableConditions: nextList });
        }
    },

    removeAvailableCondition: (conditionId, shouldBroadcast = true) => {
        const state = get();
        const nextAvailable = state.availableConditions.filter((c) => c !== conditionId);
        const updatedTokens = (state.currentScene?.tokens || []).map((t) => ({
            ...t,
            conditions: (t.conditions || []).filter((c) => c !== conditionId),
        }));

        set({
            availableConditions: nextAvailable,
            currentScene: state.currentScene ? { ...state.currentScene, tokens: updatedTokens } : null,
        });

        if (shouldBroadcast) {
            wsService.send("CONDITION_POOL_UPDATE", { availableConditions: nextAvailable });
        }
    },

    loadScenes: async (roomId) => {
        if (!roomId) return;
        set({ isLoading: true, currentRoomId: roomId });
        try {
            let [scenes, roomSettings] = await Promise.all([
                sceneApi.getScenes(roomId),
                settingsApi.getSettings(roomId).catch(() => null),
            ]);

            if (roomSettings) {
                if (roomSettings.measurementType) {
                    useCanvasStore.getState().setRulerType(roomSettings.measurementType);
                }
                if (roomSettings.inputMode) {
                    useCanvasStore.getState().setInputMode(roomSettings.inputMode);
                }
                if (roomSettings.zoomSensitivity !== undefined) {
                    useCanvasStore.getState().setZoomSensitivity(roomSettings.zoomSensitivity);
                }
                if (roomSettings.shapeSnapSensitivity !== undefined) {
                    useCanvasStore.getState().setShapeSnapSensitivity(roomSettings.shapeSnapSensitivity);
                }
                if (roomSettings.gmFogBlend !== undefined) {
                    useCanvasStore.getState().setGmFogBlend(roomSettings.gmFogBlend);
                }
            }

            if (!scenes || scenes.length === 0) {
                const defaultScene = await sceneApi.createScene({
                    roomId: roomId,
                    name: "صحنه خوش‌آمدگویی",
                    isActive: true,
                });
                scenes = [defaultScene];
            }

            const active = scenes.find((s) => s.isActive) || scenes[0];
            const fullState = await sceneApi.getSceneState(active.id);
            const sceneData = fullState.scene || active;

            const finalMapUrl = sceneData.mapUrl || sceneData.assetUrl || "";
            const rawTokens = fullState.tokens || [];
            const loadedTokens = [];
            const seenTokenIds = new Set();

            for (let i = 0; i < rawTokens.length; i++) {
                const t = rawTokens[i];
                const tId = String(t.id).toLowerCase();
                if (!seenTokenIds.has(tId)) {
                    seenTokenIds.add(tId);
                    loadedTokens.push({
                        ...t,
                        id: String(t.id),
                        avatarUrl: t.avatarUrl || t.assetUrl || "",
                        assetUrl: t.avatarUrl || t.assetUrl || "",
                        name: t.label || t.name || "",
                        label: t.label || t.name || "",
                        controlledBy: t.controlledBy ? String(t.controlledBy) : null,
                        showHp: t.showHp !== undefined ? Boolean(t.showHp) : true,
                        showConditions: t.showConditions !== undefined ? Boolean(t.showConditions) : true,
                        showAc: t.showAc !== undefined ? Boolean(t.showAc) : true,
                        allowPlayerHp: t.allowPlayerHp !== undefined ? Boolean(t.allowPlayerHp) : true,
                        allowPlayerConditions: t.allowPlayerConditions !== undefined ? Boolean(t.allowPlayerConditions) : true,
                        allowPlayerAc: t.allowPlayerAc !== undefined ? Boolean(t.allowPlayerAc) : true,
                        allowPlayerSize: t.allowPlayerSize !== undefined ? Boolean(t.allowPlayerSize) : true,
                        conditions: Array.isArray(t.conditions) ? t.conditions : [],
                    });
                }
            }

            const rawFogRegions = fullState.fogRegions || sceneData.fogShapes || [];
            const normalizedFog = rawFogRegions.map(normalizeFogRegion).filter(Boolean);
            const isRevealedSaved = Boolean(sceneData.isFogRevealed || fullState.isFogRevealed);

            useCanvasStore.getState().setFogGlobalReveal(isRevealedSaved);

            const finalGrid = {
                enabled: true,
                type: roomSettings?.gridType || sceneData.gridType || "square",
                lineType: roomSettings?.lineType || "solid",
                size: Number(roomSettings?.gridSize || sceneData.gridSize || 60),
                color: roomSettings?.gridColor || sceneData.gridColor || "#000000",
                opacity: roomSettings?.gridOpacity !== undefined ? Number(roomSettings.gridOpacity) : (sceneData.gridOpacity || 0.35),
                lineWidth: roomSettings?.lineWidth !== undefined ? Number(roomSettings.lineWidth) : 1.5,
                snapToGrid: roomSettings?.isGridSnapping !== undefined ? Boolean(roomSettings.isGridSnapping) : true,
            };

            const sceneWithState = {
                ...sceneData,
                id: String(sceneData.id || active.id),
                assetUrl: finalMapUrl,
                mapUrl: finalMapUrl,
                mapWidth: sceneData.mapWidth || 2000,
                mapHeight: sceneData.mapHeight || 1500,
                tokens: loadedTokens,
                drawings: fullState.drawings || [],
                fogShapes: normalizedFog,
                fogEnabled: normalizedFog.length > 0 || Boolean(sceneData.fogFilled),
                fogFilled: Boolean(sceneData.fogFilled),
                isFogRevealed: isRevealedSaved,
                grid: finalGrid,
            };

            const persistentConditions = sceneData.availableConditions || fullState.availableConditions || [];

            set({
                scenes: scenes,
                currentScene: sceneWithState,
                availableConditions: Array.isArray(persistentConditions) ? persistentConditions : [],
                roomSettings: roomSettings || null,
                isLoading: false,
            });
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error("خطا در دریافت صحنه‌های اتاق:", err);
            }
            set({ isLoading: false });
        }
    },

    syncTokenFromSocket: (socketData) => {
        set((state) => {
            if (!state.currentScene || !state.currentScene.tokens) return state;

            const rawId = socketData.tokenId || socketData.id;
            if (!rawId) return state;

            const strId = String(rawId).toLowerCase();

            if (
                strId.startsWith("draw-") ||
                strId.startsWith("fog-") ||
                strId.startsWith("ping-") ||
                strId.startsWith("text-") ||
                socketData.points !== undefined ||
                socketData.stroke !== undefined ||
                socketData.isCover !== undefined
            ) {
                return state;
            }

            const currentTokens = state.currentScene.tokens;

            if (socketData.isDeleted) {
                const idx = currentTokens.findIndex((t) => String(t.id).toLowerCase() === strId);
                if (idx === -1) return state;
                return {
                    currentScene: {
                        ...state.currentScene,
                        tokens: currentTokens.filter((_, i) => i !== idx),
                    },
                };
            }

            const existsIndex = currentTokens.findIndex(
                (t) => String(t.id).toLowerCase() === strId
            );

            const cleanSocketData = {};
            const keys = Object.keys(socketData);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (socketData[key] !== null && socketData[key] !== undefined) {
                    cleanSocketData[key] = socketData[key];
                }
            }

            const incomingAvatar = cleanSocketData.avatarUrl || cleanSocketData.assetUrl;
            const incomingName = cleanSocketData.label || cleanSocketData.name;

            let updatedTokens;
            if (existsIndex !== -1) {
                const oldToken = currentTokens[existsIndex];
                const resolvedConditions =
                    cleanSocketData.conditions !== undefined
                        ? (Array.isArray(cleanSocketData.conditions) ? cleanSocketData.conditions : [])
                        : (oldToken.conditions || []);

                const updatedSingleToken = {
                    ...oldToken,
                    ...cleanSocketData,
                    id: String(oldToken.id),
                    name: incomingName || oldToken.name || oldToken.label,
                    label: incomingName || oldToken.label || oldToken.name,
                    x: cleanSocketData.x !== undefined ? Number(cleanSocketData.x) : oldToken.x,
                    y: cleanSocketData.y !== undefined ? Number(cleanSocketData.y) : oldToken.y,
                    avatarUrl: incomingAvatar || oldToken.avatarUrl,
                    assetUrl: incomingAvatar || oldToken.assetUrl,
                    showHp: cleanSocketData.showHp !== undefined ? Boolean(cleanSocketData.showHp) : oldToken.showHp,
                    showConditions: cleanSocketData.showConditions !== undefined ? Boolean(cleanSocketData.showConditions) : oldToken.showConditions,
                    showAc: cleanSocketData.showAc !== undefined ? Boolean(cleanSocketData.showAc) : oldToken.showAc,
                    allowPlayerHp: cleanSocketData.allowPlayerHp !== undefined ? Boolean(cleanSocketData.allowPlayerHp) : oldToken.allowPlayerHp,
                    allowPlayerConditions: cleanSocketData.allowPlayerConditions !== undefined ? Boolean(cleanSocketData.allowPlayerConditions) : oldToken.allowPlayerConditions,
                    allowPlayerAc: cleanSocketData.allowPlayerAc !== undefined ? Boolean(cleanSocketData.allowPlayerAc) : oldToken.allowPlayerAc,
                    allowPlayerSize: cleanSocketData.allowPlayerSize !== undefined ? Boolean(cleanSocketData.allowPlayerSize) : oldToken.allowPlayerSize,
                    conditions: resolvedConditions,
                };

                updatedTokens = [...currentTokens];
                updatedTokens[existsIndex] = updatedSingleToken;
            } else {
                if (!cleanSocketData.x && !cleanSocketData.y && !incomingName) {
                    return state;
                }

                const newToken = {
                    ...cleanSocketData,
                    id: String(rawId),
                    name: incomingName || "توکن",
                    label: incomingName || "توکن",
                    avatarUrl: incomingAvatar || "",
                    assetUrl: incomingAvatar || "",
                    x: Number(cleanSocketData.x || 0),
                    y: Number(cleanSocketData.y || 0),
                    controlledBy: cleanSocketData.controlledBy ? String(cleanSocketData.controlledBy) : null,
                    showHp: cleanSocketData.showHp !== undefined ? Boolean(cleanSocketData.showHp) : true,
                    showConditions: cleanSocketData.showConditions !== undefined ? Boolean(cleanSocketData.showConditions) : true,
                    showAc: cleanSocketData.showAc !== undefined ? Boolean(cleanSocketData.showAc) : true,
                    allowPlayerHp: cleanSocketData.allowPlayerHp !== undefined ? Boolean(cleanSocketData.allowPlayerHp) : true,
                    allowPlayerConditions: cleanSocketData.allowPlayerConditions !== undefined ? Boolean(cleanSocketData.allowPlayerConditions) : true,
                    allowPlayerAc: cleanSocketData.allowPlayerAc !== undefined ? Boolean(cleanSocketData.allowPlayerAc) : true,
                    allowPlayerSize: cleanSocketData.allowPlayerSize !== undefined ? Boolean(cleanSocketData.allowPlayerSize) : true,
                    conditions: Array.isArray(cleanSocketData.conditions) ? cleanSocketData.conditions : [],
                };
                updatedTokens = [...currentTokens, newToken];
            }

            return {
                currentScene: {
                    ...state.currentScene,
                    tokens: updatedTokens,
                },
            };
        });
    },

    setMapForCurrentScene: async (mapUrl, assetId = null) => {
        const state = get();
        let current = state.currentScene;
        if (!current) return;

        const updatedScene = {
            ...current,
            mapUrl: mapUrl,
            assetUrl: mapUrl,
        };

        const sceneIdx = state.scenes.findIndex((s) => s.id === current.id);
        const nextScenes = [...state.scenes];
        if (sceneIdx !== -1) {
            nextScenes[sceneIdx] = { ...nextScenes[sceneIdx], mapUrl, assetUrl: mapUrl };
        }

        set({
            currentScene: updatedScene,
            scenes: nextScenes,
        });

        wsService.send("SCENE_UPDATED", { sceneId: current.id, mapUrl, assetId });

        try {
            await sceneApi.updateSceneMap(current.id, { mapUrl, assetId });
        } catch (err) {
            if (import.meta.env.DEV) console.error("خطا در ذخیره نقشه در سرور:", err);
        }
    },

    renameScene: async (sceneId, newName) => {
        if (!sceneId || !newName?.trim()) return;
        const trimmed = newName.trim();
        const targetId = String(sceneId).toLowerCase();

        set((state) => {
            const idx = state.scenes.findIndex((s) => String(s.id).toLowerCase() === targetId);
            const nextScenes = [...state.scenes];
            if (idx !== -1) {
                nextScenes[idx] = { ...nextScenes[idx], name: trimmed };
            }

            return {
                scenes: nextScenes,
                currentScene:
                    String(state.currentScene?.id || "").toLowerCase() === targetId
                        ? { ...state.currentScene, name: trimmed }
                        : state.currentScene,
            };
        });

        try {
            await sceneApi.renameScene(sceneId, trimmed);
            wsService.send("SCENE_RENAME", { sceneId, name: trimmed });
        } catch (err) {
            if (import.meta.env.DEV) console.error("خطا در تغییر نام صحنه:", err);
        }
    },

    addToken: async (tokenData) => {
        const state = get();
        if (!state.currentScene) return;

        const mapW = state.currentScene.mapWidth || 2000;
        const mapH = state.currentScene.mapHeight || 1500;
        const defaultCenterX = mapW / 2;
        const defaultCenterY = mapH / 2;

        const rawX = tokenData.x !== undefined ? tokenData.x : defaultCenterX;
        const rawY = tokenData.y !== undefined ? tokenData.y : defaultCenterY;

        const grid = state.currentScene.grid || {};
        const gridSize = grid.size || 60;
        const gridType = grid.type || "square";
        const snapEnabled = grid.snapToGrid !== false;

        const centerPos = snapToGrid(rawX, rawY, gridSize, gridType, tokenData.size || 1, snapEnabled);
        const tokenName = tokenData.name || tokenData.label || "توکن";

        const isValidUUID = (uuid) => {
            if (!uuid || typeof uuid !== "string") return false;
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid.trim());
        };
        const validAssetId = isValidUUID(tokenData.assetId) ? tokenData.assetId : null;

        try {
            const savedToken = await tokenApi.createToken({
                sceneId: state.currentScene.id,
                assetId: validAssetId,
                label: tokenName,
                avatarUrl: tokenData.avatarUrl || tokenData.assetUrl || "",
                x: centerPos.x,
                y: centerPos.y,
                size: tokenData.size || (tokenData.isProp ? 0.5 : 1),
                hp: tokenData.hp || 20,
                maxHp: tokenData.maxHp || 20,
                ac: tokenData.ac || 12,
                controlledBy: tokenData.controlledBy ? String(tokenData.controlledBy) : null,
                isProp: Boolean(tokenData.isProp),
            });

            const fullToken = {
                ...tokenData,
                ...savedToken,
                id: String(savedToken.id),
                name: savedToken.label || tokenName,
                label: savedToken.label || tokenName,
                avatarUrl: savedToken.avatarUrl || savedToken.assetUrl || tokenData.avatarUrl,
                assetUrl: savedToken.avatarUrl || savedToken.assetUrl || tokenData.avatarUrl,
                x: centerPos.x,
                y: centerPos.y,
                conditions: Array.isArray(savedToken.conditions) ? savedToken.conditions : [],
            };

            const updatedTokens = [...(state.currentScene.tokens || []), fullToken];
            set({ currentScene: { ...state.currentScene, tokens: updatedTokens } });

            wsService.send("TOKEN_MOVE", {
                tokenId: String(savedToken.id),
                ...fullToken,
            });
        } catch (err) {
            if (import.meta.env.DEV) console.error("خطا در ثبت پایدار توکن:", err);
        }
    },

    updateToken: (tokenId, updates) => {
        set((state) => {
            if (!state.currentScene || !state.currentScene.tokens) return state;
            const targetId = String(tokenId).toLowerCase();
            const tokens = state.currentScene.tokens;
            const idx = tokens.findIndex((t) => String(t.id).toLowerCase() === targetId);
            if (idx === -1) return state;

            const nextTokens = [...tokens];
            nextTokens[idx] = { ...nextTokens[idx], ...updates };

            return { currentScene: { ...state.currentScene, tokens: nextTokens } };
        });
    },

    moveToken: (tokenId, x, y) => {
        set((state) => {
            if (!state.currentScene || !state.currentScene.tokens) return state;
            const targetId = String(tokenId).toLowerCase();
            const tokens = state.currentScene.tokens;
            const idx = tokens.findIndex((t) => String(t.id).toLowerCase() === targetId);
            if (idx === -1) return state;

            const nextX = Number(x);
            const nextY = Number(y);
            if (tokens[idx].x === nextX && tokens[idx].y === nextY) {
                return state;
            }

            const nextTokens = [...tokens];
            nextTokens[idx] = { ...nextTokens[idx], x: nextX, y: nextY };

            return { currentScene: { ...state.currentScene, tokens: nextTokens } };
        });
    },

    removeToken: (tokenId) => {
        set((state) => {
            if (!state.currentScene || !state.currentScene.tokens) return state;
            const targetId = String(tokenId).toLowerCase();
            const tokens = state.currentScene.tokens;
            const idx = tokens.findIndex((t) => String(t.id).toLowerCase() === targetId);
            if (idx === -1) return state;

            return {
                currentScene: {
                    ...state.currentScene,
                    tokens: tokens.filter((_, i) => i !== idx),
                },
            };
        });
    },

    addDrawing: (drawing) => {
        set((state) => {
            if (!state.currentScene) return state;
            const existing = state.currentScene.drawings || [];
            const existsIndex = existing.findIndex((d) => matchDrawingId(d, drawing));

            let nextDrawings;
            if (existsIndex !== -1) {
                nextDrawings = [...existing];
                nextDrawings[existsIndex] = { ...nextDrawings[existsIndex], ...drawing };
            } else {
                nextDrawings = [...existing, drawing];
            }

            return {
                currentScene: {
                    ...state.currentScene,
                    drawings: nextDrawings,
                },
                remoteLiveDrawing: null,
            };
        });
    },

    updateDrawing: (drawingId, updates) => {
        set((state) => {
            if (!state.currentScene || !state.currentScene.drawings) return state;
            const dummy = { id: drawingId, clientDrawingId: drawingId, drawingId };
            const drawings = state.currentScene.drawings;
            const idx = drawings.findIndex((d) => matchDrawingId(d, dummy));
            if (idx === -1) return state;

            const nextDrawings = [...drawings];
            nextDrawings[idx] = { ...nextDrawings[idx], ...updates };

            return {
                currentScene: {
                    ...state.currentScene,
                    drawings: nextDrawings,
                },
            };
        });
    },

    removeDrawing: (drawingId) => {
        set((state) => {
            if (!state.currentScene || !state.currentScene.drawings) return state;
            const dummy = { id: drawingId, clientDrawingId: drawingId, drawingId };
            const drawings = state.currentScene.drawings;
            const idx = drawings.findIndex((d) => matchDrawingId(d, dummy));
            if (idx === -1) return state;

            return {
                currentScene: {
                    ...state.currentScene,
                    drawings: drawings.filter((_, i) => i !== idx),
                },
            };
        });
    },

    clearDrawings: () => {
        set((state) => {
            if (!state.currentScene || !state.currentScene.drawings || state.currentScene.drawings.length === 0) {
                return state;
            }
            return { currentScene: { ...state.currentScene, drawings: [] } };
        });
    },

    addFogShape: (shapeData) => {
        const normalized = normalizeFogRegion(shapeData);
        if (!normalized) return;

        set((state) => {
            if (!state.currentScene) return state;
            const existing = state.currentScene.fogShapes || [];
            const existsIndex = existing.findIndex((f) => matchFogId(f, normalized));

            let nextFog;
            if (existsIndex !== -1) {
                nextFog = [...existing];
                nextFog[existsIndex] = { ...nextFog[existsIndex], ...normalized };
            } else {
                nextFog = [...existing, normalized];
            }

            return {
                currentScene: {
                    ...state.currentScene,
                    fogShapes: nextFog,
                    fogEnabled: true,
                },
                remoteLiveFog: null,
            };
        });
    },

    updateFogShape: (fogId, updates) => {
        set((state) => {
            if (!state.currentScene || !state.currentScene.fogShapes) return state;
            const targetId = String(fogId).trim().toLowerCase();
            const fogShapes = state.currentScene.fogShapes;
            const idx = fogShapes.findIndex((f) => String(f.id).trim().toLowerCase() === targetId);
            if (idx === -1) return state;

            const nextFog = [...fogShapes];
            nextFog[idx] = { ...nextFog[idx], ...updates };

            return {
                currentScene: {
                    ...state.currentScene,
                    fogShapes: nextFog,
                },
            };
        });
    },

    removeFogShape: (fogId) => {
        set((state) => {
            if (!state.currentScene || !state.currentScene.fogShapes) return state;
            const targetId = String(fogId).trim().toLowerCase();
            const fogShapes = state.currentScene.fogShapes;
            const idx = fogShapes.findIndex((f) => String(f.id).trim().toLowerCase() === targetId);
            if (idx === -1) return state;

            const filteredFog = fogShapes.filter((_, i) => i !== idx);
            return {
                currentScene: {
                    ...state.currentScene,
                    fogShapes: filteredFog,
                    fogEnabled: filteredFog.length > 0 || Boolean(state.currentScene.fogFilled),
                },
            };
        });
    },

    fillFog: () => {
        set((state) => {
            if (!state.currentScene) return state;
            return {
                currentScene: {
                    ...state.currentScene,
                    fogShapes: [],
                    fogEnabled: true,
                    fogFilled: true,
                },
                remoteLiveFog: null,
            };
        });
    },

    clearFog: () => {
        set((state) => {
            if (!state.currentScene) return state;
            return {
                currentScene: {
                    ...state.currentScene,
                    fogShapes: [],
                    fogEnabled: false,
                    fogFilled: false,
                },
                remoteLiveFog: null,
            };
        });
    },

    addPing: (pingData) => {
        const pingId = `ping-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const newPing = {
            ...pingData,
            id: pingId,
            timestamp: Date.now(),
        };

        set((state) => ({ pings: [...state.pings, newPing] }));

        const timer = setTimeout(() => {
            activePingTimers.delete(timer);
            set((state) => {
                const idx = state.pings.findIndex((p) => p.id === pingId);
                if (idx === -1) return state;
                return { pings: state.pings.filter((_, i) => i !== idx) };
            });
        }, 4000);

        activePingTimers.add(timer);
    },

    switchScene: async (sceneId, shouldBroadcast = true, explicitRoomId = null) => {
        if (!sceneId) return;
        const strTargetId = String(sceneId).toLowerCase();
        const state = get();
        const activeRoomId = explicitRoomId || state.currentRoomId;

        set({
            scenes: state.scenes.map((s) => ({
                ...s,
                isActive: String(s.id).toLowerCase() === strTargetId,
            })),
            currentScene: state.currentScene
                ? { ...state.currentScene, id: String(sceneId) }
                : { id: String(sceneId) },
        });

        if (shouldBroadcast) {
            wsService.send("SCENE_ACTIVATED", { sceneId: String(sceneId) });
            sceneApi.activateScene(sceneId).catch(() => {});
        }

        try {
            let roomSettings = state.roomSettings;
            if (!roomSettings && activeRoomId) {
                try {
                    roomSettings = await settingsApi.getSettings(activeRoomId);
                    set({ roomSettings });
                } catch (ignored) {}
            }

            const fullState = await sceneApi.getSceneState(sceneId);
            const sceneData = fullState.scene || {};
            const finalMapUrl = sceneData.mapUrl || sceneData.assetUrl || "";

            if (roomSettings) {
                if (roomSettings.measurementType) {
                    useCanvasStore.getState().setRulerType(roomSettings.measurementType);
                }
                if (roomSettings.inputMode) {
                    useCanvasStore.getState().setInputMode(roomSettings.inputMode);
                }
                if (roomSettings.zoomSensitivity !== undefined) {
                    useCanvasStore.getState().setZoomSensitivity(roomSettings.zoomSensitivity);
                }
                if (roomSettings.shapeSnapSensitivity !== undefined) {
                    useCanvasStore.getState().setShapeSnapSensitivity(roomSettings.shapeSnapSensitivity);
                }
                if (roomSettings.gmFogBlend !== undefined) {
                    useCanvasStore.getState().setGmFogBlend(roomSettings.gmFogBlend);
                }
            }

            const rawTokens = fullState.tokens || [];
            const loadedTokens = [];
            for (let i = 0; i < rawTokens.length; i++) {
                const t = rawTokens[i];
                loadedTokens.push({
                    ...t,
                    id: String(t.id),
                    avatarUrl: t.avatarUrl || t.assetUrl || "",
                    assetUrl: t.avatarUrl || t.assetUrl || "",
                    name: t.label || t.name || "",
                    label: t.label || t.name || "",
                    controlledBy: t.controlledBy ? String(t.controlledBy) : null,
                    showHp: t.showHp !== undefined ? Boolean(t.showHp) : true,
                    showConditions: t.showConditions !== undefined ? Boolean(t.showConditions) : true,
                    showAc: t.showAc !== undefined ? Boolean(t.showAc) : true,
                    allowPlayerHp: t.allowPlayerHp !== undefined ? Boolean(t.allowPlayerHp) : true,
                    allowPlayerConditions: t.allowPlayerConditions !== undefined ? Boolean(t.allowPlayerConditions) : true,
                    allowPlayerAc: t.allowPlayerAc !== undefined ? Boolean(t.allowPlayerAc) : true,
                    allowPlayerSize: t.allowPlayerSize !== undefined ? Boolean(t.allowPlayerSize) : true,
                    conditions: Array.isArray(t.conditions) ? t.conditions : [],
                });
            }

            const rawFogRegions = fullState.fogRegions || sceneData.fogShapes || [];
            const normalizedFog = rawFogRegions.map(normalizeFogRegion).filter(Boolean);
            const isRevealedSaved = Boolean(sceneData.isFogRevealed || fullState.isFogRevealed);

            useCanvasStore.getState().setFogGlobalReveal(isRevealedSaved);

            const persistentConditions = sceneData.availableConditions || fullState.availableConditions || [];

            const finalGrid = {
                enabled: true,
                type: roomSettings?.gridType || sceneData.gridType || "square",
                lineType: roomSettings?.lineType || "solid",
                size: Number(roomSettings?.gridSize || sceneData.gridSize || 60),
                color: roomSettings?.gridColor || sceneData.gridColor || "#000000",
                opacity: roomSettings?.gridOpacity !== undefined
                    ? Number(roomSettings.gridOpacity)
                    : (sceneData.gridOpacity !== undefined ? Number(sceneData.gridOpacity) : 0.35),
                lineWidth: roomSettings?.lineWidth !== undefined ? Number(roomSettings.lineWidth) : 1.5,
                snapToGrid: roomSettings?.isGridSnapping !== undefined ? Boolean(roomSettings.isGridSnapping) : true,
            };

            const sceneWithState = {
                ...sceneData,
                id: String(sceneData.id || sceneId),
                assetUrl: finalMapUrl,
                mapUrl: finalMapUrl,
                mapWidth: sceneData.mapWidth || 2000,
                mapHeight: sceneData.mapHeight || 1500,
                tokens: loadedTokens,
                drawings: fullState.drawings || [],
                fogShapes: normalizedFog,
                fogEnabled: normalizedFog.length > 0 || Boolean(sceneData.fogFilled),
                fogFilled: Boolean(sceneData.fogFilled),
                isFogRevealed: isRevealedSaved,
                grid: finalGrid,
            };

            set({
                currentScene: sceneWithState,
                availableConditions: Array.isArray(persistentConditions) ? persistentConditions : [],
            });
        } catch (err) {
            if (import.meta.env.DEV) console.error("خطا در تغییر صحنه:", err);
        }
    },
}));
