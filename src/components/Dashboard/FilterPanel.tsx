import React, { useState } from 'react';
import { Calendar, Filter, X } from 'lucide-react';

interface FilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  modules: string[];
  users: string[];
  status: string[];
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableModules: string[];
  availableUsers: string[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  availableModules,
  availableUsers
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: { start: '', end: '' },
      modules: [],
      users: [],
      status: []
    });
  };

  const hasActiveFilters = 
    filters.dateRange.start || 
    filters.dateRange.end || 
    filters.modules.length > 0 || 
    filters.users.length > 0 || 
    filters.status.length > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
          hasActiveFilters 
            ? 'bg-blue-50 border-blue-200 text-blue-700' 
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
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
              filters.status.length > 0 && 'Statut'
            ].filter(Boolean).length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Filtres</h3>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Effacer tout
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Plage de dates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Période
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Modules */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Modules</label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availableModules.map(module => (
                  <label key={module} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.modules.includes(module)}
                      onChange={(e) => {
                        const newModules = e.target.checked
                          ? [...filters.modules, module]
                          : filters.modules.filter(m => m !== module);
                        updateFilter('modules', newModules);
                      }}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{module}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Utilisateurs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Utilisateurs</label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availableUsers.map(user => (
                  <label key={user} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.users.includes(user)}
                      onChange={(e) => {
                        const newUsers = e.target.checked
                          ? [...filters.users, user]
                          : filters.users.filter(u => u !== user);
                        updateFilter('users', newUsers);
                      }}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{user}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <div className="space-y-1">
                {['active', 'deprecated', 'pending'].map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={(e) => {
                        const newStatus = e.target.checked
                          ? [...filters.status, status]
                          : filters.status.filter(s => s !== status);
                        updateFilter('status', newStatus);
                      }}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;