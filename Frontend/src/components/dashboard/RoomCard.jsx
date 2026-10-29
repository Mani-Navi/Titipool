import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useClipboard } from "../../hooks/useClipboard";
import {
  Users,
  Clock,
  Copy,
  Check,
  Trash2,
  ArrowRight,
  Lock,
  Scroll,
  Crown,
  Swords,
  Link2,
  Settings2,
  LogOut,
} from "lucide-react";
import { Badge } from "../ui/Badge.jsx";
import { Button } from "../ui/Button.jsx";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const RoomCard = memo(({ room, onRequestDelete, onRequestEdit, onRequestLeave }) => {
  const navigate = useNavigate();
  const { copy, copied } = useClipboard();
  const [linkCopied, setLinkCopied] = useState(false);
  const linkTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (linkTimerRef.current) {
        clearTimeout(linkTimerRef.current);
      }
    };
  }, []);

  const daysLeft = useMemo(() => {
    const expiresAt = room.expires_at || room.expiresAt;
    if (!expiresAt) return 30;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / MS_PER_DAY));
  }, [room.expires_at, room.expiresAt]);

  const isOptimistic = Boolean(room.isOptimistic);
  const isGM = room.role === "GM";

  const resolvedHostTitle = useMemo(() => {
    return (
        room.hostRoleTitle ||
        room.host_role_title ||
        (typeof window !== "undefined" && room.id ? localStorage.getItem(`room_${room.id}_host_title`) : null) ||
        "میزبان"
    );
  }, [room.id, room.hostRoleTitle, room.host_role_title]);

  const resolvedPlayerTitle = useMemo(() => {
    return (
        room.playerRoleTitle ||
        room.player_role_title ||
        (typeof window !== "undefined" && room.id ? localStorage.getItem(`room_${room.id}_player_title`) : null) ||
        "بازیکن"
    );
  }, [room.id, room.playerRoleTitle, room.player_role_title]);

  const displayRoleTitle = isGM ? resolvedHostTitle : resolvedPlayerTitle;

  const handleCopyLink = useCallback(() => {
    const inviteUrl = `${window.location.origin}/dashboard?join=${room.code}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
          .writeText(inviteUrl)
          .then(() => {
            setLinkCopied(true);
            if (linkTimerRef.current) {
              clearTimeout(linkTimerRef.current);
            }
            linkTimerRef.current = setTimeout(() => setLinkCopied(false), 2000);
          })
          .catch(() => {});
    }
  }, [room.code]);

  return (
      <div
          className={`group relative bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 border border-zinc-800/80 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 backdrop-blur-sm ${
              isOptimistic ? "opacity-60 pointer-events-none" : ""
          }`}
          dir="rtl"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" aria-hidden="true" />

        {isOptimistic && (
            <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center rounded-2xl z-20" role="status">
              <Badge variant="amber" size="md">
                <span className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin ml-1.5" aria-hidden="true" />
                در حال ساخت اتاق در سرور...
              </Badge>
            </div>
        )}

        <div>
          <div className="flex items-start justify-between gap-2.5 sm:gap-3 mb-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <h3
                    className="text-sm sm:text-base font-bold text-zinc-100 group-hover:text-amber-300 transition-colors duration-150 truncate"
                    title={room.name}
                >
                  {room.name}
                </h3>
                {room.isProtected && (
                    <span
                        className="p-1 rounded-md bg-amber-500/10 text-amber-400 shrink-0 border border-amber-500/20"
                        title="اتاق دارای رمز عبور است"
                        aria-label="اتاق محافظت‌شده با رمز عبور"
                    >
                      <Lock className="w-3 h-3" aria-hidden="true" />
                    </span>
                )}
                {room.type === "OFFICIAL" && (
                    <span
                        className="p-1 rounded-md bg-amber-500/10 text-amber-500 shrink-0 border border-amber-500/20"
                        title="قالب و سناریوی آماده Titipool"
                        aria-label="سناریوی رسمی Titipool"
                    >
                      <Scroll className="w-3 h-3" aria-hidden="true" />
                    </span>
                )}
              </div>

              {room.description ? (
                  <p
                      className="text-xs text-zinc-400 leading-relaxed line-clamp-2 group-hover:text-zinc-300 transition-colors duration-150"
                      title={room.description}
                  >
                    {room.description}
                  </p>
              ) : (
                  <p className="text-xs text-zinc-600 italic">بدون توضیحات</p>
              )}
            </div>

            <Badge variant={isGM ? "gm" : "player"} className="shrink-0 font-semibold gap-1 text-[10px]">
              {isGM ? (
                  <Crown className="w-3 h-3 text-amber-400" aria-hidden="true" />
              ) : (
                  <Swords className="w-3 h-3 text-blue-400" aria-hidden="true" />
              )}
              <span>{displayRoleTitle}</span>
            </Badge>
          </div>

          <div className="flex items-center gap-2 my-3.5">
            <button
                type="button"
                onClick={() => copy(room.code)}
                aria-label={`کپی کد ۶ رقمی اتاق ${room.name}: ${room.code}`}
                className="group/code min-h-[36px] text-xs font-mono bg-zinc-950/90 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 px-3 py-1.5 rounded-xl border border-zinc-700/60 hover:border-amber-500/40 active:scale-95 transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-inner focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                title="کلیک برای کپی کد ۶ حرفی"
            >
              <span className="tracking-widest font-bold">{room.code}</span>
              {copied ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-fa font-bold">
                    <Check className="w-3 h-3" aria-hidden="true" /> کپی شد
                  </span>
              ) : (
                  <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover/code:text-amber-400 transition-colors" aria-hidden="true" />
              )}
            </button>

            <button
                type="button"
                onClick={handleCopyLink}
                aria-label={`کپی لینک مستقیم دعوت به اتاق ${room.name}`}
                className="min-h-[36px] min-w-[36px] p-1.5 rounded-xl bg-zinc-950/90 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border border-zinc-700/60 active:scale-95 transition-all duration-150 cursor-pointer flex items-center justify-center gap-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                title="کپی لینک مستقیم دعوت"
            >
              {linkCopied ? (
                  <span className="text-emerald-400 text-[10px] font-fa flex items-center gap-1 px-1">
                    <Check className="w-3 h-3" aria-hidden="true" /> کپی شد
                  </span>
              ) : (
                  <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </button>

            <span className="flex items-center gap-1.5 text-[11px] text-zinc-400 mr-auto bg-zinc-950/60 px-2.5 py-1.5 rounded-lg border border-zinc-800/80">
              <span
                  className={`w-1.5 h-1.5 rounded-full ${
                      room.is_active || room.isActive
                          ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                          : "bg-zinc-600"
                  }`}
                  aria-hidden="true"
              />
              <span>{room.is_active || room.isActive ? "فعال" : "غیرفعال"}</span>
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="flex items-center gap-1 text-zinc-400 text-[11px] whitespace-nowrap">
              <Users className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
              <span>{room.player_count || room.playerCount || 1} بازیکن</span>
            </span>

            <span className="flex items-center gap-1 text-zinc-400 text-[11px] whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
              <span>{`${daysLeft} روز`}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {isGM && (
                <>
                  <button
                      type="button"
                      onClick={() => onRequestEdit(room)}
                      aria-label={`ویرایش مشخصات اتاق ${room.name}`}
                      className="w-8.5 h-8.5 flex items-center justify-center text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl active:scale-90 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                      title="ویرایش مشخصات اتاق"
                  >
                    <Settings2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                      type="button"
                      onClick={() => onRequestDelete(room)}
                      aria-label={`حذف اتاق ${room.name}`}
                      className="w-8.5 h-8.5 flex items-center justify-center text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl active:scale-90 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
                      title="حذف اتاق"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </>
            )}

            {!isGM && !isOptimistic && (
                <button
                    type="button"
                    onClick={() => onRequestLeave(room)}
                    aria-label={`خروج از اتاق ${room.name}`}
                    className="w-8.5 h-8.5 flex items-center justify-center text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl active:scale-90 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
                    title="خروج از این ماجراجویی"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </button>
            )}

            <Button
                size="sm"
                variant="amber"
                onClick={() => navigate(`/room/${room.id}`)}
                aria-label={`ورود به میز بازی اتاق ${room.name}`}
                className="px-3.5 h-8.5 text-xs gap-1 font-bold shadow-sm shadow-amber-500/10 hover:shadow-md hover:shadow-amber-500/20 active:scale-[0.97] transition-all duration-150 mr-0.5"
            >
              <span>ورود</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
  );
});

RoomCard.displayName = "RoomCard";
export default RoomCard;