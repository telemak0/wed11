import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

export const DashboardPage = () => {
  const { logout } = useAuth();
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{t('admin.welcome')}</h2>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          {t('admin.logout')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/next-lineup"
          className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('admin.nextLineup')}
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            {t('admin.nextLineupDesc')}
          </p>
        </Link>

        <Link
          to="/admin/players"
          className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('admin.managePlayers')}
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            {t('admin.managePlayersDesc')}
          </p>
        </Link>

        <Link
          to="/admin/history"
          className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('admin.matchHistory')}
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            {t('admin.matchHistoryDesc')}
          </p>
        </Link>

        <Link
          to="/admin/player-stats"
          className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
        >
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('admin.playerStats')}
          </h5>
          <p className="font-normal text-gray-700 dark:text-gray-400">
            {t('admin.playerStatsDesc')}
          </p>
        </Link>
      </div>
    </div>
  );
};
