import React from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import type { CashFlowPrediction } from '../../services/api/strategic-finance.service';

interface CashFlowChartProps {
  predictions: CashFlowPrediction[];
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ predictions }) => {
  const chartData = predictions.map(prediction => ({
    month: format(new Date(prediction.periodStart), 'MMM yyyy'),
    collections: prediction.expectedCollections,
    expenses: prediction.expectedExpenses,
    netCashFlow: prediction.expectedNetCashFlow,
    confidence: prediction.collectionConfidence * 100
  }));

  const formatCurrency = (value: number) => {
    return `R${(value / 1000).toFixed(0)}k`;
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-6">Cash Flow Forecast</h3>
      
      <div className="space-y-8">
        {/* Net Cash Flow Chart */}
        <div>
          <h4 className="text-sm font-medium text-neutral-700 mb-4">Net Cash Flow Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#525252' }}
                axisLine={{ stroke: '#d4d4d4' }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12, fill: '#525252' }}
                axisLine={{ stroke: '#d4d4d4' }}
              />
              <Tooltip 
                formatter={(value: number) => `R${value.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`}
                contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #d4d4d4', borderRadius: '6px' }}
              />
              <ReferenceLine y={0} stroke="#737373" strokeWidth={1} />
              <Bar 
                dataKey="netCashFlow" 
                fill={(data: any) => data.netCashFlow >= 0 ? '#16a34a' : '#dc2626'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Collections vs Expenses Chart */}
        <div>
          <h4 className="text-sm font-medium text-neutral-700 mb-4">Collections vs Expenses</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#525252' }}
                axisLine={{ stroke: '#d4d4d4' }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12, fill: '#525252' }}
                axisLine={{ stroke: '#d4d4d4' }}
              />
              <Tooltip 
                formatter={(value: number) => `R${value.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`}
                contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #d4d4d4', borderRadius: '6px' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="collections" 
                stroke="#16a34a" 
                strokeWidth={2}
                dot={{ fill: '#16a34a', r: 4 }}
                name="Expected Collections"
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#dc2626" 
                strokeWidth={2}
                dot={{ fill: '#dc2626', r: 4 }}
                name="Expected Expenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Collection Confidence */}
        <div>
          <h4 className="text-sm font-medium text-neutral-700 mb-4">Collection Confidence</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {chartData.map((data, index) => (
              <div key={index} className="text-center">
                <p className="text-xs text-neutral-600 mb-2">{data.month}</p>
                <div className="relative">
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        data.confidence >= 80 ? 'bg-success-500' :
                        data.confidence >= 60 ? 'bg-warning-500' : 'bg-error-500'
                      }`}
                      style={{ width: `${data.confidence}%` }}
                    />
                  </div>
                  <p className="text-xs font-medium text-neutral-700 mt-1">{data.confidence.toFixed(0)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
