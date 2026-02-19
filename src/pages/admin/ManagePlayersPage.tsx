import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Player } from '../../types';
import { playerService } from '../../services/playerService';
import { Link } from 'react-router-dom';
import { PlayerEditModal } from '../../components/ui/PlayerEditModal';

export const ManagePlayersPage = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerType, setNewPlayerType] = useState<'active' | 'occasional'>('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const loadPlayers = async () => {
    try {
      const data = await playerService.getPlayers();
      setPlayers(data);
    } catch (err) {
      setError(t('managePlayers.failedToLoad'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) {return;}

    setSubmitting(true);
    try {
      await playerService.createPlayer(newPlayerName.trim(), newPlayerType);
      setNewPlayerName('');
      setNewPlayerType('active'); // Reset to default
      await loadPlayers();
      // Keep focus on input for rapid entry
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError(t('managePlayers.failedToCreate') + ': ' + (err as any).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPlayer = async (player: Player) => {
    setEditingPlayer(player);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (name: string, type: 'active' | 'occasional') => {
    if (!editingPlayer) {return;}

    try {
      await playerService.updatePlayer(editingPlayer.id, name, type);
      setPlayers(players.map(p => p.id === editingPlayer.id ? { ...p, name, type } : p));
      setEditModalOpen(false);
      setEditingPlayer(null);
    } catch (e) {
      alert(t('managePlayers.failedToUpdate'));
      console.error(e);
    }
  };

  const handleDeletePlayer = async (id: string, name: string) => {
    if (!window.confirm(t('managePlayers.deleteConfirm', { name }))) {return;}

    try {
      await playerService.deletePlayer(id);
      setPlayers(players.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert(t('managePlayers.failedToDelete'));
    }
  };

  if (loading) {return <div className="p-8 text-center">{t('managePlayers.loading')}</div>;}

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t('managePlayers.heading')}</h2>
        <Link to="/admin/dashboard" className="text-indigo-600 hover:text-indigo-800">
          {t('managePlayers.backToAdmin')}
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create Player Form */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('managePlayers.addNewPlayer')}</h3>
        <form onSubmit={handleCreatePlayer} className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="playerName" className="sr-only">{t('managePlayers.playerNameLabel')}</label>
            <input
              ref={inputRef}
              id="playerName"
              type="text"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder={t('managePlayers.playerNamePlaceholder')}
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div>
            <label htmlFor="playerType" className="sr-only">{t('managePlayers.playerTypeLabel')}</label>
            <select
              id="playerType"
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              value={newPlayerType}
              onChange={(e) => setNewPlayerType(e.target.value as 'active' | 'occasional')}
              disabled={submitting}
            >
              <option value="active">{t('managePlayers.typeActive')}</option>
              <option value="occasional">{t('managePlayers.typeOccasional')}</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting || !newPlayerName.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {submitting ? t('managePlayers.addingBtn') : t('managePlayers.addBtn')}
          </button>
        </form>
      </div>

      {/* Players List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {/* Active Players */}
        <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{t('managePlayers.activePlayersHeading')}</h3>
        </div>
        <ul role="list" className="divide-y divide-gray-200">
          {players.filter(p => p.type === 'active').length === 0 ? (
            <li className="px-4 py-4 sm:px-6 text-gray-500 text-center">
              {t('managePlayers.noActivePlayers')}
            </li>
          ) : (
            players.filter(p => p.type === 'active').map((player) => (
              <li key={player.id} className="flex items-center justify-between px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex-1">
                  <div className="text-sm font-medium text-indigo-600">{player.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{t('managePlayers.codePrefix')} {player.loginCode}</div>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleEditPlayer(player)}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-semibold"
                  >
                    {t('managePlayers.editBtn')}
                  </button>
                  <button
                    onClick={() => handleDeletePlayer(player.id, player.name)}
                    className="text-red-600 hover:text-red-900 text-sm font-semibold"
                  >
                    {t('managePlayers.deleteBtn')}
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

        {/* Occasional Players */}
        <div className="px-4 py-4 sm:px-6 border-b border-gray-200 border-t">
          <h3 className="text-lg font-medium text-gray-900">{t('managePlayers.occasionalPlayersHeading')}</h3>
        </div>
        <ul role="list" className="divide-y divide-gray-200">
          {players.filter(p => p.type === 'occasional').length === 0 ? (
            <li className="px-4 py-4 sm:px-6 text-gray-500 text-center">
              {t('managePlayers.noOccasionalPlayers')}
            </li>
          ) : (
            players.filter(p => p.type === 'occasional').map((player) => (
              <li key={player.id} className="flex items-center justify-between px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex-1">
                  <div className="text-sm font-medium text-indigo-600">{player.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{t('managePlayers.codePrefix')} {player.loginCode}</div>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleEditPlayer(player)}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-semibold"
                  >
                    {t('managePlayers.editBtn')}
                  </button>
                  <button
                    onClick={() => handleDeletePlayer(player.id, player.name)}
                    className="text-red-600 hover:text-red-900 text-sm font-semibold"
                  >
                    {t('managePlayers.deleteBtn')}
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Edit Modal */}
      {editingPlayer && (
        <PlayerEditModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingPlayer(null);
          }}
          onSave={handleSaveEdit}
          initialName={editingPlayer.name}
          initialType={editingPlayer.type}
          playerId={editingPlayer.id}
          initialLoginCode={editingPlayer.loginCode}
        />
      )}
    </div>
  );
};
