import React from 'react';
import { Users, MessageSquare, ThumbsUp, Eye } from 'lucide-react';
import { Card, CardHeader, CardContent, Button } from '../../design-system/components';

export const PeerReviewNetwork: React.FC = () => {
  const reviewRequests = [
    {
      id: '1',
      title: 'Contract Review - Mining Agreement',
      requester: 'Adv. John Smith',
      type: 'Document Review',
      deadline: '2024-02-20',
      urgent: false
    },
    {
      id: '2',
      title: 'Appeal Strategy Review',
      requester: 'Adv. Jane Doe',
      type: 'Strategy Review',
      deadline: '2024-02-18',
      urgent: true
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Peer Review Network</h3>
          <p className="text-neutral-600">Collaborate with colleagues for peer reviews and feedback</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviewRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-neutral-900">{request.title}</h4>
                    <p className="text-sm text-neutral-600">{request.requester}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded">
                        {request.type}
                      </span>
                      {request.urgent && (
                        <span className="px-2 py-1 bg-error-100 text-error-700 text-xs rounded">
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" className="bg-mpondo-gold-600">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
