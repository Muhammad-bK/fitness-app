import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { useDailyFoodLog, useFoodSearch, useLogFood } from '../hooks/useIntelligence';
import { scaleFoodCalories } from '../lib/fitnessCalculations';
import { PageHeader } from '../components/ui/page-header';
import { Card, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingState } from '../components/ui/loading-state';
import type { FoodItem, MealType } from '../types/intelligence';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function NutritionPage() {
  const [query, setQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState('100');
  const [mealType, setMealType] = useState<MealType>('lunch');

  const { data: searchResults, isFetching: searching } = useFoodSearch(query);
  const { data: dailyLog, isLoading } = useDailyFoodLog();
  const logFood = useLogFood();

  const handleLog = () => {
    if (!selectedFood) return;
    logFood.mutate(
      { fdc_id: selectedFood.fdc_id, grams: Number(grams), food_name: selectedFood.name, meal_type: mealType },
      { onSuccess: () => { setSelectedFood(null); setQuery(''); } },
    );
  };

  if (isLoading) return <LoadingState message="Loading nutrition data…" />;

  const totals = dailyLog?.daily_totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };

  return (
    <div className="space-y-8">
      <PageHeader title="Nutrition" description="Search USDA foods and track daily intake" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <p className="text-2xl font-semibold text-k-fg">{Math.round(totals.calories)}</p>
          <p className="text-xs text-k-muted">Calories</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-2xl font-semibold text-k-fg">{Math.round(totals.protein)}g</p>
          <p className="text-xs text-k-muted">Protein</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-2xl font-semibold text-k-fg">{Math.round(totals.carbs)}g</p>
          <p className="text-xs text-k-muted">Carbs</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-2xl font-semibold text-k-fg">{Math.round(totals.fat)}g</p>
          <p className="text-xs text-k-muted">Fat</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="text-sm font-medium text-k-muted mb-4">Food Search</CardTitle>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-k-muted" />
            <Input
              placeholder="Search foods (e.g. chicken breast)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {searching && <p className="text-sm text-k-muted">Searching…</p>}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults?.map((food) => (
              <button
                key={food.fdc_id}
                type="button"
                onClick={() => setSelectedFood(food)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedFood?.fdc_id === food.fdc_id
                    ? 'border-k-brand bg-k-brand-tint'
                    : 'border-k-border hover:bg-k-elevated/50'
                }`}
              >
                <p className="text-sm font-medium text-k-fg">{food.name}</p>
                <p className="text-xs text-k-muted">{food.calories} kcal / 100g · P {food.protein}g · C {food.carbs}g · F {food.fat}g</p>
              </button>
            ))}
          </div>

          {selectedFood && (
            <div className="mt-4 pt-4 border-t border-k-border space-y-3">
              <p className="text-sm font-medium text-k-fg">{selectedFood.name}</p>
              <div className="flex gap-3">
                <Input
                  type="number"
                  min={1}
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  placeholder="Grams"
                  className="w-24"
                />
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealType)}
                  className="flex-1 rounded-lg border border-k-border bg-k-surface px-3 text-sm text-k-fg"
                >
                  {MEAL_TYPES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-k-muted">
                {scaleFoodCalories(selectedFood.calories, Number(grams))} kcal for {grams}g
              </p>
              <Button onClick={handleLog} disabled={logFood.isPending} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Log Food
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle className="text-sm font-medium text-k-muted mb-4">
            Today&apos;s Meals ({dailyLog?.date})
          </CardTitle>
          {dailyLog?.entries.length === 0 ? (
            <p className="text-sm text-k-muted">No foods logged today. Search and add your first meal.</p>
          ) : (
            <div className="divide-y divide-k-border">
              {dailyLog?.entries.map((entry) => (
                <div key={entry.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-k-fg">{entry.food_name}</p>
                    <p className="text-xs text-k-muted">{entry.grams}g · <Badge variant="secondary">{entry.meal_type}</Badge></p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-k-fg">{Math.round(Number(entry.calories))} kcal</p>
                    <p className="text-xs text-k-muted">P{Math.round(Number(entry.protein))} C{Math.round(Number(entry.carbs))} F{Math.round(Number(entry.fat))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
