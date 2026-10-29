import React, { useState, memo } from "react";
import {
    Layers,
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    ChevronDown,
} from "lucide-react";
import { useSceneStore } from "../../stores/scene.store";
import { sceneApi } from "../../api/scene.api";
import { wsService } from "../../services/websocket.service";
import { confirmModal } from "../../stores/confirm.store";
import { cn } from "../../utils/cn";

export const SceneBar = memo(({ isGM = false, roomId = null }) => {
    const scenes = useSceneStore((state) => state.scenes);
    const currentScene = useSceneStore((state) => state.currentScene);
    const switchScene = useSceneStore((state) => state.switchScene);
    const renameScene = useSceneStore((state) => state.renameScene);

    const [isCreating, setIsCreating] = useState(false);
    const [newSceneName, setNewSceneName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [editingSceneId, setEditingSceneId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    if (!roomId) return null;

    const handleCreateScene = async (e) => {
        e.preventDefault();
        if (!newSceneName.trim() || isSubmitting) return;

        const sceneName = newSceneName.trim();
        setIsSubmitting(true);
        try {
            const created = await sceneApi.createScene({
                roomId,
                name: sceneName,
                isActive: true,
            });

            setNewSceneName("");
            setIsCreating(false);

            if (created && created.id) {
                useSceneStore.getState().addSceneFromSocket(created);
                await switchScene(created.id, true, roomId);
                wsService.send("SCENE_CREATED", { scene: created, sceneId: String(created.id) });
            }
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error("خطا در ایجاد صحنه:", err);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteScene = async (sceneId, e) => {
        e.stopPropagation();

        const isConfirmed = await confirmModal({
            title: "تأیید حذف صحنه بازی",
            message: "آیا از حذف این صحنه و تمام توکن‌ها، نقشه‌ها و ترسیمات آن اطمینان دارید؟ این عملیات قابل بازگشت نیست.",
            confirmText: "حذف قطعی صحنه",
            cancelText: "انصراف",
            variant: "danger",
        });

        if (!isConfirmed) return;

        try {
            await sceneApi.deleteScene(sceneId);

            const remaining = scenes.filter((s) => String(s.id).toLowerCase() !== String(sceneId).toLowerCase());
            const nextActive = remaining.length > 0 ? remaining[0].id : null;

            useSceneStore.setState({ scenes: remaining });
            if (nextActive) {
                await switchScene(nextActive, true, roomId);
            }

            wsService.send("SCENE_DELETE", {
                sceneId: String(sceneId),
                activeSceneId: nextActive ? String(nextActive) : null,
            });
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error("خطا در حذف صحنه:", err);
            }
        }
    };

    const startEditing = (scene, e) => {
        e.stopPropagation();
        setEditingSceneId(scene.id);
        setEditingName(scene.name);
    };

    const saveRename = async (sceneId, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!editingName.trim()) {
            setEditingSceneId(null);
            return;
        }

        await renameScene(sceneId, editingName.trim());
        setEditingSceneId(null);
    };

    return (
        <>
            {/* نوار صحنه‌ها در موبایل با پشتیبانی کامل از ساخت، ویرایش نام، سوییچ و حذف صحنه */}
            <div
                className="sm:hidden fixed top-[max(0.625rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-30 font-fa select-none"
                dir="rtl"
            >
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        aria-expanded={isMobileOpen}
                        aria-label="مدیریت و تغییر صحنه بازی"
                        className="flex items-center gap-1.5 px-2.5 h-9 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 shadow-xl backdrop-blur-xl text-xs font-bold cursor-pointer text-zinc-200 active:scale-95 transition-all max-w-[138px] xs:max-w-[165px]"
                    >
                        <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{currentScene?.name || "صحنه"}</span>
                        <ChevronDown
                            className={cn(
                                "w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200",
                                isMobileOpen ? "rotate-180" : ""
                            )}
                        />
                    </button>

                    {isMobileOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => {
                                    setIsMobileOpen(false);
                                    setEditingSceneId(null);
                                    setIsCreating(false);
                                }}
                                aria-hidden="true"
                            />
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 max-w-[88vw] bg-zinc-950/98 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-2xl p-2.5 z-50 flex flex-col gap-1.5 animate-fade-in-up">
                                <div className="flex items-center justify-between px-1.5 py-0.5">
                                    <span className="text-[10px] text-zinc-400 font-bold">
                                        {isGM ? "مدیریت و سوییچ صحنه‌ها:" : "صحنه فعال اتاق:"}
                                    </span>
                                    <span className="text-[10px] font-mono text-amber-400">{scenes.length} صحنه</span>
                                </div>

                                <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1">
                                    {scenes.map((scene) => {
                                        const isActive =
                                            String(currentScene?.id || "").toLowerCase() ===
                                            String(scene.id || "").toLowerCase();
                                        const isEditingThis = editingSceneId === scene.id;

                                        if (isEditingThis && isGM) {
                                            return (
                                                <form
                                                    key={scene.id}
                                                    onSubmit={(e) => saveRename(scene.id, e)}
                                                    className="flex items-center gap-1 bg-zinc-900 p-1.5 rounded-xl border border-amber-500/80"
                                                >
                                                    <input
                                                        type="text"
                                                        value={editingName}
                                                        onChange={(e) => setEditingName(e.target.value)}
                                                        autoFocus
                                                        className="flex-1 min-w-0 px-2 py-1 bg-transparent text-xs text-zinc-100 font-medium focus:outline-none"
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="w-7 h-7 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center shrink-0"
                                                        aria-label="ذخیره نام صحنه"
                                                    >
                                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingSceneId(null)}
                                                        className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center shrink-0"
                                                        aria-label="انصراف"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </form>
                                            );
                                        }

                                        return (
                                            <div
                                                key={scene.id}
                                                onClick={() => {
                                                    if (isGM && !isActive) {
                                                        switchScene(scene.id, true, roomId);
                                                        setIsMobileOpen(false);
                                                    }
                                                }}
                                                className={cn(
                                                    "w-full text-right px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 min-h-[40px]",
                                                    isActive
                                                        ? "bg-amber-500 text-zinc-950 shadow-md font-black"
                                                        : isGM
                                                            ? "text-zinc-300 hover:bg-zinc-900 cursor-pointer active:scale-[0.98]"
                                                            : "text-zinc-500"
                                                )}
                                            >
                                                <span className="truncate flex-1">{scene.name}</span>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    {isGM && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => startEditing(scene, e)}
                                                                className={cn(
                                                                    "w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                                                                    isActive
                                                                        ? "hover:bg-amber-600 text-zinc-950"
                                                                        : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
                                                                )}
                                                                aria-label="ویرایش نام صحنه"
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                            </button>

                                                            {scenes.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleDeleteScene(scene.id, e)}
                                                                    className={cn(
                                                                        "w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                                                                        isActive
                                                                            ? "hover:bg-rose-600 text-zinc-950"
                                                                            : "hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400"
                                                                    )}
                                                                    aria-label="حذف صحنه"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                    {isActive && !isGM && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {isGM && (
                                    <div className="pt-1.5 border-t border-zinc-800/80">
                                        {!isCreating ? (
                                            <button
                                                type="button"
                                                onClick={() => setIsCreating(true)}
                                                className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-amber-400 flex items-center justify-center gap-1.5 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                                            >
                                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                                <span>ایجاد صحنه جدید</span>
                                            </button>
                                        ) : (
                                            <form
                                                onSubmit={handleCreateScene}
                                                className="flex items-center gap-1 bg-zinc-900 p-1.5 rounded-xl border border-amber-500/70"
                                            >
                                                <input
                                                    type="text"
                                                    value={newSceneName}
                                                    onChange={(e) => setNewSceneName(e.target.value)}
                                                    placeholder="نام صحنه جدید..."
                                                    autoFocus
                                                    className="flex-1 min-w-0 px-2 py-1 bg-transparent text-xs text-zinc-100 font-medium focus:outline-none"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className="w-7 h-7 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center shrink-0"
                                                    aria-label="تایید ساخت صحنه"
                                                >
                                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCreating(false)}
                                                    className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center shrink-0"
                                                    aria-label="انصراف"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* نوار صحنه‌ها در دسکتاپ */}
            <div
                className="hidden sm:flex fixed top-4 left-1/2 -translate-x-1/2 z-30 items-center gap-2.5 px-3 py-1.5 bg-zinc-950/85 border border-zinc-800/80 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-2xl font-fa select-none pointer-events-auto animate-fade-in-up"
                dir="rtl"
            >
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/70 border border-zinc-800/60 text-zinc-300 text-xs font-semibold shrink-0">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>صحنه‌ها</span>
                </div>

                <div className="flex items-center gap-1.5 max-w-[50vw] overflow-x-auto no-scrollbar py-0.5 px-0.5">
                    {scenes.map((scene) => {
                        const isActive = String(currentScene?.id || "").toLowerCase() === String(scene.id || "").toLowerCase();
                        const isEditingThis = editingSceneId === scene.id;

                        if (isEditingThis && isGM) {
                            return (
                                <form
                                    key={scene.id}
                                    onSubmit={(e) => saveRename(scene.id, e)}
                                    className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-xl border border-amber-500/80 shadow-md shrink-0 animate-fade-in-up"
                                >
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        autoFocus
                                        className="w-28 px-1 py-0.5 bg-transparent text-xs text-zinc-100 font-medium focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center cursor-pointer hover:bg-amber-400 transition-colors"
                                    >
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingSceneId(null)}
                                        className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center cursor-pointer transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </form>
                            );
                        }

                        return (
                            <div
                                key={scene.id}
                                onClick={() => isGM && switchScene(scene.id, true, roomId)}
                                onDoubleClick={(e) => isGM && startEditing(scene, e)}
                                className={cn(
                                    "group relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 shrink-0",
                                    isActive
                                        ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 border border-amber-400/50 cursor-default font-black"
                                        : isGM
                                            ? "bg-zinc-900/60 border border-zinc-800/70 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:bg-zinc-900 active:scale-95 cursor-pointer"
                                            : "bg-zinc-900/40 border border-zinc-800/40 text-zinc-500 cursor-default"
                                )}
                                title={isGM ? "برای سوییچ کلیک و برای ویرایش نام دابل‌کلیک کنید" : ""}
                            >
                                <span className="truncate max-w-[150px] tracking-wide">{scene.name}</span>

                                {isGM && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 mr-0.5">
                                        <button
                                            type="button"
                                            onClick={(e) => startEditing(scene, e)}
                                            className={cn(
                                                "w-5 h-5 rounded-md flex items-center justify-center transition-colors",
                                                isActive
                                                    ? "hover:bg-amber-600 text-zinc-950"
                                                    : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                                            )}
                                            title="ویرایش نام"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                        </button>

                                        {scenes.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteScene(scene.id, e)}
                                                className={cn(
                                                    "w-5 h-5 rounded-md flex items-center justify-center transition-colors",
                                                    isActive
                                                        ? "hover:bg-rose-600 text-zinc-950"
                                                        : "hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400"
                                                )}
                                                title="حذف صحنه"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {isGM && (
                    <div className="shrink-0">
                        {!isCreating ? (
                            <button
                                type="button"
                                onClick={() => setIsCreating(true)}
                                className="h-7.5 px-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800/80 hover:border-amber-500/50 text-amber-400 flex items-center gap-1 text-xs font-semibold active:scale-95 transition-all cursor-pointer shadow-sm"
                                title="ایجاد صحنه جدید"
                            >
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span className="hidden md:inline">صحنه جدید</span>
                            </button>
                        ) : (
                            <form
                                onSubmit={handleCreateScene}
                                className="flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded-xl border border-amber-500/70 shadow-lg animate-fade-in-up"
                            >
                                <input
                                    type="text"
                                    value={newSceneName}
                                    onChange={(e) => setNewSceneName(e.target.value)}
                                    placeholder="نام صحنه..."
                                    autoFocus
                                    className="w-32 px-2 py-0.5 bg-transparent text-xs text-zinc-100 font-medium focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center cursor-pointer hover:bg-amber-400 transition-colors"
                                >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center cursor-pointer transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </>
    );
});

SceneBar.displayName = "SceneBar";
export default SceneBar;