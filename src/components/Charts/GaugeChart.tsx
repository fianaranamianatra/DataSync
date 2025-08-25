import React from 'react';
import { motion } from 'framer-motion';

interface GaugeChartProps {
  value: number;
  max: number;
  title: string;
  color?: string;
  unit?: string;
}

const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  max,
  title,
  color = '#3b82f6',
  unit = '%'
}) => {
  const percentage = (value / max) * 100;
  const strokeDasharray = `${percentage * 2.51} 251`;

  const getColorByValue = (val: number) => {
    if (val >= 80) return '#10b981'; // Green
    if (val >= 60) return '#f59e0b'; // Yellow
    if (val >= 40) return '#ef4444'; // Red
    return '#6b7280'; // Gray
  };

  const gaugeColor = getColorByValue(percentage);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
        {title}
      </h3>
      
      <div className="relative flex items-center justify-center">
        <svg width="200" height="120" viewBox="0 0 200 120">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
            strokeLinecap="round"
            className="dark:stroke-gray-700"
          />
          
          {/* Progress arc */}
          <motion.path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="251"
            strokeDashoffset={251 - (percentage * 2.51)}
            initial={{ strokeDashoffset: 251 }}
            animate={{ strokeDashoffset: 251 - (percentage * 2.51) }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          
          {/* Center text */}
          <text
            x="100"
            y="85"
            textAnchor="middle"
            className="text-2xl font-bold fill-gray-900 dark:fill-white"
          >
            {value}{unit}
          </text>
          <text
            x="100"
            y="105"
            textAnchor="middle"
            className="text-sm fill-gray-500 dark:fill-gray-400"
          >
            sur {max}{unit}
          </text>
        </svg>
      </div>
    </motion.div>
  );
};

export default GaugeChart;