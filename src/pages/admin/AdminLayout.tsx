import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Shield, Database, UserPlus } from 'lucide-react';

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="h-16 flex items-center justify-center bg-gray-900">
          <h1 className="text-xl font-bold">Admin Panel</h1>
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
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout; 