import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { KoBoService } from '../services/koboService';
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
    if (!config.token.trim()) {
      setMessage('Veuillez saisir votre token API KoboToolbox');
      return;
    }
    
    setTesting(true);
    setTestResult(null);
    setMessage('');
    
    try {
      console.log('🔑 Test avec token:', config.token.substring(0, 10) + '...');
      
      const koboService = new KoBoService(config.token);
      
      // Test avec l'Asset ID de test
      const assetId = 'a7h7L7wxkDxgtn3wGPePAr';
      console.log('📋 Asset ID:', assetId);
      console.log('🌐 URL de base:', koboService.baseUrl);
      
      // Test 1: Vérifier la connexion générale
      console.log('🧪 Test 1: Liste des assets...');
      const assets = await koboService.getAssets();
      console.log('✅ Connexion OK, assets trouvés:', assets.length);
      
      // Test 2: Vérifier l'asset spécifique
      console.log('🧪 Test 2: Données de l\'asset...');
      const data = await koboService.getAssetData(assetId);
      console.log('✅ Asset OK, données trouvées:', data.length);
      console.log('📊 Nombre d\'éléments:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('📝 Premier élément:', data[0]);
        console.log('🔑 Champs disponibles:', Object.keys(data[0] || {}));
      }
      
      setTestResult('success');
      setMessage(`Connexion réussie ! ${assets.length} projets trouvés, ${data.length} réponses dans l'asset`);
    } catch (error) {
      console.error('❌ Erreur détaillée:', error);
      setTestResult('error');
      
      if (error.message.includes('Token') || error.message.includes('401')) {
        setMessage('❌ Token invalide. Vérifiez votre token API dans les paramètres KoboToolbox.');
      } else if (error.message.includes('404')) {
        setMessage('❌ Asset non trouvé. Vérifiez l\'ID de votre projet KoboToolbox.');
      } else if (error.message.includes('CORS') || error.message.includes('fetch')) {
        setMessage('❌ Problème de connexion réseau. Réessayez dans quelques instants.');
      } else {
        setMessage(`❌ Erreur: ${error.message}`);
      }
    }
    
    setTesting(false);
    setTimeout(() => {
      setTestResult(null);
      setMessage('');
    }, 5000);
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
            
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🔐 Comment obtenir votre Token API KoboToolbox :</h3>
              <ol className="list-decimal ml-4 text-sm text-blue-700 space-y-1">
                <li>Connectez-vous sur <a href="https://kf.kobotoolbox.org" target="_blank" className="underline">kf.kobotoolbox.org</a></li>
                <li>Cliquez sur votre profil (en haut à droite)</li>
                <li>Allez dans <strong>"Account Settings"</strong></li>
                <li>Cherchez la section <strong>"API Token"</strong></li>
                <li>Copiez le token et collez-le ci-dessous</li>
              </ol>
            </div>
            
            <input
              type="password"
              value={config.token}
              onChange={(e) => setConfig({ ...config, token: e.target.value })}
              placeholder="Collez votre token API ici..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c5dfb3] focus:border-transparent"
              required
            />
            {!config.token && (
              <p className="text-sm text-red-600 mt-1">⚠️ Le token API est obligatoire pour accéder aux données</p>
            )}
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
              disabled={!config.token}
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