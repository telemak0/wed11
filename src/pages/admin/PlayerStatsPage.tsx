import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlayerStats } from '../../types';
import { playerStatsService } from '../../services/playerStatsService';
import { playerService } from '../../services/playerService';

export const PlayerStatsPage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOccasional, setShowOccasional] = useState(false);
  const [showNicknames, setShowNicknames] = useState(false);
  const [nicknameMap, setNicknameMap] = useState<Map<string, string>>(new Map());
  const [sortColumn, setSortColumn] = useState<keyof PlayerStats>('totalPoints');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadStats();
  }, [showOccasional]);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const [data, allPlayers] = await Promise.all([
        playerStatsService.getPlayerStats(showOccasional),
        playerService.getPlayers()
      ]);
      
      setStats(data);
      
      const nickMap = new Map<string, string>();
      for (const player of allPlayers) {
        if (player.nickname) {
          nickMap.set(player.id, player.nickname);
        }
      }
      setNicknameMap(nickMap);
    } catch (err) {
      setError(t('playerStats.loadError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: keyof PlayerStats) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Change column and default to descending
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortedStats = (): PlayerStats[] => {
    const sorted = [...stats].sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];

      // Use displayed name for sorting if sorting by player
      if (sortColumn === 'playerId' || sortColumn === 'playerName') {
        const aName = showNicknames ? (nicknameMap.get(a.playerId) || a.playerName) : a.playerName;
        const bName = showNicknames ? (nicknameMap.get(b.playerId) || b.playerName) : b.playerName;
        return sortDirection === 'asc' 
          ? aName.localeCompare(bName) 
          : bName.localeCompare(aName);
      }

      // Handle numeric comparisons
      const aNum = typeof aValue === 'number' ? aValue : 0;
      const bNum = typeof bValue === 'number' ? bValue : 0;

      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });

    return sorted;
  };

  const SortIndicator: React.FC<{ column: keyof PlayerStats }> = ({ column }) => {
    if (sortColumn !== column) {return <span className="text-gray-300 ml-1">↕</span>;}
    return <span className="text-indigo-600 ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return <div className="p-8 text-center">{t('playerStats.loading')}</div>;
  }

  const sortedStats = getSortedStats();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('playerStats.heading')}</h1>
            <p className="text-gray-600 mt-2">{t('playerStats.subtitle')}</p>
          </div>
          <Link
            to="/admin/dashboard"
            className="text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            ← {t('playerStats.backToAdmin')}
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Toggles */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 flex flex-wrap gap-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showOccasional}
              onChange={(e) => setShowOccasional(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-3 text-gray-700 font-medium">
              {t('playerStats.showAllPlayers')}
            </span>
          </label>

          <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showNicknames}
              onChange={(e) => setShowNicknames(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-3 text-gray-700 font-medium">
              {t('playerStats.showNicknames')}
            </span>
          </label>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {sortedStats.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t('playerStats.noStats')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                        onClick={() => handleSort('playerName')}>
                      {t('playerStats.playerName')} <SortIndicator column="playerName" />
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                        onClick={() => handleSort('matchesPlayed')}>
                      {t('playerStats.matches')} <SortIndicator column="matchesPlayed" />
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                        onClick={() => handleSort('totalPoints')}>
                      {t('playerStats.totalPoints')} <SortIndicator column="totalPoints" />
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                        onClick={() => handleSort('wins')}>
                      {t('playerStats.wins')} <SortIndicator column="wins" />
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                        onClick={() => handleSort('draws')}>
                      {t('playerStats.draws')} <SortIndicator column="draws" />
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                        onClick={() => handleSort('losses')}>
                      {t('playerStats.losses')} <SortIndicator column="losses" />
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                        onClick={() => handleSort('totalGoalsScored')}>
                      {t('playerStats.goalsFor')} <SortIndicator column="totalGoalsScored" />
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                        onClick={() => handleSort('totalGoalsConceded')}>
                      {t('playerStats.goalsAgainst')} <SortIndicator column="totalGoalsConceded" />
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                        onClick={() => handleSort('pointsPerGame')}>
                      {t('playerStats.pointsPerGame')} <SortIndicator column="pointsPerGame" />
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                        onClick={() => handleSort('goalsPerGame')}>
                      {t('playerStats.goalsForPerGame')} <SortIndicator column="goalsPerGame" />
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                        onClick={() => handleSort('goalsAgainstPerGame')}>
                      {t('playerStats.goalsAgainstPerGame')} <SortIndicator column="goalsAgainstPerGame" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedStats.map((stat) => (
                    <tr key={stat.playerId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/admin/player-stats/${stat.playerId}`}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          {showNicknames ? (nicknameMap.get(stat.playerId) || stat.playerName) : stat.playerName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                        {stat.matchesPlayed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-indigo-600">
                        {stat.totalPoints}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                        {stat.wins}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                        {stat.draws}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                        {stat.losses}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                        {stat.totalGoalsScored}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                        {stat.totalGoalsConceded}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                        {stat.pointsPerGame.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                        {stat.goalsPerGame.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                        {stat.goalsAgainstPerGame.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-sm text-gray-600 text-center">
          {t('playerStats.footer', { count: sortedStats.length, players: sortedStats.length !== 1 ? t('playerStats.players') : t('playerStats.player') })}
        </div>
      </div>
    </div>
  );
};
