import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { playerService } from '../../services/playerService';

interface PlayerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, type: 'active' | 'occasional') => Promise<void>;
  initialName: string;
  initialType: 'active' | 'occasional';
  playerId?: string;
  initialLoginCode?: string;
}

export const PlayerEditModal = ({
  isOpen,
  onClose,
  onSave,
  initialName,
  initialType,
  playerId,
  initialLoginCode = '',
}: PlayerEditModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<'active' | 'occasional'>(initialType);
  const [loginCode, setLoginCode] = useState(initialLoginCode);
  const [saving, setSaving] = useState(false);
  const [regeneratingCode, setRegeneratingCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setType(initialType);
      setLoginCode(initialLoginCode);
      setCodeCopied(false);
    }
  }, [isOpen, initialName, initialType, initialLoginCode]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(name, type);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!playerId) return;

    setRegeneratingCode(true);
    try {
      const newCode = await playerService.updatePlayerCode(playerId);
      setLoginCode(newCode);
    } catch (error) {
      console.error('Failed to regenerate code:', error);
    } finally {
      setRegeneratingCode(false);
    }
  };

  const handleCopyCode = async () => {
    if (!loginCode) return;

    try {
      await navigator.clipboard.writeText(loginCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4 text-center">{t('playerEditModal.title')}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('playerEditModal.playerName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('playerEditModal.playerType')}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'active' | 'occasional')}
              className="w-full border rounded-lg py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="active">{t('managePlayers.typeActive')}</option>
              <option value="occasional">{t('managePlayers.typeOccasional')}</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('playerEditModal.loginCode')}
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 text-gray-700 font-mono text-lg text-center">
                {loginCode || t('playerEditModal.notSet')}
              </div>
              <button
                type="button"
                onClick={handleRegenerateCode}
                disabled={regeneratingCode || saving || !playerId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap"
              >
                {regeneratingCode
                  ? t('playerEditModal.regenerating')
                  : t('playerEditModal.regenerate')}
              </button>
              <button
                type="button"
                onClick={handleCopyCode}
                disabled={!loginCode}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 whitespace-nowrap"
              >
                {codeCopied ? t('playerEditModal.copied') : t('playerEditModal.copy')}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">{t('playerEditModal.shareCode')}</p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              {t('playerEditModal.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              {saving ? t('playerEditModal.saving') : t('playerEditModal.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
