
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BookOpen,
  ChevronLeft,
  Menu
} from "lucide-react";

export const Sidebar = () => {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();

  const navigationItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Students", icon: Users, path: "/students" },
    { name: "Teachers", icon: Users, path: "/teachers" },
    { name: "Schedule", icon: Calendar, path: "/schedule" },
    { name: "Progress", icon: BookOpen, path: "/progress" },
  ];

  const isActiveRoute = (path: string) => location.pathname === path;

  return (
    <aside 
      className={`
        bg-white border-r border-gray-200 h-screen transition-all duration-300
        ${expanded ? 'w-64' : 'w-20'} relative
      `}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -right-3 top-4 bg-white border border-gray-200 rounded-full p-1.5 hover:bg-gray-50 transition-colors"
      >
        {expanded ? <ChevronLeft size={16} /> : <Menu size={16} />}
      </button>

      <div className="p-6">
        <h1 className={`font-bold text-xl mb-8 transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
          Hifz Progress
        </h1>
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`
                flex items-center space-x-2 p-3 rounded-lg transition-all duration-200
                ${isActiveRoute(item.path) 
                  ? 'bg-primary text-white' 
                  : 'text-gray-600 hover:bg-gray-50'}
                ${!expanded && 'justify-center'}
              `}
            >
              <item.icon size={20} />
              {expanded && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
};
