import React, { useState, useEffect } from 'react';
import { X, Download, FileText, BarChart3, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import { PDFGenerator } from '../../utils/pdfGenerator';
import { ReportGenerator } from '../../utils/reportGenerator';
import { useAuth } from '../../context/AuthContext';

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

interface ReportGenerationModalProps {
  template: ReportTemplate;
  period: string;
  format: string;
  onGenerated: (reportData: any) => void;
  onClose: () => void;
}

const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({
  template,
  period,
  format,
  onGenerated,
  onClose
}) => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const { currentUser } = useAuth();

  const steps = [
    'Collecte des données...',
    'Analyse des métriques...',
    'Génération des graphiques...',
    'Compilation du rapport...',
    'Finalisation...'
  ];

  const generateReport = async () => {
    setGenerating(true);
    setProgress(0);
    setError('');
    setCompleted(false);

    try {
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      // Simulation de la génération de rapport avec étapes
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setProgress((i + 1) * 20);
        
        // Simulation du temps de traitement
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      }

      // Collecte des données réelles
      const periodDays = getPeriodDays(period);
      const reportDataCollection = await ReportGenerator.collectData(currentUser.uid, periodDays);
      
      // Génération du rapport selon le format
      const generatedReport = await generateReportData(reportDataCollection);
      setReportData(generatedReport);
      setCompleted(true);
      setProgress(100);
      setCurrentStep('Rapport généré avec succès !');

    } catch (err) {
      setError('Erreur lors de la génération du rapport. Veuillez réessayer.');
      console.error('Erreur de génération:', err);
    } finally {
      setGenerating(false);
    }
  };

  const getPeriodDays = (period: string): number => {
    switch (period) {
      case '7days': return 7;
      case '30days': return 30;
      case '90days': return 90;
      case '1year': return 365;
      default: return 30;
    }
  };

  const generateReportData = async (dataCollection: any): Promise<any> => {
    // Simulation de la génération de données basée sur le type de rapport
    const baseData = {
      name: `${template.name}_${new Date().toISOString().split('T')[0]}.${format}`,
      type: template.type,
      size: ReportGenerator.getEstimatedSize(
        dataCollection.syncData.length,
        template.config.includeCharts,
        template.config.includeDetails
      ),
      downloadUrl: `#report-${template.id}-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      config: {
        period,
        format,
        includeCharts: template.config.includeCharts,
        includeDetails: template.config.includeDetails
      },
      dataCollection
    };

    // Données spécifiques par type de rapport
    switch (template.type) {
      case 'sync':
        return {
          ...baseData,
          metrics: {
            totalSyncs: dataCollection.syncData.length,
            successRate: '95.2',
            avgDuration: 15,
            dataVolume: (dataCollection.syncData.length * 0.1).toFixed(1)
          }
        };
      
      case 'users':
        return {
          ...baseData,
          metrics: {
            activeUsers: dataCollection.userData.length,
            totalSessions: dataCollection.syncData.length,
            avgSessionDuration: 25,
            topUser: dataCollection.userData[0]?.name || 'N/A'
          }
        };
      
      case 'performance':
        return {
          ...baseData,
          metrics: {
            avgResponseTime: 750,
            errorRate: '2.1',
            uptime: '99.5',
            throughput: dataCollection.syncData.length * 10
          }
        };
      
      case 'geo':
        return {
          ...baseData,
          metrics: {
            regions: dataCollection.geoData.length,
            coordinates: dataCollection.geoData.reduce((sum: number, geo: any) => sum + geo.dataPoints, 0),
            coverage: '85.3',
            topRegion: dataCollection.geoData[0]?.name || 'N/A'
          }
        };
      
      default:
        return baseData;
    }
  };

  const handleDownload = () => {
    if (reportData) {
      try {
        let blob: Blob;
        
        // Générer le contenu selon le format
        if (format === 'pdf') {
          blob = PDFGenerator.generateReport({
            title: template.name,
            subtitle: template.description,
            period: getPeriodLabel(period),
            includeCharts: template.config.includeCharts,
            includeDetails: template.config.includeDetails,
            data: reportData.dataCollection
          });
        } else if (format === 'csv') {
          blob = ReportGenerator.generateCSVReport(reportData.dataCollection, template.config);
        } else {
          // Excel
          blob = ReportGenerator.generateExcelReport(reportData.dataCollection, template.config);
        }
        
        // Télécharger le fichier
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = reportData.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Notifier le parent que le rapport a été généré
        onGenerated(reportData);
      } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        setError('Erreur lors du téléchargement du rapport');
      }
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'sync': return <BarChart3 size={20} className="text-blue-600" />;
      case 'users': return <FileText size={20} className="text-green-600" />;
      case 'performance': return <Clock size={20} className="text-purple-600" />;
      case 'geo': return <FileText size={20} className="text-orange-600" />;
      default: return <FileText size={20} className="text-gray-600" />;
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '7days': return '7 derniers jours';
      case '30days': return '30 derniers jours';
      case '90days': return '90 derniers jours';
      case '1year': return 'Cette année';
      default: return period;
    }
  };

  useEffect(() => {
    // Démarrer automatiquement la génération
    generateReport();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              {getReportTypeIcon(template.type)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Génération de Rapport
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {template.name}
              </p>
            </div>
          </div>
          {!generating && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Configuration du rapport */}
          <Card className="bg-gray-50 dark:bg-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Configuration
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Période:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {getPeriodLabel(period)}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Format:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {format.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Graphiques:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {template.config.includeCharts ? 'Oui' : 'Non'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Détails:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {template.config.includeDetails ? 'Oui' : 'Non'}
                </span>
              </div>
            </div>
          </Card>

          {/* Barre de progression */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progression
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex items-center mt-3">
              {generating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
              ) : completed ? (
                <CheckCircle size={16} className="text-green-500 mr-2" />
              ) : error ? (
                <AlertCircle size={16} className="text-red-500 mr-2" />
              ) : null}
              <span className={`text-sm ${
                error ? 'text-red-600' : completed ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {error || currentStep}
              </span>
            </div>
          </div>

          {/* Résultats */}
          {completed && reportData && (
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3 mb-3">
                <CheckCircle size={20} className="text-green-600" />
                <h3 className="font-medium text-green-900 dark:text-green-300">
                  Rapport généré avec succès
                </h3>
              </div>
              <div className="space-y-2 text-sm text-green-800 dark:text-green-300">
                <p><strong>Nom:</strong> {reportData.name}</p>
                <p><strong>Taille:</strong> {reportData.size}</p>
                {reportData.metrics && (
                  <div className="mt-3">
                    <p className="font-medium mb-1">Aperçu des métriques:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(reportData.metrics).map(([key, value]) => (
                        <div key={key}>
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="ml-1 font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Erreur */}
          {error && (
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-3">
                <AlertCircle size={20} className="text-red-600" />
                <div>
                  <h3 className="font-medium text-red-900 dark:text-red-300">
                    Erreur de génération
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          {error && (
            <Button variant="secondary" onClick={generateReport}>
              Réessayer
            </Button>
          )}
          {completed ? (
            <>
              <Button variant="secondary" onClick={onClose}>
                Fermer
              </Button>
              <Button onClick={handleDownload} className="flex items-center space-x-2">
                <Download size={16} />
                <span>Télécharger</span>
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={onClose} disabled={generating}>
              {generating ? 'Génération en cours...' : 'Annuler'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGenerationModal;