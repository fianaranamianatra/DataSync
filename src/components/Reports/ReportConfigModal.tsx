import React, { useState } from 'react';
import { X, Save, Calendar, FileText, Settings, BarChart3 } from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';

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

interface ReportConfigModalProps {
  template: ReportTemplate;
  onSave: (template: ReportTemplate) => void;
  onClose: () => void;
}

const ReportConfigModal: React.FC<ReportConfigModalProps> = ({
  template,
  onSave,
  onClose
}) => {
  const [config, setConfig] = useState(template);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
    setSaving(false);
  };

  const updateConfig = (key: string, value: any) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      setConfig(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setConfig(prev => ({ ...prev, [key]: value }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Configuration du Rapport
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {config.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations générales */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Informations générales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du rapport
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => updateConfig('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fréquence
                </label>
                <select
                  value={config.frequency}
                  onChange={(e) => updateConfig('frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Manuel">Manuel</option>
                  <option value="Quotidien">Quotidien</option>
                  <option value="Hebdomadaire">Hebdomadaire</option>
                  <option value="Mensuel">Mensuel</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={config.description}
                onChange={(e) => updateConfig('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Configuration du contenu */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Configuration du contenu
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Format de sortie
                </label>
                <select
                  value={config.config.format}
                  onChange={(e) => updateConfig('config.format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="xlsx">Excel (XLSX)</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Période de données (jours)
                </label>
                <select
                  value={config.config.dateRange}
                  onChange={(e) => updateConfig('config.dateRange', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value={7}>7 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={90}>90 jours</option>
                  <option value={365}>1 an</option>
                </select>
              </div>
            </div>
          </div>

          {/* Options d'inclusion */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Options d'inclusion
            </h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.config.includeCharts}
                  onChange={(e) => updateConfig('config.includeCharts', e.target.checked)}
                  className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <BarChart3 size={16} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Inclure les graphiques et visualisations
                  </span>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.config.includeDetails}
                  onChange={(e) => updateConfig('config.includeDetails', e.target.checked)}
                  className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <FileText size={16} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Inclure les données détaillées
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Configuration spécifique par type */}
          {config.type === 'sync' && (
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-3">
                Configuration Rapport de Synchronisation
              </h4>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <p>• Analyse des tendances de synchronisation</p>
                <p>• Métriques de performance par source</p>
                <p>• Détection des anomalies</p>
                <p>• Recommandations d'optimisation</p>
              </div>
            </Card>
          )}

          {config.type === 'users' && (
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-900 dark:text-green-300 mb-3">
                Configuration Rapport Utilisateurs
              </h4>
              <div className="space-y-2 text-sm text-green-800 dark:text-green-300">
                <p>• Statistiques d'activité par utilisateur</p>
                <p>• Analyse comportementale</p>
                <p>• Répartition des rôles et permissions</p>
                <p>• Tendances d'utilisation</p>
              </div>
            </Card>
          )}

          {config.type === 'performance' && (
            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-3">
                Configuration Rapport Performance
              </h4>
              <div className="space-y-2 text-sm text-purple-800 dark:text-purple-300">
                <p>• Métriques de temps de réponse</p>
                <p>• Analyse des erreurs et incidents</p>
                <p>• Utilisation des ressources système</p>
                <p>• Alertes et seuils de performance</p>
              </div>
            </Card>
          )}

          {config.type === 'geo' && (
            <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <h4 className="font-medium text-orange-900 dark:text-orange-300 mb-3">
                Configuration Rapport Géographique
              </h4>
              <div className="space-y-2 text-sm text-orange-800 dark:text-orange-300">
                <p>• Répartition géographique des données</p>
                <p>• Analyse par région et zone</p>
                <p>• Cartes de densité et heatmaps</p>
                <p>• Statistiques de couverture territoriale</p>
              </div>
            </Card>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} loading={saving} className="flex items-center space-x-2">
            <Save size={16} />
            <span>Sauvegarder</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportConfigModal;