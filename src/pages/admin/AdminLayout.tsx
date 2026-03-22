import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { Shield, Database, UserPlus, Users, Home, LogOut, Calendar, Settings, Menu, X } from 'lucide-react';
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
      // fallback navigate even if toast already handled
      navigate('/auth');
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gray-700 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 text-white flex flex-col transform transition-transform duration-200 ease-in-out",
          "md:relative md:translate-x-0 md:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between bg-gray-900 px-4 flex-shrink-0">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md transition-colors"
              title="Back to Dashboard"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md transition-colors"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
            {/* Close button — mobile only */}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden inline-flex items-center justify-center text-gray-400 hover:text-white p-1 rounded"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          <NavLink to="/admin/setup" className={navLinkClass}>
            <UserPlus className="mr-3 h-5 w-5" />
            Setup Admin
          </NavLink>
          <NavLink to="/admin/roles" className={navLinkClass}>
            <Shield className="mr-3 h-5 w-5" />
            Manual Role Setup
          </NavLink>
          <NavLink to="/admin/seeder" className={navLinkClass}>
            <Database className="mr-3 h-5 w-5" />
            Database Seeder
          </NavLink>
          <NavLink to="/admin/teacher-schedules" className={navLinkClass}>
            <Calendar className="mr-3 h-5 w-5" />
            Teacher Schedules
          </NavLink>
          <NavLink to="/admin/admin-creator" className={navLinkClass}>
            <Users className="mr-3 h-5 w-5" />
            Admin Creator
          </NavLink>
          <NavLink to="/admin/parent-accounts" className={navLinkClass}>
            <Users className="mr-3 h-5 w-5" />
            Parent Accounts
          </NavLink>
          <NavLink to="/settings" className={navLinkClass}>
            <Settings className="mr-3 h-5 w-5" />
            Settings & Emails
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar with hamburger */}
        <div className="md:hidden h-14 bg-gray-900 flex items-center px-4 gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center text-gray-300 hover:text-white p-1.5 rounded"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-white font-semibold text-sm">Admin Panel</span>
        </div>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
