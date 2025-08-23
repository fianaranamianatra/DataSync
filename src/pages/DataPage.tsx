import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { Search, Download, ChevronLeft, ChevronRight, Database } from 'lucide-react';

interface DataRecord {
  id: string;
  data: any[];
  createdAt: Date;
}

const DataPage: React.FC = () => {
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const { currentUser } = useAuth();
  
  const itemsPerPage = 20;

  useEffect(() => {
    loadData();
  }, [currentUser, currentPage]);

  const loadData = async (isSearch = false, searchQuery = '') => {
    if (!currentUser) return;
    
    setLoading(true);
    
    try {
      let dataQuery = query(
        collection(db, 'api_data'),
        orderBy('createdAt', 'desc'),
        limit(itemsPerPage + 1)
      );
      
      if (currentPage > 1 && lastDoc && !isSearch) {
        dataQuery = query(
          collection(db, 'api_data'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(itemsPerPage + 1)
        );
      }
      
      const snapshot = await getDocs(dataQuery);
      const docs = snapshot.docs;
      
      // Vérifier s'il y a plus de données
      setHasMore(docs.length > itemsPerPage);
      
      // Prendre seulement les éléments de la page actuelle
      const pageData = docs.slice(0, itemsPerPage);
      
      if (pageData.length > 0) {
        setLastDoc(pageData[pageData.length - 1]);
      }
      
      const fetchedRecords: DataRecord[] = pageData.map(doc => ({
        id: doc.id,
        data: doc.data().data || [],
        createdAt: doc.data().createdAt.toDate(),
      }));
      
      // Filtrer par recherche si nécessaire
      if (isSearch && searchQuery) {
        const filtered = fetchedRecords.filter(record =>
          JSON.stringify(record.data).toLowerCase().includes(searchQuery.toLowerCase())
        );
        setRecords(filtered);
      } else {
        setRecords(fetchedRecords);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setRecords([]);
    }
    
    setLoading(false);
  };

  const handleSearch = async () => {
    setSearching(true);
    setCurrentPage(1);
    await loadData(true, searchTerm);
    setSearching(false);
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === 'next' && hasMore) {
      setCurrentPage(currentPage + 1);
    }
  };

  const exportToCSV = () => {
    if (records.length === 0) return;
    
    // Créer un CSV simple avec les données
    const allData = records.flatMap(record => record.data);
    
    if (allData.length === 0) return;
    
    // Obtenir les clés du premier objet pour les en-têtes
    const headers = Object.keys(allData[0] || {});
    const csvHeaders = ['Date', ...headers].join(',');
    
    const csvData = records.flatMap(record =>
      record.data.map(item => {
        const row = [
          record.createdAt.toLocaleDateString('fr-FR'),
          ...headers.map(header => `"${item[header] || ''}"`),
        ];
        return row.join(',');
      })
    ).join('\n');
    
    const csv = `${csvHeaders}\n${csvData}`;
    
    // Télécharger le fichier
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `data-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-[#c5dfb3]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2d3436] mb-2">Données synchronisées</h1>
          <p className="text-gray-600">
            {records.length} enregistrement{records.length > 1 ? 's' : ''} trouvé{records.length > 1 ? 's' : ''}
          </p>
        </div>
        
        <Button
          onClick={exportToCSV}
          variant="secondary"
          disabled={records.length === 0}
          className="flex items-center space-x-2"
        >
          <Download size={20} />
          <span>Exporter CSV</span>
        </Button>
      </div>

      {/* Barre de recherche */}
      <Card>
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher dans les données..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c5dfb3] focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button
            onClick={handleSearch}
            loading={searching}
            className="flex items-center space-x-2"
          >
            <Search size={20} />
            <span>Rechercher</span>
          </Button>
        </div>
      </Card>

      {/* Données */}
      <Card>
        {records.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Database size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée trouvée</h3>
            <p className="text-gray-600">
              Synchronisez vos données depuis le Dashboard pour commencer.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <p className="text-sm text-gray-600">
                    Synchronisé le {record.createdAt.toLocaleDateString('fr-FR')} à {record.createdAt.toLocaleTimeString('fr-FR')}
                    {' '}({record.data.length} élément{record.data.length > 1 ? 's' : ''})
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  {record.data && record.data.length > 0 && typeof record.data[0] === 'object' && (
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(record.data[0] || {}).map((key) => (
                            <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {record.data.slice(0, 5).map((item, index) => (
                          <tr key={index}>
                            {Object.values(item || {}).map((value: any, valueIndex) => (
                              <td key={valueIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  
                  {record.data && record.data.length > 0 && typeof record.data[0] !== 'object' && (
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Données brutes :</h4>
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                        {JSON.stringify(record.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {(!record.data || record.data.length === 0) && (
                    <div className="p-4 text-center text-gray-500">
                      Aucune donnée disponible pour cet enregistrement
                    </div>
                  )}
                  
                  {record.data.length > 5 && (
                    <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 text-center">
                      ... et {record.data.length - 5} élément{record.data.length - 5 > 1 ? 's' : ''} de plus
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {records.length > 0 && (
        <Card>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Page {currentPage}
            </p>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => handlePageChange('prev')}
                disabled={currentPage <= 1}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-1"
              >
                <ChevronLeft size={16} />
                <span>Précédent</span>
              </Button>
              
              <Button
                onClick={() => handlePageChange('next')}
                disabled={!hasMore}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-1"
              >
                <span>Suivant</span>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DataPage;