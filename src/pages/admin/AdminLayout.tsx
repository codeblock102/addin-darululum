import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Shield, Database, UserPlus, Users, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="h-16 flex items-center justify-center bg-gray-900">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        
        {/* Back to Dashboard Button */}
        <div className="p-4 border-b border-gray-700">
          <Button
            variant="outline"
            onClick={handleBackToDashboard}
            className="w-full bg-gray-700 text-white border-gray-600 hover:bg-gray-600 hover:text-white transition-all duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
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