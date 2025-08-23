import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { CheckCircle, XCircle, Wifi } from 'lucide-react';

interface ApiConfig {
  url: string;
  token: string;
}

const ConfigPage: React.FC = () => {
  const [config, setConfig] = useState<ApiConfig>({ url: '', token: '' });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    loadConfig();
  }, [currentUser]);

  const loadConfig = async () => {
    if (!currentUser) return;
    
    try {
      const docRef = doc(db, 'user_settings', currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setConfig({ url: data.apiUrl || '', token: data.apiToken || '' });
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await setDoc(doc(db, 'user_settings', currentUser.uid), {
        apiUrl: config.url,
        apiToken: config.token,
        updatedAt: new Date(),
      }, { merge: true });
      
      setMessage('Configuration sauvegardée avec succès');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Erreur lors de la sauvegarde');
      setTimeout(() => setMessage(''), 3000);
    }
    setLoading(false);
  };

  const testConnection = async () => {
    if (!config.url) return;
    
    setTesting(true);
    setTestResult(null);
    
    try {
      // Valider l'URL
      try {
        new URL(config.url);
      } catch (urlError) {
        throw new Error('URL invalide. Vérifiez le format de l\'URL.');
      }
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      
      if (config.token) {
        // Support pour différents types d'authentification
        if (config.url.includes('kobotoolbox.org')) {
          headers['Authorization'] = `Token ${config.token}`;
        } else {
          headers['Authorization'] = `Bearer ${config.token}`;
        }
      }
      
      // Configuration de la requête avec gestion CORS
      const fetchOptions: RequestInit = {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'omit',
      };
      
      const response = await fetch(config.url, fetchOptions);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('text/html')) {
          setTestResult('error');
          setMessage('L\'URL semble pointer vers une page web. Utilisez un endpoint API qui retourne du JSON.');
        } else if (contentType && (contentType.includes('application/json') || contentType.includes('text/plain'))) {
          // Tester si c'est du JSON valide
          try {
            const testData = await response.json();
            setTestResult('success');
            
            // Message spécifique pour KoBoToolbox
            if (config.url.includes('kobotoolbox.org')) {
              if (config.url.includes('/assets')) {
                setMessage(`Connexion réussie ! ${Array.isArray(testData.results) ? testData.results.length : 'Plusieurs'} formulaire(s) trouvé(s).`);
              } else if (config.url.includes('/data/')) {
                setMessage('Connexion réussie ! Données de formulaire accessibles.');
              } else {
                setMessage('Connexion réussie ! Endpoint KoBoToolbox accessible.');
              }
            } else {
              setMessage('Connexion réussie ! L\'endpoint retourne du JSON valide.');
            }
          } catch (jsonError) {
            setTestResult('error');
            setMessage('L\'endpoint est accessible mais ne retourne pas du JSON valide.');
          }
        } else {
          setTestResult('success');
          setMessage(`Connexion réussie ! Type de contenu: ${contentType || 'non spécifié'}`);
        }
      } else {
        setTestResult('error');
        if (response.status === 404) {
          setMessage('Endpoint non trouvé (404). Vérifiez l\'URL.');
        } else if (response.status === 401) {
          if (config.url.includes('kobotoolbox.org')) {
            setMessage('Non autorisé (401). Vérifiez votre token KoBoToolbox. Format requis: Token YOUR_TOKEN');
          } else {
            setMessage('Non autorisé (401). Vérifiez votre token d\'authentification.');
          }
        } else if (response.status === 403) {
          setMessage('Accès interdit (403). Vérifiez vos permissions sur cette ressource.');
        } else {
          setMessage(`Erreur: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('Erreur de test de connexion:', error);
      setTestResult('error');
      if (error instanceof Error) {
        let errorMessage = error.message;
        
        // Messages d'erreur spécifiques
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Impossible de contacter l\'API. Vérifiez l\'URL et votre connexion internet.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Problème CORS. L\'API ne permet pas les requêtes depuis cette application.';
        } else if (error.message.includes('NetworkError')) {
          errorMessage = 'Erreur réseau. Vérifiez votre connexion internet.';
        }
        
        setMessage(`Erreur de connexion: ${errorMessage}`);
      } else {
        setMessage('Erreur de connexion inconnue');
      }
    }
    
    setTesting(false);
    setTimeout(() => {
      setTestResult(null);
      setMessage('');
    }, 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2d3436] mb-2">Configuration API</h1>
        <p className="text-gray-600">Configurez votre source de données API</p>
      </div>

      <Card>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#2d3436] mb-2">
              URL de l'API
            </label>
            <div className="text-xs text-gray-500 mb-2">
              <p className="mb-1">Exemples d'URLs :</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>KoBoToolbox: https://kf.kobotoolbox.org/api/v2/assets/</li>
                <li>Générique: https://jsonplaceholder.typicode.com/posts</li>
              </ul>
            </div>
            <input
              type="url"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              placeholder="https://kf.kobotoolbox.org/api/v2/assets/"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c5dfb3] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2d3436] mb-2">
              Token d'authentification (optionnel)
            </label>
            <div className="text-xs text-gray-500 mb-2">
              <p className="mb-1">Format selon l'API :</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>KoBoToolbox: Votre token API (sera automatiquement formaté)</li>
                <li>Autres APIs: Token Bearer standard</li>
              </ul>
            </div>
            <input
              type="password"
              value={config.token}
              onChange={(e) => setConfig({ ...config, token: e.target.value })}
              placeholder="Votre token API"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c5dfb3] focus:border-transparent"
            />
          </div>

          {/* Aide spécifique pour KoBoToolbox */}
          {config.url.includes('kobotoolbox.org') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Configuration KoBoToolbox</h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Pour lister vos formulaires :</strong></p>
                <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                  https://kf.kobotoolbox.org/api/v2/assets/
                </code>
                
                <p><strong>Pour récupérer les données d'un formulaire :</strong></p>
                <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                  https://kf.kobotoolbox.org/api/v2/assets/[UID_FORMULAIRE]/data/
                </code>
                
                <p><strong>Token API :</strong> Récupérez votre token depuis votre compte KoBoToolbox</p>
              </div>
            </div>
          )}

          {message && (
            <div className={`px-4 py-3 rounded-lg flex items-start space-x-2 ${
              testResult === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
              testResult === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {testResult === 'success' && <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />}
              {testResult === 'error' && <XCircle size={20} className="mt-0.5 flex-shrink-0" />}
              <span className="text-sm">{message}</span>
            </div>
          )}

          <div className="flex space-x-4">
            <Button
              onClick={testConnection}
              variant="secondary"
              loading={testing}
              disabled={!config.url}
              className="flex items-center space-x-2"
            >
              <Wifi size={20} />
              <span>Tester la connexion</span>
            </Button>

            <Button
              onClick={handleSave}
              loading={loading}
            >
              Sauvegarder
            </Button>
          </div>
        </div>
      </Card>

      {/* Guide d'utilisation */}
      <Card>
        <h2 className="text-lg font-semibold text-[#2d3436] mb-4">Guide d'utilisation</h2>
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <h3 className="font-medium text-[#2d3436] mb-2">KoBoToolbox</h3>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Connectez-vous à votre compte KoBoToolbox</li>
              <li>Allez dans Paramètres → Token API pour récupérer votre token</li>
              <li>Utilisez l'URL <code className="bg-gray-100 px-1 rounded">https://kf.kobotoolbox.org/api/v2/assets/</code> pour lister vos formulaires</li>
              <li>Pour les données d'un formulaire spécifique, ajoutez l'UID du formulaire : <code className="bg-gray-100 px-1 rounded">/api/v2/assets/[UID]/data/</code></li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-medium text-[#2d3436] mb-2">Autres APIs</h3>
            <p>Pour les autres APIs REST, utilisez l'URL de l'endpoint et le token d'authentification approprié. L'application supporte les formats JSON standards.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConfigPage;