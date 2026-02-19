import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isBootstrapped, setupAdmin } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(t('login.invalidPassword'));
      setIsLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('login.passwordsDoNotMatch'));
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await setupAdmin(password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || "Setup failed");
      setIsLoading(false);
    }
  };

  if (isBootstrapped === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t('landing.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isBootstrapped ? t('login.heading') : t('login.setupHeading')}
          </h2>
          {!isBootstrapped && (
            <p className="mt-2 text-center text-sm text-gray-600">
              {t('login.setupDesc')}
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={isBootstrapped ? handleLogin : handleSetup}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className={isBootstrapped ? "" : "sr-only"}>
                {t('login.passwordLabel')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${isBootstrapped ? 'rounded-md' : 'rounded-t-md'} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder={isBootstrapped ? t('login.passwordPlaceholder') : t('login.passwordLabel')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {!isBootstrapped && (
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  {t('login.confirmPasswordLabel')}
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder={t('login.confirmPasswordLabel')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {isLoading ? t('landing.loading') : (isBootstrapped ? t('login.signInBtn') : t('login.setupBtn'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
