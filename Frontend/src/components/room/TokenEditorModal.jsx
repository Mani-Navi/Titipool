import React, { useState, useEffect, useRef, memo } from "react";
import {
  Heart,
  Trash2,
  Plus,
  Minus,
  Activity,
  User,
  Upload,
  Image as ImageIcon,
  Shield,
  Maximize2,
  X,
  Check,
  Eye,
  Key,
  FileText,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useCanvasStore } from "../../stores/canvas.store";
import { useSceneStore } from "../../stores/scene.store";
import { useAuthStore } from "../../stores/auth.store";
import { useRoomStore } from "../../stores/room.store";
import { usePermissions } from "../../hooks/usePermissions";
import { wsService } from "../../services/websocket.service";
import { assetApi } from "../../api/asset.api";
import { getFullAssetUrl } from "../../utils/assetUrl.js";
import { WS_EVENTS } from "../../constants/wsEvents.js";
import { uiAudio } from "../../utils/uiAudio";

const PRESET_TOKEN_ICONS = Object.freeze([
  { id: "knight", label: "شوالیه / جنگجو", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4" },
  { id: "mage", label: "جادوگر / ویچ", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aria&backgroundColor=ffdfbf" },
  { id: "rogue", label: "روگ / قاتل", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Shadow&backgroundColor=c0aede" },
  { id: "cleric", label: "کشیش / پالادین", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Thorin&backgroundColor=d1d4f9" },
  { id: "ranger", label: "کماندار / رنجر", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=ffd5dc" },
  { id: "barbarian", label: "بربرین / وحشی", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Garen&backgroundColor=ffdfbf" },
  { id: "warlock", label: "وارلاک / شیاطین", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Morgath&backgroundColor=c0aede" },
  { id: "elf", label: "الف / دروید", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Valkyrie&backgroundColor=b6e3f4" },
  { id: "monster", label: "هیولا / اورک", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Golem&backgroundColor=ffd5dc" },
  { id: "dragon", label: "دراگون / تایتان", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Dragon&backgroundColor=ffdfbf" },
]);

const ALL_DND_CONDITIONS = Object.freeze([
  { id: "blinded", nameFa: "کور شده", nameEn: "Blinded", icon: "🙈" },
  { id: "charmed", nameFa: "افسون شده", nameEn: "Charmed", icon: "💖" },
  { id: "deafened", nameFa: "ناشنوا", nameEn: "Deafened", icon: "🙉" },
  { id: "frightened", nameFa: "وحشت‌زده", nameEn: "Frightened", icon: "😨" },
  { id: "grappled", nameFa: "گلاویز شده", nameEn: "Grappled", icon: "🤼" },
  { id: "incapacitated", nameFa: "ناتوان", nameEn: "Incapacitated", icon: "💫" },
  { id: "invisible", nameFa: "نامرئی", nameEn: "Invisible", icon: "👻" },
  { id: "paralyzed", nameFa: "فلج شده", nameEn: "Paralyzed", icon: "⚡" },
  { id: "petrified", nameFa: "سنگ شده", nameEn: "Petrified", icon: "🗿" },
  { id: "poisoned", nameFa: "مسموم", nameEn: "Poisoned", icon: "🤢" },
  { id: "prone", nameFa: "افتاده به خاک", nameEn: "Prone", icon: "🛌" },
  { id: "restrained", nameFa: "در بند", nameEn: "Restrained", icon: "⛓️" },
  { id: "stunned", nameFa: "گیج شده", nameEn: "Stunned", icon: "😵" },
  { id: "unconscious", nameFa: "بیهوش", nameEn: "Unconscious", icon: "💤" },
  { id: "exhaustion", nameFa: "خستگی شدید", nameEn: "Exhaustion", icon: "😫" },
  { id: "bleeding", nameFa: "خونریزی", nameEn: "Bleeding", icon: "🩸" },
]);

const MAX_TOKEN_FILE_SIZE = 3 * 1024 * 1024;

const isValidImageUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  return (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:") ||
      trimmed.startsWith("/uploads/") ||
      trimmed.startsWith("blob:")
  );
};

export const TokenEditorModal = memo(({ roomData }) => {
  const isEditing = useCanvasStore((state) => state.isTokenEditorOpen);
  const editingTokenId = useCanvasStore((state) => state.editingTokenId);
  const closeEditor = useCanvasStore((state) => state.closeTokenEditor);

  const currentScene = useSceneStore((state) => state.currentScene);
  const updateToken = useSceneStore((state) => state.updateToken);
  const removeToken = useSceneStore((state) => state.removeToken);
  const availableConditions = useSceneStore((state) => state.availableConditions || []);
  const addAvailableCondition = useSceneStore((state) => state.addAvailableCondition);
  const removeAvailableCondition = useSceneStore((state) => state.removeAvailableCondition);

  const storeRoom = useRoomStore((state) => state.currentRoom || state.room || state.activeRoom);
  const currentRoom = roomData || storeRoom;
  const { isGM, canMoveToken } = usePermissions(currentRoom);
  const currentUser = useAuthStore((state) => state.user);

  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  const token = currentScene?.tokens?.find((t) => String(t.id) === String(editingTokenId));

  const tokenOwner = token?.controlledBy ? String(token.controlledBy).toLowerCase().trim() : "";
  const userId = currentUser?.id ? String(currentUser.id).toLowerCase().trim() : "";
  const userAltId = currentUser?.userId ? String(currentUser.userId).toLowerCase().trim() : "";
  const userName = currentUser?.username ? String(currentUser.username).toLowerCase().trim() : "";
  const userEmail = currentUser?.email ? String(currentUser.email).toLowerCase().trim() : "";
  const tokenLabel = String(token?.label || token?.name || "").toLowerCase().trim();

  const isOwner = Boolean(
      isGM ||
      (tokenOwner &&
          ((userId && tokenOwner === userId) ||
              (userAltId && tokenOwner === userAltId) ||
              (userName && tokenOwner === userName) ||
              (userEmail && tokenOwner === userEmail))) ||
      (tokenLabel &&
          ((userName && tokenLabel === userName) ||
              (userEmail && tokenLabel === userEmail))) ||
      (token?.controlledBy && canMoveToken(token.controlledBy))
  );

  const canEditBasic = Boolean(isGM || isOwner);

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [hp, setHp] = useState(20);
  const [maxHp, setMaxHp] = useState(20);
  const [ac, setAc] = useState(14);
  const [size, setSize] = useState(1);
  const [isHidden, setIsHidden] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [gmNotes, setGmNotes] = useState("");
  const [calcInput, setCalcInput] = useState("");

  const isProp = Boolean(token?.isProp);

  const [showHp, setShowHp] = useState(true);
  const [showConditions, setShowConditions] = useState(true);
  const [showAc, setShowAc] = useState(true);
  const [showNotes, setShowNotes] = useState(false);

  const [allowPlayerHp, setAllowPlayerHp] = useState(true);
  const [allowPlayerConditions, setAllowPlayerConditions] = useState(true);
  const [allowPlayerAc, setAllowPlayerAc] = useState(true);
  const [allowPlayerSize, setAllowPlayerSize] = useState(true);

  const [selectedConditions, setSelectedConditions] = useState([]);
  const [showAddConditionPicker, setShowAddConditionPicker] = useState(false);

  useEffect(() => {
    if (token) {
      setName(token.label || token.name || "");

      const rawAvatar = token.avatarUrl || token.assetUrl || "";
      setAvatarUrl(isValidImageUrl(rawAvatar) ? rawAvatar : "");

      const initialMaxHp = token.maxHp !== undefined ? token.maxHp : 20;
      const initialHp = token.hp !== undefined ? token.hp : initialMaxHp;

      setMaxHp(initialMaxHp);
      setHp(Math.min(initialMaxHp, Math.max(0, initialHp)));

      setAc(token.ac !== undefined ? token.ac : 14);
      setSize(token.size || 1);
      setIsHidden(Boolean(token.isHidden));
      setIsLocked(Boolean(token.isLocked));
      setGmNotes(token.gmNotes || "");

      setShowHp(token.showHp !== false);
      setShowConditions(token.showConditions !== false);
      setShowAc(token.showAc !== false);
      setShowNotes(Boolean(token.showNotes));

      setAllowPlayerHp(token.allowPlayerHp !== false);
      setAllowPlayerConditions(token.allowPlayerConditions !== false);
      setAllowPlayerAc(token.allowPlayerAc !== false);
      setAllowPlayerSize(token.allowPlayerSize !== false);

      setSelectedConditions(Array.isArray(token.conditions) ? token.conditions : []);
      setShowAddConditionPicker(false);
      setShowPresetPicker(false);
      setUploadError("");
    }
  }, [token, isEditing]);

  if (!isEditing || !token) return null;

  const handleHpChange = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setHp(0);
    } else {
      setHp(Math.max(0, Math.min(maxHp, num)));
    }
  };

  const handleMaxHpChange = (val) => {
    const newMax = Math.max(1, parseInt(val, 10) || 1);
    setMaxHp(newMax);
    if (hp > newMax) {
      setHp(newMax);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
      setUploadError("فرمت SVG به دلایل امنیتی مجاز نیست. لطفاً PNG، JPG یا WEBP آپلود کنید.");
      return;
    }

    if (file.size > MAX_TOKEN_FILE_SIZE) {
      setUploadError("حجم تصویر توکن نمی‌تواند بیشتر از ۳ مگابایت باشد.");
      return;
    }

    setUploadError("");
    setIsUploading(true);

    try {
      const res = await assetApi.uploadAsset(file, name || "TOKEN", "TOKEN");
      const uploadedUrl = res.fileUrl || res.url || res.data?.fileUrl || "";

      if (uploadedUrl) {
        setAvatarUrl(uploadedUrl);
        uiAudio.playTokenDrop();
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[TokenEditor] Upload error:", err);
      }
      setUploadError("آپلود تصویر با خطا مواجه شد.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!canEditBasic) return;

    const finalName = name.trim() || token.label || token.name || "توکن کاراکتر";
    const finalAvatar = avatarUrl.trim() || "";
    const finalHp = Math.min(maxHp, Math.max(0, hp));

    const updated = {
      name: finalName,
      label: finalName,
      avatarUrl: finalAvatar,
      assetUrl: finalAvatar,
      ...(isGM || allowPlayerHp ? { hp: finalHp, maxHp } : {}),
      ...(isGM || allowPlayerAc ? { ac } : {}),
      ...(isGM || allowPlayerSize ? { size } : {}),
      ...(isGM || allowPlayerConditions ? { conditions: selectedConditions } : {}),
      showHp: isGM ? showHp : token.showHp,
      showConditions: isGM ? showConditions : token.showConditions,
      showAc: isGM ? showAc : token.showAc,
      showNotes: isGM ? showNotes : token.showNotes,
      allowPlayerHp: isGM ? allowPlayerHp : token.allowPlayerHp,
      allowPlayerConditions: isGM ? allowPlayerConditions : token.allowPlayerConditions,
      allowPlayerAc: isGM ? allowPlayerAc : token.allowPlayerAc,
      allowPlayerSize: isGM ? allowPlayerSize : token.allowPlayerSize,
      ...(isGM
          ? {
            isHidden,
            isLocked,
            gmNotes,
          }
          : {}),
    };

    updateToken(token.id, updated);
    uiAudio.playTokenDrop();

    wsService.send(WS_EVENTS.TOKEN_MOVED || "TOKEN_MOVE", {
      tokenId: String(token.id),
      id: String(token.id),
      ...updated,
    });
    closeEditor();
  };

  const handleDelete = () => {
    if (!isGM) return;
    removeToken(token.id);
    wsService.send(WS_EVENTS.TOKEN_MOVED || "TOKEN_MOVE", { tokenId: String(token.id), isDeleted: true });
    closeEditor();
  };

  const handleApplyDamage = () => {
    const amount = parseInt(calcInput, 10);
    if (isNaN(amount) || amount <= 0) return;
    setHp((prev) => Math.max(0, prev - amount));
    setCalcInput("");
    uiAudio.playTokenDrop();
  };

  const handleApplyHeal = () => {
    const amount = parseInt(calcInput, 10);
    if (isNaN(amount) || amount <= 0) return;
    setHp((prev) => Math.min(maxHp, prev + amount));
    setCalcInput("");
    uiAudio.playTokenDrop();
  };

  const handleToggleSelectCondition = (condId) => {
    if (selectedConditions.includes(condId)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== condId));
    } else {
      if (selectedConditions.length >= 3) {
        alert("حداکثر می‌توانید ۳ وضعیت فعال را به صورت همزمان برای هر توکن انتخاب کنید.");
        return;
      }
      setSelectedConditions([...selectedConditions, condId]);
    }
    uiAudio.playTokenDrop();
  };

  const handleAddConditionToPool = (condId) => {
    if (isGM && addAvailableCondition) {
      addAvailableCondition(condId);
    }
    setShowAddConditionPicker(false);
  };

  const handleRemoveConditionFromPool = (e, condId) => {
    e.stopPropagation();
    if (!isGM) return;
    if (removeAvailableCondition) {
      removeAvailableCondition(condId);
    }
    setSelectedConditions((prev) => prev.filter((c) => c !== condId));
  };

  const hasValidAvatar = isValidImageUrl(avatarUrl);
  const hpPercentage = Math.round((hp / (maxHp || 1)) * 100);

  return (
      <Modal
          isOpen={isEditing}
          onClose={closeEditor}
          title={isProp ? "تنظیمات شیء / پراپ" : "تنظیمات مشخصات و وضعیت توکن"}
          titleFa={isProp ? "Object Properties" : "Token Properties & Conditions"}
          maxWidth="lg"
      >
        <div
            className="space-y-4 max-h-[82vh] overflow-y-auto px-1 font-fa text-zinc-200 select-none animate-fade-in-up"
            dir="rtl"
        >
          <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800/90 shadow-lg space-y-3.5 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-zinc-900 shrink-0 shadow-inner flex items-center justify-center group">
                {hasValidAvatar ? (
                    <img
                        src={getFullAssetUrl(avatarUrl)}
                        alt={name ? `تصویر توکن ${name}` : "تصویر توکن کاراکتر"}
                        className="w-full h-full object-cover"
                        onError={() => setAvatarUrl("")}
                    />
                ) : (
                    <User className="w-10 h-10 text-zinc-600" />
                )}
                {isUploading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-xs text-amber-400 font-bold">
                      در حال آپلود...
                    </div>
                )}
              </div>

              <div className="flex-1 space-y-2.5">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    {isProp ? "نام شیء:" : "نام کاراکتر:"}
                  </label>
                  <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="نام توکن..."
                      className="w-full h-10 px-3.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                  />
                  <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-700 text-zinc-300 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:border-amber-500/50 active:scale-95"
                  >
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>{isUploading ? "درحال آپلود..." : "آپلود تصویر (تا ۳MB)"}</span>
                  </button>

                  <button
                      type="button"
                      onClick={() => setShowPresetPicker(!showPresetPicker)}
                      className="py-2 px-4 bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-700 text-zinc-300 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:border-amber-500/50 active:scale-95"
                  >
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>آیکون‌های آماده</span>
                  </button>
                </div>
              </div>
            </div>

            {uploadError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl animate-shake-subtle">
                  {uploadError}
                </div>
            )}

            {showPresetPicker && (
                <div className="p-3.5 bg-zinc-900/95 rounded-2xl border border-amber-500/50 space-y-2.5 animate-fade-in-up shadow-xl">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-bold border-b border-zinc-800 pb-2">
                    <span>انتخاب آیکون آماده فانتزی:</span>
                    <button
                        type="button"
                        onClick={() => setShowPresetPicker(false)}
                        className="text-zinc-400 hover:text-zinc-200 cursor-pointer p-1 rounded-lg hover:bg-zinc-800 active:scale-90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {PRESET_TOKEN_ICONS.map((preset) => (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setAvatarUrl(preset.url);
                              setShowPresetPicker(false);
                              uiAudio.playTokenDrop();
                            }}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                                avatarUrl === preset.url
                                    ? "border-amber-500 bg-amber-500/20 shadow-md shadow-amber-500/20 scale-105"
                                    : "border-zinc-800 bg-zinc-950/80 hover:border-zinc-700 hover:bg-zinc-900"
                            }`}
                        >
                          <img
                              src={preset.url}
                              alt={preset.label ? `آیکون آماده ${preset.label}` : "آیکون کاراکتر"}
                              className="w-11 h-11 rounded-full object-cover bg-zinc-800 shadow"
                              loading="lazy"
                          />
                          <span className="text-[10px] text-zinc-300 truncate w-full text-center font-medium">
                      {preset.label}
                    </span>
                        </button>
                    ))}
                  </div>
                </div>
            )}

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">یا آدرس مستقیم لینک تصویر:</label>
              <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://... یا /uploads/..."
                  className="w-full h-8 px-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500 font-mono"
                  dir="ltr"
              />
            </div>
          </div>

          {!isProp && (isGM || allowPlayerHp) && (
              <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800/90 shadow-lg space-y-3.5">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-100">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <Heart className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span>نوار سلامتی (HP)</span>
                  </div>

                  {isGM && (
                      <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setAllowPlayerHp(!allowPlayerHp)}
                            className={`text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-medium transition-all cursor-pointer active:scale-95 ${
                                allowPlayerHp
                                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10"
                                    : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                            }`}
                        >
                          <Key className="w-3 h-3 text-amber-400" />
                          <span>{allowPlayerHp ? "دسترسی پلیر: فعال" : "دسترسی پلیر: قفل"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowHp(!showHp)}
                            className={`text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-medium transition-all cursor-pointer active:scale-95 ${
                                showHp
                                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                                    : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                            }`}
                        >
                          <Eye className="w-3 h-3 text-emerald-400" />
                          <span>{showHp ? "نمایش روی توکن" : "مخفی از توکن"}</span>
                        </button>
                      </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-zinc-400 font-medium">HP فعلی:</label>
                      <span className="text-[10px] text-zinc-500 font-mono">{hpPercentage}%</span>
                    </div>
                    <input
                        type="number"
                        min={0}
                        max={maxHp}
                        value={hp}
                        onChange={(e) => handleHpChange(e.target.value)}
                        className="w-full h-9 px-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1">حداکثر Max HP:</label>
                    <input
                        type="number"
                        min={1}
                        value={maxHp}
                        onChange={(e) => handleMaxHpChange(e.target.value)}
                        className="w-full h-9 px-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 shadow-inner"
                    />
                  </div>
                </div>

                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                  <div
                      className={`h-full rounded-full transition-all duration-300 ${
                          hpPercentage > 50
                              ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                              : hpPercentage > 20
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, hpPercentage))}%` }}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                      type="number"
                      placeholder="مقدار..."
                      value={calcInput}
                      onChange={(e) => setCalcInput(e.target.value)}
                      className="w-28 h-8 px-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-500"
                  />
                  <button
                      type="button"
                      onClick={handleApplyDamage}
                      className="flex-1 py-1 text-xs bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded-xl hover:bg-rose-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-medium active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5" /> اعمال آسیب
                  </button>
                  <button
                      type="button"
                      onClick={handleApplyHeal}
                      className="flex-1 py-1 text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-medium active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> اعمال شفا
                  </button>
                </div>
              </div>
          )}

          {!isProp && (isGM || allowPlayerConditions) && (
              <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800/90 shadow-lg space-y-3.5">
                <div className="flex flex-col gap-2.5 border-b border-zinc-900 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-100">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <span>فهرست وضعیت‌ها</span>
                      <span className="text-[10px] text-zinc-500 font-normal">(حداکثر ۳ مورد همزمان)</span>
                    </div>

                    {isGM && (
                        <button
                            type="button"
                            onClick={() => setShowAddConditionPicker(!showAddConditionPicker)}
                            className="text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold cursor-pointer transition-all shadow-md shadow-amber-500/20 active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> افزودن به فهرست
                        </button>
                    )}
                  </div>

                  {isGM && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setAllowPlayerConditions(!allowPlayerConditions)}
                            className={`text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-medium transition-all cursor-pointer active:scale-95 ${
                                allowPlayerConditions
                                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                    : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                            }`}
                        >
                          <Key className="w-3 h-3 text-amber-400" />
                          <span>{allowPlayerConditions ? "دسترسی پلیر: فعال" : "دسترسی پلیر: قفل"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowConditions(!showConditions)}
                            className={`text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-medium transition-all cursor-pointer active:scale-95 ${
                                showConditions
                                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                    : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                            }`}
                        >
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>{showConditions ? "نمایش روی توکن" : "مخفی از توکن"}</span>
                        </button>
                      </div>
                  )}
                </div>

                {showAddConditionPicker && isGM && (
                    <div className="p-3.5 bg-zinc-900/95 rounded-2xl border border-amber-500/50 space-y-2.5 animate-fade-in-up shadow-xl">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-400 pb-2 border-b border-zinc-800">
                        <span>انتخاب وضعیت برای افزودن به بازی:</span>
                        <button
                            type="button"
                            onClick={() => setShowAddConditionPicker(false)}
                            className="text-zinc-400 hover:text-zinc-200 cursor-pointer p-1 rounded-lg hover:bg-zinc-800 active:scale-90"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                        {ALL_DND_CONDITIONS.map((cond) => {
                          const isAlreadyInPool = availableConditions.includes(cond.id);
                          return (
                              <button
                                  key={cond.id}
                                  type="button"
                                  disabled={isAlreadyInPool}
                                  onClick={() => handleAddConditionToPool(cond.id)}
                                  className={`p-2.5 rounded-xl text-right text-xs flex items-center justify-between transition-all ${
                                      isAlreadyInPool
                                          ? "bg-zinc-950/50 text-zinc-600 border border-transparent cursor-not-allowed opacity-50"
                                          : "bg-zinc-950 border border-zinc-800 hover:border-amber-500 hover:bg-zinc-850 text-zinc-200 cursor-pointer shadow-sm active:scale-95"
                                  }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-lg">{cond.icon}</span>
                                  <div className="flex flex-col truncate">
                                    <span className="text-xs font-semibold">{cond.nameFa}</span>
                                    <span className="text-[10px] text-zinc-500 font-mono">{cond.nameEn}</span>
                                  </div>
                                </div>
                                {isAlreadyInPool && <span className="text-[10px] text-zinc-500 font-bold">در لیست</span>}
                              </button>
                          );
                        })}
                      </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {availableConditions.length === 0 ? (
                      <div className="col-span-2 text-center py-6 text-xs text-zinc-500 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800/80">
                        {isGM
                            ? "فهرست وضعیت‌ها خالی است. از دکمه «افزودن به فهرست» استفاده کنید."
                            : "هیچ وضعیتی توسط GM برای این بازی تعریف نشده است."}
                      </div>
                  ) : (
                      availableConditions.map((condId) => {
                        const condDef = ALL_DND_CONDITIONS.find((c) => c.id === condId) || {
                          nameFa: condId,
                          nameEn: "",
                          icon: "⚡",
                        };
                        const isSelected = selectedConditions.includes(condId);

                        return (
                            <div
                                key={condId}
                                onClick={() => handleToggleSelectCondition(condId)}
                                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer shadow-sm active:scale-[0.98] ${
                                    isSelected
                                        ? "bg-amber-500/15 border-amber-400 text-amber-300 font-bold shadow-amber-500/10 ring-1 ring-amber-500/30"
                                        : "bg-zinc-900/70 border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300"
                                }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <span className="text-lg shrink-0">{condDef.icon}</span>
                                <div className="flex flex-col truncate">
                                  <span className="text-xs truncate font-medium">{condDef.nameFa}</span>
                                  {condDef.nameEn && (
                                      <span className="text-[10px] text-zinc-500 font-mono truncate">
                              {condDef.nameEn}
                            </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isSelected && (
                                    <span className="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center text-[10px] shadow">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                                )}
                                {isGM && (
                                    <button
                                        type="button"
                                        onClick={(e) => handleRemoveConditionFromPool(e, condId)}
                                        className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer transition-colors active:scale-90"
                                        title="حذف از فهرست بازی"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                              </div>
                            </div>
                        );
                      })
                  )}
                </div>
              </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {!isProp && (isGM || allowPlayerAc) && (
                <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800/90 shadow-lg space-y-2.5">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                      <span>زره (AC):</span>
                    </label>
                    {isGM && (
                        <div className="flex items-center gap-1.5">
                          <button
                              type="button"
                              onClick={() => setAllowPlayerAc(!allowPlayerAc)}
                              className={`text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium transition-all cursor-pointer active:scale-95 ${
                                  allowPlayerAc
                                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                      : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                              }`}
                          >
                            <Key className="w-2.5 h-2.5 text-amber-400" />
                            <span>{allowPlayerAc ? "دسترسی" : "قفل"}</span>
                          </button>
                          <button
                              type="button"
                              onClick={() => setShowAc(!showAc)}
                              className={`text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium transition-all cursor-pointer active:scale-95 ${
                                  showAc
                                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                      : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                              }`}
                          >
                            <Eye className="w-2.5 h-2.5 text-blue-400" />
                            <span>{showAc ? "نمایش" : "مخفی"}</span>
                          </button>
                        </div>
                    )}
                  </div>
                  <input
                      type="number"
                      value={ac}
                      onChange={(e) => setAc(Number(e.target.value))}
                      className="w-full h-9 px-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs font-mono font-bold text-blue-400 focus:outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>
            )}

            {(isGM || allowPlayerSize) && (
                <div
                    className={`p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800/90 shadow-lg space-y-2.5 ${
                        isProp || (!allowPlayerAc && !isGM) ? "col-span-2" : ""
                    }`}
                >
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>اندازه در گرید:</span>
                    </label>
                    {isGM && (
                        <button
                            type="button"
                            onClick={() => setAllowPlayerSize(!allowPlayerSize)}
                            className={`text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 font-medium transition-all cursor-pointer active:scale-95 ${
                                allowPlayerSize
                                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                    : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                            }`}
                        >
                          <Key className="w-2.5 h-2.5 text-amber-400" />
                          <span>{allowPlayerSize ? "دسترسی: فعال" : "دسترسی: قفل"}</span>
                        </button>
                    )}
                  </div>
                  <select
                      value={size}
                      onChange={(e) => setSize(Number(e.target.value))}
                      className="w-full h-9 px-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer shadow-inner"
                  >
                    <option value={0.5}>0.5x0.5 (Tiny / Prop)</option>
                    <option value={1}>1x1 (Medium)</option>
                    <option value={2}>2x2 (Large)</option>
                    <option value={3}>3x3 (Huge)</option>
                    <option value={4}>4x4 (Gargantuan)</option>
                  </select>
                </div>
            )}
          </div>

          {isGM && (
              <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800/90 shadow-lg space-y-2.5">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400/90">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>یادداشت محرمانه GM (مخصوص مدیر):</span>
                  </div>

                  <button
                      type="button"
                      onClick={() => setShowNotes(!showNotes)}
                      className={`text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-medium transition-all cursor-pointer active:scale-95 ${
                          showNotes
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10"
                              : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                      }`}
                      title="نمایش یادداشت روی توکن در صفحه بازی"
                  >
                    <Eye className="w-3 h-3 text-amber-400" />
                    <span>{showNotes ? "نمایش روی توکن" : "مخفی از توکن"}</span>
                  </button>
                </div>

                <textarea
                    rows={2}
                    value={gmNotes}
                    onChange={(e) => setGmNotes(e.target.value)}
                    placeholder="توضیحات مخفی، معما، تله یا لوت این مورد..."
                    className="w-full p-3 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 shadow-inner resize-none"
                />
              </div>
          )}

          <div className="pt-3.5 flex items-center justify-between border-t border-zinc-800/80">
            {isGM && (
                <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-rose-500/20 hover:border-rose-500/40 active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف توکن
                </button>
            )}

            <div className="flex gap-2.5 mr-auto">
              <Button variant="ghost" onClick={closeEditor} className="active:scale-95">
                انصراف
              </Button>
              <Button variant="amber" onClick={handleSave} className="active:scale-95">
                ذخیره تغییرات
              </Button>
            </div>
          </div>
        </div>
      </Modal>
  );
});

TokenEditorModal.displayName = "TokenEditorModal";
export default TokenEditorModal;
