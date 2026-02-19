import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Player, Match } from '../../types';
import { playerService } from '../../services/playerService';
import { matchService } from '../../services/matchService';
import { PitchView } from '../../components/ui/PitchView';

export const NextLineupPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  // Allow both 'id' and 'editMatchId' for backward compatibility or different links
  const editMatchId = searchParams.get('editMatchId') || searchParams.get('id');

  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTeam, setActiveTeam] = useState<'white' | 'red'>('white');
  const [saving, setSaving] = useState(false);

  // Derived state for selected players to check availability
  const [selectedWhiteIds, setSelectedWhiteIds] = useState<Set<string>>(new Set());
  const [selectedRedIds, setSelectedRedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [editMatchId]);

  const loadData = async () => {
    try {
      const playersPromise = playerService.getPlayers();
      const matchPromise = editMatchId
        ? matchService.getMatchById(editMatchId)
        : matchService.getScheduledMatch();

      const [playersData, matchData] = await Promise.all([playersPromise, matchPromise]);
      setAllPlayers(playersData);

      if (matchData) {
        setMatch(matchData);
        setSelectedWhiteIds(new Set(matchData.teamWhite));
        setSelectedRedIds(new Set(matchData.teamRed));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async () => {
    const dateStr = prompt(t('nextLineup.datePrompt'), new Date().toISOString().split('T')[0]);
    if (!dateStr) {
      return;
    }

    setSaving(true);
    try {
      await matchService.createMatch(dateStr);
      await loadData(); // Reload to get the new match
    } catch (e) {
      alert('Error creating match');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handlePlayerClick = async (player: Player) => {
    if (!match) {
      return;
    }

    // Check if player is already selected in EITHER team
    if (selectedWhiteIds.has(player.id) || selectedRedIds.has(player.id)) {
      // Optional: You could allow clicking to remove, but spec says "click to add", pitch removes
      return;
    }

    const newWhite = new Set(selectedWhiteIds);
    const newRed = new Set(selectedRedIds);

    if (activeTeam === 'white') {
      if (newWhite.size >= 11) {
        alert(t('nextLineup.fullTeam', { team: t('nextLineup.teamWhite') }));
        return;
      }
      newWhite.add(player.id);
    } else {
      if (newRed.size >= 11) {
        alert(t('nextLineup.fullTeam', { team: t('nextLineup.teamRed') }));
        return;
      }
      newRed.add(player.id);
    }

    // Optimistic UI update
    setSelectedWhiteIds(newWhite);
    setSelectedRedIds(newRed);

    // Save to DB
    try {
      await matchService.updateLineup(match.id, Array.from(newWhite), Array.from(newRed));
    } catch (e) {
      console.error('Failed to save lineup', e);
      // Revert on error would go here
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!match) {
      return;
    }

    const newWhite = new Set(selectedWhiteIds);
    const newRed = new Set(selectedRedIds);

    const removedFromWhite = newWhite.delete(playerId);
    const removedFromRed = newRed.delete(playerId);

    if (removedFromWhite || removedFromRed) {
      // UX Improvement: Switch toggle to the team we just removed from
      if (removedFromWhite) {
        setActiveTeam('white');
      }
      if (removedFromRed) {
        setActiveTeam('red');
      }

      setSelectedWhiteIds(newWhite);
      setSelectedRedIds(newRed);

      try {
        await matchService.updateLineup(match.id, Array.from(newWhite), Array.from(newRed));
      } catch (e) {
        console.error('Failed to save removal', e);
      }
    }
  };

  const handleCloseMatch = async () => {
    if (!match) {
      return;
    }

    if (selectedWhiteIds.size < 6 || selectedRedIds.size < 6) {
      alert(t('nextLineup.closeMatchMinPlayers'));
      return;
    }

    const whiteScore = prompt(t('nextLineup.whiteGoalsPrompt'));
    const redScore = prompt(t('nextLineup.redGoalsPrompt'));

    if (whiteScore === null || redScore === null) {
      return;
    }

    if (confirm(t('nextLineup.confirmScore', { whiteScore, redScore }))) {
      try {
        await matchService.closeMatch(match.id, parseInt(whiteScore), parseInt(redScore));
        setMatch(null); // Clear current match from view as it's closed
        setSelectedWhiteIds(new Set());
        setSelectedRedIds(new Set());
        alert(t('nextLineup.closeMatchSuccess'));
      } catch (e) {
        alert(t('nextLineup.closeMatchError'));
        console.error(e);
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center">{t('nextLineup.loading')}</div>;
  }

  if (!match) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('nextLineup.noUpcomingMatch')}</h2>
        <button
          onClick={handleCreateMatch}
          disabled={saving}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-700"
        >
          {saving ? t('nextLineup.creating') : t('nextLineup.createNextMatch')}
        </button>
        <div className="mt-6">
          <Link to="/admin/dashboard" className="text-gray-600 hover:underline">
            {t('nextLineup.backToDashboard')}
          </Link>
        </div>
      </div>
    );
  }

  // Helper to get actual Player objects for the pitch
  const teamWhitePlayers = Array.from(selectedWhiteIds)
    .map((id) => allPlayers.find((p) => p.id === id))
    .filter(Boolean) as Player[];
  const teamRedPlayers = Array.from(selectedRedIds)
    .map((id) => allPlayers.find((p) => p.id === id))
    .filter(Boolean) as Player[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {editMatchId ? t('nextLineup.editHeading') : t('nextLineup.heading')}
          </h2>
          <p className="text-sm text-gray-500">
            {t('nextLineup.matchDate')}: {match.date.toDate().toLocaleDateString()}
          </p>
          {match.status === 'completed' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
              {t('nextLineup.completed')}
            </span>
          )}
        </div>
        <div className="space-x-4 flex items-center">
          {match.status === 'scheduled' && (
            <button
              onClick={handleCloseMatch}
              className="text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 rounded transition"
            >
              {t('nextLineup.closeMatch')}
            </button>
          )}
          <Link
            to={editMatchId ? '/admin/history' : '/admin/dashboard'}
            className="text-indigo-600 hover:text-indigo-800"
          >
            {editMatchId ? t('nextLineup.backToHistory') : t('nextLineup.back')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: UI Controls */}
        <div className="space-y-6">
          {/* Team Toggle */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide block mb-3">
              {t('nextLineup.selectActiveTeam')}
            </label>
            <div className="flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setActiveTeam('white')}
                className={`flex-1 px-4 py-3 text-sm font-medium border rounded-l-lg transition-colors
                                    ${
                                      activeTeam === 'white'
                                        ? 'bg-gray-100 text-gray-900 border-gray-300 ring-2 ring-indigo-500 z-10'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
              >
                {t('nextLineup.teamWhite')} ({selectedWhiteIds.size}/11)
              </button>
              <button
                type="button"
                onClick={() => setActiveTeam('red')}
                className={`flex-1 px-4 py-3 text-sm font-medium border rounded-r-lg transition-colors
                                    ${
                                      activeTeam === 'red'
                                        ? 'bg-red-50 text-red-700 border-red-300 ring-2 ring-red-500 z-10'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
              >
                {t('nextLineup.teamRed')} ({selectedRedIds.size}/11)
              </button>
            </div>
          </div>

          {/* Roster Selection */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-[500px] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4 sticky top-0 bg-white pb-2 border-b">
              {t('nextLineup.availablePlayers')}
            </h3>

            {/* Active Players */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-700 mb-2">
                {t('nextLineup.activePlayers')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {allPlayers
                  .filter((p) => p.type === 'active')
                  .map((player) => {
                    const isSelected =
                      selectedWhiteIds.has(player.id) || selectedRedIds.has(player.id);
                    return (
                      <button
                        key={player.id}
                        onClick={() => handlePlayerClick(player)}
                        disabled={isSelected}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all transform active:scale-95
                                                ${
                                                  isSelected
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                                    : activeTeam === 'white'
                                                      ? 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-sm'
                                                      : 'bg-red-50 border border-red-200 text-red-700 hover:border-red-300 hover:bg-red-100'
                                                }
                                            `}
                      >
                        {player.name}
                      </button>
                    );
                  })}
              </div>
              {allPlayers.filter((p) => p.type === 'active').length === 0 && (
                <p className="text-gray-500 italic text-sm">{t('nextLineup.noActivePlayers')}</p>
              )}
            </div>

            {/* Occasional Players */}
            <div>
              <h4 className="text-md font-semibold text-gray-700 mb-2">
                {t('nextLineup.occasionalPlayers')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {allPlayers
                  .filter((p) => p.type === 'occasional')
                  .map((player) => {
                    const isSelected =
                      selectedWhiteIds.has(player.id) || selectedRedIds.has(player.id);
                    return (
                      <button
                        key={player.id}
                        onClick={() => handlePlayerClick(player)}
                        disabled={isSelected}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all transform active:scale-95
                                                ${
                                                  isSelected
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                                    : activeTeam === 'white'
                                                      ? 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-sm'
                                                      : 'bg-red-50 border border-red-200 text-red-700 hover:border-red-300 hover:bg-red-100'
                                                }
                                            `}
                      >
                        {player.name}
                      </button>
                    );
                  })}
              </div>
              {allPlayers.filter((p) => p.type === 'occasional').length === 0 && (
                <p className="text-gray-500 italic text-sm">
                  {t('nextLineup.noOccasionalPlayers')}
                </p>
              )}
            </div>

            {allPlayers.length === 0 && (
              <p className="text-gray-500 italic">{t('nextLineup.noPlayersFound')}</p>
            )}
          </div>
        </div>

        {/* Right Column: Visualization */}
        <div className="flex flex-col items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-xl shadow-inner w-full flex flex-col items-center">
            <h3 className="text-white text-lg font-bold mb-4 uppercase tracking-widest">
              {t('nextLineup.lineup')}
            </h3>
            <PitchView
              teamRed={teamRedPlayers}
              teamWhite={teamWhitePlayers}
              onRemovePlayer={handleRemovePlayer}
            />
          </div>
          <p className="text-gray-500 text-sm mt-4 italic">{t('nextLineup.removeFromPitch')}</p>
        </div>
      </div>
    </div>
  );
};
