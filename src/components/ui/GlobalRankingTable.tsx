import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlayerStats } from '../../types';
import { usePlayerAuth } from '../../context/PlayerAuthContext';

interface GlobalRankingTableProps {
  stats: PlayerStats[];
  isLoading: boolean;
  nicknameMap: Map<string, string>;
}

export const GlobalRankingTable: React.FC<GlobalRankingTableProps> = ({
  stats,
  isLoading,
  nicknameMap,
}) => {
  const { playerId } = usePlayerAuth();
  const { t } = useTranslation();
  const [sortColumn, setSortColumn] = useState<keyof PlayerStats>('totalPoints');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: keyof PlayerStats) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getSortedStats = (): PlayerStats[] => {
    const safeStats = stats || [];
    const sorted = [...safeStats].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (sortColumn === 'playerId' || sortColumn === 'playerName') {
        const aStr = (aValue as string).toLowerCase();
        const bStr = (bValue as string).toLowerCase();
        return sortDirection === 'asc' 
          ? aStr.localeCompare(bStr) 
          : bStr.localeCompare(aStr);
      }

      const aNum = typeof aValue === 'number' ? aValue : 0;
      const bNum = typeof bValue === 'number' ? bValue : 0;

      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });

    return sorted;
  };

  const SortIndicator: React.FC<{ column: keyof PlayerStats }> = ({ column }) => {
    if (sortColumn !== column) {
      return <span className="text-gray-300 ml-1">↕</span>;
    }
    return <span className="text-indigo-600 ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">{t('globalRanking.loading')}</div>;
  }

  const sortedStats = getSortedStats();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {sortedStats.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No rankings available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                  onClick={() => handleSort('playerName')}
                >
                  {t('playerStats.playerName')} <SortIndicator column="playerName" />
                </th>
                <th
                  className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                  onClick={() => handleSort('matchesPlayed')}
                >
                  {t('playerStats.matches')} <SortIndicator column="matchesPlayed" />
                </th>
                <th
                  className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                  onClick={() => handleSort('totalPoints')}
                >
                  {t('playerStats.totalPoints')} <SortIndicator column="totalPoints" />
                </th>
                <th
                  className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                  onClick={() => handleSort('wins')}
                >
                  {t('playerStats.wins')} <SortIndicator column="wins" />
                </th>
                <th
                  className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                  onClick={() => handleSort('draws')}
                >
                  {t('playerStats.draws')} <SortIndicator column="draws" />
                </th>
                <th
                  className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                  onClick={() => handleSort('losses')}
                >
                  {t('playerStats.losses')} <SortIndicator column="losses" />
                </th>
                <th
                  className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                  onClick={() => handleSort('totalGoalsScored')}
                >
                  {t('playerStats.goalsFor')} <SortIndicator column="totalGoalsScored" />
                </th>
                <th
                  className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                  onClick={() => handleSort('totalGoalsConceded')}
                >
                  {t('playerStats.goalsAgainst')} <SortIndicator column="totalGoalsConceded" />
                </th>
                <th
                  className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                  onClick={() => handleSort('pointsPerGame')}
                >
                  {t('playerStats.pointsPerGame')} <SortIndicator column="pointsPerGame" />
                </th>
                <th
                  className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                  onClick={() => handleSort('goalsPerGame')}
                >
                  {t('playerStats.goalsForPerGame')} <SortIndicator column="goalsPerGame" />
                </th>
                <th
                  className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-150"
                  onClick={() => handleSort('goalsAgainstPerGame')}
                >
                  {t('playerStats.goalsAgainstPerGame')} <SortIndicator column="goalsAgainstPerGame" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedStats.map((stat) => {
                const isLoggedInPlayer = stat.playerId === playerId;
                const displayName = isLoggedInPlayer 
                  ? stat.playerName 
                  : (nicknameMap.get(stat.playerId) || stat.playerName);

                return (
                  <tr
                    key={stat.playerId}
                    className={isLoggedInPlayer ? 'bg-gray-100' : 'hover:bg-gray-50'}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {displayName}
                      {isLoggedInPlayer && nicknameMap.get(stat.playerId) && (
                        <span className="ml-2 text-xs text-indigo-600 font-semibold">({nicknameMap.get(stat.playerId)})</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                      {stat.matchesPlayed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-indigo-600">
                      {stat.totalPoints}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600">
                      {stat.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-yellow-600">
                      {stat.draws}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-red-600">
                      {stat.losses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                      {stat.totalGoalsScored}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                      {stat.totalGoalsConceded}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                      {stat.pointsPerGame.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                      {stat.goalsPerGame.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                      {stat.goalsAgainstPerGame.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
