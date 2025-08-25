import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { CheckCircle, XCircle, Wifi } from 'lucide-react';
import { XlsxUtils } from '../utils/xlsxUtils';
import { ApiUtils } from '../utils/apiUtils';

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
      // Vérifier si c'est un fichier XLSX
      if (XlsxUtils.isXlsxUrl(config.url)) {
        const validation = await XlsxUtils.validateXlsxUrl(config.url, config.token);
        
        if (validation.isValid) {
          setTestResult('success');
          setMessage(validation.message);
          
          // Afficher un échantillon des données si disponible
          if (validation.sampleData && validation.sampleData.length > 0) {
            const sampleKeys = Object.keys(validation.sampleData[0]).slice(0, 3);
            const sampleInfo = sampleKeys.length > 0 ? 
              ` Colonnes détectées: ${sampleKeys.join(', ')}${sampleKeys.length < Object.keys(validation.sampleData[0]).length ? '...' : ''}` : '';
            setMessage(validation.message + sampleInfo);
          }
        } else {
          setTestResult('error');
          setMessage(validation.message);
        }
        
        setTesting(false);
        setTimeout(() => {
          setTestResult(null);
          setMessage('');
        }, 5000);
        return;
      }
      
      // Utiliser ApiUtils pour gérer automatiquement les problèmes CORS
      const result = await ApiUtils.testConnection(config.url, config.token);
      
      if (result.success) {
        setTestResult('success');
        setMessage(result.message);
      } else {
        setTestResult('error');
        setMessage(result.message);
      }
    } catch (error) {
      console.error('Erreur de test de connexion:', error);
      setTestResult('error');
      setMessage(error instanceof Error ? error.message : 'Erreur de connexion inconnue');
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
                <li>Fichier Excel: https://example.com/data.xlsx</li>
                <li>Générique: https://jsonplaceholder.typicode.com/posts</li>
              </ul>
            </div>
            <input
              type="url"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              placeholder="https://kf.kobotoolbox.org/api/v2/assets/ ou https://example.com/data.xlsx"
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
                <li>Fichiers Excel protégés: Token d'authentification si requis</li>
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
                  https://kf.kobotoolbox.org/assets/[UID_FORMULAIRE]/submissions/?format=json
                </code>
                
                <p><strong>Token API :</strong> Récupérez votre token depuis votre compte KoBoToolbox</p>
              </div>
            </div>
          )}

          {/* Aide spécifique pour les fichiers XLSX */}
          {XlsxUtils.isXlsxUrl(config.url) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Configuration fichier Excel</h4>
              <div className="text-sm text-green-800 space-y-2">
                <p><strong>Format supporté :</strong> Fichiers .xlsx et .xls</p>
                <p><strong>Structure attendue :</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>La première ligne doit contenir les en-têtes de colonnes</li>
                  <li>Les données commencent à partir de la deuxième ligne</li>
                  <li>Seule la première feuille sera traitée</li>
                </ul>
                <p><strong>Token :</strong> Nécessaire uniquement si le fichier est protégé par authentification</p>
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
              <li>Pour les données d'un formulaire spécifique : <code className="bg-gray-100 px-1 rounded">https://kf.kobotoolbox.org/assets/[UID]/submissions/?format=json</code></li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-medium text-[#2d3436] mb-2">Fichiers Excel (.xlsx)</h3>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Assurez-vous que votre fichier Excel est accessible via une URL directe</li>
              <li>La première ligne doit contenir les noms des colonnes</li>
              <li>Les données doivent commencer à partir de la deuxième ligne</li>
              <li>Seule la première feuille du classeur sera traitée</li>
              <li>Si le fichier est protégé, fournissez le token d'authentification approprié</li>
            </ol>
          </div>
          
          <div>
            <h3 className="font-medium text-[#2d3436] mb-2">Autres APIs</h3>
            <p>Pour les autres APIs REST, utilisez l'URL de l'endpoint et le token d'authentification approprié. L'application supporte les formats JSON standards et gère automatiquement les problèmes CORS en utilisant un proxy si nécessaire.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConfigPage;