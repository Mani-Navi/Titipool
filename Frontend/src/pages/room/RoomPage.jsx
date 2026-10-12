import React, { useEffect, useState, useCallback, Component } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    LogOut,
    Maximize2,
    Minimize2,
    HelpCircle,
    PowerOff,
    RefreshCw,
} from "lucide-react";
import { useSceneStore } from "../../stores/scene.store.js";
import { useCanvasStore } from "../../stores/canvas.store.js";
import { useAuthStore } from "../../stores/auth.store";
import { useRoomStore } from "../../stores/room.store";
import { useDiceStore } from "../../features/dice/state/dice.store";
import { useWebSocket } from "../../hooks/useWebSocket.js";
import { usePermissions } from "../../hooks/usePermissions";
import { usePageTitle } from "../../hooks/usePageTitle";
import { wsService } from "../../services/websocket.service";
import { roomApi } from "../../api/room.api";
import { toast } from "../../stores/toast.store";
import { confirmModal } from "../../stores/confirm.store";
import { GameCanvas } from "../../components/canvas/GameCanvas.jsx";
import { Toolbar } from "../../components/room/Toolbar.jsx";
import { SceneBar } from "../../components/room/SceneBar.jsx";
import { DiceOverlay } from "../../features/dice/components/DiceOverlay.jsx";
import { PlayerMenu } from "../../components/room/PlayerMenu.jsx";
import { SettingsMenu } from "../../components/room/SettingsMenu.jsx";
import { AssetMenu } from "../../components/room/AssetMenu.jsx";
import { TokenEditorModal } from "../../components/room/TokenEditorModal.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { WS_EVENTS } from "../../constants/wsEvents.js";
import { uiAudio } from "../../utils/uiAudio";

class CanvasErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        if (import.meta.env.DEV) {
            console.error("[Canvas Crash]:", error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-center p-6 z-10 font-fa">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-100 mb-1">خطا در پردازش گرافیکی بوم بازی</h3>
                    <p className="text-xs text-zinc-400 mb-4 max-w-sm">
                        بافت گرافیکی یا شتاب‌دهنده وب‌جی‌ال مرورگر با وقفه مواجه شد.
                    </p>
                    <button
                        type="button"
                        onClick={() => this.setState({ hasError: false })}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
                    >
                        راه‌اندازی مجدد کانواس
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export const RoomPage = () => {
    const { roomId: urlParamId } = useParams();
    const navigate = useNavigate();

    const user = useAuthStore((state) => state.user);
    const setCurrentRoom = useRoomStore((state) => state.setCurrentRoom);
    const loadScenes = useSceneStore((state) => state.loadScenes);
    const setAvailableConditions = useSceneStore((state) => state.setAvailableConditions);

    const [roomData, setRoomData] = useState(null);
    const [onlineMembers, setOnlineMembers] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    usePageTitle(roomData?.name ? `${roomData.name} — اتاق بازی` : "اتاق بازی");

    const effectiveRoomId = urlParamId;
    const { isGM, permissions: userPermissions } = usePermissions(roomData);

    useEffect(() => {
        setRoomData(null);
        setOnlineMembers([]);
        useSceneStore.getState().resetSceneStore();
        useCanvasStore.getState().resetCanvasStore();
        useDiceStore.getState().clearDice();
        useDiceStore.getState().setOpen(false);

        return () => {
            setRoomData(null);
            setOnlineMembers([]);
            useSceneStore.getState().resetSceneStore();
            useCanvasStore.getState().resetCanvasStore();
            useDiceStore.getState().clearDice();
            useDiceStore.getState().setOpen(false);
        };
    }, [urlParamId]);

    const handleSocketMessage = useCallback(
        (event) => {
            if (!event) return;

            if (Array.isArray(event)) {
                setOnlineMembers(event);
                return;
            }

            const action = event.action || (event.data ? event.action : null);
            const data = event.data !== undefined ? event.data : event;

            if (action === "ROOM_CLOSED") {
                uiAudio.playRoomAlert();
                wsService.disconnect();
                toast.warning(data || "اتاق توسط دانجن‌مستر (GM) غیرفعال شد.", "پایان نشست اتاق");
                navigate("/dashboard");
                return;
            }

            if (action === "ROOM_DELETED") {
                uiAudio.playRoomAlert();
                wsService.disconnect();
                toast.error(data || "اتاق توسط سازنده برای همیشه حذف شد.", "اتاق حذف شد");
                navigate("/dashboard");
                return;
            }

            if (action === "MEMBER_KICKED") {
                const currentUid = String(user?.id || user?.userId || "").toLowerCase().trim();
                const targetUid = String(data?.userId || "").toLowerCase().trim();
                const currentUname = String(user?.username || "").toLowerCase().trim();
                const targetUname = String(data?.username || "").toLowerCase().trim();

                if ((currentUid && targetUid && currentUid === targetUid) || (currentUname && targetUname && currentUname === targetUname)) {
                    uiAudio.playRoomAlert();
                    wsService.disconnect();
                    toast.error("شما توسط دانجن‌مستر از اتاق اخراج شدید.", "اخراج از اتاق");
                    navigate("/dashboard");
                    return;
                }
            }

            if (action === "MEMBER_BANNED") {
                const currentUid = String(user?.id || user?.userId || "").toLowerCase().trim();
                const targetUid = String(data?.userId || "").toLowerCase().trim();
                const currentUname = String(user?.username || "").toLowerCase().trim();
                const targetUname = String(data?.username || "").toLowerCase().trim();

                if ((currentUid && targetUid && currentUid === targetUid) || (currentUname && targetUname && currentUname === targetUname)) {
                    uiAudio.playRoomAlert();
                    wsService.disconnect();
                    toast.error("شما توسط دانجن‌مستر از اتاق مسدود (Ban) شدید.", "مسدودسازی حساب");
                    navigate("/dashboard");
                    return;
                }
            }

            if (action === WS_EVENTS.ROLE_TITLE_UPDATE || action === "ROLE_TITLE_UPDATE") {
                wsService.trigger("ROLE_TITLE_UPDATE", data);
            }

            if (action === WS_EVENTS.MEMBER_MUTE_TOGGLED || action === "MEMBER_MUTE_TOGGLED") {
                wsService.trigger("MEMBER_MUTE_TOGGLED", data);
            }

            if (action === "CONDITION_POOL_UPDATE") {
                if (data?.availableConditions) {
                    setAvailableConditions(data.availableConditions);
                }
            }

            if (action === "PERMISSION_UPDATED" && data) {
                const currentUname = String(user?.username || "").toLowerCase().trim();
                const incomingUname = String(data.username || "").toLowerCase().trim();
                const currentUid = String(user?.id || user?.userId || "").toLowerCase().trim();
                const targetUid = String(data.userId || "").toLowerCase().trim();
                const incomingMemberId = String(data.memberId || "").toLowerCase().trim();

                const isTargetMe =
                    (Boolean(currentUname) && Boolean(incomingUname) && currentUname === incomingUname) ||
                    (Boolean(currentUid) && Boolean(targetUid) && currentUid === targetUid) ||
                    (Boolean(incomingMemberId) &&
                        onlineMembers.some(
                            (m) =>
                                String(m.id || m.memberId || "").toLowerCase().trim() === incomingMemberId &&
                                ((currentUid && String(m.userId || "").toLowerCase().trim() === currentUid) ||
                                    (currentUname && String(m.username || "").toLowerCase().trim() === currentUname))
                        ));

                if (isTargetMe) {
                    const updatedPerms = {
                        canAssets: Boolean(data.canAssets),
                        canText: Boolean(data.canText),
                        canFog: Boolean(data.canFog),
                        canDrawing: Boolean(data.canDrawing),
                        canScene: Boolean(data.canScene),
                        canRuler: data.canRuler !== undefined ? Boolean(data.canRuler) : true,
                        canEditToken: Boolean(data.canEditToken),
                    };

                    setRoomData((prev) => ({
                        ...prev,
                        permissions: updatedPerms,
                    }));

                    setCurrentRoom((prev) => (prev ? { ...prev, permissions: updatedPerms } : prev));
                    toast.info("سطح دسترسی‌های شما در این اتاق به‌روزرسانی شد.", "تغییر دسترسی");
                }
            }
        },
        [user, setCurrentRoom, setAvailableConditions, onlineMembers, navigate]
    );

    const { isConnected } = useWebSocket(effectiveRoomId, handleSocketMessage);

    useEffect(() => {
        if (!urlParamId) return;

        roomApi
            .getRoom(urlParamId)
            .then((data) => {
                setRoomData(data);
                setCurrentRoom(data);
                const actualId = data?.id ? String(data.id) : urlParamId;
                loadScenes(actualId);
            })
            .catch((err) => {
                if (import.meta.env.DEV) {
                    console.error("خطا در دریافت اطلاعات اتاق:", err);
                }
                const message = err.response?.data?.message || err.response?.data?.error || "امکان ورود به این اتاق وجود ندارد";
                toast.error(message, "عدم دسترسی به اتاق");
                navigate("/dashboard");
            });
    }, [urlParamId, loadScenes, setCurrentRoom, navigate]);

    const handleCloseRoom = async () => {
        const isConfirmed = await confirmModal({
            title: "بستن و پایان نشست اتاق",
            message: "آیا از بستن اتاق اطمینان دارید؟ با این کار تمام بازیکنان به داشبورد هدایت شده و اتاق غیرفعال می‌شود.",
            confirmText: "بستن اتاق",
            cancelText: "انصراف",
            variant: "danger",
        });

        if (!isConfirmed) return;

        try {
            await roomApi.closeRoom(effectiveRoomId);
            uiAudio.playRoomAlert();
            toast.info("اتاق با موفقیت بسته شد.", "وضعیت اتاق");
            navigate("/dashboard");
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error("خطا در بستن اتاق:", err);
            }
            toast.error("خطا در بستن اتاق. مجدداً تلاش کنید.");
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    };

    return (
        <div className="relative w-screen h-[100dvh] overflow-hidden bg-[#090a0f] select-none font-fa">
            <PlayerMenu
                isGM={isGM}
                roomId={effectiveRoomId}
                roomData={roomData}
                onlineMembers={onlineMembers}
            />

            <SceneBar isGM={isGM} roomId={effectiveRoomId} />

            <header
                className="fixed top-2.5 sm:top-4 left-2.5 sm:left-6 z-30 flex items-center gap-1.5 sm:gap-2.5 pointer-events-auto"
                dir="ltr"
            >
                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-zinc-950/85 border border-zinc-800/80 rounded-xl shadow-lg backdrop-blur-xl text-[11px]">
          <span
              className={`w-2 h-2 rounded-full ${
                  isConnected
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      : "bg-amber-400 animate-pulse"
              }`}
          />
                    <span className="hidden sm:inline text-zinc-300 font-mono text-[10px] font-medium">
            {isConnected ? "Live Sync" : "Connecting..."}
          </span>
                </div>

                <button
                    type="button"
                    onClick={() => setIsHelpOpen(true)}
                    className="hidden sm:flex w-9 h-9 rounded-xl bg-zinc-950/85 border border-zinc-800/80 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 items-center justify-center shadow-lg backdrop-blur-xl active:scale-90 transition-all duration-150 cursor-pointer"
                    title="راهنمای کلیدها"
                >
                    <HelpCircle className="w-4 h-4" />
                </button>

                <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-950/85 border border-zinc-800/80 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 flex items-center justify-center shadow-lg backdrop-blur-xl active:scale-90 transition-all duration-150 cursor-pointer"
                    title="تمام صفحه"
                >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>

                {isGM && (
                    <button
                        type="button"
                        onClick={handleCloseRoom}
                        className="px-2 sm:px-2.5 h-8 sm:h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 flex items-center gap-1.5 shadow-lg backdrop-blur-xl active:scale-95 transition-all duration-150 cursor-pointer font-bold text-xs"
                        title="بستن و غیرفعال‌سازی اتاق"
                    >
                        <PowerOff className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">بستن اتاق</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-950/85 border border-zinc-800/80 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center justify-center shadow-lg backdrop-blur-xl active:scale-90 transition-all duration-150 cursor-pointer"
                    title="خروج از اتاق"
                >
                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
            </header>

            <CanvasErrorBoundary>
                <GameCanvas isGM={isGM} permissions={userPermissions} />
            </CanvasErrorBoundary>

            <Toolbar isGM={isGM} permissions={userPermissions} />

            <DiceOverlay />

            <SettingsMenu isGM={isGM} />
            <AssetMenu isGM={isGM} permissions={userPermissions} />
            <TokenEditorModal roomData={roomData} />

            <Modal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                title="Keyboard Controls"
                titleFa="کلیدهای میانبر و کنترل‌ها"
                maxWidth="md"
            >
                <div className="space-y-3 text-xs text-zinc-300 font-fa" dir="rtl">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                            <span className="font-bold text-amber-400 block">ابزارها:</span>
                            <div className="flex justify-between items-center">
                                <span>انتخاب:</span>
                                <kbd className="font-mono bg-zinc-900 border border-zinc-700/80 px-1.5 py-0.5 rounded text-amber-400 text-[10px]">V</kbd>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>جابجایی نقشه:</span>
                                <kbd className="font-mono bg-zinc-900 border border-zinc-700/80 px-1.5 py-0.5 rounded text-amber-400 text-[10px]">H</kbd>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>نقاشی و خطوط:</span>
                                <kbd className="font-mono bg-zinc-900 border border-zinc-700/80 px-1.5 py-0.5 rounded text-amber-400 text-[10px]">D</kbd>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>نوشت‌افزار:</span>
                                <kbd className="font-mono bg-zinc-900 border border-zinc-700/80 px-1.5 py-0.5 rounded text-amber-400 text-[10px]">T</kbd>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>خط‌کش:</span>
                                <kbd className="font-mono bg-zinc-900 border border-zinc-700/80 px-1.5 py-0.5 rounded text-amber-400 text-[10px]">R</kbd>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>تاس سه‌بعدی:</span>
                                <kbd className="font-mono bg-zinc-900 border border-zinc-700/80 px-1.5 py-0.5 rounded text-amber-400 text-[10px]">B</kbd>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>مه جنگ (GM):</span>
                                <kbd className="font-mono bg-zinc-900 border border-zinc-700/80 px-1.5 py-0.5 rounded text-amber-400 text-[10px]">F</kbd>
                            </div>
                        </div>

                        <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                            <span className="font-bold text-amber-400 block">اکشن‌ها:</span>
                            <div className="flex justify-between items-center">
                                <span>زوم:</span>
                                <span className="text-zinc-400 text-[11px]">اسکرول ماوس</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>پینگ رادار:</span>
                                <span className="text-zinc-400 text-[11px]">دوبار کلیک روی مپ</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>ویرایش توکن:</span>
                                <span className="text-zinc-400 text-[11px]">راست کلیک روی توکن</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>وصل/قطع میکروفون:</span>
                                <kbd className="font-mono bg-zinc-900 border border-zinc-700/80 px-1.5 py-0.5 rounded text-amber-400 text-[10px]">Space</kbd>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default RoomPage;