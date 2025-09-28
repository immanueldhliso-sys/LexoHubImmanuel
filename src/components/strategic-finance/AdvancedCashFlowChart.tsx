import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../design-system/components';
import type { CashFlowPrediction } from '../../services/api/strategic-finance.service';

interface AdvancedCashFlowChartProps {
  predictions: CashFlowPrediction[];
}

export const AdvancedCashFlowChart: React.FC<AdvancedCashFlowChartProps> = ({ predictions }) => {
  const chartData = predictions.map(prediction => ({
    month: format(new Date(prediction.periodStart), 'MMM yyyy'),
    inflow: prediction.expectedCollections,
    outflow: prediction.expectedExpenses,
    net: prediction.expectedNetCashFlow,
    confidence: prediction.collectionConfidence * 100,
    status: prediction.cashFlowStatus
  }));

  const totalInflow = predictions.reduce((sum, p) => sum + p.expectedCollections, 0);
  const totalOutflow = predictions.reduce((sum, p) => sum + p.expectedExpenses, 0);
  const netCashFlow = totalInflow - totalOutflow;
  const averageConfidence = predictions.reduce((sum, p) => sum + p.collectionConfidence, 0) / predictions.length;

  const criticalMonths = predictions.filter(p => p.cashFlowStatus === 'critical' || p.cashFlowStatus === 'tight');
  const minimumBalance = Math.min(...predictions.map(p => p.minimumBalanceAmount || 0).filter(Boolean));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
          <p className="font-medium text-neutral-900">{label}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">
              <span className="text-success-600">Inflow: </span>
              R{data.inflow.toLocaleString()}
            </p>
            <p className="text-sm">
              <span className="text-error-600">Outflow: </span>
              R{data.outflow.toLocaleString()}
            </p>
            <p className="text-sm font-medium">
              <span className={data.net >= 0 ? 'text-success-600' : 'text-error-600'}>
                Net: R{data.net.toLocaleString()}
              </span>
            </p>
            <p className="text-xs text-neutral-600">
              Confidence: {data.confidence.toFixed(0)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Expected Inflow</p>
                <p className="text-lg font-semibold text-success-600">
                  R{totalInflow.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-success-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Expected Outflow</p>
                <p className="text-lg font-semibold text-error-600">
                  R{totalOutflow.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="w-6 h-6 text-error-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Net Cash Flow</p>
                <p className={`text-lg font-semibold ${netCashFlow >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                  R{netCashFlow.toLocaleString()}
                </p>
              </div>
              {netCashFlow >= 0 ? (
                <TrendingUp className="w-6 h-6 text-success-500" />
              ) : (
                <TrendingDown className="w-6 h-6 text-error-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Avg Confidence</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {(averageConfidence * 100).toFixed(0)}%
                </p>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                averageConfidence >= 0.8 ? 'bg-success-100' : 
                averageConfidence >= 0.6 ? 'bg-warning-100' : 'bg-error-100'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  averageConfidence >= 0.8 ? 'bg-success-500' : 
                  averageConfidence >= 0.6 ? 'bg-warning-500' : 'bg-error-500'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {criticalMonths.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-neutral-900 mb-1">Cash Flow Alerts</h4>
                <p className="text-sm text-neutral-600">
                  {criticalMonths.length} month{criticalMonths.length !== 1 ? 's' : ''} with concerning cash flow:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {criticalMonths.map((month, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        month.cashFlowStatus === 'critical' 
                          ? 'bg-error-100 text-error-700'
                          : 'bg-warning-100 text-warning-700'
                      }`}
                    >
                      {format(new Date(month.periodStart), 'MMM yyyy')} - {month.cashFlowStatus}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Cash Flow Forecast</h3>
          <p className="text-sm text-neutral-600">
            6-month cash flow prediction with confidence intervals
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" />
                
                {/* Cash flow areas */}
                <Area
                  type="monotone"
                  dataKey="inflow"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Expected Inflow"
                />
                <Area
                  type="monotone"
                  dataKey="outflow"
                  stackId="2"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                  name="Expected Outflow"
                />
                
                {/* Net cash flow line */}
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#0f172a"
                  strokeWidth={3}
                  dot={{ fill: '#0f172a', strokeWidth: 2, r: 4 }}
                  name="Net Cash Flow"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Confidence Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-neutral-900">Prediction Confidence</h3>
          <p className="text-sm text-neutral-600">
            Collection confidence by month
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(0)}%`, 'Confidence']}
                />
                <Line
                  type="monotone"
                  dataKey="confidence"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
