import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useExercises } from '../hooks/useExercises';

export function ExerciseListAnalyticsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useExercises({ search });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Exercise Progress</h1>
      <p className="text-sm text-gray-500">Select an exercise to view its progression charts and PRs.</p>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search exercises..."
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {isLoading && <p className="text-gray-500">Loading...</p>}

      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {data?.results.map((ex) => (
          <Link
            key={ex.id}
            to={`/analytics/exercise/${ex.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
          >
            <div>
              <span className="text-sm font-medium text-gray-900">{ex.name}</span>
              {ex.muscle_group && (
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">
                  {ex.muscle_group}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">{ex.category}</span>
          </Link>
        ))}
      </div>

      {data && data.results.length === 0 && (
        <p className="text-gray-500 text-center py-8">No exercises found.</p>
      )}
    </div>
  );
}
