import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import {
  Image as ImageIcon,
  X,
  Upload,
  Search,
  MapPin,
  Lock,
  Sparkles,
  Link as LinkIcon,
  Trash2,
} from "lucide-react";
import { useCanvasStore } from "../../stores/canvas.store";
import { useSceneStore } from "../../stores/scene.store";
import { useAuthStore } from "../../stores/auth.store";
import { assetApi, getAssetUrl } from "../../api/asset.api";
import { MAP_PRESETS } from "../../constants/mapPresets";
import { TOKEN_PRESETS } from "../../constants/tokenPresets";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";
import { uiAudio } from "../../utils/uiAudio";

const SIZE_LIMITS = Object.freeze({
  maps: { bytes: 15 * 1024 * 1024, label: "۱۵ مگابایت", type: "MAP" },
  tokens: { bytes: 3 * 1024 * 1024, label: "۳ مگابایت", type: "TOKEN" },
});

const isValidUUID = (uuid) => {
  if (!uuid || typeof uuid !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid.trim());
};

const resolveAssetUrl = (asset) => {
  if (!asset) return "";
  if (typeof asset === "string") return getAssetUrl(asset);
  const raw =
      asset.avatarUrl ||
      asset.assetUrl ||
      asset.url ||
      asset.fileUrl ||
      asset.thumbnailUrl ||
      asset.filePath ||
      asset.path ||
      "";
  return getAssetUrl(raw);
};

export const AssetMenu = memo(({ isGM = false, permissions = {} }) => {
  const isAssetOpen = useCanvasStore((state) => state.isAssetMenuOpen);
  const toggleMenu = useCanvasStore((state) => state.toggleMenu);

  const currentUser = useAuthStore((state) => state.user);
  const currentScene = useSceneStore((state) => state.currentScene);
  const setMapForCurrentScene = useSceneStore((state) => state.setMapForCurrentScene);
  const addToken = useSceneStore((state) => state.addToken);

  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("maps");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [userAssets, setUserAssets] = useState([]);
  const [uploadError, setUploadError] = useState("");

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [assetUrlInput, setAssetUrlInput] = useState("");
  const [assetNameInput, setAssetNameInput] = useState("");

  const hasActiveMap = Boolean(currentScene?.assetUrl || currentScene?.mapUrl);
  const canAccessAssets = isGM || permissions?.canAssets === true;
  const canUploadMap = isGM || permissions?.canScene === true || permissions?.canMap === true;

  const loadAssets = useCallback(async (isMounted) => {
    try {
      const typeParam = SIZE_LIMITS[activeTab]?.type || "TOKEN";
      const data = await assetApi.getAssets(typeParam);
      if (isMounted) setUserAssets(data || []);
    } catch {
      if (isMounted) setUserAssets([]);
    }
  }, [activeTab]);

  useEffect(() => {
    let isMounted = true;
    if (isAssetOpen && canAccessAssets) {
      loadAssets(isMounted);
    }
    return () => {
      isMounted = false;
    };
  }, [isAssetOpen, activeTab, canAccessAssets, loadAssets]);

  const handleSelectMap = useCallback(async (rawMapUrl, assetId = null) => {
    if (!canUploadMap) return;

    const fullMapUrl = getAssetUrl(rawMapUrl);
    const validAssetId = isValidUUID(assetId) ? assetId : null;

    toggleMenu("asset");
    await setMapForCurrentScene(fullMapUrl, validAssetId);
  }, [canUploadMap, toggleMenu, setMapForCurrentScene]);

  const handleAddToken = useCallback((rawTokenUrl, tokenName, extraData = {}) => {
    if (!hasActiveMap) return;

    const fullUrl = getAssetUrl(rawTokenUrl);
    const validAssetId = isValidUUID(extraData.id) ? extraData.id : null;
    const ownerId = currentUser?.id ? String(currentUser.id) : null;

    const newToken = {
      name: tokenName || "توکن جدید",
      label: tokenName || "توکن جدید",
      avatarUrl: fullUrl,
      assetUrl: fullUrl,
      assetId: validAssetId,
      x: (currentScene?.mapWidth || 2000) / 2,
      y: (currentScene?.mapHeight || 1500) / 2,
      size: extraData.size || 1,
      hp: extraData.hp || extraData.maxHp || 20,
      maxHp: extraData.maxHp || 20,
      ac: extraData.ac || 12,
      isProp: false,
      goldValue: extraData.goldValue || 0,
      xpValue: extraData.xpValue || 0,
      controlledBy: ownerId,
    };

    addToken(newToken);
    uiAudio.playTokenDrop();
  }, [hasActiveMap, currentUser?.id, currentScene?.mapWidth, currentScene?.mapHeight, addToken]);

  const handleDirectUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
      setUploadError("فرمت SVG به دلایل امنیتی مجاز نیست. لطفاً PNG، JPG یا WEBP آپلود کنید.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const currentLimit = SIZE_LIMITS[activeTab];
    if (file.size > currentLimit.bytes) {
      setUploadError(`حجم فایل بیشتر از حد مجاز است (حداکثر ${currentLimit.label})`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const assetName = file.name.replace(/\.[^/.]+$/, "");
      const uploaded = await assetApi.uploadAsset(file, assetName, currentLimit.type, { dpi: 150 });
      const uploadedUrl = uploaded.fileUrl || uploaded.url || uploaded.assetUrl || "";

      if (activeTab === "maps") {
        await handleSelectMap(uploadedUrl, uploaded.id);
      } else {
        handleAddToken(uploadedUrl, uploaded.name, uploaded);
        loadAssets(true);
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || "خطا در آپلود فایل. لطفاً مجدداً امتحان کنید.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddFromUrl = async (e) => {
    e.preventDefault();
    if (!assetUrlInput.trim()) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const currentLimit = SIZE_LIMITS[activeTab];
      const name =
          assetNameInput.trim() ||
          (activeTab === "maps" ? "نقشه اینترنتی" : "توکن اینترنتی");
      const created = await assetApi.createAssetFromUrl(assetUrlInput.trim(), name, currentLimit.type);
      const createdUrl = created.fileUrl || created.url || created.assetUrl || "";

      setAssetUrlInput("");
      setAssetNameInput("");
      setShowUrlInput(false);

      if (activeTab === "maps") {
        await handleSelectMap(createdUrl, created.id);
      } else {
        handleAddToken(createdUrl, created.name, created);
        loadAssets(true);
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || "خطا در افزودن منبع از طریق لینک.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAsset = async (e, assetId) => {
    e.stopPropagation();
    try {
      await assetApi.deleteAsset(assetId);
      loadAssets(true);
    } catch {
      setUploadError("خطا در حذف منبع.");
    }
  };

  const filteredPresets = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (activeTab === "maps") {
      return (MAP_PRESETS || []).filter(
          (m) =>
              (m.name || "").toLowerCase().includes(q) ||
              (m.nameFa || "").includes(searchQuery)
      );
    }
    return (TOKEN_PRESETS || []).filter(
        (t) =>
            t.category !== "props" &&
            ((t.name || "").toLowerCase().includes(q) ||
                (t.nameFa || "").includes(searchQuery))
    );
  }, [activeTab, searchQuery]);

  const filteredUserAssets = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return userAssets.filter((a) => (a.name || "").toLowerCase().includes(q));
  }, [userAssets, searchQuery]);

  if (!isAssetOpen) return null;

  if (!canAccessAssets) {
    return (
        <>
          <div
              className="sm:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-xs"
              onClick={() => toggleMenu("asset")}
              aria-hidden="true"
          />
          <div
              className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:top-16 sm:right-6 sm:inset-x-auto z-50 w-full sm:w-80 glass-card border-t sm:border border-zinc-800 rounded-t-[2rem] sm:rounded-3xl shadow-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-5 text-zinc-100 font-fa select-none text-center animate-sheet-up sm:animate-fade-in-up"
              dir="rtl"
              onWheel={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden w-10 h-1.5 rounded-full bg-zinc-700/80 mx-auto -mt-2 mb-4" aria-hidden="true" />
            <div className="w-10 h-10 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-zinc-100">دسترسی محدود است</h4>
            <p className="text-xs text-zinc-400 mt-1">
              تنها گیم‌مستر یا بازیکنان دارای پرمیشن مجاز به استفاده از کتابخانه منابع هستند.
            </p>
            <Button
                size="sm"
                variant="secondary"
                className="mt-4 w-full h-10 text-xs font-bold active:scale-95"
                onClick={() => toggleMenu("asset")}
            >
              بستن
            </Button>
          </div>
        </>
    );
  }

  return (
      <>
        <div
            className="sm:hidden fixed inset-0 z-40 bg-black/75 backdrop-blur-xs"
            onClick={() => toggleMenu("asset")}
            aria-hidden="true"
        />

        <div
            role="dialog"
            aria-label="کتابخانه منابع"
            className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:top-16 sm:right-6 sm:inset-x-auto z-50 w-full sm:w-[460px] sm:max-w-[95vw] glass-card border-t sm:border border-zinc-800 rounded-t-[2rem] sm:rounded-3xl shadow-2xl p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-4 text-zinc-100 font-fa select-none animate-sheet-up sm:animate-fade-in-up max-h-[86dvh] sm:max-h-[82vh] flex flex-col"
            dir="rtl"
            onWheel={(e) => e.stopPropagation()}
        >
          <div className="sm:hidden w-10 h-1.5 rounded-full bg-zinc-700/80 mx-auto -mt-1 mb-2.5 shrink-0" aria-hidden="true" />

          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ImageIcon className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold">کتابخانه منابع (Asset Library)</h4>
                <p className="text-[10px] sm:text-[11px] text-zinc-400">مدیریت نقشه‌ها و توکن‌ها</p>
              </div>
            </div>
            <button
                type="button"
                onClick={() => toggleMenu("asset")}
                aria-label="بستن کتابخانه منابع"
                className="w-9 h-9 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 active:scale-90 cursor-pointer transition-all shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 my-3 shrink-0">
            {[
              { id: "maps", label: "نقشه‌ها", icon: MapPin },
              { id: "tokens", label: "توکن‌ها", icon: Sparkles },
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                  <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setShowUrlInput(false);
                        setUploadError("");
                      }}
                      className={cn(
                          "flex items-center justify-center gap-1.5 min-h-[38px] py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer active:scale-95",
                          activeTab === tab.id
                              ? "bg-amber-500 text-zinc-950 shadow-md font-black"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                      )}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 mb-3 shrink-0">
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو..."
                  className="w-full h-9.5 pl-3 pr-8 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleDirectUpload}
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
            />

            <Button
                size="sm"
                variant="secondary"
                className="h-9.5 w-9.5 p-0 text-xs font-bold shrink-0 cursor-pointer rounded-xl active:scale-90 flex items-center justify-center"
                onClick={() => setShowUrlInput(!showUrlInput)}
                title="افزودن با لینک وب"
                aria-label="افزودن منبع با لینک اینترنتی"
            >
              <LinkIcon className="w-4 h-4 text-amber-400" />
            </Button>

            <Button
                size="sm"
                variant="amber"
                className="h-9.5 px-3 text-xs font-bold shrink-0 cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploading}
                disabled={activeTab === "maps" && !canUploadMap}
            >
              <Upload className="w-3.5 h-3.5 ml-1" />
              <span>آپلود {activeTab === "maps" ? "نقشه" : "توکن"}</span>
            </Button>
          </div>

          {showUrlInput && (
              <form
                  onSubmit={handleAddFromUrl}
                  className="p-3 mb-3 bg-zinc-950/80 border border-amber-500/30 rounded-2xl space-y-2 animate-fade-in-up shrink-0"
              >
                <div className="text-[11px] font-bold text-amber-400">افزودن از وب (لینک مستقیم):</div>
                <input
                    type="url"
                    required
                    value={assetUrlInput}
                    onChange={(e) => setAssetUrlInput(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="w-full h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-500 text-left"
                    dir="ltr"
                />
                <div className="flex gap-2">
                  <input
                      type="text"
                      value={assetNameInput}
                      onChange={(e) => setAssetNameInput(e.target.value)}
                      placeholder="نام دلخواه"
                      className="flex-1 h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                  <Button size="sm" variant="amber" type="submit" isLoading={isUploading} className="h-9 text-xs font-bold active:scale-95">
                    ثبت لینک
                  </Button>
                </div>
              </form>
          )}

          {uploadError && (
              <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[11px] text-rose-400 text-center font-bold shrink-0 animate-shake-subtle">
                {uploadError}
              </div>
          )}

          <div
              className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3"
              style={{ WebkitOverflowScrolling: "touch" }}
          >
            {activeTab === "maps" && (
                <div className="animate-fade-in-up">
                  <span className="text-[11px] font-bold text-zinc-400 mb-2 block">نقشه‌های پیش‌فرض سیستم:</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {filteredPresets.map((map) => (
                        <div
                            key={map.id}
                            onClick={() => canUploadMap && handleSelectMap(resolveAssetUrl(map), map.id)}
                            className={cn(
                                "group relative rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950 transition-all duration-200",
                                canUploadMap
                                    ? "hover:border-amber-500 cursor-pointer hover:-translate-y-0.5 shadow-sm active:scale-[0.98]"
                                    : "opacity-60 cursor-not-allowed"
                            )}
                        >
                          <img
                              src={resolveAssetUrl(map)}
                              alt={map.nameFa ? `نقشه بازی ${map.nameFa}` : `نقشه بازی ${map.name}`}
                              crossOrigin="anonymous"
                              className="w-full h-24 object-cover group-hover:brightness-105 transition-all"
                              loading="lazy"
                          />
                          <div className="p-2 bg-zinc-900/90 flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-zinc-200 truncate">{map.nameFa || map.name}</span>
                            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
            )}

            {activeTab === "tokens" && (
                <div className="animate-fade-in-up">
                  <span className="text-[11px] font-bold text-zinc-400 mb-2 block">
                    {!hasActiveMap
                        ? "ابتدا نقشه را انتخاب کنید تا بتوانید توکن اضافه نمایید."
                        : "برای افزودن، روی توکن کلیک یا لمس کنید:"}
                  </span>
                  <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                    {filteredPresets.map((token) => (
                        <div
                            key={token.id}
                            onClick={() => handleAddToken(resolveAssetUrl(token), token.nameFa || token.name, token)}
                            className={cn(
                                "group p-2.5 rounded-2xl border border-zinc-800 bg-zinc-950 transition-all duration-150 flex flex-col items-center gap-1.5 active:scale-95",
                                !hasActiveMap
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:border-amber-500 cursor-pointer hover:bg-zinc-900"
                            )}
                        >
                          <img
                              src={resolveAssetUrl(token)}
                              alt={token.nameFa ? `توکن کاراکتر ${token.nameFa}` : `توکن کاراکتر ${token.name}`}
                              crossOrigin="anonymous"
                              className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/40 shadow-md group-hover:border-amber-400 transition-all"
                              loading="lazy"
                          />
                          <span className="text-[11px] font-bold text-zinc-300 truncate max-w-full">
                            {token.nameFa || token.name}
                          </span>
                        </div>
                    ))}
                  </div>
                </div>
            )}

            {filteredUserAssets.length > 0 && (
                <div className="pt-3 border-t border-zinc-800/80 animate-fade-in-up">
                  <span className="text-[11px] font-bold text-amber-400/90 mb-2 block">
                    فایل‌های شخصی شما:
                  </span>
                  <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                    {filteredUserAssets.map((asset) => {
                      const itemUrl = resolveAssetUrl(asset);
                      return (
                          <div
                              key={asset.id}
                              onClick={() => {
                                if (asset.type === "MAP" && canUploadMap) {
                                  handleSelectMap(itemUrl, asset.id);
                                } else if (hasActiveMap) {
                                  handleAddToken(itemUrl, asset.name, asset);
                                }
                              }}
                              className={cn(
                                  "group relative p-2.5 rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col items-center gap-1.5 transition-all active:scale-95",
                                  !hasActiveMap && asset.type !== "MAP"
                                      ? "opacity-40 cursor-not-allowed"
                                      : "hover:border-amber-500 cursor-pointer hover:bg-zinc-900"
                              )}
                          >
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center border border-zinc-800 relative">
                              <img
                                  src={itemUrl}
                                  alt={asset.name ? `منبع آپلودشده ${asset.name}` : "تصویر منبع کاربر"}
                                  crossOrigin="anonymous"
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    if (e.currentTarget.nextElementSibling) {
                                      e.currentTarget.nextElementSibling.classList.remove("hidden");
                                    }
                                  }}
                              />
                              <ImageIcon className="w-5 h-5 text-zinc-600 hidden" />
                            </div>

                            <span className="text-[10px] font-medium text-zinc-300 truncate max-w-full text-center">
                              {asset.name}
                            </span>

                            {/* دکمه حذف در موبایل همیشه نمایان است و در دسکتاپ با هاور ظاهر می‌شود */}
                            <button
                                type="button"
                                onClick={(e) => handleDeleteAsset(e, asset.id)}
                                aria-label={`حذف ${asset.name}`}
                                className="absolute top-1.5 right-1.5 w-6 h-6 sm:w-5.5 sm:h-5.5 bg-rose-600/95 hover:bg-rose-500 text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer shadow-md active:scale-90"
                                title="حذف"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                      );
                    })}
                  </div>
                </div>
            )}
          </div>
        </div>
      </>
  );
});

AssetMenu.displayName = "AssetMenu";
export default AssetMenu;