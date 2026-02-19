import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePlayerAuth } from '../../context/PlayerAuthContext';
import { playerStatsService } from '../../services/playerStatsService';
import { playerDetailService } from '../../services/playerDetailService';
import { playerService } from '../../services/playerService';
import { GlobalRankingTable } from '../../components/ui';
import type { PlayerStats, PlayerTeammateStats, PlayerOpponentStats } from '../../types';

export const PlayerDashboardPage = () => {
  const { playerId, playerName, logout } = usePlayerAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [teammates, setTeammates] = useState<PlayerTeammateStats[]>([]);
  const [opponents, setOpponents] = useState<PlayerOpponentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Global ranking state
  const [allStats, setAllStats] = useState<PlayerStats[]>([]);
  const [nicknameMap, setNicknameMap] = useState<Map<string, string>>(new Map());
  const [rankingLoading, setRankingLoading] = useState(true);

  useEffect(() => {
    if (!playerId) {
      navigate('/player-login');
      return;
    }

    const loadStats = async () => {
      try {
        const playerStats = await playerStatsService.calculateStatsForPlayer(playerId);
        if (playerStats) {
          setStats(playerStats);
        }

        const [tm, op] = await Promise.all([
          playerDetailService.getTopTeammates(playerId),
          playerDetailService.getTopOpponents(playerId),
        ]);
        setTeammates(tm);
        setOpponents(op);

        // Load global ranking stats (ACTIVE players only) and their nicknames from Firestore
        const rankingStats = await playerStatsService.getPlayerStats(false);
        setAllStats(rankingStats);

        // Load all players to get their nicknames from Firestore
        const allPlayers = await playerService.getPlayers();
        const nickMap = new Map<string, string>();
        for (const player of allPlayers) {
          if (player.nickname) {
            nickMap.set(player.id, player.nickname);
          }
        }
        setNicknameMap(nickMap);
        setRankingLoading(false);

        setError('');
      } catch (err) {
        setError(t('playerDashboard.loadError'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [playerId, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/player-login');
  };

  if (!playerId || !playerName) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t('playerDashboard.title', { playerName })}</h1>
            <p className="text-gray-600">{t('playerDashboard.statsSubtitle')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            {t('playerDashboard.logout')}
          </button>
        </div>

        {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="inline-block">{t('common.loading')}</div>
          </div>
        ) : stats ? (
          <div className="bg-white p-6 rounded-lg shadow">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-gray-600 text-sm font-medium">
                  {t('playerDashboard.matchesPlayed')}
                </p>
                <p className="text-3xl font-bold text-blue-600">{stats.matchesPlayed}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-gray-600 text-sm font-medium">{t('playerDashboard.wins')}</p>
                <p className="text-3xl font-bold text-green-600">{stats.wins}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded">
                <p className="text-gray-600 text-sm font-medium">{t('playerDashboard.draws')}</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.draws}</p>
              </div>
              <div className="bg-red-50 p-4 rounded">
                <p className="text-gray-600 text-sm font-medium">{t('playerDashboard.losses')}</p>
                <p className="text-3xl font-bold text-red-600">{stats.losses}</p>
              </div>
            </div>

            <hr className="my-6" />

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4">
                <p className="text-gray-600 text-sm font-medium mb-1">
                  {t('playerDashboard.totalPoints')}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPoints}</p>
              </div>
              <div className="p-4">
                <p className="text-gray-600 text-sm font-medium mb-1">
                  {t('playerDashboard.pointsPerGame')}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stats.pointsPerGame.toFixed(2)}</p>
              </div>
              <div className="p-4">
                <p className="text-gray-600 text-sm font-medium mb-1">
                  {t('playerDashboard.goalsScored')}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalGoalsScored}</p>
              </div>
              <div className="p-4">
                <p className="text-gray-600 text-sm font-medium mb-1">
                  {t('playerDashboard.goalsPerGame')}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stats.goalsPerGame.toFixed(2)}</p>
              </div>
              <div className="p-4">
                <p className="text-gray-600 text-sm font-medium mb-1">
                  {t('playerDashboard.goalsAgainst')}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalGoalsConceded}</p>
              </div>
              <div className="p-4">
                <p className="text-gray-600 text-sm font-medium mb-1">
                  {t('playerDashboard.goalsAgainstPerGame')}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.goalsAgainstPerGame.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Top Teammates and Opponents */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
              {/* Top Teammates */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('playerDashboard.teammates')}
                </h2>
                {teammates.length === 0 ? (
                  <p className="text-gray-500">{t('playerDashboard.noTeammates')}</p>
                ) : (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={450}>
                      <BarChart
                        data={teammates.map((t) => ({
                          name: t.playerName,
                          games: t.gamesPlayed,
                          winrate: t.winrate,
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === 'games') {
                              return [
                                `${value} ${t('playerDetail.games')}`,
                                t('playerDashboard.gamesLabel'),
                              ];
                            }
                            if (name === 'winrate') {
                              return [`${value}%`, t('playerDashboard.winrateLabel')];
                            }
                            return [value, name];
                          }}
                        />
                        <Bar dataKey="games" fill="#3b82f6" name="Games" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 text-sm text-gray-600">
                      {teammates.map((tm) => (
                        <div key={tm.playerId} className="flex justify-between">
                          <span>{tm.playerName}</span>
                          <span className="font-medium">
                            {t('playerDashboard.statsSummary', {
                              count: tm.gamesPlayed,
                              winrate: tm.winrate,
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Top Opponents */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('playerDashboard.opponents')}
                </h2>
                {opponents.length === 0 ? (
                  <p className="text-gray-500">{t('playerDashboard.noOpponents')}</p>
                ) : (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={450}>
                      <BarChart
                        data={opponents.map((o) => ({
                          name: o.playerName,
                          games: o.gamesPlayed,
                          winrate: o.winrate,
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === 'games') {
                              return [
                                `${value} ${t('playerDetail.games')}`,
                                t('playerDashboard.gamesLabel'),
                              ];
                            }
                            if (name === 'winrate') {
                              return [`${value}%`, t('playerDashboard.winrateLabel')];
                            }
                            return [value, name];
                          }}
                        />
                        <Bar dataKey="games" fill="#f59e0b" name="Games" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 text-sm text-gray-600">
                      {opponents.map((o) => (
                        <div key={o.playerId} className="flex justify-between">
                          <span>{o.playerName}</span>
                          <span className="font-medium">
                            {t('playerDashboard.statsSummary', {
                              count: o.gamesPlayed,
                              winrate: o.winrate,
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Global Ranking Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {t('playerDashboard.globalRanking')}
              </h2>
              <GlobalRankingTable
                stats={allStats}
                isLoading={rankingLoading}
                nicknameMap={nicknameMap}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-600 text-lg">{t('playerDashboard.noStats')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
