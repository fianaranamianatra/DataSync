import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Database, 
  Users, 
  Clock, 
  TrendingUp, 
  Activity,
  Smartphone,
  MapPin,
  CheckCircle
} from 'lucide-react';
import { useDashboardStore } from '../stores/dashboardStore';
import KPICard from '../components/Dashboard/KPICard';
import TrendChart from '../components/Charts/TrendChart';
import DonutChart from '../components/Charts/DonutChart';
import BarChart from '../components/Charts/BarChart';
import GaugeChart from '../components/Charts/GaugeChart';
import FilterPanel from '../components/Dashboard/FilterPanel';
import Card from '../components/UI/Card';

const AnalyticsDashboard: React.FC = () => {
  const { data, filters } = useDashboardStore();
  const location = useLocation();
  
  // Get active tab from URL search params
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'overview';

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Date filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const itemDate = new Date(item.submission_time);
        if (filters.dateRange.start && itemDate < filters.dateRange.start) return false;
        if (filters.dateRange.end && itemDate > filters.dateRange.end) return false;
      }
      
      // User filter
      if (filters.users.length > 0 && !filters.users.includes(item.submitted_by)) return false;
      
      // Device filter
      if (filters.devices.length > 0 && !filters.devices.includes(item.device)) return false;
      
      // Module filter
      if (filters.modules.length > 0) {
        const itemModules = Object.keys(item.modules);
        if (!filters.modules.some(module => itemModules.includes(module))) return false;
      }
      
      return true;
    });
  }, [data, filters]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalRecords = filteredData.length;
    const uniqueUsers = new Set(filteredData.map(item => item.submitted_by)).size;
    const avgDuration = filteredData.reduce((sum, item) => sum + item.duration, 0) / filteredData.length || 0;
    const completionRate = (filteredData.filter(item => 
      Object.values(item.modules).some(value => 
        typeof value === 'string' && value.toLowerCase().includes('completed')
      )
    ).length / totalRecords) * 100 || 0;

    return [
      {
        title: 'Total des enregistrements',
        value: totalRecords,
        change: 12.5,
        trend: 'up' as const,
        icon: <Database size={20} className="text-white" />,
        color: 'bg-gradient-to-r from-blue-500 to-blue-600',
        subtitle: 'Ce mois'
      },
      {
        title: 'Utilisateurs actifs',
        value: uniqueUsers,
        change: -2.3,
        trend: 'down' as const,
        icon: <Users size={20} className="text-white" />,
        color: 'bg-gradient-to-r from-green-500 to-green-600',
        subtitle: 'Derniers 30 jours'
      },
      {
        title: 'Temps moyen',
        value: `${Math.round(avgDuration)}min`,
        change: 5.7,
        trend: 'up' as const,
        icon: <Clock size={20} className="text-white" />,
        color: 'bg-gradient-to-r from-purple-500 to-purple-600',
        subtitle: 'Par session'
      },
      {
        title: 'Taux de complétion',
        value: `${Math.round(completionRate)}%`,
        change: 8.2,
        trend: 'up' as const,
        icon: <CheckCircle size={20} className="text-white" />,
        color: 'bg-gradient-to-r from-orange-500 to-orange-600',
        subtitle: 'Formulaires complétés'
      }
    ];
  }, [filteredData]);

  // Prepare chart data
  const trendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayData = filteredData.filter(item => 
        item.submission_time.startsWith(date)
      );
      return {
        name: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' }),
        value: dayData.length,
        date
      };
    });
  }, [filteredData]);

  const userDistribution = useMemo(() => {
    const userCounts = filteredData.reduce((acc, item) => {
      acc[item.submitted_by] = (acc[item.submitted_by] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(userCounts).map(([name, value]) => ({
      name,
      value,
      total: filteredData.length
    }));
  }, [filteredData]);

  const moduleDistribution = useMemo(() => {
    const moduleCounts = filteredData.reduce((acc, item) => {
      Object.keys(item.modules).forEach(module => {
        acc[module] = (acc[module] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(moduleCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const deviceDistribution = useMemo(() => {
    const deviceCounts = filteredData.reduce((acc, item) => {
      acc[item.device] = (acc[item.device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(deviceCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      total: filteredData.length
    }));
  }, [filteredData]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'modules':
        return (
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Modules les plus utilisés
              </h2>
              <BarChart
                data={moduleDistribution}
                title="Utilisation des modules"
                dataKey="value"
                color="#10b981"
              />
            </Card>
            
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Détails des modules
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {moduleDistribution.slice(0, 6).map((module, index) => (
                  <div key={module.name} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-white">{module.name}</h3>
                    <p className="text-2xl font-bold text-blue-600 mt-2">{module.value}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">utilisations</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );
        
      case 'users':
        return (
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Répartition par utilisateur
              </h2>
              <DonutChart
                data={userDistribution}
                title="Activité des utilisateurs"
                colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']}
              />
            </Card>
            
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Détails des utilisateurs
              </h2>
              <div className="space-y-3">
                {userDistribution.map((user, index) => (
                  <div key={user.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Users size={16} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{user.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {((user.value / user.total) * 100).toFixed(1)}% de l'activité totale
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{user.value}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">soumissions</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );
        
      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendChart
                data={trendData}
                title="Tendance analytique"
                dataKey="value"
                color="#8b5cf6"
                type="line"
              />
              <DonutChart
                data={deviceDistribution}
                title="Répartition par appareil"
                colors={['#6366f1', '#06b6d4', '#84cc16']}
              />
            </div>
            
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Métriques avancées
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg">
                  <h3 className="text-sm font-medium mb-2">Taux d'engagement</h3>
                  <p className="text-2xl font-bold">87.3%</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg">
                  <h3 className="text-sm font-medium mb-2">Temps moyen</h3>
                  <p className="text-2xl font-bold">{Math.round(filteredData.reduce((sum, item) => sum + item.duration, 0) / filteredData.length || 0)}min</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg">
                  <h3 className="text-sm font-medium mb-2">Score qualité</h3>
                  <p className="text-2xl font-bold">94.2</p>
                </div>
              </div>
            </Card>
          </div>
        );
        
      case 'activity':
        return (
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Activité récente
              </h2>
              <div className="space-y-4">
                {filteredData.slice(0, 10).map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Activity size={16} className="text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.submitted_by}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.submission_time).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                        {item.device}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.duration}min
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
            
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Statistiques d'activité
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                    Activité par heure
                  </h3>
                  <div className="space-y-2">
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i;
                      const count = filteredData.filter(item => 
                        new Date(item.submission_time).getHours() === hour
                      ).length;
                      const maxCount = Math.max(...Array.from({ length: 24 }, (_, h) => 
                        filteredData.filter(item => new Date(item.submission_time).getHours() === h).length
                      ));
                      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      
                      return (
                        <div key={hour} className="flex items-center space-x-3">
                          <span className="text-xs text-gray-600 dark:text-gray-400 w-8">
                            {hour.toString().padStart(2, '0')}h
                          </span>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 w-6">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                    Répartition par appareil
                  </h3>
                  <div className="space-y-3">
                    {deviceDistribution.map((device, index) => (
                      <div key={device.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Smartphone size={16} className="text-gray-600 dark:text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">{device.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {device.value}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            ({((device.value / device.total) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );
        
      default: // overview
        return (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpis.map((kpi, index) => (
                <motion.div
                  key={kpi.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <KPICard {...kpi} />
                </motion.div>
              ))}
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendChart
                data={trendData}
                title="Tendance des soumissions (7 derniers jours)"
                dataKey="value"
                color="#3b82f6"
                type="area"
              />
              
              <DonutChart
                data={userDistribution}
                title="Répartition par utilisateur"
                colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']}
              />
            </div>

            {/* Secondary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <BarChart
                data={moduleDistribution}
                title="Modules les plus utilisés"
                dataKey="value"
                color="#10b981"
              />
              
              <DonutChart
                data={deviceDistribution}
                title="Répartition par appareil"
                colors={['#6366f1', '#06b6d4', '#84cc16']}
              />
              
              <GaugeChart
                value={Math.round((filteredData.filter(item => 
                  Object.values(item.modules).some(value => 
                    typeof value === 'string' && value.toLowerCase().includes('completed')
                  )
                ).length / filteredData.length) * 100) || 0}
                max={100}
                title="Taux de complétion"
                unit="%"
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            PRODUIR VAGUE 4
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tableau de Bord Analytique
          </p>
        </div>
        <FilterPanel />
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default AnalyticsDashboard;