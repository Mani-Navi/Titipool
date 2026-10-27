import React, { useState, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../ui/Modal.jsx";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { roomApi } from "../../api/room.api";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

// نگاشت هوشمند کلیدهای کیبورد فارسی به حروف انگلیسی متناظر (در صورت فراموشی تغییر زبان)
const FA_TO_EN_KEYBOARD_MAP = Object.freeze({
  'ض': 'Q', 'ص': 'W', 'ث': 'E', 'ق': 'R', 'ف': 'T', 'غ': 'Y', 'ع': 'U', 'ه': 'I', 'خ': 'O', 'ح': 'P',
  'ش': 'A', 'س': 'S', 'ی': 'D', 'ب': 'F', 'ل': 'G', 'ا': 'H', 'ت': 'J', 'ن': 'K', 'م': 'L',
  'ظ': 'Z', 'ط': 'X', 'ز': 'C', 'ر': 'V', 'ذ': 'B', 'د': 'N', 'پ': 'M', 'ک': 'K', 'گ': 'G',
  'و': 'V', 'ژ': 'C', 'آ': 'H', 'ي': 'D', 'ك': 'K',
});

// تبدیل درلحظه هرگونه ورودی فارسی/عربی به کد انگلیسی استاندارد
const normalizeRoomCode = (rawInput = "") => {
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
  code: z.string().length(6, "کد اتاق باید دقیقاً ۶ کاراکتر باشد").toUpperCase(),
  password: z.string().optional(),
});

export const JoinRoomModal = memo(({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      code: "",
      password: "",
    },
  });

  const handleClose = () => {
    reset();
    setServerError("");
    setShowPassword(false);
    onClose();
  };

  const onSubmit = async (data) => {
    setServerError("");
    const cleanedCode = normalizeRoomCode(data.code);
    try {
      const res = await roomApi.joinRoom(cleanedCode, data.password || null);
      handleClose();
      navigate(`/room/${res.roomId || res.id}`);
    } catch (err) {
      if (err.response?.status === 401) {
        setServerError("این اتاق دارای رمز عبور است یا رمز وارد شده اشتباه است.");
      } else if (err.response?.status === 404) {
        setServerError("اتاقی با این کد یافت نشد یا منقضی شده است.");
      } else {
        setServerError("خطا در ورود به اتاق بازی.");
      }
    }
  };

  return (
      <Modal
          isOpen={isOpen}
          onClose={handleClose}
          title="Join Room"
          titleFa="ورود به اتاق با کد دعوت"
          maxWidth="sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 font-fa" dir="rtl">
          <Input
              label="کد ۶ حرفی اتاق بازی (پشتیبانی از اعداد فارسی و انگلیسی)"
              placeholder="مثلا: OWL772 یا ۷۵B4EE"
              error={errors.code?.message}
              disabled={isSubmitting}
              dir="ltr"
              className="uppercase font-mono text-center tracking-widest text-base font-bold h-11"
              {...register("code", {
                onChange: (e) => {
                  const cleaned = normalizeRoomCode(e.target.value);
                  setValue("code", cleaned, { shouldValidate: true });
                },
              })}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              رمز عبور اتاق (در صورت خصوصی بودن)
            </label>
            <div className="relative">
              <input
                  type={showPassword ? "text" : "password"}
                  placeholder="اگر اتاق رمز دارد، وارد کنید"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 pl-10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all h-10"
                  disabled={isSubmitting}
                  {...register("password")}
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
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium animate-shake-subtle">
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