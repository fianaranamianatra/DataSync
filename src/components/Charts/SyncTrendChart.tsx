import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SyncData {
  date: string;
  records: number;
  formattedDate: string;
}

interface SyncTrendChartProps {
  data: SyncData[];
}

const SyncTrendChart: React.FC<SyncTrendChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Aucune donnée de synchronisation disponible</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#666"
            fontSize={12}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getDate()}/${date.getMonth() + 1}`;
            }}
          />
          <YAxis stroke="#666" fontSize={12} />
          <Tooltip 
            labelFormatter={(value) => {
              const date = new Date(value);
              return `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
            }}
            formatter={(value: number) => [value, 'Enregistrements']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="records" 
            stroke="#c5dfb3" 
            strokeWidth={3}
            dot={{ fill: '#c5dfb3', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#c5dfb3', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SyncTrendChart;