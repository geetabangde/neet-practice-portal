import { StackedBarChart } from "@/components/charts/bar-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { attemptSeriesNames, weeklyAttempts } from "@/data/dashboard";

export function AttemptsChart() {
  const completed = weeklyAttempts.reduce((sum, week) => sum + week.values[0], 0);
  const all = weeklyAttempts.reduce((sum, week) => sum + week.values[0] + week.values[1], 0);

  return (
    <Card>
      <CardHeader
        title="Test attempt statistics"
        description={`${Math.round((completed / all) * 100)}% of ${all.toLocaleString("en-IN")} attempts were completed`}
      />
      <CardContent>
        <StackedBarChart data={weeklyAttempts} seriesNames={attemptSeriesNames} title="Test attempts per week" />
      </CardContent>
    </Card>
  );
}
