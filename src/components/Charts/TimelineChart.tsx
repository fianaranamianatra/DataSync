import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimelineData {
  date: string;
  syncs: number;
  errors: number;
  modules: number;
}

interface TimelineChartProps {
  data: TimelineData[];
}

const TimelineChart: React.FC<TimelineChartProps> = ({ data }) => {
  const [selectedMetric, setSelectedMetric] = useState<'syncs' | 'errors' | 'modules'>('syncs');

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Aucune donnée temporelle disponible</p>
      </div>
    );
  }

  const metrics = {
    syncs: { color: '#c5dfb3', label: 'Synchronisations' },
    errors: { color: '#ef4444', label: 'Erreurs' },
    modules: { color: '#3b82f6', label: 'Modules actifs' }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = parseISO(label);
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">
            {format(date, 'dd MMMM yyyy', { locale: fr })}
          </p>
          <p className="text-sm text-gray-600">
            {`${metrics[selectedMetric].label}: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        {Object.entries(metrics).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setSelectedMetric(key as any)}
            className={`px-3 py-1 text-sm rounded-full transition-all ${
              selectedMetric === key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date"
              stroke="#666"
              fontSize={12}
              tickFormatter={(value) => format(parseISO(value), 'dd/MM')}
            />
            <YAxis stroke="#666" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke={metrics[selectedMetric].color}
              strokeWidth={3}
              dot={{ fill: metrics[selectedMetric].color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: metrics[selectedMetric].color, strokeWidth: 2 }}
            />
            <Brush 
              dataKey="date" 
              height={30} 
              stroke={metrics[selectedMetric].color}
              tickFormatter={(value) => format(parseISO(value), 'dd/MM')}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimelineChart;