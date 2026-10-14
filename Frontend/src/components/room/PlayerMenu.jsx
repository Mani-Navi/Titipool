import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
    Dices,
    Crown,
    User,
    Shield,
    Volume2,
    VolumeX,
    UserX,
    Ban,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
    Tag,
    Settings2,
    Sliders,
    Users,
    Mic,
    MicOff,
    X,
} from "lucide-react";
import { useAuthStore } from "../../stores/auth.store";
import { useClipboard } from "../../hooks/useClipboard";
import { useVoice } from "../../hooks/useVoice";
import { roomApi } from "../../api/room.api";
import { wsService } from "../../services/websocket.service";
import { confirmModal } from "../../stores/confirm.store";
import { Badge } from "../ui/Badge";
import { cn } from "../../utils/cn";
import { WS_EVENTS } from "../../constants/wsEvents.js";

const HOST_ROLE_PRESETS = Object.freeze([
    "میزبان",
    "دانجن‌مستر (DM)",
    "گیم‌مستر (GM)",
    "داستان‌گو (Storyteller)",
    "نگهبان (Keeper)",
    "داور (Referee)",
]);

const PLAYER_ROLE_PRESETS = Object.freeze([
    "بازیکن",
    "ماجراجو (Adventurer)",
    "قهرمان (Hero)",
    "محقق (Investigator)",
    "مبارز (Warrior)",
    "جادوگر (Mage)",
]);

const MemberCard = memo(
    ({
         member,
         currentUser,
         isGM,
         isExpanded,
         isSpeaking,
         hostTitle,
         playerTitle,
         customInputVal,
         onToggleExpand,
         onSetRoleTitle,
         onCustomInputChange,
         onToggleMute,
         onRoleChange,
         onKick,
         onBan,
         onPermissionToggle,
     }) => {
        const memberActualId = member.id || member.memberId || member.userId;
        const isSelf =
            member.userId === currentUser?.id ||
            member.username?.toLowerCase() === currentUser?.username?.toLowerCase();
        const isMemberGM = member.role === "GM" || member.role === "ADMIN";
        const perms = member.permissions || {};
        const displayTitle = isMemberGM ? hostTitle : playerTitle;
        const targetType = isMemberGM ? "HOST" : "PLAYER";
        const availablePresets = isMemberGM ? HOST_ROLE_PRESETS : PLAYER_ROLE_PRESETS;

        return (
            <div
                className={cn(
                    "rounded-2xl border transition-all duration-200 overflow-hidden",
                    isSpeaking
                        ? "bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/30"
                        : isExpanded
                            ? "bg-zinc-950/95 border-amber-500/40 shadow-lg ring-1 ring-amber-500/20"
                            : "bg-zinc-900/60 hover:bg-zinc-900/90 border-zinc-800/80 hover:border-zinc-700"
                )}
            >
                <div className="flex items-center justify-between p-2.5 sm:p-3">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="relative">
                            <div
                                className={cn(
                                    "w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs shadow-inner transition-all duration-150",
                                    isSpeaking ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950 scale-105 shadow-[0_0_12px_rgba(251,191,36,0.3)]" : "",
                                    isMemberGM
                                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                        : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                                )}
                            >
                                {member.username ? member.username.slice(0, 2).toUpperCase() : "U"}
                            </div>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950 absolute -bottom-0.5 -right-0.5 animate-pulse shadow-sm shadow-emerald-500/50" />
                        </div>

                        <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                <span
                    className={cn(
                        "text-xs font-bold truncate max-w-[100px] sm:max-w-[120px] transition-colors",
                        isSpeaking ? "text-amber-400 font-black" : "text-zinc-100"
                    )}
                >
                  {member.username}
                </span>
                                {isSelf && (
                                    <span className="text-[9px] px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded-md font-medium">
                    شما
                  </span>
                                )}
                                {member.isMuted && (
                                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/20">
                    <VolumeX className="w-3 h-3" />
                    <span>بی‌صدا</span>
                  </span>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5">
                <span
                    className={cn(
                        "text-[10px] font-semibold",
                        isMemberGM ? "text-amber-400" : "text-zinc-400"
                    )}
                >
                  {displayTitle}
                </span>

                                {isSpeaking && (
                                    <div className="flex items-center gap-[2px] pr-1">
                                        <div className="w-[2px] h-2 bg-amber-400 rounded-full animate-pulse" />
                                        <div className="w-[2px] h-3 bg-amber-400 rounded-full animate-bounce" />
                                        <div className="w-[2px] h-1.5 bg-amber-400 rounded-full animate-pulse" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <div
                            className={cn(
                                "px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-[11px] font-bold flex items-center gap-1 border",
                                isMemberGM
                                    ? "bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-sm"
                                    : "bg-zinc-800/80 text-zinc-300 border-zinc-700/60"
                            )}
                        >
                            {isMemberGM ? (
                                <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                            ) : (
                                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-400" />
                            )}
                            <span className="truncate max-w-[80px] sm:max-w-none">{displayTitle}</span>
                        </div>

                        {isGM && (
                            <button
                                type="button"
                                onClick={() => onToggleExpand(memberActualId)}
                                className={cn(
                                    "w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-90",
                                    isExpanded
                                        ? "bg-amber-500 text-zinc-950 font-bold"
                                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                                )}
                                title="تنظیمات مدیریت و دسترسی"
                            >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                </div>

                {isGM && isExpanded && (
                    <div className="p-3 bg-zinc-950 border-t border-zinc-800/90 space-y-3 animate-fade-in-up">
                        <div className="p-2.5 sm:p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                                <div className="flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5" />
                                    <span className="text-[11px] sm:text-xs">
                    تغییر تگ {isMemberGM ? "میزبان‌ها" : "تمام بازیکنان"}:
                  </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {availablePresets.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => onSetRoleTitle(targetType, preset)}
                                        className={cn(
                                            "px-2 sm:px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-medium transition-all cursor-pointer border active:scale-95",
                                            displayTitle === preset
                                                ? "bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold shadow-sm"
                                                : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/80"
                                        )}
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-1.5 pt-1.5">
                                <input
                                    type="text"
                                    value={customInputVal}
                                    onChange={(e) => onCustomInputChange(memberActualId, e.target.value)}
                                    placeholder={
                                        isMemberGM ? "عنوان دلخواه میزبان..." : "عنوان دلخواه تمام بازیکنان..."
                                    }
                                    className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 shadow-inner"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (customInputVal) {
                                            onSetRoleTitle(targetType, customInputVal);
                                        }
                                    }}
                                    className="px-2.5 sm:px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md shadow-amber-500/20 shrink-0 active:scale-95"
                                >
                                    اعمال به همه
                                </button>
                            </div>
                        </div>

                        {!isSelf && (
                            <>
                                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onToggleMute(member)}
                                        className={cn(
                                            "py-2 px-1 rounded-xl border text-[10px] sm:text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95",
                                            member.isMuted
                                                ? "bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-sm"
                                                : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700"
                                        )}
                                    >
                                        {member.isMuted ? (
                                            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                                        ) : (
                                            <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                                        )}
                                        <span>{member.isMuted ? "وصل صدا" : "بی‌صدا"}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onRoleChange(memberActualId, member.role)}
                                        className="py-2 px-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:bg-zinc-800 hover:border-zinc-700 text-[10px] sm:text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95"
                                    >
                                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                                        <span className="truncate">{isMemberGM ? "پلیر" : "میزبان"}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onKick(memberActualId, member.username)}
                                        className="py-2 px-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 text-[10px] sm:text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95"
                                    >
                                        <UserX className="w-3.5 h-3.5 text-rose-400" />
                                        <span>اخراج</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onBan(memberActualId, member.username)}
                                        className="py-2 px-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-rose-500 hover:bg-rose-500/20 hover:border-rose-500/40 text-[10px] sm:text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95"
                                    >
                                        <Ban className="w-3.5 h-3.5 text-rose-500" />
                                        <span>مسدود</span>
                                    </button>
                                </div>

                                <div className="p-2.5 sm:p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                                        <Sliders className="w-3.5 h-3.5" />
                                        <span>دسترسی‌ها (Permissions):</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-1">
                                        {[
                                            { key: "canDrawing", label: "ترسیم (Draw)" },
                                            { key: "canText", label: "نوشتار (Text)" },
                                            { key: "canFog", label: "مه (Fog)" },
                                            { key: "canAssets", label: "منابع (Asset)" },
                                            { key: "canScene", label: "نقشه (Map)" },
                                            { key: "canRuler", label: "خط‌کش (Ruler)" },
                                        ].map((p) => {
                                            const isAllowed = Boolean(perms[p.key]);
                                            return (
                                                <div
                                                    key={p.key}
                                                    onClick={() => onPermissionToggle(memberActualId, p.key, isAllowed)}
                                                    className={cn(
                                                        "p-1.5 sm:p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none active:scale-95",
                                                        isAllowed
                                                            ? "bg-amber-500/15 border-amber-500/40 text-amber-300 font-medium"
                                                            : "bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                                                    )}
                                                >
                                                    <span className="text-[10px] sm:text-[11px] truncate">{p.label}</span>
                                                    <div
                                                        className={cn(
                                                            "w-6 h-3.5 rounded-full transition-colors relative flex items-center p-0.5",
                                                            isAllowed ? "bg-amber-500" : "bg-zinc-800"
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "w-2.5 h-2.5 rounded-full bg-white transition-transform",
                                                                isAllowed ? "translate-x-0" : "-translate-x-2.5"
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

MemberCard.displayName = "MemberCard";

export const PlayerMenu = memo(
    ({ isGM = false, roomId = null, roomData = null, onlineMembers: propOnlineMembers = [] }) => {
        const currentUser = useAuthStore((state) => state.user);
        const { copy, copied } = useClipboard();

        const [isOpen, setIsOpen] = useState(false);
        const [expandedMemberId, setExpandedMemberId] = useState(null);
        const [membersList, setMembersList] = useState(propOnlineMembers);

        useEffect(() => {
            setMembersList(propOnlineMembers);
        }, [propOnlineMembers]);

        const isSelfMutedByGM = useMemo(() => {
            if (isGM) return false;
            const myUid = String(currentUser?.id || currentUser?.userId || "").toLowerCase().trim();
            const myUname = String(currentUser?.username || "").toLowerCase().trim();

            const myRecord = membersList.find((m) => {
                const targetId = String(m.id || m.memberId || m.userId || "").toLowerCase().trim();
                const targetUid = String(m.userId || "").toLowerCase().trim();
                const targetUname = String(m.username || "").toLowerCase().trim();

                return (
                    (myUid && (targetId === myUid || targetUid === myUid)) ||
                    (myUname && targetUname === myUname)
                );
            });

            return Boolean(myRecord?.isMuted);
        }, [membersList, currentUser, isGM]);

        const {
            isMicEnabled,
            isConnected: isVoiceConnected,
            speakingMap = {},
            toggleMicrophone,
            error: voiceError,
        } = useVoice(roomId, isSelfMutedByGM);

        const [hostTitle, setHostTitle] = useState(() => {
            return (
                roomData?.hostRoleTitle || localStorage.getItem(`room_${roomId}_host_title`) || "میزبان"
            );
        });

        const [playerTitle, setPlayerTitle] = useState(() => {
            return (
                roomData?.playerRoleTitle || localStorage.getItem(`room_${roomId}_player_title`) || "بازیکن"
            );
        });

        const [customInputMap, setCustomInputMap] = useState({});

        useEffect(() => {
            if (roomData?.hostRoleTitle) setHostTitle(roomData.hostRoleTitle);
            if (roomData?.playerRoleTitle) setPlayerTitle(roomData.playerRoleTitle);
        }, [roomData]);

        useEffect(() => {
            if (!roomId) return;
            try {
                localStorage.setItem(`room_${roomId}_host_title`, hostTitle);
                localStorage.setItem(`room_${roomId}_player_title`, playerTitle);
            } catch {}
        }, [hostTitle, playerTitle, roomId]);

        useEffect(() => {
            const unsubRole = wsService.on(WS_EVENTS.ROLE_TITLE_UPDATE || "ROLE_TITLE_UPDATE", (data) => {
                if (data?.targetType === "HOST" && data.title) {
                    setHostTitle(data.title);
                } else if (data?.targetType === "PLAYER" && data.title) {
                    setPlayerTitle(data.title);
                }
            });

            const unsubPerm = wsService.on("PERMISSION_UPDATED", (data) => {
                if (data && data.memberId) {
                    setMembersList((prev) =>
                        prev.map((m) =>
                            m.id === data.memberId || m.userId === data.memberId
                                ? { ...m, permissions: { ...(m.permissions || {}), ...data } }
                                : m
                        )
                    );
                }
            });

            const unsubMute = wsService.on(
                WS_EVENTS.MEMBER_MUTE_TOGGLED || "MEMBER_MUTE_TOGGLED",
                (data) => {
                    if (data) {
                        const targetMemberId = String(data.memberId || "").toLowerCase().trim();
                        const targetUserId = String(data.userId || "").toLowerCase().trim();
                        const targetUsername = String(data.username || "").toLowerCase().trim();

                        setMembersList((prev) =>
                            prev.map((m) => {
                                const currentId = String(m.id || m.memberId || "").toLowerCase().trim();
                                const currentUid = String(m.userId || "").toLowerCase().trim();
                                const currentUname = String(m.username || "").toLowerCase().trim();

                                const isMatch =
                                    (targetMemberId &&
                                        (currentId === targetMemberId || currentUid === targetMemberId)) ||
                                    (targetUserId && (currentUid === targetUserId || currentId === targetUserId)) ||
                                    (targetUsername && currentUname === targetUsername);

                                if (isMatch) {
                                    return { ...m, isMuted: Boolean(data.isMuted) };
                                }
                                return m;
                            })
                        );
                    }
                }
            );

            return () => {
                unsubRole();
                unsubPerm();
                unsubMute();
            };
        }, []);

        const handleSetRoleTitle = useCallback((targetType, title) => {
            if (!title || !title.trim()) return;
            const finalTitle = title.trim();

            if (targetType === "HOST") {
                setHostTitle(finalTitle);
            } else {
                setPlayerTitle(finalTitle);
            }

            wsService.send(WS_EVENTS.ROLE_TITLE_UPDATE || "ROLE_TITLE_UPDATE", {
                targetType: targetType,
                title: finalTitle,
            });
        }, []);

        const handleKick = useCallback(
            async (memberId, username) => {
                const isConfirmed = await confirmModal({
                    title: "اخراج بازیکن از اتاق",
                    message: `آیا از اخراج «${username || "این کاربر"}» از اتاق اطمینان دارید؟ بازیکن بلافاصله به داشبورد هدایت خواهد شد.`,
                    confirmText: "اخراج بازیکن",
                    cancelText: "انصراف",
                    variant: "danger",
                });

                if (!isConfirmed) return;

                try {
                    await roomApi.kickMember(roomId, memberId);
                } catch (err) {
                    if (import.meta.env.DEV) console.error("خطا در اخراج کاربر:", err);
                }
            },
            [roomId]
        );

        const handleBan = useCallback(
            async (memberId, username) => {
                const isConfirmed = await confirmModal({
                    title: "مسدودسازی دائمی (Ban) کاربر",
                    message: `آیا از مسدودسازی «${username || "این کاربر"}» اطمینان دارید؟ این بازیکن دیگر اجازه ورود مجدد به این اتاق را نخواهد داشت.`,
                    confirmText: "مسدودسازی قطعی",
                    cancelText: "انصراف",
                    variant: "danger",
                });

                if (!isConfirmed) return;

                try {
                    await roomApi.banMember(roomId, memberId);
                } catch (err) {
                    if (import.meta.env.DEV) console.error("خطا در بن کاربر:", err);
                }
            },
            [roomId]
        );

        const handleToggleMute = useCallback(
            async (member) => {
                const memberActualId = member.id || member.memberId || member.userId;
                const nextMuteState = !member.isMuted;

                setMembersList((prev) =>
                    prev.map((m) =>
                        m.id === memberActualId || m.userId === memberActualId
                            ? { ...m, isMuted: nextMuteState }
                            : m
                    )
                );

                wsService.send(WS_EVENTS.MEMBER_MUTE_TOGGLED || "MEMBER_MUTE_TOGGLED", {
                    memberId: memberActualId,
                    userId: member.userId,
                    username: member.username,
                    isMuted: nextMuteState,
                });

                try {
                    await roomApi.muteMember(roomId, memberActualId);
                } catch (err) {
                    if (import.meta.env.DEV) console.error("خطا در ذخیره وضعیت صدا:", err);
                }
            },
            [roomId]
        );

        const handleRoleChange = useCallback(
            async (memberId, currentRole) => {
                const targetRole = currentRole === "GM" ? "Player" : "GM";
                try {
                    await roomApi.changeRole(roomId, memberId, targetRole);
                } catch (err) {
                    if (import.meta.env.DEV) console.error("خطا در تغییر رول:", err);
                }
            },
            [roomId]
        );

        const handlePermissionToggle = useCallback(
            async (memberId, permissionKey, currentValue) => {
                const nextVal = !currentValue;

                setMembersList((prev) =>
                    prev.map((m) => {
                        if (m.id === memberId || m.userId === memberId) {
                            return {
                                ...m,
                                permissions: {
                                    ...(m.permissions || {}),
                                    [permissionKey]: nextVal,
                                },
                            };
                        }
                        return m;
                    })
                );

                try {
                    const payload = {
                        memberId: memberId,
                        [permissionKey]: nextVal,
                    };
                    await roomApi.updatePermissions(payload);
                } catch (err) {
                    if (import.meta.env.DEV) console.error("خطا در آپدیت پرمیشن:", err);
                    setMembersList((prev) =>
                        prev.map((m) => {
                            if (m.id === memberId || m.userId === memberId) {
                                return {
                                    ...m,
                                    permissions: {
                                        ...(m.permissions || {}),
                                        [permissionKey]: currentValue,
                                    },
                                };
                            }
                            return m;
                        })
                    );
                }
            },
            []
        );

        const handleCustomInputChange = useCallback((memberId, val) => {
            setCustomInputMap((prev) => ({ ...prev, [memberId]: val }));
        }, []);

        const handleToggleExpand = useCallback((id) => {
            setExpandedMemberId((prev) => (prev === id ? null : id));
        }, []);

        const displayCode =
            roomData?.code || (roomId ? roomId.substring(0, 6).toUpperCase() : "------");
        const mySelfTitle = isGM ? hostTitle : playerTitle;

        const hostMembers = useMemo(() => {
            return membersList.filter((m) => m.role === "GM" || m.role === "ADMIN");
        }, [membersList]);

        const playerMembers = useMemo(() => {
            return membersList.filter((m) => m.role !== "GM" && m.role !== "ADMIN");
        }, [membersList]);

        return (
            <>
                <div className="fixed top-3 right-3 sm:top-4 sm:right-6 z-30 font-fa select-none pointer-events-auto" dir="rtl">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950/85 hover:bg-zinc-900 border border-zinc-800/80 text-zinc-200 text-xs font-bold cursor-pointer transition-all duration-150 shadow-lg backdrop-blur-xl active:scale-95"
                    >
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-mono text-amber-400 font-bold">{membersList.length}</span>
                        <span className="hidden sm:inline text-zinc-400 text-[11px]">نفر</span>
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
                    </button>
                </div>

                {isOpen && (
                    <div
                        className="hidden sm:block fixed top-16 right-6 z-50 w-96 max-w-[95vw] glass-card border border-zinc-800 rounded-3xl shadow-2xl p-3.5 pt-3 space-y-3 animate-fade-in-up font-fa"
                        dir="rtl"
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                            <div className="flex items-center gap-2">
                                <Dices className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-bold text-zinc-100 truncate max-w-[150px]">{roomData?.name || "ماجراجویی D&D"}</span>
                                <Badge variant={isGM ? "gm" : "player"} size="sm">
                                    {mySelfTitle}
                                </Badge>
                            </div>
                            <button
                                type="button"
                                onClick={() => copy(displayCode)}
                                className="flex items-center gap-1 font-mono text-[11px] text-amber-400 bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800 active:scale-95 transition-all"
                                title="کپی کد"
                            >
                                <span>{displayCode}</span>
                                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                            {membersList.length === 0 ? (
                                <div className="text-center py-6 text-zinc-500 text-xs">هیچ کاربری آنلاین نیست</div>
                            ) : (
                                <>
                                    {hostMembers.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5" />
                          <span>— {hostTitle} ({hostMembers.length}) —</span>
                        </span>
                                            </div>
                                            {hostMembers.map((member) => {
                                                const mId = member.id || member.memberId || member.userId;
                                                const isSelf = member.userId === currentUser?.id || member.username?.toLowerCase() === currentUser?.username?.toLowerCase();
                                                const isSpeaking = Boolean(speakingMap[String(member.userId || member.id || "")] || (isSelf && isMicEnabled));
                                                return (
                                                    <MemberCard
                                                        key={mId}
                                                        member={member}
                                                        currentUser={currentUser}
                                                        isGM={isGM}
                                                        isExpanded={expandedMemberId === mId}
                                                        isSpeaking={isSpeaking}
                                                        hostTitle={hostTitle}
                                                        playerTitle={playerTitle}
                                                        customInputVal={customInputMap[mId] || ""}
                                                        onToggleExpand={handleToggleExpand}
                                                        onSetRoleTitle={handleSetRoleTitle}
                                                        onCustomInputChange={handleCustomInputChange}
                                                        onToggleMute={handleToggleMute}
                                                        onRoleChange={handleRoleChange}
                                                        onKick={handleKick}
                                                        onBan={handleBan}
                                                        onPermissionToggle={handlePermissionToggle}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}

                                    {playerMembers.length > 0 && (
                                        <div className="space-y-2 pt-1">
                                            <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span>— {playerTitle} ({playerMembers.length}) —</span>
                        </span>
                                            </div>
                                            {playerMembers.map((member) => {
                                                const mId = member.id || member.memberId || member.userId;
                                                const isSelf = member.userId === currentUser?.id || member.username?.toLowerCase() === currentUser?.username?.toLowerCase();
                                                const isSpeaking = Boolean(speakingMap[String(member.userId || member.id || "")] || (isSelf && isMicEnabled));
                                                return (
                                                    <MemberCard
                                                        key={mId}
                                                        member={member}
                                                        currentUser={currentUser}
                                                        isGM={isGM}
                                                        isExpanded={expandedMemberId === mId}
                                                        isSpeaking={isSpeaking}
                                                        hostTitle={hostTitle}
                                                        playerTitle={playerTitle}
                                                        customInputVal={customInputMap[mId] || ""}
                                                        onToggleExpand={handleToggleExpand}
                                                        onSetRoleTitle={handleSetRoleTitle}
                                                        onCustomInputChange={handleCustomInputChange}
                                                        onToggleMute={handleToggleMute}
                                                        onRoleChange={handleRoleChange}
                                                        onKick={handleKick}
                                                        onBan={handleBan}
                                                        onPermissionToggle={handlePermissionToggle}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="pt-2 border-t border-zinc-800/80">
                            <button
                                type="button"
                                disabled={!isVoiceConnected}
                                onClick={toggleMicrophone}
                                className={cn(
                                    "w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md select-none active:scale-[0.98]",
                                    isMicEnabled
                                        ? "bg-emerald-500 text-zinc-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                        : isVoiceConnected
                                            ? "bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-750"
                                            : "bg-zinc-950 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                                )}
                            >
                                {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                                <span>{isMicEnabled ? "میکروفون فعال (Space برای قطع)" : "میکروفون غیرفعال (Space برای وصل)"}</span>
                            </button>
                        </div>
                    </div>
                )}

                {isOpen && (
                    <div className="sm:hidden fixed inset-0 z-[100] flex flex-col justify-end pointer-events-auto font-fa" dir="rtl">
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in-up"
                            onClick={() => setIsOpen(false)}
                        />

                        <div className="relative z-10 w-full max-h-[85dvh] bg-zinc-950 border-t border-zinc-800 rounded-t-[2.5rem] p-4 pb-8 space-y-3.5 shadow-2xl flex flex-col animate-fade-in-up">
                            <div className="w-12 h-1.5 rounded-full bg-zinc-800 mx-auto -mt-1 mb-1" />

                            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                                        <Dices className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-zinc-100">{roomData?.name || "اتاق بازی"}</h3>
                                        <span className="text-[10px] text-amber-400 font-mono">کد: {displayCode}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer active:scale-90"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {voiceError && (
                                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center animate-shake-subtle">
                                    <span className="text-[11px] text-rose-400">{voiceError}</span>
                                </div>
                            )}

                            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                                {membersList.length === 0 ? (
                                    <div className="text-center py-6 text-zinc-500 text-xs">هیچ کاربری آنلاین نیست</div>
                                ) : (
                                    <>
                                        {hostMembers.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5" />
                            <span>— {hostTitle} ({hostMembers.length}) —</span>
                          </span>
                                                </div>
                                                {hostMembers.map((member) => {
                                                    const mId = member.id || member.memberId || member.userId;
                                                    const isSelf = member.userId === currentUser?.id || member.username?.toLowerCase() === currentUser?.username?.toLowerCase();
                                                    const isSpeaking = Boolean(speakingMap[String(member.userId || member.id || "")] || (isSelf && isMicEnabled));
                                                    return (
                                                        <MemberCard
                                                            key={mId}
                                                            member={member}
                                                            currentUser={currentUser}
                                                            isGM={isGM}
                                                            isExpanded={expandedMemberId === mId}
                                                            isSpeaking={isSpeaking}
                                                            hostTitle={hostTitle}
                                                            playerTitle={playerTitle}
                                                            customInputVal={customInputMap[mId] || ""}
                                                            onToggleExpand={handleToggleExpand}
                                                            onSetRoleTitle={handleSetRoleTitle}
                                                            onCustomInputChange={handleCustomInputChange}
                                                            onToggleMute={handleToggleMute}
                                                            onRoleChange={handleRoleChange}
                                                            onKick={handleKick}
                                                            onBan={handleBan}
                                                            onPermissionToggle={handlePermissionToggle}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {playerMembers.length > 0 && (
                                            <div className="space-y-2 pt-1">
                                                <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span>— {playerTitle} ({playerMembers.length}) —</span>
                          </span>
                                                </div>
                                                {playerMembers.map((member) => {
                                                    const mId = member.id || member.memberId || member.userId;
                                                    const isSelf = member.userId === currentUser?.id || member.username?.toLowerCase() === currentUser?.username?.toLowerCase();
                                                    const isSpeaking = Boolean(speakingMap[String(member.userId || member.id || "")] || (isSelf && isMicEnabled));
                                                    return (
                                                        <MemberCard
                                                            key={mId}
                                                            member={member}
                                                            currentUser={currentUser}
                                                            isGM={isGM}
                                                            isExpanded={expandedMemberId === mId}
                                                            isSpeaking={isSpeaking}
                                                            hostTitle={hostTitle}
                                                            playerTitle={playerTitle}
                                                            customInputVal={customInputMap[mId] || ""}
                                                            onToggleExpand={handleToggleExpand}
                                                            onSetRoleTitle={handleSetRoleTitle}
                                                            onCustomInputChange={handleCustomInputChange}
                                                            onToggleMute={handleToggleMute}
                                                            onRoleChange={handleRoleChange}
                                                            onKick={handleKick}
                                                            onBan={handleBan}
                                                            onPermissionToggle={handlePermissionToggle}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="pt-2 border-t border-zinc-800/80">
                                {isSelfMutedByGM ? (
                                    <div className="w-full py-2.5 px-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center gap-2 text-xs font-bold">
                                        <VolumeX className="w-4 h-4 text-rose-400" />
                                        <span>شما توسط GM بی‌صدا شدید</span>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={!isVoiceConnected}
                                        onClick={toggleMicrophone}
                                        className={cn(
                                            "w-full h-12 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl select-none active:scale-[0.98]",
                                            isMicEnabled
                                                ? "bg-emerald-500 text-zinc-950 font-black shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                                                : isVoiceConnected
                                                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                                                    : "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                                        )}
                                    >
                                        {isMicEnabled ? (
                                            <>
                                                <Mic className="w-4 h-4 text-zinc-950" />
                                                <span>میکروفون وصل است (لمس برای قطع)</span>
                                            </>
                                        ) : (
                                            <>
                                                <MicOff className="w-4 h-4 text-zinc-400" />
                                                <span>{isVoiceConnected ? "میکروفون قطع است (لمس برای وصل)" : "چت صوتی غیرفعال"}</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }
);

PlayerMenu.displayName = "PlayerMenu";
export default PlayerMenu;