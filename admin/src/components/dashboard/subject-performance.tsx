import { BarList } from "@/components/charts/bar-list";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getAnalytics } from "@/data/analytics";

export function SubjectPerformance() {
  // Best subject first
  const data = [...getAnalytics("30d").subjectPerformance].sort((a, b) => b.value - a.value);

  return (
    <Card className="h-full">
      <CardHeader title="Subject-wise performance" description="Average score of students, last 30 days" />
      <CardContent>
        <BarList data={data} measure="average score" />
      </CardContent>
    </Card>
  );
}
