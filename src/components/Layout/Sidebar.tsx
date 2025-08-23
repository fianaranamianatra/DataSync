import React from 'react';
import { Settings, BarChart3, Database } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Configuration', href: '/config', icon: Settings },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Données', href: '/data', icon: Database },
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 h-full">
      <nav className="mt-8">
        <div className="px-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-2 transition-all duration-200 ${
                  isActive
                    ? 'bg-[#c5dfb3]/20 text-[#2d3436] border-r-4 border-[#c5dfb3]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#2d3436]'
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-[#c5dfb3]' : 'text-gray-400 group-hover:text-[#c5dfb3]'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;