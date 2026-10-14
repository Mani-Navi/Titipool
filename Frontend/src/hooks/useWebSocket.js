// src/hooks/useWebSocket.js
import { useEffect, useRef, useCallback } from "react";
import { wsService } from "../services/websocket.service";
import { useSceneStore } from "../stores/scene.store";
import { useCanvasStore } from "../stores/canvas.store";
import { useWebSocketStore } from "../stores/websocket.store";
import { useDiceStore } from "../features/dice/state/dice.store";
import { WS_EVENTS } from "../constants/wsEvents.js";

export function useWebSocket(roomId, onMessage = null) {
  const status = useWebSocketStore((state) => state.status);
  const latency = useWebSocketStore((state) => state.latency);

  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!roomId) return;

    const token = localStorage.getItem("vtt_jwt");
    wsService.connect(roomId, token);

    const unsubUsers = wsService.on("USERS_UPDATE", (data) => {
      if (onMessageRef.current) onMessageRef.current(data);
    });

    const unsubRoomClosed = wsService.on("ROOM_CLOSED", (data) => {
      if (onMessageRef.current) onMessageRef.current({ action: "ROOM_CLOSED", data });
    });

    const unsubRoomDeleted = wsService.on("ROOM_DELETED", (data) => {
      if (onMessageRef.current) onMessageRef.current({ action: "ROOM_DELETED", data });
    });

    const unsubMemberKicked = wsService.on("MEMBER_KICKED", (data) => {
      if (onMessageRef.current) onMessageRef.current({ action: "MEMBER_KICKED", data });
    });

    const unsubMemberBanned = wsService.on("MEMBER_BANNED", (data) => {
      if (onMessageRef.current) onMessageRef.current({ action: "MEMBER_BANNED", data });
    });

    const unsubToken = wsService.on(WS_EVENTS.TOKEN_MOVED, (data) => {
      if (data) {
        useSceneStore.getState().syncTokenFromSocket(data);
      }
      if (onMessageRef.current) onMessageRef.current(data);
    });

    const unsubConditions = wsService.on("CONDITION_POOL_UPDATE", (data) => {
      if (data) {
        const conditionsList =
            data.availableConditions ||
            data.conditions ||
            (Array.isArray(data) ? data : null);

        if (conditionsList && Array.isArray(conditionsList)) {
          useSceneStore.getState().setAvailableConditions(conditionsList);
        }
      }
      if (onMessageRef.current) onMessageRef.current({ action: "CONDITION_POOL_UPDATE", data });
    });

    const unsubDraw = wsService.on(WS_EVENTS.DRAWING_ADDED, (data) => {
      if (data) {
        useSceneStore.getState().addDrawing(data);
      }
      if (onMessageRef.current) onMessageRef.current(data);
    });

    const unsubDrawDelete = wsService.on(WS_EVENTS.DRAWING_DELETED, (data) => {
      const targetId = data?.id || data?.drawingId || data?.clientDrawingId || data;
      if (targetId) {
        useSceneStore.getState().removeDrawing(targetId);
      }
      if (onMessageRef.current) onMessageRef.current(data);
    });

    const unsubDrawLive = wsService.on("DRAWING_LIVE", (data) => {
      if (data) {
        useSceneStore.getState().setRemoteLiveDrawing(data);
      }
    });

    const unsubDrawLiveEnd = wsService.on("DRAWING_LIVE_END", () => {
      useSceneStore.getState().setRemoteLiveDrawing(null);
    });

    const unsubDrawClear = wsService.on(WS_EVENTS.DRAWINGS_CLEARED, () => {
      useSceneStore.getState().clearDrawings();
    });
    const unsubDrawingsClearedAlt = wsService.on("DRAWINGS_CLEAR", () => {
      useSceneStore.getState().clearDrawings();
    });

    const unsubLaserMove = wsService.on("LASER_MOVE", (data) => {
      if (data && data.x !== undefined && data.y !== undefined) {
        useCanvasStore.getState().updateRemoteLaser(data);
      }
    });

    const unsubLaserClear = wsService.on("LASER_CLEAR", (data) => {
      if (data && data.userId) {
        useCanvasStore.getState().clearRemoteLaser(data.userId);
      }
    });

    const unsubRulerUpdate = wsService.on("RULER_UPDATE", (data) => {
      if (data && data.startX !== undefined && data.currentX !== undefined) {
        useCanvasStore.getState().updateRemoteMeasurement(data);
      }
    });

    const unsubRulerClear = wsService.on("RULER_CLEAR", (data) => {
      if (data && data.userId) {
        useCanvasStore.getState().clearRemoteMeasurement(data.userId);
      }
    });

    const unsubPerm = wsService.on("PERMISSION_UPDATED", (data) => {
      if (onMessageRef.current) onMessageRef.current({ action: "PERMISSION_UPDATED", data });
    });

    const handleFogPayload = (data) => {
      if (!data) return;
      const store = useSceneStore.getState();
      const type = String(data.type || data.mode || "").toUpperCase();

      if (
          type === "CLEAR_ALL" ||
          type === "CLEAR" ||
          data.mode === "clear_all" ||
          data.fogCleared === true
      ) {
        store.clearFog();
        if (onMessageRef.current) onMessageRef.current(data);
        return;
      }

      if (
          type === "FILL_ALL" ||
          data.mode === "fill_all" ||
          data.fogFilled === true
      ) {
        store.fillFog();
        if (onMessageRef.current) onMessageRef.current(data);
        return;
      }

      if (type === "DELETE" || type === "REMOVE" || type === "FOG_DELETE") {
        const targetId = data.id || data.fogId || data.points?.id;
        if (targetId) {
          store.removeFogShape(targetId);
        }
        if (onMessageRef.current) onMessageRef.current(data);
        return;
      }

      store.addFogShape(data);
      if (onMessageRef.current) onMessageRef.current(data);
    };

    const unsubFog = wsService.on(WS_EVENTS.FOG_UPDATED, handleFogPayload);
    const unsubFogUpdate = wsService.on("FOG_UPDATE", handleFogPayload);

    const unsubFogDelete = wsService.on("FOG_DELETE", (data) => {
      const targetId = data?.id || data?.fogId || data?.points?.id || (typeof data === "string" ? data : null);
      if (targetId) {
        useSceneStore.getState().removeFogShape(targetId);
      }
      if (onMessageRef.current) onMessageRef.current(data);
    });

    const unsubFogDeleted = wsService.on("FOG_DELETED", (data) => {
      const targetId = data?.id || data?.fogId || data?.points?.id || (typeof data === "string" ? data : null);
      if (targetId) {
        useSceneStore.getState().removeFogShape(targetId);
      }
      if (onMessageRef.current) onMessageRef.current(data);
    });

    const unsubFogClear = wsService.on("FOG_CLEAR", () => {
      useSceneStore.getState().clearFog();
    });
    const unsubFogCleared = wsService.on("FOG_CLEARED", () => {
      useSceneStore.getState().clearFog();
    });
    const unsubFogFill = wsService.on("FOG_FILL", () => {
      useSceneStore.getState().fillFog();
    });
    const unsubFogFilled = wsService.on("FOG_FILLED", () => {
      useSceneStore.getState().fillFog();
    });

    const unsubFogLive = wsService.on("FOG_LIVE", (data) => {
      if (data) {
        useSceneStore.getState().setRemoteLiveFog(data);
      }
    });

    const unsubFogLiveEnd = wsService.on("FOG_LIVE_END", () => {
      useSceneStore.getState().setRemoteLiveFog(null);
    });

    const unsubFogGlobalReveal = wsService.on("FOG_GLOBAL_REVEAL", (data) => {
      const isRevealed =
          data?.isRevealed !== undefined
              ? Boolean(data.isRevealed)
              : (data?.data?.isRevealed !== undefined ? Boolean(data.data.isRevealed) : null);

      if (isRevealed !== null) {
        useCanvasStore.getState().setFogGlobalReveal(isRevealed);
      }
    });

    const handleSettingsPayload = (payload) => {
      if (!payload) return;
      const data = payload.data !== undefined ? payload.data : payload;
      if (!data) return;

      if (data.measurementType) {
        useCanvasStore.getState().setRulerType(data.measurementType);
      }
      if (data.inputMode) {
        useCanvasStore.getState().setInputMode(data.inputMode);
      }
      if (data.zoomSensitivity !== undefined) {
        useCanvasStore.getState().setZoomSensitivity(data.zoomSensitivity);
      }
      if (data.shapeSnapSensitivity !== undefined) {
        useCanvasStore.getState().setShapeSnapSensitivity(data.shapeSnapSensitivity);
      }
      if (data.gmFogBlend !== undefined) {
        useCanvasStore.getState().setGmFogBlend(data.gmFogBlend);
      }

      const store = useSceneStore.getState();
      store.setRoomSettings(data);

      const current = store.currentScene;
      if (current) {
        const updatedGrid = {
          ...current.grid,
          enabled: true,
          type: data.gridType || current.grid?.type || "square",
          lineType: data.lineType || current.grid?.lineType || "solid",
          size: Number(data.gridSize || current.grid?.size || 60),
          color: data.gridColor || current.grid?.color || "#000000",
          opacity: data.gridOpacity !== undefined ? Number(data.gridOpacity) : (current.grid?.opacity ?? 0.35),
          lineWidth: data.lineWidth !== undefined ? Number(data.lineWidth) : (current.grid?.lineWidth ?? 1.5),
          snapToGrid: data.isGridSnapping !== undefined ? Boolean(data.isGridSnapping) : (current.grid?.snapToGrid ?? true),
        };
        useSceneStore.setState({ currentScene: { ...current, grid: updatedGrid } });
      }
    };

    const unsubSettings = wsService.on(WS_EVENTS.SETTINGS_UPDATED, handleSettingsPayload);
    const unsubSettingsUpdate = wsService.on("SETTINGS_UPDATE", handleSettingsPayload);
    const unsubSettingsUpdated = wsService.on("SETTINGS_UPDATED", handleSettingsPayload);

    const unsubViewportSync = wsService.on(WS_EVENTS.VIEWPORT_SYNC, (payload) => {
      if (!payload) return;
      const data = payload.data !== undefined ? payload.data : payload;
      if (data && data.zoom !== undefined && data.stageX !== undefined && data.stageY !== undefined) {
        useCanvasStore.getState().setZoom(Number(data.zoom));
        useCanvasStore.getState().setStagePos(Number(data.stageX), Number(data.stageY));
      }
    });

    const unsubDice = wsService.on("DICE_ROLL", (payload) => {
      if (!payload) return;
      const data = payload.data !== undefined ? payload.data : payload;
      const currentTabId = sessionStorage.getItem('vtt_tab_id');

      if (data && data.dice && Array.isArray(data.dice)) {
        if (!currentTabId || data.senderTabId !== currentTabId) {
          useDiceStore.getState().triggerRemoteRoll(data.dice, data.rollerName);
        }
      }

      if (data && useSceneStore.getState().addDiceRoll) {
        useSceneStore.getState().addDiceRoll(data);
      }
      if (onMessageRef.current) onMessageRef.current(data);
    });

    const unsubDiceSettled = wsService.on("DICE_SETTLED", (payload) => {
      if (!payload) return;
      const data = payload.data !== undefined ? payload.data : payload;
      const currentTabId = sessionStorage.getItem('vtt_tab_id');

      if (data && (!currentTabId || data.senderTabId !== currentTabId)) {
        useDiceStore.getState().setRemoteResults(data.results, data.totalSum, data.transforms);
      }
    });

    const unsubDiceReThrow = wsService.on("DICE_RETHROW", (payload) => {
      if (!payload) return;
      const data = payload.data !== undefined ? payload.data : payload;
      const currentTabId = sessionStorage.getItem('vtt_tab_id');

      if (data && (!currentTabId || data.senderTabId !== currentTabId)) {
        useDiceStore.getState().applyRemoteReThrow(data);
      }
    });

    const unsubScene = wsService.on("SCENE_ACTIVATED", async (data) => {
      const targetSceneId = data?.sceneId || data?.id || (typeof data === "string" ? data : null);
      if (targetSceneId) {
        const strId = String(targetSceneId);
        const store = useSceneStore.getState();
        const exists = store.scenes.some((s) => String(s.id).toLowerCase() === strId.toLowerCase());

        if (!exists) {
          await store.loadScenes(roomId);
        }
        await store.switchScene(strId, false, roomId);
      }
      if (onMessageRef.current) onMessageRef.current(data);
    });

    const unsubSceneCreate = wsService.on("SCENE_CREATED", async (data) => {
      const newScene = data?.scene || (data?.id ? data : null);
      const store = useSceneStore.getState();

      if (newScene && newScene.id) {
        store.addSceneFromSocket(newScene);

        if (newScene.isActive) {
          await store.switchScene(String(newScene.id), false, roomId);
        }
      } else {
        await store.loadScenes(roomId);
      }
      if (onMessageRef.current) onMessageRef.current(data);
    });

    const unsubSceneDelete = wsService.on("SCENE_DELETE", async (data) => {
      if (data && data.sceneId) {
        const targetId = String(data.sceneId).toLowerCase();
        useSceneStore.setState((state) => ({
          scenes: state.scenes.filter((s) => String(s.id).toLowerCase() !== targetId),
        }));

        if (data.activeSceneId) {
          await useSceneStore.getState().switchScene(String(data.activeSceneId), false, roomId);
        }
      }
      if (onMessageRef.current) onMessageRef.current(data);
    });

    const unsubSceneUpdate = wsService.on("SCENE_UPDATED", (data) => {
      if (data && data.sceneId) {
        const targetId = String(data.sceneId).toLowerCase();
        const nextMapUrl = data.mapUrl || data.assetUrl || "";
        useSceneStore.setState((state) => {
          const isCurrent = String(state.currentScene?.id || "").toLowerCase() === targetId;
          const idx = state.scenes.findIndex((s) => String(s.id).toLowerCase() === targetId);
          let nextScenes = state.scenes;
          if (idx !== -1) {
            nextScenes = [...state.scenes];
            nextScenes[idx] = { ...nextScenes[idx], mapUrl: nextMapUrl, assetUrl: nextMapUrl };
          }
          return {
            scenes: nextScenes,
            currentScene: isCurrent
                ? { ...state.currentScene, mapUrl: nextMapUrl, assetUrl: nextMapUrl }
                : state.currentScene,
          };
        });
      }
      if (onMessageRef.current) onMessageRef.current(data);
    });

    const unsubRename = wsService.on("SCENE_RENAME", (data) => {
      if (data && data.sceneId && data.name) {
        const targetId = String(data.sceneId).toLowerCase();
        useSceneStore.setState((state) => {
          const idx = state.scenes.findIndex((s) => String(s.id).toLowerCase() === targetId);
          let nextScenes = state.scenes;
          if (idx !== -1) {
            nextScenes = [...state.scenes];
            nextScenes[idx] = { ...nextScenes[idx], name: data.name };
          }
          return {
            scenes: nextScenes,
            currentScene:
                String(state.currentScene?.id || "").toLowerCase() === targetId
                    ? { ...state.currentScene, name: data.name }
                    : state.currentScene,
          };
        });
      }
      if (onMessageRef.current) onMessageRef.current(data);
    });

    return () => {
      unsubUsers();
      unsubRoomClosed();
      unsubRoomDeleted();
      unsubMemberKicked();
      unsubMemberBanned();
      unsubToken();
      unsubConditions();
      unsubDraw();
      unsubDrawDelete();
      unsubDrawLive();
      unsubDrawLiveEnd();
      unsubDrawClear();
      unsubDrawingsClearedAlt();
      unsubLaserMove();
      unsubLaserClear();
      unsubRulerUpdate();
      unsubRulerClear();
      unsubPerm();
      unsubFog();
      unsubFogUpdate();
      unsubFogDelete();
      unsubFogDeleted();
      unsubFogClear();
      unsubFogCleared();
      unsubFogFill();
      unsubFogFilled();
      unsubFogLive();
      unsubFogLiveEnd();
      unsubFogGlobalReveal();
      unsubSettings();
      unsubSettingsUpdate();
      unsubSettingsUpdated();
      unsubViewportSync();
      unsubDice();
      unsubDiceSettled();
      unsubDiceReThrow();
      unsubScene();
      unsubSceneCreate();
      unsubSceneDelete();
      unsubSceneUpdate();
      unsubRename();
      wsService.disconnect();
    };
  }, [roomId]);

  const sendEvent = useCallback((type, data) => {
    wsService.send(type, data);
  }, []);

  return {
    status,
    latency,
    isConnected: status === "CONNECTED",
    sendEvent,
  };
}