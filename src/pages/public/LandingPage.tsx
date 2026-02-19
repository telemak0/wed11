import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PitchView } from '../../components/ui/PitchView';
import { matchService } from '../../services/matchService';
import { playerService } from '../../services/playerService';
import { Match, Player } from '../../types';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [match, setMatch] = useState<Match | null>(null);
  const [teamRed, setTeamRed] = useState<Player[]>([]);
  const [teamWhite, setTeamWhite] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [m, players] = await Promise.all([
          matchService.getScheduledMatch(),
          playerService.getPlayers(),
        ]);

        if (m) {
          setMatch(m);
          setTeamRed(
            m.teamRed.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[]
          );
          setTeamWhite(
            m.teamWhite.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[]
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header with Logo and Login Button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            {t('landing.heading')}
          </h1>
          <button
            onClick={() => navigate('/player-login')}
            className="px-6 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors"
          >
            {t('landing.playerLoginBtn')}
          </button>
        </div>

        <div className="flex flex-col items-center">
          {loading ? (
            <div className="text-gray-500">{t('landing.loading')}</div>
          ) : match ? (
            <div className="w-full">
              <div className="bg-white rounded-xl shadow-2xl p-6 overflow-hidden">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {t('landing.scheduledMatch')}
                  </h2>
                  <p className="text-gray-500">{match.date.toDate().toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-900 p-4 rounded-xl">
                  <h3 className="text-center text-white text-lg font-bold mb-4 uppercase tracking-widest">
                    {t('landing.fieldView')}
                  </h3>
                  <PitchView teamRed={teamRed} teamWhite={teamWhite} interactive={false} />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-12">
              <p>{t('landing.noUpcomingMatches')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
