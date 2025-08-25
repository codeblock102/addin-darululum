import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { Shield, Database, UserPlus, Users, Home } from 'lucide-react';

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="h-16 flex items-center justify-between bg-gray-900 px-4">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md transition-colors"
            title="Back to Dashboard"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
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
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout; 