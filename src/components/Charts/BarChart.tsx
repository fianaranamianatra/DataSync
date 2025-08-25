import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface BarChartProps {
  data: any[];
  title: string;
  dataKey: string;
  color?: string;
  horizontal?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  dataKey,
  color = '#3b82f6',
  horizontal = false
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

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart 
            data={data} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            layout={horizontal ? 'horizontal' : 'vertical'}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" />
            <XAxis 
              dataKey="name" 
              stroke="#666" 
              fontSize={12}
              className="dark:stroke-gray-400"
              type={horizontal ? 'number' : 'category'}
            />
            <YAxis 
              stroke="#666" 
              fontSize={12}
              className="dark:stroke-gray-400"
              type={horizontal ? 'category' : 'number'}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey={dataKey} 
              fill={color}
              radius={[4, 4, 0, 0]}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default BarChart;