"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  UserPlus,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { toast } from "react-hot-toast";
import Layout from "@/components/Layout/Layout";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "ADMIN" | "STAFF";
}

const PasswordStrengthMeter = ({ password }: { password?: string }) => {
  const getStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };
  const strength = getStrength();
  const color = [
    "bg-gray-300",
    "bg-red-500",
    "bg-yellow-500",
    "bg-orange-500",
    "bg-green-500",
  ][strength];
  const width = `${(strength / 4) * 100}%`;

  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
      <div
        className={`h-1.5 rounded-full transition-all duration-300 ${color}`}
        style={{ width }}
      ></div>
    </div>
  );
};

export default function RegisterPage() {
  const router = useRouter();
  const {
    register: registerUser,
    user: currentUser,
    isAuthenticated,
    loading,
  } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isAdminRegistering =
    isAuthenticated && currentUser?.role === "ADMIN";

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    defaultValues: { role: "STAFF" },
  });

  const password = watch("password");

  useEffect(() => {
    if (isAuthenticated && !isAdminRegistering) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isAdminRegistering, router]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      toast.success(`Pengguna "${data.name}" berhasil didaftarkan!`);
      if (isAdminRegistering) reset();
      else router.push("/dashboard");
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-600"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-md md:max-w-lg mx-auto mt-10 mb-16">
        <div className="bg-white shadow-lg rounded-2xl p-8 space-y-6 border border-gray-100">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <Image
                src="/ARSANA.svg"
                alt="Arsana Logo"
                width={180}
                height={45}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAdminRegistering
                ? "Daftarkan Pengguna Baru"
                : "Buat Akun Baru"}
            </h1>
            <p className="text-sm text-gray-600">
              {isAdminRegistering
                ? "Isi detail pengguna di bawah."
                : "Selamat datang! Isi detail Anda untuk mendaftar."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Nama + Role */}
            {isAdminRegistering ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <InputField
                  icon={User}
                  label="Nama Lengkap"
                  placeholder="Masukkan nama lengkap"
                  error={errors.name?.message}
                  register={register("name", { required: "Nama wajib diisi" })}
                />
                <SelectField
                  icon={Shield}
                  label="Peran (Role)"
                  options={[
                    { label: "Staff", value: "STAFF" },
                    { label: "Admin", value: "ADMIN" },
                  ]}
                  register={register("role")}
                />
              </div>
            ) : (
              <InputField
                icon={User}
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap"
                error={errors.name?.message}
                register={register("name", { required: "Nama wajib diisi" })}
              />
            )}

            <InputField
              icon={Mail}
              label="Email"
              placeholder="contoh@email.com"
              error={errors.email?.message}
              register={register("email", {
                required: "Email wajib diisi",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Format email tidak valid",
                },
              })}
            />

            <PasswordField
              label="Password"
              password={password}
              register={register("password", {
                required: "Password wajib diisi",
                minLength: {
                  value: 8,
                  message: "Password minimal 8 karakter",
                },
              })}
              show={showPassword}
              toggle={() => setShowPassword(!showPassword)}
              error={errors.password?.message}
            />

            <PasswordField
              label="Konfirmasi Password"
              register={register("confirmPassword", {
                required: "Konfirmasi password wajib diisi",
                validate: (value) =>
                  value === password || "Password tidak cocok",
              })}
              show={showConfirmPassword}
              toggle={() => setShowConfirmPassword(!showConfirmPassword)}
              error={errors.confirmPassword?.message}
            />

            {/* Tombol */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-3 px-4 text-white bg-[#12A168] hover:bg-[#0e7d52] rounded-xl font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Mendaftarkan...
                </div>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Daftar
                </>
              )}
            </button>

            {!isAdminRegistering && (
              <p className="text-sm text-center text-gray-600 pt-2">
                Sudah punya akun?{" "}
                <Link
                  href="/auth/login"
                  className="text-[#12A168] font-medium hover:underline"
                >
                  Masuk di sini
                </Link>
              </p>
            )}
          </form>
        </div>
      </div>
    </Layout>
  );
}

/* 🔹 Subkomponen input modern */
const InputField = ({
  icon: Icon,
  label,
  register,
  error,
  placeholder,
}: any) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <div
      className={`flex items-center px-3 border rounded-xl shadow-sm bg-gray-50 focus-within:ring-2 focus-within:ring-[#12A168] transition-all ${
        error ? "border-red-500" : "border-gray-300"
      }`}
    >
      <Icon className="h-5 w-5 text-gray-400 mr-2" />
      <input
        {...register}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none py-2 text-gray-900 placeholder-gray-400"
      />
    </div>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

const SelectField = ({ icon: Icon, label, options, register }: any) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <div className="flex items-center px-3 border rounded-xl shadow-sm bg-gray-50 focus-within:ring-2 focus-within:ring-[#12A168] transition-all border-gray-300">
      <Icon className="h-5 w-5 text-gray-400 mr-2" />
      <select
        {...register}
        className="w-full bg-transparent outline-none py-2 text-gray-900"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

const PasswordField = ({
  label,
  password,
  register,
  error,
  show,
  toggle,
}: any) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <div
      className={`flex items-center px-3 border rounded-xl shadow-sm bg-gray-50 focus-within:ring-2 focus-within:ring-[#12A168] transition-all ${
        error ? "border-red-500" : "border-gray-300"
      }`}
    >
      <Lock className="h-5 w-5 text-gray-400 mr-2" />
      <input
        {...register}
        type={show ? "text" : "password"}
        placeholder="Masukkan password"
        className="w-full bg-transparent outline-none py-2 text-gray-900 placeholder-gray-400"
      />
      <button
        type="button"
        onClick={toggle}
        className="text-gray-400 hover:text-gray-600"
      >
        {show ? (
          <EyeOff className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
      </button>
    </div>
    {password !== undefined && label === "Password" && (
      <PasswordStrengthMeter password={password} />
    )}
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);
