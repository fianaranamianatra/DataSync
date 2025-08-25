import React, { useState } from 'react';
import { FileText, Download, Filter, Calendar, TrendingUp, BarChart3, PieChart, Users } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedFormat, setSelectedFormat] = useState('pdf');

  // Données simulées pour les rapports
  const reportTemplates = [
    {
      id: '1',
      name: 'Rapport de Synchronisation',
      description: 'Analyse détaillée des synchronisations de données',
      type: 'sync',
      lastGenerated: '2025-01-15T10:30:00',
      frequency: 'Hebdomadaire',
      size: '2.3 MB'
    },
    {
      id: '2',
      name: 'Rapport d\'Activité Utilisateurs',
      description: 'Statistiques d\'utilisation par utilisateur',
      type: 'users',
      lastGenerated: '2025-01-14T16:45:00',
      frequency: 'Mensuel',
      size: '1.8 MB'
    },
    {
      id: '3',
      name: 'Rapport de Performance',
      description: 'Métriques de performance système',
      type: 'performance',
      lastGenerated: '2025-01-13T09:15:00',
      frequency: 'Quotidien',
      size: '3.1 MB'
    },
    {
      id: '4',
      name: 'Rapport Géographique',
      description: 'Analyse des données par localisation',
      type: 'geo',
      lastGenerated: '2025-01-12T14:20:00',
      frequency: 'Mensuel',
      size: '4.2 MB'
    }
  ];

  const recentReports = [
    {
      id: '1',
      name: 'Rapport_Sync_2025-01-15.pdf',
      generatedAt: '2025-01-15T10:30:00',
      size: '2.3 MB',
      status: 'ready'
    },
    {
      id: '2',
      name: 'Rapport_Users_2025-01-14.xlsx',
      generatedAt: '2025-01-14T16:45:00',
      size: '1.8 MB',
      status: 'ready'
    },
    {
      id: '3',
      name: 'Rapport_Performance_2025-01-13.pdf',
      generatedAt: '2025-01-13T09:15:00',
      size: '3.1 MB',
      status: 'ready'
    }
  ];

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'sync': return <BarChart3 size={20} className="text-blue-600" />;
      case 'users': return <Users size={20} className="text-green-600" />;
      case 'performance': return <TrendingUp size={20} className="text-purple-600" />;
      case 'geo': return <PieChart size={20} className="text-orange-600" />;
      default: return <FileText size={20} className="text-gray-600" />;
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'sync': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'users': return 'bg-green-100 text-green-800 border-green-200';
      case 'performance': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'geo': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
              <FileText size={24} className="text-white" />
            </div>
            <span>Rapports</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Génération et gestion des rapports d'analyse
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="7days">7 derniers jours</option>
              <option value="30days">30 derniers jours</option>
              <option value="90days">90 derniers jours</option>
              <option value="1year">Cette année</option>
            </select>
            
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="pdf">PDF</option>
              <option value="xlsx">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          
          <Button className="flex items-center space-x-2">
            <Download size={16} />
            <span>Générer rapport</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Rapports générés</p>
              <p className="text-2xl font-bold">{recentReports.length}</p>
            </div>
            <FileText size={24} className="text-blue-200" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Modèles actifs</p>
              <p className="text-2xl font-bold">{reportTemplates.length}</p>
            </div>
            <BarChart3 size={24} className="text-green-200" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Taille totale</p>
              <p className="text-2xl font-bold">
                {(recentReports.reduce((sum, r) => sum + parseFloat(r.size), 0)).toFixed(1)} MB
              </p>
            </div>
            <Download size={24} className="text-purple-200" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Automatisés</p>
              <p className="text-2xl font-bold">
                {reportTemplates.filter(r => r.frequency !== 'Manuel').length}
              </p>
            </div>
            <Calendar size={24} className="text-orange-200" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Templates */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Modèles de Rapports
            </h2>
            <Button variant="secondary" size="sm" className="flex items-center space-x-2">
              <Filter size={16} />
              <span>Filtrer</span>
            </Button>
          </div>
          
          <div className="space-y-4">
            {reportTemplates.map((template) => (
              <div key={template.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getReportTypeIcon(template.type)}
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {template.description}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getReportTypeColor(template.type)}`}>
                    {template.type}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span>Fréquence: {template.frequency}</span>
                    <span>Taille: {template.size}</span>
                  </div>
                  <span>
                    Dernière génération: {new Date(template.lastGenerated).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                
                <div className="flex items-center justify-end space-x-2 mt-3">
                  <Button variant="secondary" size="sm">
                    Configurer
                  </Button>
                  <Button size="sm" className="flex items-center space-x-1">
                    <Download size={14} />
                    <span>Générer</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Reports */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Rapports Récents
            </h2>
            <Button variant="secondary" size="sm">
              Voir tout
            </Button>
          </div>
          
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FileText size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                      {report.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Généré le {new Date(report.generatedAt).toLocaleDateString('fr-FR')} • {report.size}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    Prêt
                  </span>
                  <Button variant="secondary" size="sm" className="flex items-center space-x-1">
                    <Download size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Actions Rapides
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" size="sm" className="flex items-center justify-center space-x-2">
                <BarChart3 size={16} />
                <span>Rapport Express</span>
              </Button>
              <Button variant="secondary" size="sm" className="flex items-center justify-center space-x-2">
                <Calendar size={16} />
                <span>Planifier</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;