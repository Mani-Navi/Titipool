import React, { useState, useEffect, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, Eye, EyeOff, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../ui/Modal.jsx";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { roomApi } from "../../api/room.api";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

const FA_TO_EN_KEYBOARD_MAP = Object.freeze({
  'ض': 'Q', 'ص': 'W', 'ث': 'E', 'ق': 'R', 'ف': 'T', 'غ': 'Y', 'ع': 'U', 'ه': 'I', 'خ': 'O', 'ح': 'P',
  'ش': 'A', 'س': 'S', 'ی': 'D', 'ب': 'F', 'ل': 'G', 'ا': 'H', 'ت': 'J', 'ن': 'K', 'م': 'L',
  'ظ': 'Z', 'ط': 'X', 'ز': 'C', 'ر': 'V', 'ذ': 'B', 'د': 'N', 'پ': 'M', 'ک': 'K', 'گ': 'G',
  'و': 'V', 'ژ': 'C', 'آ': 'H', 'ي': 'D', 'ك': 'K',
});

export const normalizeRoomCode = (rawInput = "") => {
  let result = "";
  for (const char of String(rawInput || "")) {
    const faIndex = PERSIAN_DIGITS.indexOf(char);
    if (faIndex !== -1) {
      result += faIndex;
      continue;
    }

    const arIndex = ARABIC_DIGITS.indexOf(char);
    if (arIndex !== -1) {
      result += arIndex;
      continue;
    }

    if (FA_TO_EN_KEYBOARD_MAP[char]) {
      result += FA_TO_EN_KEYBOARD_MAP[char];
      continue;
    }

    if (/[a-zA-Z0-9]/.test(char)) {
      result += char.toUpperCase();
    }
  }
  return result.slice(0, 6);
};

const joinRoomSchema = z.object({
  inviteCode: z.string().length(6, "کد اتاق باید دقیقاً ۶ کاراکتر باشد").toUpperCase(),
  roomPasscode: z.string().optional(),
});

export const JoinRoomModal = memo(({ isOpen, onClose, prefilledCode = "" }) => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const hasLockedInviteCode = Boolean(prefilledCode && prefilledCode.length === 6);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      inviteCode: "",
      roomPasscode: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      const cleanPrefill = normalizeRoomCode(prefilledCode);
      reset({
        inviteCode: cleanPrefill || "",
        roomPasscode: "",
      });
      setServerError(
          cleanPrefill
              ? "این اتاق خصوصی است؛ لطفاً رمز عبور اتاق را برای ورود وارد کنید."
              : ""
      );
      setShowPassword(false);
    }
  }, [isOpen, prefilledCode, reset]);

  const handleClose = () => {
    reset();
    setServerError("");
    setShowPassword(false);
    onClose();
  };

  const onSubmit = async (data) => {
    setServerError("");
    const cleanedCode = normalizeRoomCode(hasLockedInviteCode ? prefilledCode : data.inviteCode);
    try {
      const res = await roomApi.joinRoom(cleanedCode, data.roomPasscode || null);
      handleClose();
      navigate(`/room/${res.roomId || res.id}`);
    } catch (err) {
      if (err.response?.status === 401) {
        setServerError("رمز عبور وارد شده برای این اتاق اشتباه است.");
      } else if (err.response?.status === 404) {
        setServerError("اتاقی با این کد یافت نشد یا منقضی شده است.");
      } else {
        setServerError(err.response?.data?.error || err.response?.data?.message || "خطا در ورود به اتاق بازی.");
      }
    }
  };

  return (
      <Modal
          isOpen={isOpen}
          onClose={handleClose}
          title={hasLockedInviteCode ? "Protected Room" : "Join Room"}
          titleFa={hasLockedInviteCode ? `ورود به اتاق خصوصی (${prefilledCode})` : "ورود به اتاق با کد دعوت"}
          maxWidth="sm"
      >
        <form
            onSubmit={handleSubmit(onSubmit)}
            autoComplete="off"
            data-form-type="other"
            className="space-y-3.5 font-fa"
            dir="rtl"
        >
          {!hasLockedInviteCode ? (
              <Input
                  label="کد ۶ حرفی اتاق بازی (پشتیبانی از اعداد فارسی و انگلیسی)"
                  placeholder="مثلا: OWL772 یا ۷۵B4EE"
                  error={errors.inviteCode?.message}
                  disabled={isSubmitting}
                  dir="ltr"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  className="uppercase font-mono text-center tracking-widest text-base font-bold h-11"
                  {...register("inviteCode", {
                    onChange: (e) => {
                      const cleaned = normalizeRoomCode(e.target.value);
                      setValue("inviteCode", cleaned, { shouldValidate: true });
                    },
                  })}
              />
          ) : (
              <input type="hidden" {...register("inviteCode")} />
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>{hasLockedInviteCode ? "رمز عبور اتاق را وارد کنید:" : "رمز عبور اتاق (در صورت خصوصی بودن)"}</span>
            </label>
            <div className="relative">
              <input
                  type="text"
                  dir="ltr"
                  placeholder={hasLockedInviteCode ? "رمز عبور اتاق..." : "اگر اتاق رمز دارد، وارد کنید"}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  style={!showPassword ? { WebkitTextSecurity: "disc" } : undefined}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 pl-10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all h-10 text-left font-mono"
                  disabled={isSubmitting}
                  {...register("roomPasscode")}
              />
              <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-400 active:scale-90 transition-all cursor-pointer p-1"
                  title={showPassword ? "مخفی‌سازی رمز" : "نمایش رمز"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {serverError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center font-medium animate-fade-in-up">
                {serverError}
              </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-zinc-800">
            <Button type="button" variant="ghost" onClick={handleClose} className="h-10 text-xs active:scale-95">
              انصراف
            </Button>
            <Button
                type="submit"
                variant="amber"
                isLoading={isSubmitting}
                aria-busy={isSubmitting}
                className="font-bold h-10 text-xs active:scale-[0.98] shadow-md shadow-amber-500/10 hover:shadow-amber-500/20"
            >
              {!isSubmitting && <LogIn className="w-4 h-4 ml-1.5" />}
              <span>{isSubmitting ? "در حال اتصال به اتاق..." : "ورود به اتاق"}</span>
            </Button>
          </div>
        </form>
      </Modal>
  );
});

JoinRoomModal.displayName = "JoinRoomModal";
export default JoinRoomModal;