import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (white: number, red: number) => Promise<void>;
  initialWhite?: number;
  initialRed?: number;
}

export const ScoreModal: React.FC<ScoreModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialWhite = 0,
  initialRed = 0,
}) => {
  const { t } = useTranslation();
  const [white, setWhite] = useState(initialWhite);
  const [red, setRed] = useState(initialRed);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setWhite(initialWhite);
      setRed(initialRed);
    }
  }, [isOpen, initialWhite, initialRed]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(white, red);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4 text-center">{t('scoreModal.title')}</h2>
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-6 gap-4">
            <div className="text-center flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('scoreModal.whiteTeamLabel')}
              </label>
              <input
                type="number"
                min="0"
                value={white}
                onChange={(e) => setWhite(parseInt(e.target.value) || 0)}
                className="w-full text-center text-3xl font-bold border rounded-lg py-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="text-2xl font-bold text-gray-400">-</div>
            <div className="text-center flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('scoreModal.redTeamLabel')}
              </label>
              <input
                type="number"
                min="0"
                value={red}
                onChange={(e) => setRed(parseInt(e.target.value) || 0)}
                className="w-full text-center text-3xl font-bold border rounded-lg py-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              {saving ? t('scoreModal.saving') : t('scoreModal.saveBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
