"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { DeliveryEntry } from '@/lib/types';
import { DELIVERY_BOY_RATE, COMPANY_RATE } from '@/lib/types';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

export default function EarningsChart({ entries }: { entries: DeliveryEntry[] }) {
  const profitRate = COMPANY_RATE - DELIVERY_BOY_RATE;

  const dataByBoy = entries.reduce((acc, entry) => {
    if (!acc[entry.deliveryBoyName]) {
      acc[entry.deliveryBoyName] = { name: entry.deliveryBoyName, payout: 0, profit: 0 };
    }
    acc[entry.deliveryBoyName].payout += entry.delivered * DELIVERY_BOY_RATE;
    acc[entry.deliveryBoyName].profit += entry.delivered * profitRate;
    return acc;
  }, {} as Record<string, { name: string; payout: number; profit: number }>);

  const chartData = Object.values(dataByBoy).sort((a,b) => (b.payout + b.profit) - (a.payout + a.profit));
  
  const chartConfig = {
    payout: {
      label: 'Delivery Payout',
      color: 'hsl(var(--chart-1))',
    },
    profit: {
      label: 'Your Profit',
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact'
    }).format(amount);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings Overview</CardTitle>
        <CardDescription>Payout to delivery boys vs. your profit.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-[400px]">
            <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{left: 10}}>
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                width={80}
              />
              <XAxis type="number" dataKey="payout" tickFormatter={(value) => formatCurrency(Number(value))} hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent
                  formatter={(value, name, item) => (
                    <div className="flex min-w-[120px] items-center">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-[2px] mr-2" style={{backgroundColor: item.color}} />
                      <div className="flex flex-1 justify-between">
                        <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig].label}</span>
                        <span className="font-bold">{formatCurrency(Number(value))}</span>
                      </div>
                    </div>
                  )}
                 />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="payout" stackId="a" fill="var(--color-payout)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="profit" stackId="a" fill="var(--color-profit)" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[450px] w-full items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
            Not enough data to display chart.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
