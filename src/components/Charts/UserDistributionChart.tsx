import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface UserData {
  user: string;
  syncs: number;
  modules: number;
  lastActivity: string;
  role: 'admin' | 'user' | 'viewer';
}

interface UserDistributionChartProps {
  data: UserData[];
}

const UserDistributionChart: React.FC<UserDistributionChartProps> = ({ data }) => {
  const [viewType, setViewType] = useState<'pie' | 'bar'>('pie');

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Aucune donnée utilisateur disponible</p>
      </div>
    );
  }

  const roleColors = {
    admin: '#dc2626',
    user: '#059669',
    viewer: '#7c3aed'
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.user}</p>
          <p className="text-sm text-gray-600">{`Synchronisations: ${data.syncs}`}</p>
          <p className="text-sm text-gray-600">{`Modules: ${data.modules}`}</p>
          <p className="text-sm text-gray-600">{`Rôle: ${data.role}`}</p>
          <p className="text-sm text-gray-600">{`Dernière activité: ${data.lastActivity}`}</p>
        </div>
      );
    }
    return null;
  };

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          dataKey="syncs"
          label={({ user, percent }) => `${user} (${(percent * 100).toFixed(0)}%)`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={roleColors[entry.role]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="user" 
          stroke="#666"
          fontSize={12}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis stroke="#666" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="syncs" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={roleColors[entry.role]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewType('pie')}
            className={`px-3 py-1 text-sm rounded-full transition-all ${
              viewType === 'pie'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Secteurs
          </button>
          <button
            onClick={() => setViewType('bar')}
            className={`px-3 py-1 text-sm rounded-full transition-all ${
              viewType === 'bar'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Barres
          </button>
        </div>
        
        <div className="flex space-x-4 text-xs">
          {Object.entries(roleColors).map(([role, color]) => (
            <div key={role} className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="capitalize text-gray-600">{role}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="h-80">
        {viewType === 'pie' ? renderPieChart() : renderBarChart()}
      </div>
    </div>
  );
};

export default UserDistributionChart;