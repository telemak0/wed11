import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
import { playerService } from '../../services/playerService';
import { isValidCodeFormat } from '../../utils/code-generator';

export const PlayerLoginPage = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = usePlayerAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidCodeFormat(code)) {
      setError(t('playerLogin.invalidCodeFormat'));
      return;
    }

    setLoading(true);
    try {
      const player = await playerService.getPlayerByCode(code);
      if (!player) {
        setError(t('playerLogin.invalidCode'));
        setLoading(false);
        return;
      }

      // Login successful
      login(player.id, player.name);
      navigate('/player-dashboard');
    } catch (err) {
      setError(t('playerLogin.error'));
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">{t('playerLogin.heading')}</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              {t('playerLogin.codeLabel')}
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder={t('playerLogin.codePlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 4}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('playerLogin.loggingBtn') : t('playerLogin.loginBtn')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('playerLogin.instruction')}
        </p>
      </div>
    </div>
  );
};
