import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ModuleData {
  module: string;
  version: string;
  status: 'active' | 'deprecated' | 'pending';
  syncCount: number;
  lastSync: string;
}

interface ModuleVersionChartProps {
  data: ModuleData[];
}

const ModuleVersionChart: React.FC<ModuleVersionChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Aucune donnée de module disponible</p>
      </div>
    );
  }

  const statusColors = {
    active: '#10b981',
    deprecated: '#f59e0b',
    pending: '#6b7280'
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{`Module: ${label}`}</p>
          <p className="text-sm text-gray-600">{`Version: ${data.version}`}</p>
          <p className="text-sm text-gray-600">{`Synchronisations: ${data.syncCount}`}</p>
          <p className="text-sm text-gray-600">{`Statut: ${data.status}`}</p>
          <p className="text-sm text-gray-600">{`Dernière sync: ${data.lastSync}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="module" 
            stroke="#666"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke="#666" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="syncCount" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={statusColors[entry.status]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ModuleVersionChart;