import { IMonitoringData } from "./solar-types";

// Monitoring Dashboard Component for Monitoring Phase
export interface MonitoringDashboardComponentProps {
  monitoringData: IMonitoringData;
}

export default function MonitoringDashboardComponent({ monitoringData }: Readonly<MonitoringDashboardComponentProps>) {
  const efficiencyPercent = (monitoringData.performance.efficiency * 100).toFixed(1);
  const prPercent = (monitoringData.performance.performanceRatio * 100).toFixed(1);
  const expectedVsActualPercent = monitoringData.performance.expectedVsActual.toFixed(1);

  const getAlertStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  const getSeverityBadgeStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-200 text-red-800';
      case 'high':
        return 'bg-orange-200 text-orange-800';
      case 'medium':
        return 'bg-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-200 text-blue-800';
    }
  };

  const getEfficiencyWidth = (percent: string) => Math.min(parseFloat(percent), 25);
  const getPrWidth = (percent: string) => Math.min(parseFloat(percent), 100);
  const getExpectedVsActualWidth = (percent: string) => Math.max(0, Math.min(100, 50 + parseFloat(percent)));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">System Monitoring Dashboard</h3>
        <div className="text-sm text-gray-500">
          Last updated: {new Date(monitoringData.timestamp).toLocaleString()}
        </div>
      </div>

      {/* Production Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{monitoringData.production.daily.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Daily Production (kWh)</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{monitoringData.production.monthly.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Monthly Production (kWh)</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{monitoringData.production.yearly.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Yearly Production (kWh)</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{monitoringData.production.lifetime.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Lifetime Production (kWh)</div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">System Efficiency</span>
              <span className={`text-sm font-semibold ${parseFloat(efficiencyPercent) >= 20 ? 'text-green-600' : 'text-yellow-600'}`}>
                {efficiencyPercent}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              {/* eslint-disable-next-line react/style-prop-object */}
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  getEfficiencyWidth(efficiencyPercent) >= 20 ? 'bg-green-600' : 'bg-yellow-600'
                }`}
                style={{ width: `${getEfficiencyWidth(efficiencyPercent)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Performance Ratio</span>
              <span className={`text-sm font-semibold ${parseFloat(prPercent) >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                {prPercent}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              {/* eslint-disable-next-line react/style-prop-object */}
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  getPrWidth(prPercent) >= 80 ? 'bg-green-600' : 'bg-yellow-600'
                }`}
                style={{ width: `${getPrWidth(prPercent)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Expected vs Actual</span>
              <span className={`text-sm font-semibold ${parseFloat(expectedVsActualPercent) >= -10 ? 'text-green-600' : 'text-red-600'}`}>
                {expectedVsActualPercent}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getExpectedVsActualWidth(expectedVsActualPercent) >= 40 ? 'bg-green-600' : 'bg-red-600'}`}
                style={{ width: `${getExpectedVsActualWidth(expectedVsActualPercent)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Conditions */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Weather Conditions</h4>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{monitoringData.weather.irradiance}</div>
              <div className="text-sm text-gray-600">Irradiance (W/m²)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{monitoringData.weather.temperature}°C</div>
              <div className="text-sm text-gray-600">Temperature</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{monitoringData.weather.windSpeed} m/s</div>
              <div className="text-sm text-gray-600">Wind Speed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts and Maintenance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Alerts */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h4>
          <div className="space-y-2">
            {monitoringData.alerts.length > 0 ? (
              monitoringData.alerts.map((alert, index) => (
                <div
                  key={`${alert.timestamp}-${index}`}
                  className={`p-3 rounded-lg border-l-4 ${getAlertStyles(alert.severity)}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900">{alert.type.toUpperCase()}</div>
                      <div className="text-sm text-gray-600">{alert.message}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getSeverityBadgeStyles(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                <div>No active alerts</div>
              </div>
            )}
          </div>
        </div>

        {/* Maintenance Schedule */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Schedule</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Last Inspection:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(monitoringData.maintenance.lastInspection).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Next Scheduled:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(monitoringData.maintenance.nextScheduled).toLocaleDateString()}
                </span>
              </div>
              {monitoringData.maintenance.issues.length > 0 && (
                <div>
                  <span className="text-gray-700 block mb-2">Active Issues:</span>
                  <ul className="list-disc list-inside text-sm text-red-600">
                    {monitoringData.maintenance.issues.map((issue, index) => (
                      <li key={`issue-${index}-${issue.substring(0, 10)}`}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}