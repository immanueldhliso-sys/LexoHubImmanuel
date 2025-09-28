import React from 'react';
import { Target, Users, FileText, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';

export const PracticeSuccessionPlanning: React.FC = () => {
  const successionMetrics = {
    planCompleteness: 65,
    mentorshipPrograms: 3,
    knowledgeTransfer: 78,
    financialPreparation: 45
  };

  const actionItems = [
    {
      id: '1',
      task: 'Update client handover protocols',
      priority: 'high',
      dueDate: '2024-03-01',
      status: 'pending'
    },
    {
      id: '2',
      task: 'Complete financial valuation',
      priority: 'medium',
      dueDate: '2024-03-15',
      status: 'in-progress'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 text-mpondo-gold-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-900">{successionMetrics.planCompleteness}%</p>
            <p className="text-sm text-neutral-600">Plan Complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-judicial-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-900">{successionMetrics.mentorshipPrograms}</p>
            <p className="text-sm text-neutral-600">Mentorship Programs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-8 h-8 text-success-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-900">{successionMetrics.knowledgeTransfer}%</p>
            <p className="text-sm text-neutral-600">Knowledge Transfer</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-warning-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-900">{successionMetrics.financialPreparation}%</p>
            <p className="text-sm text-neutral-600">Financial Ready</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Succession Action Items</h3>
          <p className="text-neutral-600">Key tasks for your practice succession planning</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actionItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-neutral-900">{item.task}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded ${
                      item.priority === 'high' ? 'bg-error-100 text-error-700' :
                      item.priority === 'medium' ? 'bg-warning-100 text-warning-700' :
                      'bg-neutral-100 text-neutral-700'
                    }`}>
                      {item.priority} priority
                    </span>
                    <span className="text-sm text-neutral-500">Due: {item.dueDate}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Update
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
