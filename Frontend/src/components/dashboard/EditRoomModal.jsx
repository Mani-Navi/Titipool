import React, { useState, useEffect, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "../ui/Modal.jsx";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { Eye, EyeOff, FileText, Check } from "lucide-react";

const editRoomSchema = z.object({
    name: z
        .string()
        .min(2, "نام اتاق باید حداقل ۲ حرف باشد")
        .max(100, "نام اتاق حداکثر ۱۰۰ حرف است"),
    description: z.string().max(500, "توضیحات حداکثر ۵۰۰ حرف است").optional(),
    password: z.string().max(30, "رمز عبور حداکثر ۳۰ کاراکتر است").optional(),
});

export const EditRoomModal = memo(({ isOpen, onClose, onUpdate, room }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(editRoomSchema),
        defaultValues: {
            name: "",
            description: "",
            password: "",
        },
    });

    const nameValue = watch("name") || "";
    const descValue = watch("description") || "";

    useEffect(() => {
        if (room && isOpen) {
            reset({
                name: room.name || "",
                description: room.description || "",
                password: "",
            });
            setServerError("");
            setShowPassword(false);
        }
    }, [room, isOpen, reset]);

    const onSubmit = async (data) => {
        setServerError("");
        try {
            await onUpdate(room.id, {
                name: data.name.trim(),
                description: data.description?.trim() || null,
                password: data.password !== undefined ? data.password.trim() : null,
            });
            onClose();
        } catch {
            setServerError("خطا در ویرایش مشخصات اتاق.");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Adventure Settings"
            titleFa="ویرایش مشخصات اتاق بازی"
            maxWidth="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 font-fa" dir="rtl">
                {serverError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium animate-shake-subtle">
                        {serverError}
                    </div>
                )}

                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-300">
                            نام ماجرا <span className="text-amber-400">*</span>
                        </label>
                        <span className="text-[10px] text-zinc-500 font-mono">{nameValue.length}/100</span>
                    </div>
                    <Input
                        placeholder="نام ماجرا..."
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
                            placeholder="توضیحات..."
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
                        رمز عبور اتاق (برای حذف رمز، خالی بگذارید)
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="تغییر یا حذف رمز..."
                            maxLength={30}
                            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 pl-10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all h-10"
                            disabled={isSubmitting}
                            {...register("password")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-400 active:scale-90 transition-all cursor-pointer p-1"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-zinc-800">
                    <Button type="button" variant="ghost" onClick={onClose} className="h-10 text-xs active:scale-95">
                        انصراف
                    </Button>
                    <Button type="submit" variant="amber" isLoading={isSubmitting} className="font-bold h-10 text-xs active:scale-[0.98]">
                        <Check className="w-4 h-4 ml-1.5" />
                        ذخیره تغییرات
                    </Button>
                </div>
            </form>
        </Modal>
    );
});

EditRoomModal.displayName = "EditRoomModal";
export default EditRoomModal;