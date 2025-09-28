import React, { useState } from 'react';
import { X, Calculator, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { StrategicFinanceService } from '../../services/api/strategic-finance.service';
import { toast } from 'react-hot-toast';

interface SuccessFeeCalculatorProps {
  onClose: () => void;
  matterId?: string;
}

export const SuccessFeeCalculator: React.FC<SuccessFeeCalculatorProps> = ({ onClose, matterId }) => {
  const [formData, setFormData] = useState({
    scenarioName: '',
    description: '',
    successDefinition: '',
    successProbability: 0.5,
    baseFee: 0,
    successFeePercentage: 0.25,
    successFeeCap: '',
    minimumRecovery: 0,
    expectedRecovery: 0,
    maximumRecovery: 0
  });

  const [calculations, setCalculations] = useState({
    minimumTotalFee: 0,
    expectedTotalFee: 0,
    maximumTotalFee: 0,
    riskAdjustedFee: 0,
    breakevenProbability: 0
  });

  // Calculate fees whenever inputs change
  React.useEffect(() => {
    const cap = formData.successFeeCap ? parseFloat(formData.successFeeCap) : Infinity;
    
    const minSuccessFee = Math.min(formData.minimumRecovery * formData.successFeePercentage, cap);
    const expSuccessFee = Math.min(formData.expectedRecovery * formData.successFeePercentage, cap);
    const maxSuccessFee = Math.min(formData.maximumRecovery * formData.successFeePercentage, cap);
    
    const minimumTotalFee = formData.baseFee + minSuccessFee;
    const expectedTotalFee = formData.baseFee + expSuccessFee;
    const maximumTotalFee = formData.baseFee + maxSuccessFee;
    
    const riskAdjustedFee = formData.baseFee + (expSuccessFee * formData.successProbability);
    
    // Breakeven probability: probability where risk-adjusted fee equals base fee
    const breakevenProbability = formData.baseFee > 0 && expSuccessFee > 0
      ? formData.baseFee / (formData.baseFee + expSuccessFee)
      : 0;
    
    setCalculations({
      minimumTotalFee,
      expectedTotalFee,
      maximumTotalFee,
      riskAdjustedFee,
      breakevenProbability
    });
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!matterId) {
      toast.error('Please select a matter first');
      return;
    }
    
    try {
      await StrategicFinanceService.createSuccessFeeScenario({
        matterId,
        ...formData,
        successFeeCap: formData.successFeeCap ? parseFloat(formData.successFeeCap) : undefined
      });
      
      onClose();
    } catch (error) {
      // Error handling done in service
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="w-6 h-6 text-mpondo-gold-600" />
              <h2 className="text-xl font-semibold text-neutral-900">Success Fee Calculator</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Scenario Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Scenario Name <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.scenarioName}
                      onChange={(e) => setFormData({ ...formData, scenarioName: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Success Definition <span className="text-error-500">*</span>
                    </label>
                    <textarea
                      value={formData.successDefinition}
                      onChange={(e) => setFormData({ ...formData, successDefinition: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                      placeholder="Define what constitutes success for this fee arrangement..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Success Probability
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={formData.successProbability}
                        onChange={(e) => setFormData({ ...formData, successProbability: parseFloat(e.target.value) })}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-neutral-900 w-12">
                        {(formData.successProbability * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Fee Structure</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Base Fee (R)
                      </label>
                      <input
                        type="number"
                        value={formData.baseFee}
                        onChange={(e) => setFormData({ ...formData, baseFee: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                        min="0"
                        step="1000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Success Fee %
                      </label>
                      <input
                        type="number"
                        value={formData.successFeePercentage * 100}
                        onChange={(e) => setFormData({ ...formData, successFeePercentage: (parseFloat(e.target.value) || 0) / 100 })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                        min="0"
                        max="50"
                        step="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Success Fee Cap (R) <span className="text-xs text-neutral-500">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      value={formData.successFeeCap}
                      onChange={(e) => setFormData({ ...formData, successFeeCap: e.target.value })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                      min="0"
                      step="10000"
                      placeholder="No cap"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recovery Scenarios</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Minimum Recovery (R)
                    </label>
                    <input
                      type="number"
                      value={formData.minimumRecovery}
                      onChange={(e) => setFormData({ ...formData, minimumRecovery: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                      min="0"
                      step="10000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Expected Recovery (R)
                    </label>
                    <input
                      type="number"
                      value={formData.expectedRecovery}
                      onChange={(e) => setFormData({ ...formData, expectedRecovery: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                      min="0"
                      step="10000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Maximum Recovery (R)
                    </label>
                    <input
                      type="number"
                      value={formData.maximumRecovery}
                      onChange={(e) => setFormData({ ...formData, maximumRecovery: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-mpondo-gold-500 focus:border-mpondo-gold-500"
                      min="0"
                      step="10000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              <div className="bg-neutral-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-mpondo-gold-600" />
                  Fee Calculations
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-neutral-600 mb-2">Scenario Outcomes</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm text-neutral-700">Minimum Total Fee</span>
                        <span className="font-semibold text-neutral-900">
                          R{calculations.minimumTotalFee.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm text-neutral-700">Expected Total Fee</span>
                        <span className="font-semibold text-lg text-mpondo-gold-600">
                          R{calculations.expectedTotalFee.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm text-neutral-700">Maximum Total Fee</span>
                        <span className="font-semibold text-neutral-900">
                          R{calculations.maximumTotalFee.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 pt-4">
                    <p className="text-sm text-neutral-600 mb-2">Risk Analysis</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm text-neutral-700">Risk-Adjusted Fee</span>
                        <span className="font-semibold text-judicial-blue-600">
                          R{calculations.riskAdjustedFee.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="text-sm text-neutral-700">Breakeven Probability</span>
                        <span className="font-semibold text-neutral-900">
                          {(calculations.breakevenProbability * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-warning-800">
                    <p className="font-semibold mb-1">Risk Considerations</p>
                    <ul className="space-y-1">
                      <li>• Ensure success criteria are clearly defined and measurable</li>
                      <li>• Consider the client's ability to pay the success fee</li>
                      <li>• Document all fee arrangements in writing</li>
                      <li>• Review Bar Council rules on contingency fees</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-judicial-blue-50 border border-judicial-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-judicial-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-judicial-blue-800">
                    <p className="font-semibold mb-1">Understanding the Calculations</p>
                    <ul className="space-y-1">
                      <li>• <strong>Risk-Adjusted Fee:</strong> Expected fee weighted by success probability</li>
                      <li>• <strong>Breakeven Probability:</strong> Minimum success rate to match base fee</li>
                      <li>• <strong>Success Fee Cap:</strong> Maximum success fee regardless of recovery</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!matterId}
              className="px-4 py-2 bg-mpondo-gold-600 text-white rounded-lg hover:bg-mpondo-gold-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Scenario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
