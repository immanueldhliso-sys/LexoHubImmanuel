import React, { useState } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Users,
  Database,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';

export const RiskManagementDashboard: React.FC = () => {
  const [riskLevel, setRiskLevel] = useState('medium');

  const complianceMetrics = {
    overallScore: 87,
    ethicsCompliance: 92,
    trustAccountCompliance: 85,
    dataProtection: 90,
    auditReadiness: 78
  };

  const alerts = [
    {
      id: '1',
      type: 'ethics',
      severity: 'high',
      title: 'Ethics Rule Alert: Conflict of Interest',
      description: 'Potential conflict detected in matter ABC-2024-001',
      dueDate: '2024-02-16',
      status: 'active'
    },
    {
      id: '2',
      type: 'trust',
      severity: 'medium',
      title: 'Trust Account Reconciliation Due',
      description: 'Monthly reconciliation required by end of month',
      dueDate: '2024-02-29',
      status: 'pending'
    },
    {
      id: '3',
      type: 'audit',
      severity: 'low',
      title: 'Audit Trail Update Required',
      description: 'Update document access logs for compliance',
      dueDate: '2024-03-01',
      status: 'scheduled'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-error-600 bg-error-100';
      case 'medium':
        return 'text-warning-600 bg-warning-100';
      case 'low':
        return 'text-success-600 bg-success-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success-600';
    if (score >= 75) return 'text-warning-600';
    return 'text-error-600';
  };

  return (
    <div className="space-y-6">
      {/* Compliance Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-8 h-8 text-mpondo-gold-500 mx-auto mb-2" />
            <p className={`text-2xl font-bold ${getScoreColor(complianceMetrics.overallScore)}`}>
              {complianceMetrics.overallScore}%
            </p>
            <p className="text-sm text-neutral-600">Overall Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-judicial-blue-500 mx-auto mb-2" />
            <p className={`text-2xl font-bold ${getScoreColor(complianceMetrics.ethicsCompliance)}`}>
              {complianceMetrics.ethicsCompliance}%
            </p>
            <p className="text-sm text-neutral-600">Ethics</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Database className="w-8 h-8 text-success-500 mx-auto mb-2" />
            <p className={`text-2xl font-bold ${getScoreColor(complianceMetrics.trustAccountCompliance)}`}>
              {complianceMetrics.trustAccountCompliance}%
            </p>
            <p className="text-sm text-neutral-600">Trust Account</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
            <p className={`text-2xl font-bold ${getScoreColor(complianceMetrics.dataProtection)}`}>
              {complianceMetrics.dataProtection}%
            </p>
            <p className="text-sm text-neutral-600">Data Protection</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-8 h-8 text-warning-500 mx-auto mb-2" />
            <p className={`text-2xl font-bold ${getScoreColor(complianceMetrics.auditReadiness)}`}>
              {complianceMetrics.auditReadiness}%
            </p>
            <p className="text-sm text-neutral-600">Audit Ready</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Compliance Alerts</h3>
              <p className="text-neutral-600">Active compliance issues requiring attention</p>
            </div>
            <Button variant="outline" size="sm">
              <Activity className="w-4 h-4 mr-2" />
              View All Alerts
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="border border-neutral-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-neutral-900">{alert.title}</h4>
                      <p className="text-sm text-neutral-600 mt-1">{alert.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity} priority
                        </span>
                        <span className="text-xs text-neutral-500">Due: {alert.dueDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    <Button size="sm" className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700">
                      Resolve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-mpondo-gold-500 mx-auto mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">Ethics Monitoring</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Automated conflict checking and ethics rule compliance monitoring
            </p>
            <Button size="sm" variant="outline" className="w-full">
              Configure Ethics Rules
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Database className="w-12 h-12 text-judicial-blue-500 mx-auto mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">Trust Account Auditing</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Automated reconciliation and trust account compliance tracking
            </p>
            <Button size="sm" variant="outline" className="w-full">
              Run Audit Check
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 text-success-500 mx-auto mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">Audit Trail Generator</h3>
            <p className="text-sm text-neutral-600 mb-4">
              One-click comprehensive audit trail for compliance reporting
            </p>
            <Button size="sm" variant="outline" className="w-full">
              Generate Audit Trail
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
