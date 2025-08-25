import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import SyncTrendChart from '../components/Charts/SyncTrendChart';
import DataSourceDistribution from '../components/Charts/DataSourceDistribution';
import RecentSyncHistory from '../components/Dashboard/RecentSyncHistory';
import { RefreshCw, Database, Clock, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { XlsxUtils } from '../utils/xlsxUtils';
import { ApiUtils } from '../utils/apiUtils';
import { sanitizeFirestoreKeys } from '../utils/dataUtils';

interface Stats {
  totalRecords: number;
  lastSync: Date | null;
  apiStatus: 'connected' | 'disconnected' | 'unknown';
  totalSyncs: number;
  avgRecordsPerSync: number;
}

interface SyncRecord {
  id: string;
  createdAt: Date;
  recordCount: number;
  source: string;
  apiType: string;
  status: 'success' | 'error';
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalRecords: 0,
    lastSync: null,
    apiStatus: 'unknown',
    totalSyncs: 0,
    avgRecordsPerSync: 0,
  });
  const [syncHistory, setSyncHistory] = useState<SyncRecord[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    loadStats();
    loadChartData();
  }, [currentUser]);

  const loadStats = async () => {
    if (!currentUser) return;
    
    try {
      // Récupérer tous les enregistrements de synchronisation
      const dataQuery = query(
        collection(db, 'api_data'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const dataSnapshot = await getDocs(dataQuery);
      
      // Calculer les statistiques
      let totalRecords = 0;
      const syncRecords: SyncRecord[] = [];
      
      dataSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const recordCount = data.recordCount || (data.data ? data.data.length : 0);
        totalRecords += recordCount;
        
        syncRecords.push({
          id: doc.id,
          createdAt: data.createdAt.toDate(),
          recordCount,
          source: data.source || 'Inconnue',
          apiType: data.apiType || 'generic',
          status: 'success' // Par défaut, on considère que les syncs stockées sont réussies
        });
      });
      
      // Prendre les 10 synchronisations les plus récentes pour l'historique
      setSyncHistory(syncRecords.slice(0, 10));
      
      // Récupérer la dernière synchronisation
      const settingsDoc = await getDoc(doc(db, 'user_settings', currentUser.uid));
      const settings = settingsDoc.data();
      
      setStats({
        totalRecords,
        lastSync: settings?.lastSync?.toDate() || null,
        apiStatus: settings?.apiUrl ? 'connected' : 'disconnected',
        totalSyncs: dataSnapshot.size,
        avgRecordsPerSync: dataSnapshot.size > 0 ? Math.round(totalRecords / dataSnapshot.size) : 0,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
    
    setLoading(false);
  };

  const loadChartData = async () => {
    if (!currentUser) return;
    
    try {
      // Récupérer les données pour les graphiques (sans orderBy pour éviter l'index composite)
      const dataQuery = query(
        collection(db, 'api_data'),
        where('userId', '==', currentUser.uid)
      );
      const dataSnapshot = await getDocs(dataQuery);
      
      // Trier côté client et limiter aux 30 dernières synchronisations
      const sortedDocs = dataSnapshot.docs
        .sort((a, b) => b.data().createdAt.toDate().getTime() - a.data().createdAt.toDate().getTime())
        .slice(0, 30);
      
      // Préparer les données pour le graphique de tendance (ordre chronologique)
      const trendData = sortedDocs.reverse().map(doc => {
        const data = doc.data();
        const date = data.createdAt.toDate();
        return {
          date: date.toISOString(),
          records: data.recordCount || (data.data ? data.data.length : 0),
          formattedDate: date.toLocaleDateString('fr-FR')
        };
      });
      setChartData(trendData);
      
      // Préparer les données pour la répartition des sources
      const sourceCount: { [key: string]: number } = {};
      sortedDocs.forEach(doc => {
        const apiType = doc.data().apiType || 'generic';
        sourceCount[apiType] = (sourceCount[apiType] || 0) + 1;
      });
      
      const sourceDistribution = Object.entries(sourceCount).map(([type, count]) => {
        let name = 'Autre';
        let color = '#fdcb6e';
        
        switch (type) {
          case 'kobotoolbox':
            name = 'KoBoToolbox';
            color = '#c5dfb3';
            break;
          case 'xlsx':
            name = 'Excel';
            color = '#74b9ff';
            break;
          case 'generic':
            name = 'API Générique';
            color = '#fd79a8';
            break;
        }
        
        return { name, value: count, color };
      });
      
      setSourceData(sourceDistribution);
    } catch (error) {
      console.error('Erreur lors du chargement des données de graphique:', error);
    }
  };

  const syncData = async () => {
    if (!currentUser) return;
    
    setSyncing(true);
    setMessage('');
    
    try {
      // Récupérer la configuration API
      const settingsDoc = await getDoc(doc(db, 'user_settings', currentUser.uid));
      const settings = settingsDoc.data();
      
      if (!settings?.apiUrl) {
        setMessage('Configurez d\'abord votre API dans la page Configuration');
        setSyncing(false);
        return;
      }
      
      // Vérifier si c'est un fichier XLSX
      if (XlsxUtils.isXlsxUrl(settings.apiUrl)) {
        // Traitement spécifique pour les fichiers XLSX
        const xlsxResult = await XlsxUtils.fetchAndParseXlsx(settings.apiUrl, settings.apiToken);
        
        if (xlsxResult.data.length === 0) {
          setMessage('Synchronisation réussie, mais aucune donnée n\'a été trouvée dans le fichier Excel.');
          setSyncing(false);
          return;
        }
        
        // Limiter les données pour éviter les problèmes de taille
        const limitedData = xlsxResult.data.slice(0, 1000);
        
        // Sanitize field names to comply with Firestore restrictions
        const sanitizedData = sanitizeFirestoreKeys(limitedData);
        
        const docData = {
          data: sanitizedData,
          createdAt: new Date(),
          userId: currentUser.uid,
          source: settings.apiUrl,
          recordCount: sanitizedData.length,
          apiType: 'xlsx',
          sheetNames: xlsxResult.sheetNames,
          totalRowsInFile: xlsxResult.totalRows,
          status: 'success',
        };
        
        await setDoc(doc(db, 'api_data', `sync_${Date.now()}`), docData);
        
        // Mettre à jour la dernière synchronisation
        await setDoc(doc(db, 'user_settings', currentUser.uid), {
          ...settings,
          lastSync: new Date(),
        }, { merge: true });
        
        const totalMessage = xlsxResult.totalRows > 1000 ? 
          ` (${sanitizedData.length} sur ${xlsxResult.totalRows} lignes importées)` : '';
        setMessage(`Synchronisation Excel réussie ! ${sanitizedData.length} enregistrement${sanitizedData.length > 1 ? 's' : ''} synchronisé${sanitizedData.length > 1 ? 's' : ''}${totalMessage}.`);
        loadStats();
        loadChartData();
        setSyncing(false);
        setTimeout(() => setMessage(''), 5000);
        return;
      } else {
        // Traitement API JSON avec gestion automatique CORS
        const syncResult = await ApiUtils.syncData(settings.apiUrl, settings.apiToken);
        
        if (syncResult.data.length === 0) {
          setMessage('Synchronisation réussie, mais aucune donnée n\'a été trouvée.');
          setSyncing(false);
          return;
        }
        
        // Stocker les données dans Firestore
        const limitedData = syncResult.data.slice(0, 100); // Limiter à 100 éléments pour éviter les problèmes de taille
        
        // Sanitize field names to comply with Firestore restrictions
        const sanitizedData = sanitizeFirestoreKeys(limitedData);
        
        const docData = {
          data: sanitizedData,
          createdAt: new Date(),
          userId: currentUser.uid,
          source: settings.apiUrl,
          recordCount: sanitizedData.length,
          apiType: settings.apiUrl.includes('kobotoolbox.org') ? 'kobotoolbox' : 'generic',
          status: 'success',
        };
        
        await setDoc(doc(db, 'api_data', `sync_${Date.now()}`), docData);
        
        // Mettre à jour la dernière synchronisation
        await setDoc(doc(db, 'user_settings', currentUser.uid), {
          ...settings,
          lastSync: new Date(),
        }, { merge: true });
        
        let successMessage = `Synchronisation réussie ! ${sanitizedData.length} enregistrement${sanitizedData.length > 1 ? 's' : ''} synchronisé${sanitizedData.length > 1 ? 's' : ''}.`;
        if (syncResult.usedProxy) {
          successMessage += ' (via proxy CORS)';
        }
        setMessage(successMessage);
        loadStats();
        loadChartData();
      }
    } catch (error) {
      console.error('Erreur de synchronisation détaillée:', error);
      setMessage(`Erreur de synchronisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
    
    setSyncing(false);
    setTimeout(() => setMessage(''), 5000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-[#c5dfb3]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2d3436] mb-2">Dashboard</h1>
          <p className="text-gray-600">Vue d'ensemble de vos données</p>
        </div>
        
        <Button
          onClick={syncData}
          loading={syncing}
          className="flex items-center space-x-2"
        >
          <RefreshCw size={20} />
          <span>Synchroniser</span>
        </Button>
      </div>

      {message && (
        <Card className={`border-l-4 ${
          message.includes('Erreur') ? 'border-red-400 bg-red-50' : 'border-green-400 bg-green-50'
        }`}>
          <p className={message.includes('Erreur') ? 'text-red-700' : 'text-green-700'}>
            {message}
          </p>
        </Card>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-[#c5dfb3]">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-[#c5dfb3]/20 mr-4">
              <Database className="h-6 w-6 text-[#c5dfb3]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total des enregistrements</p>
              <p className="text-2xl font-bold text-[#2d3436]">{stats.totalRecords}</p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-blue-400">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Dernière synchronisation</p>
              <p className="text-lg font-semibold text-[#2d3436]">
                {stats.lastSync ? stats.lastSync.toLocaleDateString('fr-FR') : 'Jamais'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-purple-400">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total synchronisations</p>
              <p className="text-2xl font-bold text-[#2d3436]">{stats.totalSyncs}</p>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-orange-400">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 mr-4">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Moyenne par sync</p>
              <p className="text-2xl font-bold text-[#2d3436]">{stats.avgRecordsPerSync}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#2d3436]">Tendance des synchronisations</h2>
            <div className="p-2 rounded-full bg-[#c5dfb3]/20">
              <TrendingUp className="h-5 w-5 text-[#c5dfb3]" />
            </div>
          </div>
          <SyncTrendChart data={chartData} />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#2d3436]">Répartition des sources</h2>
            <div className="p-2 rounded-full bg-blue-100">
              <PieChart className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <DataSourceDistribution data={sourceData} />
        </Card>
      </div>

      {/* Historique des synchronisations récentes */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#2d3436]">Synchronisations récentes</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              stats.apiStatus === 'connected' ? 'bg-green-400' : 
              stats.apiStatus === 'disconnected' ? 'bg-red-400' : 'bg-gray-400'
            }`}></div>
            <span className={`text-sm font-medium ${
              stats.apiStatus === 'connected' ? 'text-green-600' : 
              stats.apiStatus === 'disconnected' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {stats.apiStatus === 'connected' ? 'API Connectée' : 
               stats.apiStatus === 'disconnected' ? 'API Non configurée' : 'Statut inconnu'}
            </span>
          </div>
        </div>
        <RecentSyncHistory records={syncHistory} />
      </Card>

      {/* Actions rapides - Mise à jour avec navigation */}
      <Card>
        <h2 className="text-lg font-semibold text-[#2d3436] mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg hover:border-[#c5dfb3] transition-colors">
            <h3 className="font-medium text-[#2d3436] mb-2">Configuration API</h3>
            <p className="text-sm text-gray-600 mb-3">
              Configurez votre source de données (API ou fichier Excel) et testez la connexion.
            </p>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => window.location.href = '/config'}
            >
              Configurer
            </Button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg hover:border-[#c5dfb3] transition-colors">
            <h3 className="font-medium text-[#2d3436] mb-2">Visualiser les données</h3>
            <p className="text-sm text-gray-600 mb-3">
              Explorez et exportez vos données synchronisées.
            </p>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => window.location.href = '/data'}
            >
              Voir les données
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;