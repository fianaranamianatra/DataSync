import React, { useState } from 'react';
import { MapPin, Navigation, Globe, Users, Filter, Search } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const GeolocationPage: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'map' | 'list'>('map');

  // Données simulées pour la géolocalisation
  const locationData = [
    {
      id: '1',
      user: 'Alice Martin',
      location: { lat: -18.919671, lng: 47.523901, address: 'Antaniavo, Antohomadinika' },
      timestamp: '2025-01-15T07:46:50',
      accuracy: 5
    },
    {
      id: '2',
      user: 'Bob Dupont',
      location: { lat: -18.925671, lng: 47.530901, address: 'Ambohimanga, Antananarivo' },
      timestamp: '2025-01-15T09:30:20',
      accuracy: 8
    },
    {
      id: '3',
      user: 'Claire Moreau',
      location: { lat: -18.915671, lng: 47.520901, address: 'Analakely, Antananarivo' },
      timestamp: '2025-01-14T14:15:30',
      accuracy: 3
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
              <MapPin size={24} className="text-white" />
            </div>
            <span>Géolocalisation</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Suivi des positions et analyse géographique des données
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setSelectedView('map')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedView === 'map'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Globe size={16} className="inline mr-2" />
              Carte
            </button>
            <button
              onClick={() => setSelectedView('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedView === 'list'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Users size={16} className="inline mr-2" />
              Liste
            </button>
          </div>
          
          <Button className="flex items-center space-x-2">
            <Filter size={16} />
            <span>Filtres</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Positions</p>
              <p className="text-2xl font-bold">{locationData.length}</p>
            </div>
            <Navigation size={24} className="text-blue-200" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Utilisateurs Actifs</p>
              <p className="text-2xl font-bold">{new Set(locationData.map(d => d.user)).size}</p>
            </div>
            <Users size={24} className="text-green-200" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Précision Moyenne</p>
              <p className="text-2xl font-bold">
                {Math.round(locationData.reduce((sum, d) => sum + d.accuracy, 0) / locationData.length)}m
              </p>
            </div>
            <MapPin size={24} className="text-purple-200" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Zones Couvertes</p>
              <p className="text-2xl font-bold">3</p>
            </div>
            <Globe size={24} className="text-orange-200" />
          </div>
        </Card>
      </div>

      {/* Main Content */}
      {selectedView === 'map' ? (
        <Card className="h-96">
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Carte Interactive
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                L'intégration de la carte sera disponible prochainement
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Positions Enregistrées
            </h2>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {locationData.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <MapPin size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{item.user}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.location.address}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(item.timestamp).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Précision: {item.accuracy}m</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {item.location.lat.toFixed(6)}, {item.location.lng.toFixed(6)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default GeolocationPage;