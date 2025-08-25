import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Filter, Clock, Users } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<'month' | 'week' | 'day'>('month');

  // Données simulées pour les événements
  const events = [
    {
      id: '1',
      title: 'Synchronisation KoBoToolbox',
      date: '2025-01-15',
      time: '09:00',
      type: 'sync',
      status: 'completed',
      participants: 3
    },
    {
      id: '2',
      title: 'Rapport mensuel',
      date: '2025-01-16',
      time: '14:30',
      type: 'report',
      status: 'scheduled',
      participants: 5
    },
    {
      id: '3',
      title: 'Maintenance système',
      date: '2025-01-18',
      time: '02:00',
      type: 'maintenance',
      status: 'scheduled',
      participants: 2
    },
    {
      id: '4',
      title: 'Formation utilisateurs',
      date: '2025-01-20',
      time: '10:00',
      type: 'training',
      status: 'scheduled',
      participants: 12
    }
  ];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'sync': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'report': return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'training': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'scheduled': return 'text-blue-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
              <Calendar size={24} className="text-white" />
            </div>
            <span>Calendrier</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Planification et suivi des événements système
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {['month', 'week', 'day'].map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                  selectedView === view
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {view === 'month' ? 'Mois' : view === 'week' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>
          
          <Button className="flex items-center space-x-2">
            <Plus size={16} />
            <span>Nouvel événement</span>
          </Button>
          
          <Button variant="secondary" className="flex items-center space-x-2">
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
              <p className="text-blue-100 text-sm">Événements ce mois</p>
              <p className="text-2xl font-bold">{events.length}</p>
            </div>
            <Calendar size={24} className="text-blue-200" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Complétés</p>
              <p className="text-2xl font-bold">{events.filter(e => e.status === 'completed').length}</p>
            </div>
            <Clock size={24} className="text-green-200" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Planifiés</p>
              <p className="text-2xl font-bold">{events.filter(e => e.status === 'scheduled').length}</p>
            </div>
            <Clock size={24} className="text-purple-200" />
          </div>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Participants</p>
              <p className="text-2xl font-bold">{events.reduce((sum, e) => sum + e.participants, 0)}</p>
            </div>
            <Users size={24} className="text-orange-200" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Aujourd'hui
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => {
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i - 6);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();
              const hasEvents = events.some(event => event.date === date.toISOString().split('T')[0]);
              
              return (
                <div
                  key={i}
                  className={`p-2 h-20 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors ${
                    isCurrentMonth 
                      ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' 
                      : 'bg-gray-50 dark:bg-gray-900 text-gray-400'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
                    {date.getDate()}
                  </div>
                  {hasEvents && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Events List */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Événements à venir
          </h3>
          
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {event.title}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getEventTypeColor(event.type)}`}>
                    {event.type}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Clock size={12} />
                    <span>{new Date(event.date).toLocaleDateString('fr-FR')} à {event.time}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users size={12} />
                    <span>{event.participants}</span>
                  </div>
                </div>
                
                <div className={`text-xs mt-2 font-medium ${getStatusColor(event.status)}`}>
                  {event.status === 'completed' ? 'Terminé' : 
                   event.status === 'scheduled' ? 'Planifié' : 'Annulé'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CalendarPage;