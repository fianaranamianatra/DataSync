import React from 'react';
import { CheckCircle, XCircle, Clock, Database } from 'lucide-react';

interface SyncRecord {
  id: string;
  createdAt: Date;
  recordCount: number;
  source: string;
  apiType: string;
  status: 'success' | 'error';
}

interface RecentSyncHistoryProps {
  records: SyncRecord[];
}

const RecentSyncHistory: React.FC<RecentSyncHistoryProps> = ({ records }) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <Clock size={48} className="mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun historique</h3>
        <p className="text-gray-600">
          Les synchronisations récentes apparaîtront ici.
        </p>
      </div>
    );
  }

  const getApiTypeLabel = (apiType: string) => {
    switch (apiType) {
      case 'kobotoolbox':
        return 'KoBoToolbox';
      case 'xlsx':
        return 'Excel';
      case 'generic':
        return 'API Générique';
      default:
        return 'Autre';
    }
  };

  const getApiTypeColor = (apiType: string) => {
    switch (apiType) {
      case 'kobotoolbox':
        return 'bg-green-100 text-green-800';
      case 'xlsx':
        return 'bg-blue-100 text-blue-800';
      case 'generic':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${record.status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
              {record.status === 'success' ? (
                <CheckCircle size={16} className="text-green-600" />
              ) : (
                <XCircle size={16} className="text-red-600" />
              )}
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {record.recordCount} enregistrement{record.recordCount > 1 ? 's' : ''}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getApiTypeColor(record.apiType)}`}>
                  {getApiTypeLabel(record.apiType)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {record.createdAt.toLocaleDateString('fr-FR')} à {record.createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center text-gray-400">
            <Database size={16} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentSyncHistory;