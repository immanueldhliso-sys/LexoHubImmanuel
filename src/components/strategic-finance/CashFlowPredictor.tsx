import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Target,
  BarChart3,
  Settings,
  RefreshCw,
  Download,
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';
import { AdvancedCashFlowChart } from './AdvancedCashFlowChart';
import { StrategicFinanceService, type CashFlowPrediction } from '../../services/api/strategic-finance.service';
import { toast } from 'react-hot-toast';
import { format, addMonths } from 'date-fns';

interface CashFlowPredictorProps {
  className?: string;
}

interface ScenarioSettings {
  monthsAhead: number;
  collectionRate: number;
  newBusinessGrowth: number;
  expenseInflation: number;
  seasonalAdjustment: boolean;
}

interface CashFlowScenario {
  name: string;
  description: string;
  settings: ScenarioSettings;
  predictions: CashFlowPrediction[];
  totalNet: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export const CashFlowPredictor: React.FC<CashFlowPredictorProps> = ({ className }) => {
  const [predictions, setPredictions] = useState<CashFlowPrediction[]>([]);
  const [scenarios, setScenarios] = useState<CashFlowScenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<string>('realistic');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customSettings, setCustomSettings] = useState<ScenarioSettings>({
    monthsAhead: 12,
    collectionRate: 0.85,
    newBusinessGrowth: 0.05,
    expenseInflation: 0.03,
    seasonalAdjustment: true
  });

  const defaultScenarios: Omit<CashFlowScenario, 'predictions' | 'totalNet'>[] = [
    {
      name: 'optimistic',
      description: 'Best case scenario with high collection rates and new business growth',
      settings: {
        monthsAhead: 12,
        collectionRate: 0.95,
        newBusinessGrowth: 0.15,
        expenseInflation: 0.02,
        seasonalAdjustment: true
      },
      riskLevel: 'low'
    },
    {
      name: 'realistic',
      description: 'Most likely scenario based on historical performance',
      settings: {
        monthsAhead: 12,
        collectionRate: 0.85,
        newBusinessGrowth: 0.05,
        expenseInflation: 0.03,
        seasonalAdjustment: true
      },
      riskLevel: 'medium'
    },
    {
      name: 'pessimistic',
      description: 'Conservative scenario with lower collection rates and economic challenges',
      settings: {
        monthsAhead: 12,
        collectionRate: 0.70,
        newBusinessGrowth: -0.05,
        expenseInflation: 0.05,
        seasonalAdjustment: true
      },
      riskLevel: 'high'
    }
  ];

  const loadPredictions = async (settings: ScenarioSettings) => {
    setLoading(true);
    try {
      const predictions = await StrategicFinanceService.generateCashFlowPredictions({
        monthsAhead: settings.monthsAhead,
        collectionRate: settings.collectionRate,
        newBusinessGrowth: settings.newBusinessGrowth,
        expenseInflation: settings.expenseInflation,
        seasonalAdjustment: settings.seasonalAdjustment
      });
      return predictions;
    } catch (error) {
      console.error('Error loading cash flow predictions:', error);
      toast.error('Failed to load cash flow predictions');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const generateAllScenarios = async () => {
    setLoading(true);
    try {
      const scenarioResults = await Promise.all(
        defaultScenarios.map(async (scenario) => {
          const predictions = await loadPredictions(scenario.settings);
          const totalNet = predictions.reduce((sum, p) => sum + p.expectedNetCashFlow, 0);
          return {
            ...scenario,
            predictions,
            totalNet
          };
        })
      );
      
      setScenarios(scenarioResults);
      
      // Set the realistic scenario as default
      const realisticScenario = scenarioResults.find(s => s.name === 'realistic');
      if (realisticScenario) {
        setPredictions(realisticScenario.predictions);
      }
      
      toast.success('Cash flow scenarios generated successfully');
    } catch (error) {
      console.error('Error generating scenarios:', error);
      toast.error('Failed to generate cash flow scenarios');
    } finally {
      setLoading(false);
    }
  };

  const generateCustomScenario = async () => {
    setLoading(true);
    try {
      const predictions = await loadPredictions(customSettings);
      const totalNet = predictions.reduce((sum, p) => sum + p.expectedNetCashFlow, 0);
      
      const customScenario: CashFlowScenario = {
        name: 'custom',
        description: 'Custom scenario with your specific parameters',
        settings: customSettings,
        predictions,
        totalNet,
        riskLevel: totalNet < 0 ? 'high' : totalNet < 100000 ? 'medium' : 'low'
      };
      
      setScenarios(prev => {
        const filtered = prev.filter(s => s.name !== 'custom');
        return [...filtered, customScenario];
      });
      
      setActiveScenario('custom');
      setPredictions(predictions);
      setShowSettings(false);
      
      toast.success('Custom scenario generated successfully');
    } catch (error) {
      console.error('Error generating custom scenario:', error);
      toast.error('Failed to generate custom scenario');
    } finally {
      setLoading(false);
    }
  };

  const switchScenario = (scenarioName: string) => {
    const scenario = scenarios.find(s => s.name === scenarioName);
    if (scenario) {
      setActiveScenario(scenarioName);
      setPredictions(scenario.predictions);
    }
  };

  const exportPredictions = () => {
    const activeScenarioData = scenarios.find(s => s.name === activeScenario);
    if (!activeScenarioData) return;

    const csvData = [
      ['Month', 'Expected Collections', 'Expected Expenses', 'Net Cash Flow', 'Confidence', 'Status'],
      ...activeScenarioData.predictions.map(p => [
        format(new Date(p.periodStart), 'MMM yyyy'),
        p.expectedCollections.toString(),
        p.expectedExpenses.toString(),
        p.expectedNetCashFlow.toString(),
        (p.collectionConfidence * 100).toFixed(1) + '%',
        p.cashFlowStatus
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash-flow-forecast-${activeScenario}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Cash flow forecast exported successfully');
  };

  useEffect(() => {
    generateAllScenarios();
  }, []);

  const activeScenarioData = scenarios.find(s => s.name === activeScenario);
  const criticalMonths = predictions.filter(p => p.cashFlowStatus === 'critical' || p.cashFlowStatus === 'tight');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Cash Flow Predictor</h2>
              <p className="text-sm text-neutral-600">
                12-month cash flow forecasting with scenario planning
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Custom Scenario
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportPredictions}
                disabled={predictions.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generateAllScenarios}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Custom Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-neutral-900">Custom Scenario Settings</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Forecast Period (months)
                </label>
                <input
                  type="number"
                  min="3"
                  max="24"
                  value={customSettings.monthsAhead}
                  onChange={(e) => setCustomSettings(prev => ({
                    ...prev,
                    monthsAhead: parseInt(e.target.value) || 12
                  }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Collection Rate (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  step="5"
                  value={customSettings.collectionRate * 100}
                  onChange={(e) => setCustomSettings(prev => ({
                    ...prev,
                    collectionRate: (parseInt(e.target.value) || 85) / 100
                  }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Business Growth (%)
                </label>
                <input
                  type="number"
                  min="-20"
                  max="50"
                  step="1"
                  value={customSettings.newBusinessGrowth * 100}
                  onChange={(e) => setCustomSettings(prev => ({
                    ...prev,
                    newBusinessGrowth: (parseInt(e.target.value) || 5) / 100
                  }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Expense Inflation (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={customSettings.expenseInflation * 100}
                  onChange={(e) => setCustomSettings(prev => ({
                    ...prev,
                    expenseInflation: (parseFloat(e.target.value) || 3) / 100
                  }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mpondo-gold-500"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={customSettings.seasonalAdjustment}
                  onChange={(e) => setCustomSettings(prev => ({
                    ...prev,
                    seasonalAdjustment: e.target.checked
                  }))}
                  className="rounded border-neutral-300 text-mpondo-gold-600 focus:ring-mpondo-gold-500"
                />
                <span className="text-sm text-neutral-700">Apply seasonal adjustments</span>
              </label>
              
              <Button
                onClick={generateCustomScenario}
                disabled={loading}
                className="ml-auto"
              >
                <Zap className="w-4 h-4 mr-2" />
                Generate Custom Scenario
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenario Tabs */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b border-neutral-200">
            {scenarios.map((scenario) => (
              <button
                key={scenario.name}
                onClick={() => switchScenario(scenario.name)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeScenario === scenario.name
                    ? 'border-mpondo-gold-500 text-mpondo-gold-600 bg-mpondo-gold-50'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="capitalize">{scenario.name}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    scenario.riskLevel === 'low' ? 'bg-success-500' :
                    scenario.riskLevel === 'medium' ? 'bg-warning-500' : 'bg-error-500'
                  }`} />
                </div>
              </button>
            ))}
          </div>
          
          {activeScenarioData && (
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 capitalize">
                    {activeScenarioData.name} Scenario
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {activeScenarioData.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-neutral-600">12-Month Net Cash Flow</p>
                  <p className={`text-2xl font-bold ${
                    activeScenarioData.totalNet >= 0 ? 'text-success-600' : 'text-error-600'
                  }`}>
                    R{activeScenarioData.totalNet.toLocaleString()}
                  </p>
                </div>
              </div>
              
              {/* Scenario Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-xs text-neutral-600">Collection Rate</p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {(activeScenarioData.settings.collectionRate * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-xs text-neutral-600">Business Growth</p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {activeScenarioData.settings.newBusinessGrowth >= 0 ? '+' : ''}
                    {(activeScenarioData.settings.newBusinessGrowth * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-xs text-neutral-600">Expense Inflation</p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {(activeScenarioData.settings.expenseInflation * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-xs text-neutral-600">Risk Level</p>
                  <p className={`text-lg font-semibold ${
                    activeScenarioData.riskLevel === 'low' ? 'text-success-600' :
                    activeScenarioData.riskLevel === 'medium' ? 'text-warning-600' : 'text-error-600'
                  }`}>
                    {activeScenarioData.riskLevel.charAt(0).toUpperCase() + activeScenarioData.riskLevel.slice(1)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      {criticalMonths.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-neutral-900 mb-1">Cash Flow Alerts</h4>
                <p className="text-sm text-neutral-600 mb-3">
                  {criticalMonths.length} month{criticalMonths.length !== 1 ? 's' : ''} require attention in the {activeScenario} scenario:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {criticalMonths.map((month, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        month.cashFlowStatus === 'critical' 
                          ? 'bg-error-50 border-error-200'
                          : 'bg-warning-50 border-warning-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-neutral-900">
                          {format(new Date(month.periodStart), 'MMMM yyyy')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          month.cashFlowStatus === 'critical' 
                            ? 'bg-error-100 text-error-700'
                            : 'bg-warning-100 text-warning-700'
                        }`}>
                          {month.cashFlowStatus}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">
                        Net: R{month.expectedNetCashFlow.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {predictions.length > 0 && (
        <AdvancedCashFlowChart predictions={predictions} />
      )}

      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mpondo-gold-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Generating cash flow predictions...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};