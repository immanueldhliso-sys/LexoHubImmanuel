import React from 'react';
import type { CashFlowPrediction } from '@/services/api/strategic-finance.service';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

interface CashFlowChartProps {
  predictions: CashFlowPrediction[];
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ predictions }) => {
  const data = predictions.map(p => ({
    name: format(new Date(p.periodStart), 'MMM yyyy'),
    expectedIn: Math.round(p.expectedCollections),
    expectedOut: -Math.round(p.expectedExpenses),
    net: Math.round(p.expectedNetCashFlow)
  }));

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(v: number) => `R${v.toLocaleString('en-ZA')}`} />
            <Legend />
            <Area type="monotone" dataKey="expectedIn" name="Expected In" stroke="#16a34a" fillOpacity={1} fill="url(#colorIn)" />
            <Area type="monotone" dataKey="expectedOut" name="Expected Out" stroke="#dc2626" fillOpacity={1} fill="url(#colorOut)" />
            <Area type="monotone" dataKey="net" name="Net" stroke="#D4AF37" fillOpacity={1} fill="url(#colorNet)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};