import React, { useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface PerformanceData {
  module: string;
  avgSyncTime: number;
  successRate: number;
  dataVolume: number;
  errorCount: number;
  trend: 'up' | 'down' | 'stable';
}

interface PerformanceMetricsChartProps {
  data: PerformanceData[];
}

const PerformanceMetricsChart: React.FC<PerformanceMetricsChartProps> = ({ data }) => {
  const [selectedView, setSelectedView] = useState<'performance' | 'volume'>('performance');

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Aucune donnée de performance disponible</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{`Module: ${label}`}</p>
          {selectedView === 'performance' ? (
            <>
              <p className="text-sm text-gray-600">{`Temps moyen: ${data.avgSyncTime}ms`}</p>
              <p className="text-sm text-gray-600">{`Taux de succès: ${data.successRate}%`}</p>
              <p className="text-sm text-gray-600">{`Erreurs: ${data.errorCount}`}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">{`Volume de données: ${data.dataVolume} MB`}</p>
              <p className="text-sm text-gray-600">{`Tendance: ${data.trend}`}</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  const renderPerformanceChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="module" 
          stroke="#666"
          fontSize={12}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis yAxisId="left" stroke="#666" fontSize={12} />
        <YAxis yAxisId="right" orientation="right" stroke="#666" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Bar yAxisId="left" dataKey="avgSyncTime" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Line 
          yAxisId="right" 
          type="monotone" 
          dataKey="successRate" 
          stroke="#10b981" 
          strokeWidth={3}
          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderVolumeChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
        <Area 
          type="monotone" 
          dataKey="dataVolume" 
          stroke="#c5dfb3" 
          fill="#c5dfb3" 
          fillOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedView('performance')}
            className={`px-3 py-1 text-sm rounded-full transition-all ${
              selectedView === 'performance'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setSelectedView('volume')}
            className={`px-3 py-1 text-sm rounded-full transition-all ${
              selectedView === 'volume'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Volume
          </button>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          {selectedView === 'performance' ? (
            <>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500"></div>
                <span className="text-gray-600">Temps (ms)</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-1 bg-green-500"></div>
                <span className="text-gray-600">Succès (%)</span>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-200"></div>
              <span className="text-gray-600">Volume (MB)</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="h-80">
        {selectedView === 'performance' ? renderPerformanceChart() : renderVolumeChart()}
      </div>
    </div>
  );
};

export default PerformanceMetricsChart;