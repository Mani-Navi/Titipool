import React, { useState, useEffect, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sparkles,
  Scroll,
  Box,
  Eye,
  EyeOff,
  FileText,
  CheckCircle2,
  MousePointerClick,
  Image as ImageIcon,
} from "lucide-react";
import { Modal } from "../ui/Modal.jsx";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { roomApi } from "../../api/room.api";

const createRoomSchema = z.object({
  name: z
      .string()
      .min(2, "نام اتاق باید حداقل ۲ حرف باشد")
      .max(100, "نام اتاق نمی‌تواند بیشتر از ۱۰۰ حرف باشد"),
  description: z.string().max(500, "توضیحات اتاق نمی‌تواند بیشتر از ۵۰۰ حرف باشد").optional(),
  password: z.string().max(30, "رمز عبور حداکثر ۳۰ کاراکتر است").optional(),
});

export const CreateRoomModal = memo(({ isOpen, onClose, onCreate }) => {
  const [tab, setTab] = useState("blank");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
      description: "",
      password: "",
    },
  });

  const nameValue = watch("name") || "";
  const descValue = watch("description") || "";

  useEffect(() => {
    let isMounted = true;
    if (isOpen && tab === "template" && templates.length === 0) {
      setIsLoadingTemplates(true);
      roomApi
          .getTemplates()
          .then((data) => {
            if (isMounted) setTemplates(data);
          })
          .catch((err) => {
            if (import.meta.env.DEV) {
              console.warn("[CreateRoomModal] Failed to fetch templates:", err);
            }
          })
          .finally(() => {
            if (isMounted) setIsLoadingTemplates(false);
          });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, tab, templates.length]);

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setValue("name", tpl.title || "");
    setValue("description", tpl.description || "");
  };

  const handleSwitchTab = (newTab) => {
    setTab(newTab);
    setServerError("");
    setSelectedTemplate(null);
    setValue("name", "");
    setValue("description", "");
    setValue("password", "");
  };

  const handleClose = () => {
    reset();
    setSelectedTemplate(null);
    setShowPassword(false);
    setServerError("");
    setTab("blank");
    onClose();
  };

  const onSubmit = async (data) => {
    setServerError("");
    try {
      const payload = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        password: data.password?.trim() || null,
        templateId: tab === "template" ? selectedTemplate?.id : null,
      };
      await onCreate(payload);
      handleClose();
    } catch (err) {
      if (err.response?.status === 409) {
        setServerError("شما قبلاً اتاقی با همین نام ساخته‌اید. لطفاً نام دیگری انتخاب کنید.");
      } else {
        setServerError("خطا در ساخت اتاق. لطفاً مجدداً تلاش نمایید.");
      }
    }
  };

  const shouldShowForm = tab === "blank" || (tab === "template" && selectedTemplate !== null);

  return (
      <Modal
          isOpen={isOpen}
          onClose={handleClose}
          title="Create Game Room"
          titleFa="ساخت اتاق بازی Titipool"
          maxWidth="lg"
      >
        <div className="space-y-4 text-right font-fa" dir="rtl">
          <div className="grid grid-cols-2 gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/80">
            <button
                type="button"
                onClick={() => handleSwitchTab("blank")}
                className={`flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer active:scale-95 ${
                    tab === "blank"
                        ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
            >
              <Box className="w-4 h-4 shrink-0" />
              <span className="truncate">میز خام و بدون قالب</span>
            </button>
            <button
                type="button"
                onClick={() => handleSwitchTab("template")}
                className={`flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer active:scale-95 ${
                    tab === "template"
                        ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
            >
              <Scroll className="w-4 h-4 shrink-0" />
              <span className="truncate">قالب ماجراجویی</span>
            </button>
          </div>

          {tab === "template" && (
              <div className="space-y-2.5 p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/90 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">یک سناریو را انتخاب کنید:</span>
                  {selectedTemplate && (
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 truncate max-w-[180px]">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {selectedTemplate.title}
                      </span>
                  )}
                </div>

                {isLoadingTemplates ? (
                    <div className="h-24 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-xs text-zinc-500 animate-pulse">
                      در حال بارگذاری سناریوها...
                    </div>
                ) : templates.length === 0 ? (
                    <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-400">
                      هیچ قالب پیش‌فرضی یافت نشد.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {templates.map((tpl) => {
                        const isSelected = selectedTemplate?.id === tpl.id;
                        return (
                            <div
                                key={tpl.id}
                                onClick={() => handleSelectTemplate(tpl)}
                                className={`p-2 rounded-xl border cursor-pointer transition-all duration-150 flex gap-2.5 items-center active:scale-[0.98] ${
                                    isSelected
                                        ? "bg-amber-500/15 border-amber-500 text-zinc-100 ring-1 ring-amber-500/50 shadow-md"
                                        : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-900"
                                }`}
                            >
                              <div className="w-12 h-12 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0 overflow-hidden flex items-center justify-center relative">
                                {tpl.baseMapUrl ? (
                                    <img
                                        src={tpl.baseMapUrl}
                                        alt={tpl.title ? `پیش‌نمایش نقشه قالب ${tpl.title}` : "پیش‌نمایش نقشه قالب"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <ImageIcon className="w-5 h-5 text-zinc-700" />
                                )}
                                {isSelected && (
                                    <div className="absolute inset-0 bg-amber-500/25 flex items-center justify-center">
                                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                                    </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs text-amber-300 truncate">{tpl.title}</h4>
                                <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">
                                  {tpl.description || "شامل مپ و توکن‌های آماده"}
                                </p>
                              </div>
                            </div>
                        );
                      })}
                    </div>
                )}
              </div>
          )}

          {!shouldShowForm && (
              <div className="p-5 rounded-xl bg-zinc-950/40 border border-dashed border-zinc-800 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
                <MousePointerClick className="w-5 h-5 text-amber-500/60 animate-bounce" />
                <p className="text-xs font-medium text-zinc-400">
                  جهت تنظیم مشخصات و ساخت میز، لطفاً یکی از قالب‌های بالا را انتخاب کنید.
                </p>
              </div>
          )}

          {serverError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium animate-shake-subtle">
                {serverError}
              </div>
          )}

          {shouldShowForm && (
              <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-3 transition-all duration-300 animate-fade-in-up"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">
                      نام اتاق یا کمپین <span className="text-amber-400">*</span>
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">{nameValue.length}/100</span>
                  </div>
                  <Input
                      placeholder="مثلا: دخمه اشباح سرخ"
                      error={errors.name?.message}
                      disabled={isSubmitting}
                      maxLength={100}
                      className="h-10 text-sm"
                      {...register("name")}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">
                      توضیحات و خلاصه ماجرا (اختیاری)
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">{descValue.length}/500</span>
                  </div>
                  <div className="relative">
                    <textarea
                        rows={2}
                        placeholder="توضیحات کوتاه درباره سناریو، اهداف یا قوانین..."
                        maxLength={500}
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2 pl-9 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all resize-none"
                        disabled={isSubmitting}
                        {...register("description")}
                    />
                    <FileText className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                  {errors.description && (
                      <p className="text-[11px] text-rose-400 font-medium">
                        {errors.description.message}
                      </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-zinc-300">
                    رمز عبور اتاق (اختیاری جهت خصوصی‌سازی)
                  </label>
                  <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="در صورت تمایل یک رمز تعیین کنید"
                        maxLength={30}
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 pl-10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all h-10"
                        disabled={isSubmitting}
                        {...register("password")}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-400 active:scale-90 p-1 cursor-pointer transition-all"
                        title={showPassword ? "مخفی‌سازی رمز" : "نمایش رمز"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                      <p className="text-[11px] text-rose-400 font-medium">{errors.password.message}</p>
                  )}
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-zinc-800">
                  <Button type="button" variant="ghost" onClick={handleClose} className="h-10 text-xs active:scale-95">
                    انصراف
                  </Button>
                  <Button
                      type="submit"
                      variant="amber"
                      isLoading={isSubmitting}
                      className="font-bold shadow-md shadow-amber-500/10 hover:shadow-lg hover:shadow-amber-500/20 h-10 text-xs active:scale-[0.98]"
                  >
                    <Sparkles className="w-4 h-4 ml-1.5" />
                    ایجاد و راه‌اندازی میز
                  </Button>
                </div>
              </form>
          )}
        </div>
      </Modal>
  );
});

CreateRoomModal.displayName = "CreateRoomModal";
export default CreateRoomModal;