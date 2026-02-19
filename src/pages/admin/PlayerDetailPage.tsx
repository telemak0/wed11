import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  PlayerTeammateStats,
  PlayerOpponentStats,
  PlayerTeamDistribution,
  PlayerResultDistribution,
  Player,
} from '../../types';
import { playerDetailService } from '../../services/playerDetailService';
import { playerService } from '../../services/playerService';

// Custom label component for team distribution pie chart to ensure readable text
const TeamDistributionLabel = (props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
  index?: number;
  name?: string;
  value?: number;
}) => {
  const RADIAN = Math.PI / 180;
  const radius =
    (props.innerRadius ?? 0) + ((props.outerRadius ?? 0) - (props.innerRadius ?? 0)) * 1.2;
  const x = (props.cx ?? 0) + radius * Math.cos(-((props.midAngle ?? 0) * RADIAN));
  const y = (props.cy ?? 0) + radius * Math.sin(-((props.midAngle ?? 0) * RADIAN));

  return (
    <text
      x={x}
      y={y}
      fill="#000000"
      textAnchor={x > (props.cx ?? 0) ? 'start' : 'end'}
      dominantBaseline="central"
      className="font-semibold"
    >
      {`${props.name}: ${props.value}`}
    </text>
  );
};

export const PlayerDetailPage = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [player, setPlayer] = useState<Player | null>(null);
  const [teammates, setTeammates] = useState<PlayerTeammateStats[]>([]);
  const [opponents, setOpponents] = useState<PlayerOpponentStats[]>([]);
  const [teamDistribution, setTeamDistribution] = useState<PlayerTeamDistribution | null>(null);
  const [resultDistribution, setResultDistribution] = useState<PlayerResultDistribution | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!playerId) {
      return;
    }
    loadPlayerDetail();
  }, [playerId]);

  const loadPlayerDetail = async () => {
    if (!playerId) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Load player info
      const playerData = await playerService.getPlayerById(playerId);
      if (!playerData) {
        setError(t('playerDetail.notFound'));
        setLoading(false);
        return;
      }
      setPlayer(playerData);

      // Load all detail data in parallel
      const [tm, op, td, rd] = await Promise.all([
        playerDetailService.getTopTeammates(playerId),
        playerDetailService.getTopOpponents(playerId),
        playerDetailService.getTeamDistribution(playerId),
        playerDetailService.getResultDistribution(playerId),
      ]);

      setTeammates(tm);
      setOpponents(op);
      setTeamDistribution(td);
      setResultDistribution(rd);
    } catch (err) {
      setError(t('playerDetail.failedToLoad'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">{t('playerDetail.loading')}</div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/admin/player-stats')}
          className="mb-6 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          {t('playerDetail.backToStats')}
        </button>
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-red-800">{error || t('playerDetail.notFound')}</p>
        </div>
      </div>
    );
  }

  // Total games for header info
  const totalGames = (teamDistribution?.white ?? 0) + (teamDistribution?.red ?? 0);
  const totalPoints = (resultDistribution?.wins ?? 0) * 3 + (resultDistribution?.draws ?? 0);

  // Prepare data for pie charts
  const teamData = [
    { name: 'White', value: teamDistribution?.white ?? 0 },
    { name: 'Red', value: teamDistribution?.red ?? 0 },
  ];

  const resultData = [
    { name: 'Wins', value: resultDistribution?.wins ?? 0 },
    { name: 'Draws', value: resultDistribution?.draws ?? 0 },
    { name: 'Losses', value: resultDistribution?.losses ?? 0 },
  ];

  // Calculate percentages for teammates and opponents
  const teammatesTotals = teammates.reduce((sum, t) => sum + t.gamesPlayed, 0) || 1;
  const opponentsTotals = opponents.reduce((sum, o) => sum + o.gamesPlayed, 0) || 1;

  const teammatesData = teammates.map((t) => ({
    name: t.playerName,
    games: t.gamesPlayed,
    winrate: t.winrate,
    percentage: Math.round((t.gamesPlayed / teammatesTotals) * 100),
  }));

  const opponentsData = opponents.map((o) => ({
    name: o.playerName,
    games: o.gamesPlayed,
    winrate: o.winrate,
    percentage: Math.round((o.gamesPlayed / opponentsTotals) * 100),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate('/admin/player-stats')}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 mb-2"
          >
            {t('playerDetail.backToStats')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{player.name}</h1>
          <p className="mt-2 text-gray-600">
            <span className="font-medium">{totalGames}</span> {t('playerDetail.totalMatches')} •{' '}
            <span className="font-medium">{totalPoints}</span> {t('playerDetail.totalPoints')}
          </p>
        </div>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Team Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('playerDetail.teamDistribution')}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={teamData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={TeamDistributionLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#ffffff" stroke="#000000" strokeWidth={2} />
                <Cell fill="#ef4444" stroke="#000000" strokeWidth={2} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Results Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('playerDetail.resultsDistribution')}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={resultData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#eab308" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Teammates and Opponents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Teammates */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('playerDetail.topTeammates')}
          </h2>
          {teammates.length === 0 ? (
            <p className="text-gray-500">{t('playerDetail.noTeammatesFound')}</p>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={450}>
                <BarChart
                  data={teammatesData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, totalGames]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'games') {
                        return [`${value} games`, 'Games'];
                      }
                      if (name === 'percentage') {
                        return [`${value}%`, 'Percentage'];
                      }
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="games" fill="#3b82f6" name="Games" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 text-sm text-gray-600">
                {teammates.map((t) => (
                  <div key={t.playerId} className="flex justify-between">
                    <span>{t.playerName}</span>
                    <span className="font-medium">
                      {t.gamesPlayed} games - {t.winrate}% winrate
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
            {t('playerDetail.topOpponents')}
          </h2>
          {opponents.length === 0 ? (
            <p className="text-gray-500">{t('playerDetail.noOpponentsFound')}</p>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={450}>
                <BarChart
                  data={opponentsData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, totalGames]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'games') {
                        return [`${value} games`, 'Games'];
                      }
                      if (name === 'percentage') {
                        return [`${value}%`, 'Percentage'];
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
                      {o.gamesPlayed} games - {o.winrate}% winrate
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
