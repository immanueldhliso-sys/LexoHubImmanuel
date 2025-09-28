import React, { useState } from 'react';
import { Video, Calendar, Users, Play, Clock, Star } from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';

export const VirtualShadowingDashboard: React.FC = () => {
  const [filter, setFilter] = useState('all');

  const shadowingSessions = [
    {
      id: '1',
      title: 'High Court Commercial Motion',
      mentor: 'SC Sarah Matthews',
      date: '2024-02-15',
      time: '09:00',
      duration: 120,
      participants: 8,
      category: 'Commercial Law',
      level: 'Advanced',
      status: 'upcoming'
    },
    {
      id: '2',
      title: 'Appeal Court Hearing',
      mentor: 'SC David Wilson',
      date: '2024-02-18',
      time: '10:30',
      duration: 180,
      participants: 12,
      category: 'Appeal Procedure',
      level: 'Expert',
      status: 'upcoming'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Virtual Shadowing Sessions</h3>
          <p className="text-neutral-600">Shadow experienced advocates in real court proceedings</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shadowingSessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-neutral-900">{session.title}</h4>
                    <p className="text-sm text-neutral-600">{session.mentor}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {session.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {session.time} ({session.duration}min)
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {session.participants} participants
                      </span>
                    </div>
                  </div>
                  <Button size="sm" className="bg-mpondo-gold-600">
                    <Video className="w-4 h-4 mr-2" />
                    Join Session
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
