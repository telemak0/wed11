import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Match } from '../../types';
import { matchService } from '../../services/matchService';
import { ScoreModal } from '../../components/ui/ScoreModal';

export const MatchHistoryPage = () => {
  const { t } = useTranslation();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const data = await matchService.getAllMatches();
      // Filter for history? Or show all? Usually history implies past.
      // Let's show all for admin convenience, or maybe just completed + past dates.
      // For now, showing all sorted by date desc seems best for an admin tool.
      setMatches(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, date: Date) => {
    if (confirm(t('matchHistory.deleteConfirm', { date: date.toLocaleDateString() }))) {
      try {
        await matchService.deleteMatch(id);
        setMatches(matches.filter(m => m.id !== id));
      } catch (e) {
        alert(t('matchHistory.deleteError'));
        console.error(e);
      }
    }
  };

  const handleEditScoreClick = (match: Match) => {
    setEditingMatch(match);
    setScoreModalOpen(true);
  };

  const handleSaveScore = async (whiteGoals: number, redGoals: number) => {
    if (!editingMatch) {return;}

    try {
        await matchService.updateMatchScore(editingMatch.id, whiteGoals, redGoals);
        // Update local state
        setMatches(matches.map(m => m.id === editingMatch.id ? { 
            ...m, 
            result: { goalsWhite: whiteGoals, goalsRed: redGoals },
            status: 'completed'
        } : m));
        setScoreModalOpen(false);
        setEditingMatch(null);
    } catch (e) {
        alert(t('matchHistory.updateScoreError'));
    }
  };

  if (loading) {return <div className="p-8 text-center">{t('matchHistory.loading')}</div>;}

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t('matchHistory.heading')}</h2>
        <Link to="/admin/dashboard" className="text-indigo-600 hover:text-indigo-800">
          &larr; {t('matchHistory.backToAdmin')}
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {matches.map((match) => {
              const date = match.date.toDate();
              const isCompleted = match.status === 'completed';
              const score = isCompleted && match.result 
                ? `${match.result.goalsWhite} - ${match.result.goalsRed}` 
                : 'Pending/Scheduled';

              return (
                <li key={match.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {date.toLocaleDateString()}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex flex-col items-end">
                            {isCompleted ? (
                                <>
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {t('matchHistory.completed')}
                                    </span>
                                    <span className="text-xs text-gray-500 mt-1">
                                        {t('matchHistory.final')}: {score}
                                    </span>
                                </>
                            ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    {t('matchHistory.scheduled')}
                                </span>
                            )}
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {t('matchHistory.whitePlayers', { count: match.teamWhite.length })} | {t('matchHistory.redPlayers', { count: match.teamRed.length })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-3 justify-end">
                      <button 
                        onClick={() => navigate(`/admin/next-lineup?editMatchId=${match.id}`)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                          {t('matchHistory.editLineup')}
                      </button>
                      <button 
                        onClick={() => handleEditScoreClick(match)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                          {t('matchHistory.editScore')}
                      </button>
                      <button 
                         onClick={() => handleDelete(match.id, date)}
                         className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                      >
                          {t('matchHistory.delete')}
                      </button>
                  </div>
                </li>
              );
          })}
          {matches.length === 0 && (
              <li className="px-4 py-8 text-center text-gray-500">{t('matchHistory.noMatchesFound')}</li>
          )}
        </ul>
      </div>
      
      {editingMatch && (
        <ScoreModal
          isOpen={scoreModalOpen}
          onClose={() => {
            setScoreModalOpen(false);
            setEditingMatch(null);
          }}
          onSave={handleSaveScore}
          initialWhite={editingMatch.result?.goalsWhite ?? 0}
          initialRed={editingMatch.result?.goalsRed ?? 0}
        />
      )}
    </div>
  );
};
