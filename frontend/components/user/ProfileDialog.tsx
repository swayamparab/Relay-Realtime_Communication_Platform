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

import {
    Eye,
    EyeOff,
    X,
    User,
    ShieldCheck,
} from "lucide-react";

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
                    border-0
                    bg-slate-950
                    p-0
                    text-white
                    shadow-2xl
                    outline-none
                    ring-0
                    sm:max-w-md
                "
            >
                {/* Close Button */}

                <button
                    type="button"
                    onClick={() =>
                        onOpenChange(false)
                    }
                    className="
                        absolute
                        right-4
                        top-4
                        z-20
                        rounded-xl
                        border-0
                        p-2
                        text-slate-500
                        outline-none
                        ring-0
                        transition
                        hover:bg-slate-800
                        hover:text-white
                        focus:outline-none
                        focus:ring-0
                    "
                    aria-label="Close profile settings"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Header */}

                <DialogHeader
                    className="
                        px-6
                        pb-5
                        pt-6
                    "
                >
                    <div className="pr-8">
                        <DialogTitle
                            className="
                                text-xl
                                font-semibold
                                tracking-tight
                                text-white
                            "
                        >
                            Profile Settings
                        </DialogTitle>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage your Relay account
                            and security settings.
                        </p>
                    </div>

                    {/* Account */}

                    <div
                        className="
                            mt-5
                            flex
                            items-center
                            gap-3
                            rounded-xl
                            bg-slate-900/70
                            p-3
                        "
                    >
                        <div
                            className="
                                flex
                                h-10
                                w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-slate-800
                            "
                        >
                            <User className="h-4 w-4 text-slate-400" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                                Account
                            </p>

                            <p className="mt-0.5 truncate text-sm font-medium text-slate-200">
                                {data?.user.email ??
                                    "Loading..."}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                {/* Form */}

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="px-6 py-5"
                >
                    {/* Profile */}

                    <section className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div
                                className="
                                    mt-0.5
                                    flex
                                    h-8
                                    w-8
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-lg
                                    bg-sky-500/10
                                "
                            >
                                <User className="h-4 w-4 text-sky-400" />
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-white">
                                    Profile
                                </h3>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    This is how you'll
                                    appear to other
                                    users.
                                </p>
                            </div>
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
                                aria-invalid={
                                    !!errors.username
                                }
                                {...register("username")}
                                className="
                                    h-11
                                    border-0
                                    bg-slate-900
                                    text-white
                                    shadow-none
                                    outline-none
                                    ring-0
                                    placeholder:text-slate-600
                                    focus-visible:border-0
                                    focus-visible:ring-1
                                    focus-visible:ring-sky-500
                                "
                            />

                            {errors.username && (
                                <p className="text-xs text-red-400">
                                    {errors.username.message}
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Security */}

                    <section
                        className="
                            mt-7
                            space-y-4
                            pt-6
                        "
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className="
                                    mt-0.5
                                    flex
                                    h-8
                                    w-8
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-lg
                                    bg-emerald-500/10
                                "
                            >
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-white">
                                    Security
                                </h3>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    Change your password
                                    to keep your account
                                    secure.
                                </p>
                            </div>
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
                                        {...register(
                                            "currentPassword"
                                        )}
                                        className="
                                            h-11
                                            border-0
                                            bg-slate-900
                                            pr-11
                                            text-white
                                            shadow-none
                                            outline-none
                                            ring-0
                                            placeholder:text-slate-600
                                            focus-visible:border-0
                                            focus-visible:ring-1
                                            focus-visible:ring-sky-500
                                        "
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowCurrentPassword(
                                                (prev) => !prev
                                            )
                                        }
                                        className="
                                            absolute
                                            right-3
                                            top-1/2
                                            -translate-y-1/2
                                            rounded-md
                                            border-0
                                            p-1
                                            text-slate-500
                                            outline-none
                                            ring-0
                                            transition
                                            hover:text-slate-200
                                            focus:outline-none
                                            focus:ring-0
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
                                    <p className="text-xs text-red-400">
                                        {
                                            errors.currentPassword
                                                .message
                                        }
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
                                        {...register(
                                            "newPassword"
                                        )}
                                        className="
                                            h-11
                                            border-0
                                            bg-slate-900
                                            pr-11
                                            text-white
                                            shadow-none
                                            outline-none
                                            ring-0
                                            placeholder:text-slate-600
                                            focus-visible:border-0
                                            focus-visible:ring-1
                                            focus-visible:ring-sky-500
                                        "
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowNewPassword(
                                                (prev) => !prev
                                            )
                                        }
                                        className="
                                            absolute
                                            right-3
                                            top-1/2
                                            -translate-y-1/2
                                            rounded-md
                                            border-0
                                            p-1
                                            text-slate-500
                                            outline-none
                                            ring-0
                                            transition
                                            hover:text-slate-200
                                            focus:outline-none
                                            focus:ring-0
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
                                    <p className="text-xs text-red-400">
                                        {
                                            errors.newPassword
                                                .message
                                        }
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
                                        {...register(
                                            "confirmPassword"
                                        )}
                                        className="
                                            h-11
                                            border-0
                                            bg-slate-900
                                            pr-11
                                            text-white
                                            shadow-none
                                            outline-none
                                            ring-0
                                            placeholder:text-slate-600
                                            focus-visible:border-0
                                            focus-visible:ring-1
                                            focus-visible:ring-sky-500
                                        "
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                (prev) => !prev
                                            )
                                        }
                                        className="
                                            absolute
                                            right-3
                                            top-1/2
                                            -translate-y-1/2
                                            rounded-md
                                            border-0
                                            p-1
                                            text-slate-500
                                            outline-none
                                            ring-0
                                            transition
                                            hover:text-slate-200
                                            focus:outline-none
                                            focus:ring-0
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
                                    <p className="text-xs text-red-400">
                                        {
                                            errors.confirmPassword
                                                .message
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Save */}

                    <div className="mt-7 pt-5">
                        <Button
                            type="submit"
                            className="
                                h-11
                                w-full
                                rounded-xl
                                border-0
                                bg-white
                                font-semibold
                                text-slate-950
                                shadow-lg
                                outline-none
                                ring-0
                                transition
                                hover:bg-slate-200
                                focus-visible:ring-0
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                            disabled={
                                isUpdatingProfile ||
                                !isDirty
                            }
                        >
                            {isUpdatingProfile
                                ? "Saving..."
                                : "Save Changes"}
                        </Button>

                        <p className="mt-2 text-center text-[11px] text-slate-600">
                            Changes are applied
                            immediately.
                        </p>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}