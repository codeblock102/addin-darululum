import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { Shield, Database, UserPlus, Users, Home, LogOut, Calendar, Activity as ActivityIcon, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth.ts';

const AdminLayout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (_err) {
      // fallback navigate even if toast already handled
      navigate('/auth');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="h-16 flex items-center justify-between bg-gray-900 px-4">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md transition-colors"
              title="Back to Dashboard"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md transition-colors"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink
            to="/admin/activity"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <ActivityIcon className="mr-3 h-5 w-5" />
            Activity Feed
          </NavLink>
          <NavLink
            to="/admin/setup"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <UserPlus className="mr-3 h-5 w-5" />
            Setup Admin
          </NavLink>
          <NavLink
            to="/admin/roles"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Shield className="mr-3 h-5 w-5" />
            Manual Role Setup
          </NavLink>
          <NavLink
            to="/admin/seeder"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Database className="mr-3 h-5 w-5" />
            Database Seeder
          </NavLink>
          <NavLink
            to="/admin/teacher-schedules"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Calendar className="mr-3 h-5 w-5" />
            Teacher Schedules
          </NavLink>
          <NavLink
            to="/admin/admin-creator"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Users className="mr-3 h-5 w-5" />
            Admin Creator
          </NavLink>
          <NavLink
            to="/admin/parent-accounts"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Users className="mr-3 h-5 w-5" />
            Parent Accounts
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings & Emails
          </NavLink>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout; 