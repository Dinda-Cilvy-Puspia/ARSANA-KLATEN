import React, { ReactNode, useState, Fragment } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Home, 
  FileText, 
  Send, 
  Calendar, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  X,
  User,
  UserPlus,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useApi';
import { Menu as HeadlessMenu, Transition } from '@headlessui/react';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Surat Masuk', href: '/letters/incoming', icon: FileText },
  { name: 'Surat Keluar', href: '/letters/outgoing', icon: Send },
  { name: 'Agenda', href: '/calendar', icon: Calendar },
];

const adminNavigation = {
  name: 'Registrasi Pengguna',
  href: '/auth/register',
  icon: UserPlus,
};

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { data: notificationsData } = useNotifications({ 
    page: 1, 
    limit: 5, 
    unreadOnly: true 
  });

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const unreadCount = notificationsData?.unreadCount || 0;

  const SidebarContent = () => (
    <div className="flex flex-grow flex-col overflow-y-auto bg-gray-900"> {/* --- [REDESIGN] Latar belakang sidebar gelap --- */}
      <div className="flex h-20 items-center justify-center px-4 flex-shrink-0 border-b border-gray-700">
        <div className="relative h-14 w-48">
          {/* CATATAN: Pastikan Anda punya logo versi putih */}
          <Image src="/ARSANA.svg" alt="Arsana Logo" fill style={{ objectFit: 'contain' }} priority />
        </div>
      </div>
      <nav className="flex flex-1 flex-col px-4 py-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = router.pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-[#12A168] text-white shadow-md' // --- [REDESIGN] Style aktif
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white' // --- [REDESIGN] Style non-aktif
                  }`}
                  onClick={() => sidebarOpen && setSidebarOpen(false)}
                >
                  <item.icon className={`h-5 w-5 mr-3 transition-all duration-200 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                  {item.name}
                </Link>
              </li>
            );
          })}
          
          {user?.role === 'ADMIN' && (
             <li>
              <Link
                href={adminNavigation.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  router.pathname.startsWith(adminNavigation.href)
                    ? 'bg-[#12A168] text-white shadow-md'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                onClick={() => sidebarOpen && setSidebarOpen(false)}
              >
                <adminNavigation.icon className={`h-5 w-5 mr-3 transition-all duration-200 ${router.pathname.startsWith(adminNavigation.href) ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                {adminNavigation.name}
              </Link>
            </li>
          )}
        </ul>
      </nav>
      {/* --- [REDESIGN] Hapus user profile dari bottom sidebar untuk mobile, karena akan ada di top bar --- */}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50"> {/* --- [REDESIGN] Latar belakang konten lebih cerah --- */}
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <div className="fixed inset-0 z-50 lg:hidden">
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="fixed top-0 left-0 bottom-0 flex w-64">
              <SidebarContent />
            </div>
          </Transition.Child>
        </div>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-gray-200"> {/* --- [REDESIGN] Top bar dengan efek blur --- */}
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex-1"></div> {/* Spacer */}

            <div className="flex items-center gap-4">
              <Link
                href="/notifications"
                className="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                  </span>
                )}
              </Link>

              {/* --- [REDESIGN] User menu di pojok kanan atas --- */}
              <HeadlessMenu as="div" className="relative">
                <HeadlessMenu.Button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                  <div className="h-8 w-8 bg-[#12A168] rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden sm:inline text-sm font-semibold text-gray-800">{user?.name}</span>
                  <ChevronDown className="hidden sm:inline h-4 w-4 text-gray-500" />
                </HeadlessMenu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <HeadlessMenu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-1 py-1">
                       <div className="px-4 py-3">
                         <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                         <p className="text-xs text-gray-500 truncate">{user?.role}</p>
                       </div>
                    </div>
                    <div className="px-1 py-1">
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${
                              active ? 'bg-red-500 text-white' : 'text-red-600'
                            } group flex rounded-md items-center w-full px-4 py-2 text-sm font-medium`}
                          >
                            <LogOut className="w-5 h-5 mr-2" />
                            Keluar
                          </button>
                        )}
                      </HeadlessMenu.Item>
                    </div>
                  </HeadlessMenu.Items>
                </Transition>
              </HeadlessMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}