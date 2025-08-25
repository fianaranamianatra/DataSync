import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';

interface TrendChartProps {
  data: any[];
  title: string;
  dataKey: string;
  color?: string;
  type?: 'line' | 'area';
}

const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title,
  dataKey,
  color = '#3b82f6',
  type = 'area'
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">
            {label}
          </p>
          <p className="text-sm" style={{ color }}>
            {`${title}: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const ChartComponent = type === 'area' ? AreaChart : LineChart;
  const DataComponent = type === 'area' ? Area : Line;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" />
            <XAxis 
              dataKey="name" 
              stroke="#666" 
              fontSize={12}
              className="dark:stroke-gray-400"
            />
            <YAxis 
              stroke="#666" 
              fontSize={12}
              className="dark:stroke-gray-400"
            />
            <Tooltip content={<CustomTooltip />} />
            {type === 'area' ? (
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                fill={color}
                fillOpacity={0.3}
                strokeWidth={3}
              />
            ) : (
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={3}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default TrendChart;