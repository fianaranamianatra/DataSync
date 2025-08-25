import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  MapPin, 
  FileText, 
  Settings,
  Database,
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react';
import { useDashboardStore } from '../../stores/dashboardStore';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  active?: boolean;
}

const DashboardSidebar: React.FC = () => {
  const { sidebarCollapsed } = useDashboardStore();

  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: <BarChart3 size={20} />,
      active: true
    },
    {
      id: 'modules',
      label: 'Modules',
      icon: <Database size={20} />,
      badge: 12
    },
    {
      id: 'users',
      label: 'Utilisateurs',
      icon: <Users size={20} />,
      badge: 3
    },
    {
      id: 'geolocation',
      label: 'Géolocalisation',
      icon: <MapPin size={20} />
    },
    {
      id: 'analytics',
      label: 'Analytiques',
      icon: <TrendingUp size={20} />
    },
    {
      id: 'activity',
      label: 'Activité',
      icon: <Activity size={20} />
    },
    {
      id: 'calendar',
      label: 'Calendrier',
      icon: <Calendar size={20} />
    },
    {
      id: 'reports',
      label: 'Rapports',
      icon: <FileText size={20} />
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: <Settings size={20} />
    }
  ];

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col"
    >
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                item.active
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex-shrink-0">
                {item.icon}
              </div>
              
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left text-sm font-medium">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.active
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </motion.button>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      {!sidebarCollapsed && (
        <div className="mt-auto p-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Mise à jour disponible
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Une nouvelle version avec des fonctionnalités améliorées est disponible.
            </p>
            <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium py-2 px-3 rounded-md hover:from-blue-600 hover:to-purple-700 transition-all">
              Mettre à jour
            </button>
          </div>
        </div>
      )}
    </motion.aside>
  );
};

export default DashboardSidebar;