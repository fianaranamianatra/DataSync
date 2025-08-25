import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { RefreshCw, Database, Clock, TrendingUp } from 'lucide-react';
import { XlsxUtils } from '../utils/xlsxUtils';

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
        
        const docData = {
          data: limitedData,
          createdAt: new Date(),
          userId: currentUser.uid,
          source: settings.apiUrl,
          recordCount: limitedData.length,
          apiType: 'xlsx',
          sheetNames: xlsxResult.sheetNames,
          totalRowsInFile: xlsxResult.totalRows,
        };
        
        await setDoc(doc(db, 'api_data', `sync_${Date.now()}`), docData);
        
        // Mettre à jour la dernière synchronisation
        await setDoc(doc(db, 'user_settings', currentUser.uid), {
          ...settings,
          lastSync: new Date(),
        }, { merge: true });
        
        const totalMessage = xlsxResult.totalRows > 1000 ? 
          ` (${limitedData.length} sur ${xlsxResult.totalRows} lignes importées)` : '';
        setMessage(`Synchronisation Excel réussie ! ${limitedData.length} enregistrement${limitedData.length > 1 ? 's' : ''} synchronisé${limitedData.length > 1 ? 's' : ''}${totalMessage}.`);
        loadStats();
        setSyncing(false);
        setTimeout(() => setMessage(''), 5000);
        return;
      } else {
        // Traitement API JSON existant
        // Valider l'URL
        let apiUrl: URL;
        try {
          apiUrl = new URL(settings.apiUrl);
        } catch (urlError) {
          throw new Error('L\'URL de l\'API n\'est pas valide. Vérifiez le format de l\'URL.');
        }
        
        // Appeler l'API
        const headers: Record<string, string> = {
          'Accept': 'application/json',
        };
        
        if (settings.apiToken) {
          // Support pour différents types d'authentification
          if (settings.apiUrl.includes('kobotoolbox.org')) {
            headers['Authorization'] = `Token ${settings.apiToken}`;
          } else {
            headers['Authorization'] = `Bearer ${settings.apiToken}`;
          }
        }
        
        // Configuration de la requête avec gestion CORS
        const fetchOptions: RequestInit = {
          method: 'GET',
          headers,
          mode: 'cors',
          credentials: 'omit',
        };
        
        const response = await fetch(settings.apiUrl, fetchOptions);
        
        if (!response.ok) {
          // Gérer les erreurs HTTP spécifiques
          if (response.status === 404) {
            throw new Error(`Endpoint non trouvé (404). Vérifiez que l'URL "${settings.apiUrl}" est correcte.`);
          } else if (response.status === 401) {
            throw new Error('Non autorisé (401). Vérifiez votre token d\'authentification.');
          } else if (response.status === 403) {
            throw new Error('Accès interdit (403). Vérifiez vos permissions.');
          } else if (response.status >= 500) {
            throw new Error(`Erreur serveur (${response.status}). Le serveur API rencontre des problèmes.`);
          } else {
            throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
          }
        }
        
        // Vérifier le type de contenu de la réponse
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('text/html')) {
          throw new Error(`L'URL semble pointer vers une page web (HTML) plutôt qu'un endpoint API. Vérifiez que l'URL "${settings.apiUrl}" est bien un endpoint API qui retourne du JSON.`);
        }
        
        if (contentType && !contentType.includes('application/json') && !contentType.includes('text/plain')) {
          throw new Error(`L'API ne retourne pas du JSON. Type de contenu reçu: ${contentType}. L'endpoint doit retourner du JSON (application/json).`);
        }
        
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          throw new Error('La réponse de l\'API n\'est pas un JSON valide. Vérifiez que l\'endpoint retourne du JSON correctement formaté.');
        }
        
        // Valider que nous avons des données
        if (data === null || data === undefined) {
          throw new Error('L\'API a retourné des données vides.');
        }
        
        // Convertir en tableau si ce n'est pas déjà le cas
        let dataArray: any[];
        if (Array.isArray(data)) {
          dataArray = data;
        } else if (typeof data === 'object' && data !== null) {
          // Gestion spécifique pour KoBoToolbox
          if (data.results && Array.isArray(data.results)) {
            dataArray = data.results;
          } else if (data.data && Array.isArray(data.data)) {
            dataArray = data.data;
          } else if (data.items && Array.isArray(data.items)) {
            dataArray = data.items;
          } else if (settings.apiUrl.includes('kobotoolbox.org') && (settings.apiUrl.includes('/data/') || settings.apiUrl.includes('/submissions/'))) {
            // Pour les données de formulaire KoBoToolbox, les données sont directement dans l'objet
            dataArray = [data];
          } else {
            // Traiter l'objet comme un seul élément
            dataArray = [data];
          }
        } else if (typeof data === 'object') {
          dataArray = [data];
        } else {
          throw new Error('Format de données non supporté. L\'API doit retourner un objet JSON ou un tableau.');
        }
        
        if (dataArray.length === 0) {
          setMessage('Synchronisation réussie, mais aucune donnée n\'a été trouvée.');
          setSyncing(false);
          return;
        }
        
        // Stocker les données dans Firestore
        const limitedData = dataArray.slice(0, 100); // Limiter à 100 éléments pour éviter les problèmes de taille
        
        const docData = {
          data: limitedData,
          createdAt: new Date(),
          userId: currentUser.uid,
          source: settings.apiUrl,
          recordCount: limitedData.length,
          apiType: settings.apiUrl.includes('kobotoolbox.org') ? 'kobotoolbox' : 'generic',
        };
        
        await setDoc(doc(db, 'api_data', `sync_${Date.now()}`), docData);
        
        // Mettre à jour la dernière synchronisation
        await setDoc(doc(db, 'user_settings', currentUser.uid), {
          ...settings,
          lastSync: new Date(),
        }, { merge: true });
        
        setMessage(`Synchronisation réussie ! ${limitedData.length} enregistrement${limitedData.length > 1 ? 's' : ''} synchronisé${limitedData.length > 1 ? 's' : ''}.`);
        loadStats();
      }
    } catch (error) {
      console.error('Erreur de synchronisation détaillée:', error);
      if (error instanceof Error) {
        let errorMessage = error.message;
        
        // Messages d'erreur spécifiques pour les problèmes courants
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Impossible de contacter la source de données. Vérifiez votre connexion internet et que l\'URL est correcte.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Problème CORS détecté. La source de données ne permet pas les requêtes depuis cette application web.';
        } else if (error.message.includes('NetworkError')) {
          errorMessage = 'Erreur réseau. Vérifiez votre connexion internet et l\'URL.';
        }
        
        setMessage(`Erreur de synchronisation: ${errorMessage}`);
      } else {
        setMessage('Erreur de synchronisation inconnue');
      }
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
              Configurez votre source de données (API ou fichier Excel) et testez la connexion.
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