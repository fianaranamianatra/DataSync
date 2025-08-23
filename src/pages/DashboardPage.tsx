import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { RefreshCw, Database, Clock, TrendingUp } from 'lucide-react';

interface Stats {
  totalRecords: number;
  lastSync: Date | null;
  apiStatus: 'connected' | 'disconnected' | 'unknown';
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalRecords: 0,
    lastSync: null,
    apiStatus: 'unknown',
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    loadStats();
  }, [currentUser]);

  const loadStats = async () => {
    if (!currentUser) return;
    
    try {
      // Récupérer le nombre total d'enregistrements
      const dataQuery = query(
        collection(db, 'api_data'),
        orderBy('createdAt', 'desc')
      );
      const dataSnapshot = await getDocs(dataQuery);
      
      // Récupérer la dernière synchronisation
      const settingsDoc = await getDoc(doc(db, 'user_settings', currentUser.uid));
      const settings = settingsDoc.data();
      
      setStats({
        totalRecords: dataSnapshot.size,
        lastSync: settings?.lastSync?.toDate() || null,
        apiStatus: settings?.apiUrl ? 'connected' : 'disconnected',
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
    
    setLoading(false);
  };

  const syncData = async () => {
    if (!currentUser) return;
    
    setSyncing(true);
    setMessage('');
    
    try {
      const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=';
      const targetUrl = 'https://kf.kobotoolbox.org/api/v2/assets/a7h7L7wxkDxgtn3wGPePAr/data.json';
      const finalUrl = proxyUrl + encodeURIComponent(targetUrl);

      // Requête simple sans headers d'authentification
      const response = await fetch(finalUrl, {
        method: 'GET',
        mode: 'cors'
      });

      const data = await response.json();
      console.log('Données récupérées:', data);
      
      // Convertir en tableau si ce n'est pas déjà le cas
      let dataArray: any[] = Array.isArray(data) ? data : [data];
      
      if (dataArray.length === 0) {
        setMessage('Synchronisation réussie, mais aucune donnée n\'a été trouvée.');
        setSyncing(false);
        return;
      }
      
      // Stocker les données dans Firestore (simulation)
      // Dans une vraie app, vous stockeriez chaque élément séparément
      const limitedData = dataArray.slice(0, 100); // Limiter à 100 éléments pour éviter les problèmes de taille
      
      const docData = {
        data: limitedData,
        createdAt: new Date(),
        userId: currentUser.uid,
        source: targetUrl,
        recordCount: limitedData.length,
        apiType: 'kobotoolbox',
      };
      
      await setDoc(doc(db, 'api_data', `sync_${Date.now()}`), docData);
      
      // Mettre à jour la dernière synchronisation
      await setDoc(doc(db, 'user_settings', currentUser.uid), {
        lastSync: new Date(),
      }, { merge: true });
      
      setMessage(`Synchronisation réussie ! ${limitedData.length} enregistrement${limitedData.length > 1 ? 's' : ''} synchronisé${limitedData.length > 1 ? 's' : ''}.`);
      loadStats();
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <Card className="border-l-4 border-green-400">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Statut API</p>
              <p className={`text-lg font-semibold ${
                stats.apiStatus === 'connected' ? 'text-green-600' : 
                stats.apiStatus === 'disconnected' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {stats.apiStatus === 'connected' ? 'Connecté' : 
                 stats.apiStatus === 'disconnected' ? 'Non configuré' : 'Inconnu'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <h2 className="text-lg font-semibold text-[#2d3436] mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-[#2d3436] mb-2">Configuration API</h3>
            <p className="text-sm text-gray-600 mb-3">
              Configurez votre source de données et testez la connexion.
            </p>
            <Button variant="secondary" size="sm">
              Configurer
            </Button>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-[#2d3436] mb-2">Visualiser les données</h3>
            <p className="text-sm text-gray-600 mb-3">
              Explorez et exportez vos données synchronisées.
            </p>
            <Button variant="secondary" size="sm">
              Voir les données
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;