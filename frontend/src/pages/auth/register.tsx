"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, CheckCircle, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'ADMIN' | 'STAFF';
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isAuthenticated, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    defaultValues: {
      role: 'STAFF'
    }
  });

  const password = watch('password');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      router.push('/dashboard');
    } catch (error) {
      // Error is handled in the auth context
    }
  };

  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="relative mb-8">
          <div className="w-20 h-20 relative animate-pulse">
            <Image src="/ARSANA.svg" alt="Arsana Logo" fill className="object-contain dark:filter dark:invert" />
          </div>
          <div className="absolute -inset-8 bg-blue-400 dark:bg-blue-500 rounded-full opacity-20 animate-ping"></div>
        </div>
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-400 dark:border-t-blue-500"></div>
          <Zap className="absolute inset-0 m-auto h-6 w-6 text-blue-400 dark:text-blue-500 animate-pulse" />
        </div>
        <p className="mt-6 text-sm text-gray-600 dark:text-gray-400 animate-pulse font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background with blurred clouds/abstract shapes */}
      <div className="absolute inset-0 z-0 opacity-80 dark:opacity-70">
        <div className="absolute w-96 h-96 bg-white dark:bg-blue-900 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute w-80 h-80 bg-blue-200 dark:bg-purple-900 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2 animation-delay-2000"></div>
        <div className="absolute w-72 h-72 bg-purple-100 dark:bg-indigo-900 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 max-w-2xl w-full px-4">
        {/* Main form container with glassmorphism style */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl p-8 sm:p-12 shadow-2xl border border-white dark:border-gray-700 space-y-8">
          
          <div className="flex flex-col items-center text-center">
            <div className="w-full flex justify-center mb-6">
              <Image
                src="/ARSANA.svg"
                alt="Arsana Logo"
                width={300}
                height={80}
                className="w-[300px] h-auto object-contain dark:filter dark:invert transition-all duration-300"
                priority
              />
            </div>

            <h1 className="text-4xl font-semibold text-gray-900 dark:text-white tracking-tight leading-tight">
              Buat Akun Arsana.
            </h1>
            <p className="mt-3 text-gray-700 dark:text-gray-300 text-base">
              Sistem Arsip Surat Internal.
            </p>
            <p className="mt-1 text-gray-700 dark:text-gray-300 text-base">
              Disdukcapil Klaten.
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Tata letak dua kolom untuk Name, Email, Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <input
                    {...register('name', {
                      required: 'Nama wajib diisi',
                      minLength: {
                        value: 2,
                        message: 'Nama minimal 2 karakter'
                      }
                    })}
                    type="text"
                    className="block w-full pl-12 pr-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-red-600 dark:text-red-400" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Role
                </label>
                <div className="relative">
                  <select
                    {...register('role')}
                    className="block w-full pl-4 pr-10 py-3 bg-white/70 dark:bg-gray-700/70 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white appearance-none"
                  >
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-5">

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <input
                    {...register('email', {
                      required: 'Email wajib diisi',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Format email tidak valid'
                      }
                    })}
                    type="email"
                    className="block w-full pl-12 pr-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    placeholder="name@company.com"
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-red-600 dark:text-red-400" />
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <input
                    {...register('password', {
                      required: 'Password wajib diisi',
                      minLength: {
                        value: 6,
                        message: 'Password minimal 6 karakter'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full pl-12 pr-12 py-3 bg-white/70 dark:bg-gray-700/70 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none transition-colors duration-200"
                  >
                    {showPassword ? 
                      <EyeOff className="h-5 w-5" /> : 
                      <Eye className="h-5 w-5" />
                    }
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-red-600 dark:text-red-400" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <input
                    {...register('confirmPassword', {
                      required: 'Konfirmasi password wajib diisi',
                      validate: value =>
                        value === password || 'Password tidak cocok'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="block w-full pl-12 pr-12 py-3 bg-white/70 dark:bg-gray-700/70 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none transition-colors duration-200"
                  >
                    {showConfirmPassword ? 
                      <EyeOff className="h-5 w-5" /> : 
                      <Eye className="h-5 w-5" />
                    }
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-red-600 dark:text-red-400" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
              <p>By registering, you agree to our <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-lg font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/50 border-t-white mr-3"></div>
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    <span>Register Now</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          © 2025 Arsana. All rights reserved.
        </div>
      </div>
    </div>
  );
}