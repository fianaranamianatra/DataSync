import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, Calendar, TrendingUp, BarChart3, PieChart, Users, Settings, Clock, Play, Plus, RefreshCw } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import ReportConfigModal from '../components/Reports/ReportConfigModal';
import ReportGenerationModal from '../components/Reports/ReportGenerationModal';
import { ReportGenerator } from '../utils/reportGenerator';
import { useAuth } from '../context/AuthContext';
import { collection, query, orderBy, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'sync' | 'users' | 'performance' | 'geo';
  lastGenerated: string;
  frequency: 'Quotidien' | 'Hebdomadaire' | 'Mensuel' | 'Manuel';
  size: string;
  config: {
    includeCharts: boolean;
    includeDetails: boolean;
    format: 'pdf' | 'xlsx' | 'csv';
    dateRange: number;
  };
}

interface GeneratedReport {
  id: string;
  name: string;
  generatedAt: string;
  size: string;
  status: 'ready' | 'generating' | 'error';
  downloadUrl?: string;
  type: string;
}

const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [filterType, setFilterType] = useState<string>('all');
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { currentUser } = useAuth();

  // Données par défaut des modèles de rapports
  const defaultTemplates: ReportTemplate[] = [
    {
      id: '1',
      name: 'Rapport de Synchronisation',
      description: 'Analyse détaillée des synchronisations de données avec métriques de performance',
      type: 'sync',
      lastGenerated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      frequency: 'Hebdomadaire',
      size: '2.3 MB',
      config: {
        includeCharts: true,
        includeDetails: true,
        format: 'pdf',
        dateRange: 30
      }
    },
    {
      id: '2',
      name: 'Rapport d\'Activité Utilisateurs',
      description: 'Statistiques d\'utilisation par utilisateur avec analyse comportementale',
      type: 'users',
      lastGenerated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      frequency: 'Mensuel',
      size: '1.8 MB',
      config: {
        includeCharts: true,
        includeDetails: false,
        format: 'xlsx',
        dateRange: 90
      }
    },
    {
      id: '3',
      name: 'Rapport de Performance',
      description: 'Métriques de performance système avec alertes et recommandations',
      type: 'performance',
      lastGenerated: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      frequency: 'Quotidien',
      size: '3.1 MB',
      config: {
        includeCharts: true,
        includeDetails: true,
        format: 'pdf',
        dateRange: 7
      }
    },
    {
      id: '4',
      name: 'Rapport Géographique',
      description: 'Analyse des données par localisation avec cartes et statistiques régionales',
      type: 'geo',
      lastGenerated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      frequency: 'Mensuel',
      size: '4.2 MB',
      config: {
        includeCharts: true,
        includeDetails: true,
        format: 'pdf',
        dateRange: 30
      }
    }
  ];

  useEffect(() => {
    loadReportTemplates();
    loadGeneratedReports();
  }, [currentUser]);

  const loadReportTemplates = async () => {
    if (!currentUser) return;
    
    try {
      const docRef = doc(db, 'report_templates', currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setReportTemplates(docSnap.data().templates || defaultTemplates);
      } else {
        // Sauvegarder les modèles par défaut
        await setDoc(docRef, { templates: defaultTemplates });
        setReportTemplates(defaultTemplates);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des modèles:', error);
      setReportTemplates(defaultTemplates);
    }
  };

  const loadGeneratedReports = async () => {
    if (!currentUser) return;
    
    try {
      const reportsQuery = query(
        collection(db, 'generated_reports'),
        orderBy('generatedAt', 'desc')
      );
      const snapshot = await getDocs(reportsQuery);
      
      const reports: GeneratedReport[] = snapshot.docs
        .filter(doc => doc.data().userId === currentUser.uid)
        .slice(0, 10)
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as GeneratedReport));
      
      setGeneratedReports(reports);
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
      // Données simulées en cas d'erreur
      setGeneratedReports([
        {
          id: '1',
          name: 'Rapport_Sync_2025-01-15.pdf',
          generatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          size: '2.3 MB',
          status: 'ready',
          type: 'sync'
        },
        {
          id: '2',
          name: 'Rapport_Users_2025-01-14.xlsx',
          generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          size: '1.8 MB',
          status: 'ready',
          type: 'users'
        }
      ]);
    }
  };

  const handleConfigureReport = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setConfigModalOpen(true);
  };

  const handleGenerateReport = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setGenerateModalOpen(true);
  };

  const handleSaveTemplate = async (updatedTemplate: ReportTemplate) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const updatedTemplates = reportTemplates.map(t => 
        t.id === updatedTemplate.id ? updatedTemplate : t
      );
      
      await setDoc(doc(db, 'report_templates', currentUser.uid), {
        templates: updatedTemplates
      });
      
      setReportTemplates(updatedTemplates);
      setConfigModalOpen(false);
      
      // Mettre à jour la date de dernière modification
      const updatedTemplate2 = { ...updatedTemplate, lastGenerated: new Date().toISOString() };
      const finalTemplates = reportTemplates.map(t => 
        t.id === updatedTemplate2.id ? updatedTemplate2 : t
      );
      setReportTemplates(finalTemplates);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de la configuration');
    }
    setLoading(false);
  };

  const handleReportGenerated = async (reportData: any) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const newReport: GeneratedReport = {
        id: `report_${Date.now()}`,
        name: reportData.name,
        generatedAt: new Date().toISOString(),
        size: reportData.size,
        status: 'ready',
        type: reportData.type,
        downloadUrl: reportData.downloadUrl
      };
      
      await setDoc(doc(db, 'generated_reports', newReport.id), {
        ...newReport,
        userId: currentUser.uid
      });
      
      setGeneratedReports([newReport, ...generatedReports]);
      setGenerateModalOpen(false);
      
      // Mettre à jour la date de dernière génération du template
      const updatedTemplates = reportTemplates.map(t => 
        t.id === selectedTemplate?.id ? { ...t, lastGenerated: new Date().toISOString() } : t
      );
      setReportTemplates(updatedTemplates);
      
      // Sauvegarder les templates mis à jour
      await setDoc(doc(db, 'report_templates', currentUser.uid), {
        templates: updatedTemplates
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du rapport:', error);
      alert('Erreur lors de la sauvegarde du rapport généré');
    }
    setLoading(false);
  };

  const handleDownloadReport = (report: GeneratedReport) => {
    try {
      // Simulation du téléchargement avec génération de contenu
      const content = `Rapport: ${report.name}\nGénéré le: ${new Date(report.generatedAt).toLocaleDateString('fr-FR')}\nTaille: ${report.size}\n\nContenu du rapport simulé...`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = report.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log(`Téléchargement du rapport: ${report.name}`);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du rapport');
    }
  };

  const handleQuickReport = () => {
    if (loading) return;
    
    try {
      // Créer un template de rapport express
      const quickTemplate: ReportTemplate = {
        id: 'quick-report',
        name: 'Rapport Express',
        description: 'Rapport rapide avec les données actuelles',
        type: 'sync',
        lastGenerated: new Date().toISOString(),
        frequency: 'Manuel',
        size: '1.5 MB',
        config: {
          includeCharts: true,
          includeDetails: false,
          format: selectedFormat as 'pdf' | 'xlsx' | 'csv',
          dateRange: parseInt(selectedPeriod.replace('days', '')) || 30
        }
      };
      
      setSelectedTemplate(quickTemplate);
      setGenerateModalOpen(true);
    } catch (error) {
      console.error('Erreur lors de la création du rapport express:', error);
      alert('Erreur lors de la création du rapport express');
    }
  };

  const handleScheduleReport = () => {
    if (loading) return;
    
    try {
      // Trouver un template automatisé ou créer un nouveau
      let template = reportTemplates.find(t => t.frequency !== 'Manuel');
      
      if (!template) {
        // Créer un template de planification par défaut
        template = {
          id: 'scheduled-report',
          name: 'Rapport Planifié',
          description: 'Rapport automatique généré selon la fréquence définie',
          type: 'sync',
          lastGenerated: new Date().toISOString(),
          frequency: 'Hebdomadaire',
          size: '2.0 MB',
          config: {
            includeCharts: true,
            includeDetails: true,
            format: 'pdf',
            dateRange: 30
          }
        };
      }
      
      setSelectedTemplate(template);
      setConfigModalOpen(true);
    } catch (error) {
      console.error('Erreur lors de la planification:', error);
      alert('Erreur lors de la configuration de la planification');
    }
  };

  const handleRefreshReports = async () => {
    setRefreshing(true);
    try {
      await loadGeneratedReports();
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error);
      alert('Erreur lors de l\'actualisation des rapports');
    }
    setRefreshing(false);
  };

  const handleFilterChange = (newFilterType: string) => {
    setFilterType(newFilterType);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod);
  };

  const handleFormatChange = (newFormat: string) => {
    setSelectedFormat(newFormat);
  };

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

  const filteredTemplates = reportTemplates.filter(template => 
    filterType === 'all' || template.type === filterType
  );

  const periodOptions = [
    { value: '7days', label: '7 derniers jours' },
    { value: '30days', label: '30 derniers jours' },
    { value: '90days', label: '90 derniers jours' },
    { value: '1year', label: 'Cette année' }
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'xlsx', label: 'Excel' },
    { value: 'csv', label: 'CSV' }
  ];

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
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {periodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={selectedFormat}
              onChange={(e) => handleFormatChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {formatOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <Button 
            className="flex items-center space-x-2"
            onClick={handleQuickReport}
            loading={loading}
            disabled={loading}
          >
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
              <p className="text-2xl font-bold">{generatedReports.length}</p>
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
                {(generatedReports.reduce((sum, r) => sum + parseFloat(r.size), 0)).toFixed(1)} MB
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
            <div className="flex items-center space-x-2">
              <select
                value={filterType}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Tous les types</option>
                <option value="sync">Synchronisation</option>
                <option value="users">Utilisateurs</option>
                <option value="performance">Performance</option>
                <option value="geo">Géographique</option>
              </select>
              <Button 
                variant="secondary" 
                size="sm" 
                className="flex items-center space-x-2"
                onClick={() => handleFilterChange('all')}
              >
                <Filter size={16} />
                <span>Réinitialiser</span>
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredTemplates.map((template) => (
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
                
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center space-x-4">
                    <span>Fréquence: {template.frequency}</span>
                    <span>Taille: {template.size}</span>
                    <span>Format: {template.config.format.toUpperCase()}</span>
                  </div>
                  <span>
                    Dernière génération: {new Date(template.lastGenerated).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                
                <div className="flex items-center justify-end space-x-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleConfigureReport(template)}
                    disabled={loading}
                    className="flex items-center space-x-1"
                  >
                    <Settings size={14} />
                    <span>Configurer</span>
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex items-center space-x-1"
                    onClick={() => handleGenerateReport(template)}
                    disabled={loading}
                  >
                    <Play size={14} />
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
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleRefreshReports}
              loading={refreshing}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw size={14} />
              <span>Actualiser</span>
            </Button>
          </div>
          
          <div className="space-y-3">
            {generatedReports.map((report) => (
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
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    report.status === 'ready' ? 'text-green-600 bg-green-100' :
                    report.status === 'generating' ? 'text-blue-600 bg-blue-100' :
                    'text-red-600 bg-red-100'
                  }`}>
                    {report.status === 'ready' ? 'Prêt' :
                     report.status === 'generating' ? 'En cours' : 'Erreur'}
                  </span>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex items-center space-x-1"
                    onClick={() => handleDownloadReport(report)}
                    disabled={report.status !== 'ready'}
                  >
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
              <Button 
                variant="secondary" 
                size="sm" 
                className="flex items-center justify-center space-x-2"
                onClick={handleQuickReport}
                disabled={loading}
              >
                <BarChart3 size={16} />
                <span>Rapport Express</span>
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="flex items-center justify-center space-x-2"
                onClick={handleScheduleReport}
                disabled={loading}
              >
                <Calendar size={16} />
                <span>Planifier</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      {configModalOpen && selectedTemplate && (
        <ReportConfigModal
          template={selectedTemplate}
          onSave={handleSaveTemplate}
          onClose={() => setConfigModalOpen(false)}
        />
      )}

      {generateModalOpen && selectedTemplate && (
        <ReportGenerationModal
          template={selectedTemplate}
          period={selectedPeriod}
          format={selectedFormat}
          onGenerated={handleReportGenerated}
          onClose={() => setGenerateModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ReportsPage;