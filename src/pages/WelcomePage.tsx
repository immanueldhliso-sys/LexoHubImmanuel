import React from 'react';
import { Card, CardHeader, CardContent, Button } from '../design-system/components';
import { useAuth } from '../contexts/AuthContext';

const WelcomePage: React.FC = () => {
  const { user } = useAuth();

  const handleGoToDashboard = () => {
    window.location.href = '/';
  };

  const handleGoToSignIn = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <Card className="max-w-lg w-full shadow-md border border-neutral-200 bg-white">
        <CardHeader>
          <h1 className="text-2xl font-bold text-neutral-900">Welcome to LexoHub</h1>
          <p className="text-neutral-600">Email confirmation complete</p>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              <p className="text-neutral-700">
                Your email has been verified and you are signed in.
              </p>
              <Button variant="primary" onClick={handleGoToDashboard}>
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-neutral-700">
                Thanks for confirming your email. You can now sign in to start using LexoHub.
              </p>
              <Button variant="primary" onClick={handleGoToSignIn}>
                Go to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomePage;