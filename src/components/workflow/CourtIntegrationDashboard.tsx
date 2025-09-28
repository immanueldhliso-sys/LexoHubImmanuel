import React, { useState } from 'react';
import { 
  FileText, 
  Send, 
  Download, 
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  ExternalLink,
  Upload,
  Search
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';

export const CourtIntegrationDashboard: React.FC = () => {
  const [selectedCourt, setSelectedCourt] = useState('gauteng-high');
  const [filingQueue, setFilingQueue] = useState([
    {
      id: '1',
      type: 'Notice of Motion',
      matter: 'Smith v Jones',
      court: 'Gauteng High Court',
      status: 'pending',
      dueDate: '2024-02-15',
      priority: 'high'
    },
    {
      id: '2',
      type: 'Heads of Argument',
      matter: 'ABC Corp v XYZ Ltd',
      court: 'Gauteng High Court',
      status: 'submitted',
      dueDate: '2024-02-10',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'Application for Leave',
      matter: 'Estate Late John Doe',
      court: 'Magistrate Court',
      status: 'filed',
      dueDate: '2024-02-08',
      priority: 'low'
    }
  ]);

  const courtSystems = [
    {
      id: 'gauteng-high',
      name: 'Gauteng High Court',
      status: 'connected',
      features: ['Electronic Filing', 'Case Management', 'Document Service'],
      lastSync: '5 minutes ago'
    },
    {
      id: 'western-cape-high',
      name: 'Western Cape High Court',
      status: 'available',
      features: ['Electronic Filing', 'Calendar Integration'],
      lastSync: 'Not connected'
    },
    {
      id: 'magistrates',
      name: 'Magistrates Courts',
      status: 'partial',
      features: ['Limited Filing', 'Manual Sync'],
      lastSync: '2 hours ago'
    },
    {
      id: 'supreme-court',
      name: 'Supreme Court of Appeal',
      status: 'connected',
      features: ['Full Integration', 'Real-time Updates'],
      lastSync: '1 minute ago'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-warning-500" />;
      case 'submitted':
        return <Send className="w-4 h-4 text-judicial-blue-500" />;
      case 'filed':
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-error-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-success-600 bg-success-100';
      case 'available':
        return 'text-judicial-blue-600 bg-judicial-blue-100';
      case 'partial':
        return 'text-warning-600 bg-warning-100';
      default:
        return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-error-700 bg-error-100';
      case 'medium':
        return 'text-warning-700 bg-warning-100';
      case 'low':
        return 'text-success-700 bg-success-100';
      default:
        return 'text-neutral-700 bg-neutral-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Court Systems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courtSystems.map((court) => (
          <Card key={court.id} hoverable>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">{court.name}</h3>
                  <p className="text-sm text-neutral-600">Last sync: {court.lastSync}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(court.status)}`}>
                  {court.status === 'connected' ? 'Connected' : 
                   court.status === 'available' ? 'Available' : 
                   court.status === 'partial' ? 'Partial' : 'Offline'}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                {court.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-neutral-600">
                    <CheckCircle className="w-3 h-3 text-success-500" />
                    {feature}
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                {court.status === 'connected' ? (
                  <>
                    <Button size="sm" variant="outline">
                      <Settings className="w-3 h-3 mr-1" />
                      Configure
                    </Button>
                    <Button size="sm" className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Open Portal
                    </Button>
                  </>
                ) : (
                  <Button size="sm" className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700">
                    Connect Now
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filing Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Electronic Filing Queue</h3>
              <p className="text-neutral-600">Manage document submissions and track filing status</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Search Filings
              </Button>
              <Button className="bg-mpondo-gold-600 hover:bg-mpondo-gold-700" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                New Filing
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Document Type</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Matter</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Court</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Due Date</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Priority</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-neutral-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filingQueue.map((filing) => (
                  <tr key={filing.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-neutral-500" />
                        <span className="font-medium text-neutral-900">{filing.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">{filing.matter}</td>
                    <td className="py-3 px-4 text-neutral-600">{filing.court}</td>
                    <td className="py-3 px-4 text-neutral-600">{filing.dueDate}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(filing.priority)}`}>
                        {filing.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(filing.status)}
                        <span className="text-sm text-neutral-600 capitalize">{filing.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {filing.status === 'pending' && (
                          <Button size="sm" variant="outline">
                            <Send className="w-3 h-3 mr-1" />
                            Submit
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Integration Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 text-mpondo-gold-500 mx-auto mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">Electronic Filing</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Submit documents directly to court systems with automated validation and confirmation
            </p>
            <Button size="sm" variant="outline" className="w-full">
              Learn More
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="w-12 h-12 text-judicial-blue-500 mx-auto mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">Case Management</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Real-time case status updates and automated deadline tracking across all courts
            </p>
            <Button size="sm" variant="outline" className="w-full">
              View Cases
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-4" />
            <h3 className="font-semibold text-neutral-900 mb-2">Document Service</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Automated service of documents with delivery confirmation and compliance tracking
            </p>
            <Button size="sm" variant="outline" className="w-full">
              Configure
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
