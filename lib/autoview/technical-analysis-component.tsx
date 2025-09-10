import { IFinancialAnalysis } from "./solar-types";

// Technical Analysis Component for Analysis Phase
export interface TechnicalAnalysisComponentProps {
  analysis: IFinancialAnalysis;
}

export default function TechnicalAnalysisComponent({ analysis }: Readonly<TechnicalAnalysisComponentProps>) {
  const paybackYears = Math.round(analysis.savings.paybackPeriod * 10) / 10;
  const roiPercent = Math.round(analysis.savings.roi * 100 * 10) / 10;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Technical & Financial Analysis</h3>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">System Specifications</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-blue-700">System Size:</span>
              <span className="font-semibold text-blue-900">{analysis.systemSize} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Estimated Cost:</span>
              <span className="font-semibold text-blue-900">${analysis.estimatedCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Net Cost:</span>
              <span className="font-semibold text-blue-900">${analysis.netCost.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-green-900 mb-3">Return on Investment</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-green-700">Payback Period:</span>
              <span className="font-semibold text-green-900">{paybackYears} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">ROI:</span>
              <span className="font-semibold text-green-900">{roiPercent}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Annual Savings:</span>
              <span className="font-semibold text-green-900">${analysis.savings.annualSavings.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Incentives Breakdown */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Available Incentives</h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">${analysis.incentives.federalITC.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Federal ITC</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${analysis.incentives.stateRebates.toLocaleString()}</div>
              <div className="text-sm text-gray-600">State Rebates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">${analysis.incentives.utilityRebates.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Utility Rebates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">${analysis.incentives.totalIncentives.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Incentives</div>
            </div>
          </div>
        </div>
      </div>

      {/* Environmental Impact */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Environmental Impact</h4>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{analysis.environmental.co2Offset.toLocaleString()}</div>
              <div className="text-sm text-gray-600">kg CO₂ Offset/Year</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{analysis.environmental.treesEquivalent}</div>
              <div className="text-sm text-gray-600">Trees Equivalent</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{analysis.environmental.carsEquivalent}</div>
              <div className="text-sm text-gray-600">Cars Off Road</div>
            </div>
          </div>
        </div>
      </div>

      {/* Financing Options */}
      {analysis.financing && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Financing Details</h4>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-600">${analysis.financing.downPayment.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Down Payment</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-600">${analysis.financing.monthlyPayment.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Monthly Payment</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-600">{(analysis.financing.interestRate * 100).toFixed(2)}%</div>
                <div className="text-sm text-gray-600">Interest Rate</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-600">{analysis.financing.termYears} years</div>
                <div className="text-sm text-gray-600">Term</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}