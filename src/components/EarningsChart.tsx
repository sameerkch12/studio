"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { DeliveryEntry, AdvancePayment, Pincode } from '@/lib/types';
import { DELIVERY_BOY_RATE, COMPANY_RATES } from '@/lib/types';

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
import { Skeleton } from './ui/skeleton';

type EarningsChartProps = {
    entries: DeliveryEntry[];
    advances: AdvancePayment[];
    isLoading: boolean;
}

export default function EarningsChart({ entries, advances, isLoading }: EarningsChartProps) {
  
  const dataByBoy = [...entries, ...advances].reduce((acc, item) => {
    const name = item.deliveryBoyName;
    if (!acc[name]) {
      acc[name] = { name, payout: 0, profit: 0, advance: 0, codShortage: 0 };
    }

    if ('delivered' in item) { // It's a DeliveryEntry
      const entry = item as DeliveryEntry;
      const workDone = entry.delivered + entry.rvp;
      const companyRate = COMPANY_RATES[entry.pincode as Pincode] || 0;
      const profitRate = companyRate - DELIVERY_BOY_RATE;

      acc[name].payout += workDone * DELIVERY_BOY_RATE;
      acc[name].profit += workDone * profitRate;
      acc[name].advance += entry.advance; // on-spot advance
      acc[name].codShortage += entry.expectedCod - entry.actualCodCollected;
    } else { // It's an AdvancePayment
      const advance = item as AdvancePayment;
      acc[name].advance += advance.amount;
    }
    
    return acc;
  }, {} as Record<string, { name: string; payout: number; profit: number, advance: number, codShortage: number }>);

  const chartData = Object.values(dataByBoy).map(boy => ({
      ...boy,
      netPayout: boy.payout - boy.advance - boy.codShortage,
  })).sort((a,b) => (b.payout + b.profit) - (a.payout + a.profit));
  
  const chartConfig = {
    netPayout: {
      label: 'Net Payout',
      color: 'hsl(var(--chart-1))',
    },
    profit: {
      label: 'Your Profit',
      color: 'hsl(var(--chart-2))',
    },
    advance: {
      label: 'Advance Paid',
      color: 'hsl(var(--destructive))'
    }
  } satisfies ChartConfig;

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      notation: 'compact'
    }).format(amount);
    return `Rs ${formatted}`;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings Overview</CardTitle>
        <CardDescription>Payout to delivery boys vs. your profit.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex h-[450px] w-full items-center justify-center">
                 <Skeleton className="h-full w-full" />
            </div>
        ) : chartData.length > 0 ? (
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
                        <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig]?.label || name}</span>
                        <span className="font-bold">{formatCurrency(Number(value))}</span>
                      </div>
                    </div>
                  )}
                 />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="netPayout" stackId="a" fill="var(--color-netPayout)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="profit" stackId="a" fill="var(--color-profit)" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[450px] w-full items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
            No data to display. Add an entry to see the chart.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
