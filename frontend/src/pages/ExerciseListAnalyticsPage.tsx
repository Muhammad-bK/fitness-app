import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useExercises } from '../hooks/useExercises';
import { paths, exerciseProgressNav } from '../routes';
import { PageHeader } from '../components/ui/page-header';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { LoadingState } from '../components/ui/loading-state';

export function ExerciseListAnalyticsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useExercises({ search });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exercise Progress"
        description="Select an exercise to view its progression charts and PRs."
      />

      <Input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search exercises…"
      />

      {isLoading && <LoadingState />}

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-k-border">
          {data?.results.map((ex) => (
            <Link
              key={ex.id}
              to={paths.analytics.exercise(ex.id)}
              state={exerciseProgressNav.fromExercises}
              className="flex items-center justify-between px-6 py-3.5 hover:bg-k-elevated/50 transition-colors"
            >
              <div>
                <span className="text-sm font-medium text-k-fg">{ex.name}</span>
                {ex.muscle_group && (
                  <Badge variant="default" className="ml-2">
                    {ex.muscle_group}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-k-faint">{ex.category}</span>
            </Link>
          ))}
        </div>
      </Card>

      {data && data.results.length === 0 && (
        <p className="text-k-muted text-center py-8">No exercises found.</p>
      )}
    </div>
  );
}
