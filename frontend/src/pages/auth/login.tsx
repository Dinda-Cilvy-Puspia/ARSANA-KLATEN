"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { Mail, Lock, Eye, EyeOff, ArrowRight, Zap, Shield, Sparkles, XCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import Image from "next/image"

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, loading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>()

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [isAuthenticated, router])

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data)
      router.push("/dashboard")
    } catch (error) {
      // Error is handled in the auth context
    }
  }

  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="relative mb-8">
          <div className="w-20 h-20 relative animate-pulse">
            <Image src="/ARSANA.svg" alt="Arsana Logo" fill className="object-contain" />
          </div>
          <div className="absolute -inset-8 bg-blue-400 dark:bg-blue-500 rounded-full opacity-20 animate-ping"></div>
        </div>
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-400 dark:border-t-blue-500"></div>
          <Zap className="absolute inset-0 m-auto h-6 w-6 text-blue-400 dark:text-blue-500 animate-pulse" />
        </div>
        <p className="mt-6 text-sm text-gray-600 dark:text-gray-400 animate-pulse font-medium">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-100 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-950">
      {/* Background with subtle clouds or abstract shapes */}
      <div className="absolute inset-0 z-0 opacity-80 dark:opacity-60 pointer-events-none">
        {/* Subtle cloud-like radial gradients */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-blue-200 dark:bg-blue-800 blur-3xl opacity-20 top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 animate-blob"></div>
        <div className="absolute w-[300px] h-[300px] rounded-full bg-indigo-200 dark:bg-indigo-800 blur-3xl opacity-20 bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2 animate-blob animation-delay-2000"></div>
        <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-200 dark:bg-purple-800 blur-3xl opacity-15 top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Optional: Subtle mouse-follower effect */}
      <div
          className="absolute w-64 h-64 bg-blue-400 dark:bg-blue-500 opacity-5 rounded-full blur-2xl transition-all duration-300 ease-out"
          style={{
            left: mousePosition.x + "px",
            top: mousePosition.y + "px",
            transform: "translate(-50%, -50%)",
          }}
        ></div>

      <div className="relative z-10 max-w-md w-full px-4">
        {/* Adjusted styling for the main card to match the glassmorphism */}
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-3xl p-8 sm:p-12 shadow-xl border border-white dark:border-gray-700 space-y-8 backdrop-blur-xl transition-all duration-300">
          
          <div className="flex flex-col items-center text-center">
            <div className="w-full flex justify-center mb-6">
              <Image
                src="/ARSANA.svg"
                alt="Arsana Logo"
                width={300}
                height={80}
                className="w-[300px] h-auto object-contain transition-all duration-300 "
                priority
              />
            </div>

            <h1 className="text-4xl font-semibold text-gray-900 dark:text-white tracking-tight leading-tight">
              Masuk ke Arsana
            </h1>
            <p className="mt-3 text-gray-600 dark:text-gray-400 text-base">
              Sistem Arsip Surat Internal.
            </p>
            <p className="mt-3 text-gray-600 dark:text-gray-400 text-base">
              Disdukcapil Klaten.
            </p>
            
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email format",
                    },
                  })}
                  type="email"
                  // Adjusted input style
                  className="block w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-white/50 dark:border-gray-600/50 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  placeholder="Masukan Email Disini Bro.."
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline transition-colors duration-200"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  type={showPassword ? "text" : "password"}
                  // Adjusted input style
                  className="block w-full pl-12 pr-12 py-3 bg-white/50 dark:bg-gray-700/50 border border-white/50 dark:border-gray-600/50 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  placeholder="Masukin Password Disini Bro.."
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/50 border-t-white mr-3"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="ml-2 -mr-1 h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="text-center mt-6">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              © 2025 Arsana. KMI UNS 2025.
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 dark:bg-opacity-85 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 max-w-sm w-full relative border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowForgotPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            >
              <XCircle className="h-6 w-6" />
            </button>
            <div className="text-center mb-6">
              <Lock className="mx-auto h-12 w-12 text-blue-500 dark:text-blue-400 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Reset Password</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Untuk keamanan, permintaan reset password harus melalui bantuan Admin.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 text-base">
                Silakan hubungi:
              </p>
              <p className="flex items-center text-gray-800 dark:text-gray-200 font-medium">
                <Mail className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
                <a href="mailto:support@arsana.com" className="hover:underline">leviathan13@student.uns.ac.id</a>
              </p>
              <p className="flex items-center text-gray-800 dark:text-gray-200 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>(021) 123-4567</span>
              </p>
            </div>
            <button
              onClick={() => setShowForgotPasswordModal(false)}
              className="mt-8 w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  )
}