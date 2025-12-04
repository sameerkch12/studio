"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { DeliveryEntry, AdvancePayment, OwnerExpense } from '@/lib/types';
import { DELIVERY_BOY_RATE, COMPANY_RATES, Pincodes } from '@/lib/types';

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
    ownerExpenses: OwnerExpense[];
    isLoading: boolean;
}

export default function EarningsChart({ entries, advances, ownerExpenses, isLoading }: EarningsChartProps) {
  
  const totalOwnerExpense = ownerExpenses.reduce((acc, e) => acc + e.amount, 0);

  const dataByBoy = [...entries, ...advances].reduce((acc, item) => {
    if (!item.deliveryBoyName) return acc;
    const name = item.deliveryBoyName;
    if (!acc[name]) {
      acc[name] = { name, payout: 0, profit: 0, advance: 0, codShortage: 0 };
    }

    if ('delivered_bhilai3' in item) { // It's a DeliveryEntry
      const entry = item as DeliveryEntry;
      const workBhilai3 = entry.delivered_bhilai3 || 0;
      const workCharoda = entry.delivered_charoda || 0;
      const workRVP = entry.rvp || 0;
      
      const totalWork = workBhilai3 + workCharoda + workRVP;

      const profitBhilai3 = workBhilai3 * (COMPANY_RATES[Pincodes.BHILAI_3] - DELIVERY_BOY_RATE);
      const profitCharoda = workCharoda * (COMPANY_RATES[Pincodes.CHARODA] - DELIVERY_BOY_RATE);
      const profitRVP = workRVP * (COMPANY_RATES[Pincodes.BHILAI_3] - DELIVERY_BOY_RATE); // RVP profit based on Bhilai-3 rate
      
      acc[name].payout += totalWork * DELIVERY_BOY_RATE;
      acc[name].profit += profitBhilai3 + profitCharoda + profitRVP;
      acc[name].advance += entry.advance || 0; // on-spot advance
      
      const shortage = (entry.expectedCod || 0) - (entry.actualCodCollected || 0);
      if (shortage > 0) {
        acc[name].codShortage += shortage;
      }

    } else { // It's an AdvancePayment
      const advance = item as AdvancePayment;
      acc[name].advance += advance.amount;
    }
    
    return acc;
  }, {} as Record<string, { name: string; payout: number; profit: number, advance: number, codShortage: number }>);

  // Distribute owner expense among boys based on their profit share
  const totalProfitBeforeExpense = Object.values(dataByBoy).reduce((acc, boy) => acc + boy.profit, 0);

  const chartData = Object.values(dataByBoy).map(boy => {
      const netPayout = boy.payout - boy.advance - boy.codShortage;
      let netProfit = boy.profit;

      if(totalProfitBeforeExpense > 0) {
        const profitShare = boy.profit / totalProfitBeforeExpense;
        netProfit -= (totalOwnerExpense * profitShare);
      }
      
      return {
          ...boy,
          netPayout,
          netProfit
      }
  }).sort((a,b) => (b.netPayout + b.netProfit) - (a.netPayout + a.netProfit));
  
  const chartConfig = {
    netPayout: {
      label: 'Net Payout',
      color: 'hsl(var(--chart-1))',
    },
    netProfit: {
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
        <CardDescription>Payout to delivery boys vs. your net profit.</CardDescription>
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
                        <span className="font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0}).format(Number(value))}</span>
                      </div>
                    </div>
                  )}
                 />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="netPayout" stackId="a" fill="var(--color-netPayout)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="netProfit" stackId="a" fill="var(--color-netProfit)" radius={[4, 4, 4, 4]} />
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
