import React, { ReactNode, useState, Fragment, useMemo, memo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Home, 
  FileText, 
  Send, 
  Calendar, 
  Bell, 
  LogOut,
  Menu,
  User,
  UserPlus,
  ChevronDown,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useApi';
import { Menu as HeadlessMenu, Transition, Dialog } from '@headlessui/react';

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

// ====================================
// MEMOIZED COMPONENTS
// ====================================

const NavItem = memo(({ 
  item, 
  isActive, 
  onClick 
}: { 
  item: { name: string; href: string; icon: React.ElementType }
  isActive: boolean
  onClick?: () => void
}) => (
  <li>
    <Link
      href={item.href}
      className={`group flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-[#12A168] to-[#0e8653] text-white shadow-lg shadow-emerald-500/30' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-white hover:shadow-md' 
      }`}
      onClick={onClick}
    >
      <item.icon className={`h-5 w-5 mr-3 transition-all duration-200 ${
        isActive ? 'text-white scale-110' : 'text-gray-500 group-hover:text-white group-hover:scale-110'
      }`} />
      <span className="truncate">{item.name}</span>
    </Link>
  </li>
));

NavItem.displayName = 'NavItem';

const NotificationBadge = memo(({ count }: { count: number }) => {
  if (count === 0) return null;
  
  return (
    <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg animate-bounce">
      {count > 9 ? '9+' : count}
    </span>
  );
});

NotificationBadge.displayName = 'NotificationBadge';

const UserAvatar = memo(({ name }: { name?: string }) => (
  <div className="h-9 w-9 bg-gradient-to-br from-[#12A168] to-[#0e8653] rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
    <span className="text-sm font-bold text-white">
      {name?.charAt(0).toUpperCase() || 'U'}
    </span>
  </div>
));

UserAvatar.displayName = 'UserAvatar';

// ====================================
// SIDEBAR COMPONENT
// ====================================

const SidebarContent = memo(({ 
  router, 
  user, 
  onNavigate 
}: { 
  router: any
  user: any
  onNavigate?: () => void
}) => {
  const navItems = useMemo(() => {
    const items = navigation.map(item => ({
      ...item,
      isActive: router.pathname.startsWith(item.href)
    }));

    if (user?.role === 'ADMIN') {
      items.push({
        ...adminNavigation,
        isActive: router.pathname.startsWith(adminNavigation.href)
      });
    }

    return items;
  }, [router.pathname, user?.role]);

  return (
    <div className="flex flex-grow flex-col overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Logo Section */}
      <div className="flex h-20 items-center justify-center px-4 flex-shrink-0 border-b border-gray-700/50">
        <div className="relative h-14 w-48">
          <Image 
            src="/ARSANA.svg" 
            alt="Arsana Logo" 
            fill 
            style={{ objectFit: 'contain' }} 
            priority 
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-4 py-6">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <NavItem 
              key={item.href} 
              item={item} 
              isActive={item.isActive}
              onClick={onNavigate}
            />
          ))}
        </ul>

        {/* Footer Info */}
        <div className="mt-auto pt-6 pb-4 border-t border-gray-700/50">
          <div className="px-3 py-2 bg-gray-800/50 rounded-xl">
            <p className="text-xs text-gray-400">Logged in as</p>
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-emerald-400 font-medium mt-0.5">{user?.role}</p>
          </div>
        </div>
      </nav>
    </div>
  );
});

SidebarContent.displayName = 'SidebarContent';

// ====================================
// MAIN LAYOUT COMPONENT
// ====================================

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { data: notificationsData } = useNotifications({ 
    page: 1, 
    limit: 5, 
    unreadOnly: true 
  });

  const handleLogout = useCallback(() => {
    logout();
    router.push('/auth/login');
  }, [logout, router]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const unreadCount = useMemo(() => notificationsData?.unreadCount || 0, [notificationsData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Mobile Sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={closeSidebar}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button 
                      type="button" 
                      className="-m-2.5 p-2.5 text-white hover:bg-white/10 rounded-lg transition-colors"
                      onClick={closeSidebar}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent router={router} user={user} onNavigate={closeSidebar} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col shadow-2xl">
        <SidebarContent router={router} user={user} />
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Navigation */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={openSidebar}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 hover:shadow-md"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex-1 lg:hidden" />

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Link
                href="/notifications"
                className="relative p-2.5 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:shadow-md group"
              >
                <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <NotificationBadge count={unreadCount} />
              </Link>

              {/* User Menu */}
              <HeadlessMenu as="div" className="relative">
                <HeadlessMenu.Button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:shadow-md group">
                  <UserAvatar name={user?.name} />
                  <span className="hidden sm:inline text-sm font-semibold text-gray-800 max-w-[120px] truncate group-hover:text-[#12A168] transition-colors">
                    {user?.name}
                  </span>
                  <ChevronDown className="hidden sm:inline h-4 w-4 text-gray-500 group-hover:text-[#12A168] transition-colors" />
                </HeadlessMenu.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-150"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <HeadlessMenu.Items className="absolute right-0 mt-3 w-64 origin-top-right bg-white divide-y divide-gray-100 rounded-2xl shadow-2xl ring-1 ring-black/5 focus:outline-none overflow-hidden">
                    {/* User Info */}
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-white">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user?.name} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                            {user?.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Logout Action */}
                    <div className="p-2">
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${
                              active 
                                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md' 
                                : 'text-red-600'
                            } group flex rounded-xl items-center w-full px-4 py-3 text-sm font-semibold transition-all duration-200`}
                          >
                            <LogOut className={`w-5 h-5 mr-3 ${active ? 'scale-110' : ''} transition-transform`} />
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

        {/* Page Content */}
        <main className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}