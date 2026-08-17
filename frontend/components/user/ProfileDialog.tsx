"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Eye, EyeOff } from "lucide-react";

import {
    updateProfileSchema,
    UpdateProfileForm,
} from "@/schemas/profile";

import { useCurrentUser } from "@/hooks/user/useCurrentUser";
import { useProfileActions } from "@/hooks/user/useProfileActions";

type SettingsDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function ProfileDialog({
    open,
    onOpenChange,
}: SettingsDialogProps) {
    const { data } = useCurrentUser();

    const {
        updateProfile,
        isUpdatingProfile,
    } = useProfileActions();

    const [showCurrentPassword, setShowCurrentPassword] =
        useState(false);

    const [showNewPassword, setShowNewPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: {
            errors,
            isDirty,
        },
    } = useForm<UpdateProfileForm>({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: {
            username: "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    useEffect(() => {
        if (!data) return;

        reset({
            username: data.user.username,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
    }, [data, reset, open]);

    function onSubmit(values: UpdateProfileForm) {
        if (!data) return;

        const payload: {
            username?: string;
            currentPassword?: string;
            newPassword?: string;
        } = {};

        if (values.username !== data.user.username) {
            payload.username = values.username;
        }

        if (values.newPassword) {
            payload.currentPassword =
                values.currentPassword;

            payload.newPassword =
                values.newPassword;
        }

        updateProfile(payload, {
            onSuccess: () => {
                reset({
                    username: values.username,
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });

                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent
                className="
                    max-h-[90vh]
                    overflow-y-auto
                    border
                    border-slate-800
                    bg-slate-950
                    text-white
                    shadow-2xl
                    sm:max-w-md
                "
            >
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-2xl font-semibold tracking-tight text-white">
                        Profile Settings
                    </DialogTitle>

                    <p className="text-sm text-slate-400">
                        Manage your Relay account.
                    </p>

                    {/* Account */}
                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                            Account
                        </p>

                        <p className="mt-1 truncate text-sm font-medium text-slate-200">
                            {data?.user.email}
                        </p>
                    </div>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="mt-2 space-y-7"
                >
                    {/* Profile */}
                    <section className="space-y-3">
                        <div>
                            <h3 className="text-sm font-semibold text-white">
                                Profile
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                This is how you'll appear to other users.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="username"
                                className="text-sm text-slate-300"
                            >
                                Username
                            </Label>

                            <Input
                                id="username"
                                placeholder="Username"
                                autoComplete="username"
                                aria-invalid={!!errors.username}
                                {...register("username")}
                                className="
                                    h-11
                                    border-slate-800
                                    bg-slate-900
                                    text-white
                                    placeholder:text-slate-600
                                    focus-visible:border-slate-600
                                    focus-visible:ring-slate-700
                                "
                            />

                            {errors.username && (
                                <p className="text-sm text-red-400">
                                    {errors.username.message}
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Security */}
                    <section className="space-y-4 border-t border-slate-800 pt-6">
                        <div>
                            <h3 className="text-sm font-semibold text-white">
                                Security
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                Change your password to keep your account secure.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Current Password */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="currentPassword"
                                    className="text-sm text-slate-300"
                                >
                                    Current Password
                                </Label>

                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={
                                            showCurrentPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="Current password"
                                        autoComplete="current-password"
                                        aria-invalid={
                                            !!errors.currentPassword
                                        }
                                        {...register("currentPassword")}
                                        className="
                                            h-11
                                            border-slate-800
                                            bg-slate-900
                                            pr-11
                                            text-white
                                            placeholder:text-slate-600
                                            focus-visible:border-slate-600
                                            focus-visible:ring-slate-700
                                        "
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowCurrentPassword(
                                                !showCurrentPassword
                                            )
                                        }
                                        className="
                                            absolute
                                            right-3
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-500
                                            transition-colors
                                            hover:text-slate-200
                                        "
                                        aria-label={
                                            showCurrentPassword
                                                ? "Hide current password"
                                                : "Show current password"
                                        }
                                    >
                                        {showCurrentPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>

                                {errors.currentPassword && (
                                    <p className="text-sm text-red-400">
                                        {errors.currentPassword.message}
                                    </p>
                                )}
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="newPassword"
                                    className="text-sm text-slate-300"
                                >
                                    New Password
                                </Label>

                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={
                                            showNewPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="New password"
                                        autoComplete="new-password"
                                        aria-invalid={
                                            !!errors.newPassword
                                        }
                                        {...register("newPassword")}
                                        className="
                                            h-11
                                            border-slate-800
                                            bg-slate-900
                                            pr-11
                                            text-white
                                            placeholder:text-slate-600
                                            focus-visible:border-slate-600
                                            focus-visible:ring-slate-700
                                        "
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowNewPassword(
                                                !showNewPassword
                                            )
                                        }
                                        className="
                                            absolute
                                            right-3
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-500
                                            transition-colors
                                            hover:text-slate-200
                                        "
                                        aria-label={
                                            showNewPassword
                                                ? "Hide new password"
                                                : "Show new password"
                                        }
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>

                                {errors.newPassword && (
                                    <p className="text-sm text-red-400">
                                        {errors.newPassword.message}
                                    </p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <Label
                                    htmlFor="confirmPassword"
                                    className="text-sm text-slate-300"
                                >
                                    Confirm Password
                                </Label>

                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="Confirm password"
                                        autoComplete="new-password"
                                        aria-invalid={
                                            !!errors.confirmPassword
                                        }
                                        {...register("confirmPassword")}
                                        className="
                                            h-11
                                            border-slate-800
                                            bg-slate-900
                                            pr-11
                                            text-white
                                            placeholder:text-slate-600
                                            focus-visible:border-slate-600
                                            focus-visible:ring-slate-700
                                        "
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                        className="
                                            absolute
                                            right-3
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-500
                                            transition-colors
                                            hover:text-slate-200
                                        "
                                        aria-label={
                                            showConfirmPassword
                                                ? "Hide confirm password"
                                                : "Show confirm password"
                                        }
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>

                                {errors.confirmPassword && (
                                    <p className="text-sm text-red-400">
                                        {errors.confirmPassword.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Save */}
                    <Button
                        type="submit"
                        className="
                            h-11
                            w-full
                            bg-white
                            font-semibold
                            text-slate-950
                            transition
                            hover:bg-slate-200
                        "
                        disabled={
                            isUpdatingProfile || !isDirty
                        }
                    >
                        {isUpdatingProfile
                            ? "Saving..."
                            : "Save Changes"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}