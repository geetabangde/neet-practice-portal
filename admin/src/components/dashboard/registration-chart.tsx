"use client";

import { useState } from "react";
import { AreaChart } from "@/components/charts/area-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { registrationOverview, registrationPeriods, type RegistrationPeriod } from "@/data/dashboard";

export function RegistrationChart() {
  const [period, setPeriod] = useState<RegistrationPeriod>("12m");
  const data = registrationOverview[period];
  const total = data.reduce((sum, point) => sum + point.value, 0);

  return (
    <Card>
      <CardHeader
        title="Student registration overview"
        description={`${total.toLocaleString("en-IN")} new students in this period`}
        action={
          <Tabs
            ariaLabel="Registration period"
            tabs={registrationPeriods}
            value={period}
            onChange={setPeriod}
          />
        }
      />
      <CardContent>
        <AreaChart
          data={data}
          title="New student registrations"
          format={(value) => `${value} students`}
          formatTick={(value) => String(value)}
        />
      </CardContent>
    </Card>
  );
}
