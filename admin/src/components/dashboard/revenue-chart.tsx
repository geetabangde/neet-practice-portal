import { BarChart } from "@/components/charts/bar-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { monthlyRevenue } from "@/data/dashboard";
import { formatCompact, formatCurrency } from "@/lib/format";

export function RevenueChart() {
  const total = monthlyRevenue.reduce((sum, point) => sum + point.value, 0);

  return (
    <Card>
      <CardHeader title="Monthly revenue" description={`${formatCurrency(total)} in the last 12 months`} />
      <CardContent>
        <BarChart
          data={monthlyRevenue}
          title="Monthly revenue"
          format={formatCurrency}
          formatTick={(value) => `₹${formatCompact(value)}`}
        />
      </CardContent>
    </Card>
  );
}
