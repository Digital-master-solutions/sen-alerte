import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyReports = () => {
  const navigate = useNavigate();
  const [authCode, setAuthCode] = useState('');

  const handleContinue = () => {
    if (authCode.length === 8) {
      // TODO: Implement authentication logic
      console.log('Auth code:', authCode);
    }
  };

  const handleAuthCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 8) {
      setAuthCode(value);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/")}
          className="mb-8"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <Phone className="h-10 w-10 text-blue-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Mes Signalements
          </h1>

          {/* Subtitle */}
          <p className="text-gray-600 mb-8">
            Entrez votre code d'authentification pour voir vos signalements
          </p>

          {/* Form */}
          <div className="space-y-6">
            <div className="text-left">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code d'authentification
              </label>
              <Input
                type="text"
                value={authCode}
                onChange={handleAuthCodeChange}
                placeholder="EX: A2B4C8D9"
                className="text-center text-lg font-mono tracking-wider border-2 border-gray-300 rounded-lg h-12"
                maxLength={8}
              />
              <p className="text-sm text-gray-500 mt-2">
                Format: 8 caractères alphanumériques (ex: A2B4C8D9)
              </p>
            </div>

            <Button
              onClick={handleContinue}
              disabled={authCode.length !== 8}
              className="w-full h-12 text-lg bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Continuer
            </Button>
          </div>

          {/* Footer link */}
          <div className="mt-8 pt-6">
            <p className="text-gray-600">
              Vous n'avez pas de code ?{' '}
              <button
                onClick={() => navigate('/signaler')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Faire un signalement
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyReports;