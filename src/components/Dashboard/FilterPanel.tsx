import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Calendar, Users, Smartphone, X } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useDashboardStore } from '../../stores/dashboardStore';
import "react-datepicker/dist/react-datepicker.css";

const FilterPanel: React.FC = () => {
  const { filters, setFilters, data } = useDashboardStore();
  const [isOpen, setIsOpen] = useState(false);

  const uniqueUsers = [...new Set(data.map(item => item.submitted_by))];
  const uniqueDevices = [...new Set(data.map(item => item.device))];
  const uniqueModules = [...new Set(data.flatMap(item => Object.keys(item.modules)))];

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters({ [key]: value });
  };

  const clearFilters = () => {
    setFilters({
      dateRange: { start: null, end: null },
      modules: [],
      users: [],
      devices: []
    });
  };

  const hasActiveFilters = 
    filters.dateRange.start || 
    filters.dateRange.end || 
    filters.modules.length > 0 || 
    filters.users.length > 0 || 
    filters.devices.length > 0;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
          hasActiveFilters 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' 
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        <Filter size={16} />
        <span>Filtres</span>
        {hasActiveFilters && (
          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
            {[
              filters.dateRange.start && 'Date',
              filters.modules.length > 0 && 'Modules',
              filters.users.length > 0 && 'Utilisateurs',
              filters.devices.length > 0 && 'Appareils'
            ].filter(Boolean).length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Filtres avancés</h3>
              <div className="flex items-center space-x-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Effacer tout
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Période
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    selected={filters.dateRange.start}
                    onChange={(date) => handleFilterChange('dateRange', { ...filters.dateRange, start: date })}
                    placeholderText="Date de début"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <DatePicker
                    selected={filters.dateRange.end}
                    onChange={(date) => handleFilterChange('dateRange', { ...filters.dateRange, end: date })}
                    placeholderText="Date de fin"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Users */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Users size={16} className="inline mr-1" />
                  Utilisateurs
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {uniqueUsers.map(user => (
                    <label key={user} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.users.includes(user)}
                        onChange={(e) => {
                          const newUsers = e.target.checked
                            ? [...filters.users, user]
                            : filters.users.filter(u => u !== user);
                          handleFilterChange('users', newUsers);
                        }}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{user}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Devices */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Smartphone size={16} className="inline mr-1" />
                  Appareils
                </label>
                <div className="space-y-1">
                  {uniqueDevices.map(device => (
                    <label key={device} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.devices.includes(device)}
                        onChange={(e) => {
                          const newDevices = e.target.checked
                            ? [...filters.devices, device]
                            : filters.devices.filter(d => d !== device);
                          handleFilterChange('devices', newDevices);
                        }}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{device}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Modules */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Modules
                </label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {uniqueModules.map(module => (
                    <label key={module} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.modules.includes(module)}
                        onChange={(e) => {
                          const newModules = e.target.checked
                            ? [...filters.modules, module]
                            : filters.modules.filter(m => m !== module);
                          handleFilterChange('modules', newModules);
                        }}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{module}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterPanel;