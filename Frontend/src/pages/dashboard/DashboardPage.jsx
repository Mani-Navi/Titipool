import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useRooms } from "../../hooks/useRooms";
import { useAuth } from "../../hooks/useAuth";
import { usePageTitle } from "../../hooks/usePageTitle";
import { RoomCard } from "../../components/dashboard/RoomCard";
import { CreateRoomModal } from "../../components/dashboard/CreateRoomModal";
import { JoinRoomModal } from "../../components/dashboard/JoinRoomModal";
import { DeleteRoomModal } from "../../components/dashboard/DeleteRoomModal";
import { EditRoomModal } from "../../components/dashboard/EditRoomModal";
import { LeaveRoomModal } from "../../components/dashboard/LeaveRoomModal";
import { EmptyRooms } from "../../components/dashboard/EmptyRooms";
import { RpgAvatar } from "../../components/profile/RpgAvatar";
import { Button } from "../../components/ui/Button.jsx";
import { Footer } from "../../components/layout/Footer.jsx";
import {
  Dices,
  Plus,
  KeyRound,
  LogOut,
  RefreshCw,
  AlertCircle,
  Search,
  Crown,
  Swords,
} from "lucide-react";

export const DashboardPage = () => {
  usePageTitle("داشبورد بازی‌ها");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { rooms, isLoading, error, fetchRooms, createRoom, updateRoom, deleteRoom, leaveRoom } = useRooms();
  const { user, logout } = useAuth();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [roomToEdit, setRoomToEdit] = useState(null);
  const [roomToLeave, setRoomToLeave] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastError, setToastError] = useState("");

  useEffect(() => {
    const inviteCode = searchParams.get("join");
    const actionParam = searchParams.get("action");
    if (inviteCode || actionParam === "join") {
      setIsJoinOpen(true);
      searchParams.delete("join");
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (
          activeEl &&
          (activeEl.tagName === "INPUT" ||
              activeEl.tagName === "TEXTAREA" ||
              activeEl.tagName === "SELECT" ||
              activeEl.isContentEditable)
      ) {
        return;
      }

      if (e.key === "n" || e.key === "N" || e.key === "د") {
        e.preventDefault();
        setIsCreateOpen(true);
      } else if (e.key === "j" || e.key === "J" || e.key === "ت") {
        e.preventDefault();
        setIsJoinOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    const handleFocus = () => fetchRooms();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchRooms]);

  const handleCreateRoom = useCallback(async (data) => {
    await createRoom(data);
  }, [createRoom]);

  const handleUpdateRoom = useCallback(async (id, data) => {
    await updateRoom(id, data);
  }, [updateRoom]);

  const handleConfirmDelete = useCallback(async () => {
    if (!roomToDelete) return;
    setIsActionLoading(true);
    try {
      await deleteRoom(roomToDelete.id, roomToDelete);
      setRoomToDelete(null);
    } catch {
      setToastError("خطا در حذف اتاق");
      setTimeout(() => setToastError(""), 3500);
    } finally {
      setIsActionLoading(false);
    }
  }, [roomToDelete, deleteRoom]);

  const handleConfirmLeave = useCallback(async () => {
    if (!roomToLeave) return;
    setIsActionLoading(true);
    try {
      await leaveRoom(roomToLeave.id, roomToLeave);
      setRoomToLeave(null);
    } catch {
      setToastError("خطا در خروج از اتاق");
      setTimeout(() => setToastError(""), 3500);
    } finally {
      setIsActionLoading(false);
    }
  }, [roomToLeave, leaveRoom]);

  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return rooms;
    const query = searchQuery.trim().toLowerCase();
    return rooms.filter(
        (r) =>
            r.name?.toLowerCase().includes(query) ||
            r.code?.toLowerCase().includes(query) ||
            r.description?.toLowerCase().includes(query)
    );
  }, [rooms, searchQuery]);

  const myCreatedAdventures = useMemo(
      () => filteredRooms.filter((r) => r.role === "GM"),
      [filteredRooms]
  );
  const myJoinedAdventures = useMemo(
      () => filteredRooms.filter((r) => r.role !== "GM"),
      [filteredRooms]
  );

  return (
      <div
          className="fixed inset-0 w-full h-[100dvh] bg-[#090a0f] text-zinc-100 flex flex-col font-fa select-none overflow-y-auto overflow-x-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:pb-0"
          style={{ WebkitOverflowScrolling: "touch" }}
          dir="rtl"
      >
        {/* نور ملایم محیطی در بالای داشبورد با شتاب‌دهی GPU */}
        <div className="fixed -top-32 left-1/2 -translate-x-1/2 w-96 sm:w-[48rem] h-64 bg-amber-500/8 rounded-full blur-[130px] pointer-events-none transform-gpu" aria-hidden="true" />

        {toastError && (
            <div
                role="alert"
                aria-live="assertive"
                className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-rose-600/90 backdrop-blur-xl text-white px-4 py-2.5 rounded-2xl shadow-2xl shadow-rose-950 text-xs font-semibold border border-rose-500/30 flex items-center gap-2 animate-shake-subtle"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{toastError}</span>
            </div>
        )}

        {/* هدر ناوبری اصلی */}
        <header
            className="min-h-16 shrink-0 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl px-3.5 sm:px-6 pt-[env(safe-area-inset-top,0px)] flex items-center justify-between sticky top-0 z-30 transition-all"
            role="banner"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Link
                to="/"
                className="flex items-center gap-2.5 sm:gap-3 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 rounded-xl transition-all min-w-0"
                title="بازگشت به صفحه اصلی"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.12)] shrink-0 transition-transform duration-200 group-hover:scale-105 group-active:scale-95" aria-hidden="true">
                <Dices className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="font-black text-xs sm:text-sm text-zinc-100 group-hover:text-amber-400 tracking-wide truncate flex items-center gap-1.5 transition-colors">
                  <span>میز بازی Titipool</span>
                  <span className="hidden md:inline-flex px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700/60" aria-label="نسخه ۱.۴">
                    v1.4
                  </span>
                </h1>
                {user?.username && (
                    <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                      خوش آمدید،{" "}
                      <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate("/profile");
                          }}
                          className="text-amber-400 font-semibold hover:text-amber-300 hover:underline transition-colors cursor-pointer"
                          aria-label={`مشاهده پروفایل ${user.username}`}
                      >
                        {user.username}
                      </button>
                    </p>
                )}
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsJoinOpen(true)}
                className="hidden sm:flex text-xs gap-1.5 active:scale-[0.97] transition-all duration-150 h-9"
                title="میانبر: کلید J"
                aria-label="ورود به اتاق با کد دعوت (کلید J)"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>ورود با کد</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-zinc-800 text-zinc-400 rounded border border-zinc-700" aria-hidden="true">J</kbd>
            </Button>

            <Button
                type="button"
                variant="amber"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="hidden sm:flex text-xs font-bold gap-1.5 shadow-md shadow-amber-500/10 hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.97] transition-all duration-150 h-9"
                title="میانبر: کلید N"
                aria-label="ایجاد اتاق ماجرای جدید (کلید N)"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
              <span>ایجاد ماجرا</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-amber-600/30 text-amber-100 rounded border border-amber-400/40" aria-hidden="true">N</kbd>
            </Button>

            <div className="hidden sm:block h-5 w-px bg-zinc-800 mx-1" aria-hidden="true" />

            <button
                type="button"
                onClick={() => navigate("/profile")}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-zinc-900 border border-zinc-700/80 overflow-hidden flex items-center justify-center hover:border-amber-500/60 active:scale-90 transition-all duration-150 cursor-pointer p-0.5 shrink-0 hover:shadow-[0_0_12px_rgba(251,191,36,0.2)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                aria-label="مشاهده و ویرایش تنظیمات پروفایل"
            >
              <RpgAvatar avatarId={user?.avatarUrl || "cowboy"} className="w-full h-full" />
            </button>

            <button
                type="button"
                onClick={logout}
                className="w-9 h-9 sm:w-auto sm:h-auto sm:p-2 flex items-center justify-center text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl active:scale-90 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
                aria-label="خروج از حساب کاربری"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* محتوای اصلی داشبورد */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-3.5 sm:p-6 md:p-8 space-y-6 sm:space-y-8 animate-fade-in-up" role="main">
          {rooms.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950/70 border border-zinc-800/80 p-3 rounded-2xl backdrop-blur-md">
                <div className="relative w-full sm:w-80">
                  <input
                      type="text"
                      placeholder="جستجو در بین تمامی اتاق‌ها..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="جستجو در بین اتاق‌ها بر اساس عنوان یا کد"
                      className="w-full h-10 bg-zinc-900/90 border border-zinc-700/70 rounded-xl px-3.5 pl-9 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all duration-150"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" aria-hidden="true" />
                </div>

                <div className="grid grid-cols-3 sm:flex sm:items-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-zinc-400 bg-zinc-900/40 sm:bg-transparent p-2 sm:p-0 rounded-xl text-center sm:text-right border border-zinc-800/50 sm:border-none">
                  <div>
                    کل اتاق‌ها: <strong className="text-zinc-200 font-mono">{rooms.length}</strong>
                  </div>
                  <div className="hidden sm:block h-3 w-px bg-zinc-800" aria-hidden="true" />
                  <div>
                    ماجراهای من: <strong className="text-amber-400 font-mono">{rooms.filter((r) => r.role === "GM").length}</strong>
                  </div>
                  <div className="hidden sm:block h-3 w-px bg-zinc-800" aria-hidden="true" />
                  <div>
                    ماجراجویی‌ها: <strong className="text-blue-400 font-mono">{rooms.filter((r) => r.role !== "GM").length}</strong>
                  </div>
                </div>
              </div>
          )}

          {error && (
              <div
                  role="alert"
                  className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-400 animate-shake-subtle"
              >
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {error}
                </span>
                <button
                    type="button"
                    onClick={fetchRooms}
                    className="flex items-center gap-1.5 font-bold hover:underline text-rose-300 active:scale-95 transition-transform cursor-pointer"
                    aria-label="تلاش مجدد برای دریافت لیست اتاق‌ها"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  تلاش مجدد
                </button>
              </div>
          )}

          {isLoading && rooms.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" role="status" aria-label="در حال بارگذاری لیست اتاق‌ها">
                {[1, 2, 3].map((n) => (
                    <div
                        key={n}
                        className="h-44 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-5 animate-pulse flex flex-col justify-between"
                        aria-hidden="true"
                    >
                      <div className="space-y-3">
                        <div className="h-4 bg-zinc-800/80 rounded-md w-2/3" />
                        <div className="h-3 bg-zinc-800/60 rounded-md w-1/3" />
                      </div>
                      <div className="h-4 bg-zinc-800/50 rounded-md w-full" />
                    </div>
                ))}
              </div>
          ) : rooms.length === 0 && !isLoading ? (
              <EmptyRooms onCreateClick={() => setIsCreateOpen(true)} />
          ) : (
              <div className="space-y-7 sm:space-y-9">
                {myCreatedAdventures.length > 0 && (
                    <section className="space-y-3.5" aria-labelledby="gm-rooms-title">
                      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
                        <Crown className="w-4 h-4 text-amber-400" aria-hidden="true" />
                        <h2 id="gm-rooms-title" className="text-xs sm:text-sm font-bold text-zinc-100">
                          ماجراهای من (میزبان)
                        </h2>
                        <span className="text-[11px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-500/20 font-mono">
                          {myCreatedAdventures.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {myCreatedAdventures.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                onRequestEdit={(r) => setRoomToEdit(r)}
                                onRequestDelete={(r) => setRoomToDelete(r)}
                            />
                        ))}
                      </div>
                    </section>
                )}

                {myJoinedAdventures.length > 0 && (
                    <section className="space-y-3.5" aria-labelledby="player-rooms-title">
                      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
                        <Swords className="w-4 h-4 text-blue-400" aria-hidden="true" />
                        <h2 id="player-rooms-title" className="text-xs sm:text-sm font-bold text-zinc-100">
                          ماجراجویی‌های من (بازیکن)
                        </h2>
                        <span className="text-[11px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-500/20 font-mono">
                          {myJoinedAdventures.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        {myJoinedAdventures.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                onRequestLeave={(r) => setRoomToLeave(r)}
                            />
                        ))}
                      </div>
                    </section>
                )}

                {filteredRooms.length === 0 && searchQuery.trim() && (
                    <div className="p-8 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-center text-zinc-400 space-y-2">
                      <p className="text-xs sm:text-sm">اتاقی با عبارت «{searchQuery}» پیدا نشد.</p>
                      <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="text-xs text-amber-400 hover:text-amber-300 hover:underline transition-colors cursor-pointer font-bold"
                          aria-label="پاک کردن فیلتر جستجو"
                      >
                        پاک کردن جستجو
                      </button>
                    </div>
                )}
              </div>
          )}
        </main>

        {/* فوتر حقوقی و پشتیبانی */}
        <Footer />

        {/* داک پایین ارگونومیک موبایل بدون همپوشانی با کارت‌ها و فوتر */}
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/92 backdrop-blur-xl border-t border-zinc-800/90 px-3.5 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.6)] flex items-center gap-2.5">
          <button
              type="button"
              onClick={() => setIsJoinOpen(true)}
              className="flex-1 min-h-[44px] px-3 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-amber-400 shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all duration-150 cursor-pointer font-bold text-xs"
              aria-label="ورود به اتاق با کد دعوت"
          >
            <KeyRound className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>ورود با کد</span>
          </button>

          <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex-[1.35] min-h-[44px] px-4 rounded-2xl bg-amber-500 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all duration-150 border border-amber-400 cursor-pointer"
              aria-label="ایجاد اتاق ماجرای جدید"
          >
            <Plus className="w-4 h-4 stroke-[3] shrink-0" aria-hidden="true" />
            <span>ایجاد ماجرا</span>
          </button>
        </div>

        <CreateRoomModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onCreate={handleCreateRoom}
        />
        <JoinRoomModal isOpen={isJoinOpen} onClose={() => setIsJoinOpen(false)} />
        <EditRoomModal
            isOpen={!!roomToEdit}
            onClose={() => setRoomToEdit(null)}
            onUpdate={handleUpdateRoom}
            room={roomToEdit}
        />
        <DeleteRoomModal
            isOpen={!!roomToDelete}
            onClose={() => setRoomToDelete(null)}
            onConfirm={handleConfirmDelete}
            room={roomToDelete}
            isLoading={isActionLoading}
        />
        <LeaveRoomModal
            isOpen={!!roomToLeave}
            onClose={() => setRoomToLeave(null)}
            onConfirm={handleConfirmLeave}
            room={roomToLeave}
            isLoading={isActionLoading}
        />
      </div>
  );
};