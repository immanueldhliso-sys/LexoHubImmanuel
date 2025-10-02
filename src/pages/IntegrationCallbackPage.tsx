import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { integrationManager } from '../services/integrations/integration-manager.service';
import { toast } from 'react-hot-toast';

const IntegrationCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing integration...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        throw new Error(`Integration error: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Missing authorization code or state');
      }

      const stateData = JSON.parse(atob(state));
      const { integrationId, userId } = stateData;

      if (userId !== user?.id) {
        throw new Error('User mismatch');
      }

      await integrationManager.handleOAuthCallback(integrationId, code, userId);

      setStatus('success');
      setMessage(`Successfully connected ${integrationId}!`);
      toast.success('Integration connected successfully');

      setTimeout(() => {
        navigate('/settings/integrations');
      }, 2000);
    } catch (error) {
      console.error('Integration callback error:', error);
      setStatus('error');
      setMessage((error as Error).message || 'Failed to connect integration');
      toast.error('Failed to connect integration');

      setTimeout(() => {
        navigate('/settings/integrations');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-mpondo-gold-500 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Connecting...</h2>
              <p className="text-neutral-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-status-success-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Success!</h2>
              <p className="text-neutral-600">{message}</p>
              <p className="text-sm text-neutral-500 mt-4">Redirecting...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-status-error-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Connection Failed</h2>
              <p className="text-neutral-600">{message}</p>
              <p className="text-sm text-neutral-500 mt-4">Redirecting...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegrationCallbackPage;
