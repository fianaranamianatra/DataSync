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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (config.token) {
        headers['Authorization'] = `Bearer ${config.token}`;
      }
      
      const response = await fetch(config.url, { headers });
      
      if (response.ok) {
        setTestResult('success');
        setMessage('Connexion réussie !');
      } else {
        setTestResult('error');
        setMessage(`Erreur: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setTestResult('error');
      setMessage('Erreur de connexion');
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
            <input
              type="url"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              placeholder="https://api.exemple.com/data"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c5dfb3] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2d3436] mb-2">
              Token d'authentification (optionnel)
            </label>
            <input
              type="password"
              value={config.token}
              onChange={(e) => setConfig({ ...config, token: e.target.value })}
              placeholder="Votre token API"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c5dfb3] focus:border-transparent"
            />
          </div>

          {message && (
            <div className={`px-4 py-3 rounded-lg flex items-center space-x-2 ${
              testResult === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
              testResult === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {testResult === 'success' && <CheckCircle size={20} />}
              {testResult === 'error' && <XCircle size={20} />}
              <span>{message}</span>
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
    </div>
  );
};

export default ConfigPage;