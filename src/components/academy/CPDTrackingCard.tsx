import React from 'react';
import { Award, Calendar, Clock, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';

export const CPDTrackingCard: React.FC = () => {
  const cpdData = {
    required: 20,
    completed: 15.5,
    remaining: 4.5,
    deadline: '2024-12-31'
  };

  const cpdActivities = [
    {
      id: '1',
      title: 'Commercial Law Update Seminar',
      provider: 'Law Society',
      date: '2024-01-15',
      hours: 3,
      status: 'completed'
    },
    {
      id: '2',
      title: 'Ethics in Practice Workshop',
      provider: 'Bar Council',
      date: '2024-01-22',
      hours: 2.5,
      status: 'completed'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Award className="w-8 h-8 text-mpondo-gold-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-900">{cpdData.completed}</p>
            <p className="text-sm text-neutral-600">Hours Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="w-8 h-8 text-warning-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-900">{cpdData.remaining}</p>
            <p className="text-sm text-neutral-600">Hours Remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
            <p className="text-lg font-bold text-neutral-900">{cpdData.deadline}</p>
            <p className="text-sm text-neutral-600">Deadline</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-lg font-bold text-success-600">
                {Math.round((cpdData.completed / cpdData.required) * 100)}%
              </span>
            </div>
            <p className="text-sm text-neutral-600">Progress</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">CPD Activities</h3>
          <p className="text-neutral-600">Track your continuing professional development</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cpdActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success-500" />
                  <div>
                    <h4 className="font-medium text-neutral-900">{activity.title}</h4>
                    <p className="text-sm text-neutral-600">{activity.provider} • {activity.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-neutral-900">{activity.hours} hours</p>
                  <p className="text-sm text-success-600">Completed</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
