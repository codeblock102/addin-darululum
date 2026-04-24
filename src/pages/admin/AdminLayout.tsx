import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Database,
  UserPlus,
  Users,
  Home,
  LogOut,
  Calendar,
  Settings,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth.ts';
import { cn } from '@/lib/utils.ts';

const AdminLayout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (_err) {
      navigate('/auth');
    }
  };

  const navItems = [
    { to: '/admin/setup', icon: UserPlus, label: 'Setup Admin' },
    { to: '/admin/roles', icon: Shield, label: 'Manual Role Setup' },
    { to: '/admin/seeder', icon: Database, label: 'Database Seeder' },
    { to: '/admin/teacher-schedules', icon: Calendar, label: 'Teacher Schedules' },
    { to: '/admin/admin-creator', icon: Users, label: 'Admin Creator' },
    { to: '/admin/parent-accounts', icon: Users, label: 'Parent Accounts' },
    { to: '/settings', icon: Settings, label: 'Settings & Emails' },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative',
      isActive
        ? 'bg-green-50 text-green-800 font-semibold'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand header */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #14532d, #166534)" }}>
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">Admin Panel</p>
          <p className="text-xs text-gray-400">Dār Al-Ulūm Montréal</p>
        </div>
        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="ml-auto md:hidden text-gray-400 hover:text-gray-600 p-1 rounded"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={navLinkClass}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer actions */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1 flex-shrink-0">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150"
          onClick={() => setSidebarOpen(false)}
        >
          <Home className="h-4 w-4 flex-shrink-0" />
          Back to Dashboard
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-150"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f5f6fa] font-sans">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — desktop: static, mobile: overlay */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-200 ease-in-out',
          'md:relative md:translate-x-0 md:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-50"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #14532d, #166534)" }}>
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Admin Panel</span>
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
