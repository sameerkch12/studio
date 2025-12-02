import type { DeliveryEntry } from "@/lib/types";
import { DELIVERY_BOY_RATE, COMPANY_RATE } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, PackageCheck, TrendingUp, Wallet } from "lucide-react";

type SummaryCardsProps = {
  entries: DeliveryEntry[];
};

export default function SummaryCards({ entries }: SummaryCardsProps) {
  const totalDelivered = entries.reduce((acc, entry) => acc + entry.delivered, 0);
  const totalCodCollected = entries.reduce((acc, entry) => acc + entry.codCollected, 0);
  const totalAdvance = entries.reduce((acc, entry) => acc + entry.advance, 0);
  const totalGrossPayout = totalDelivered * DELIVERY_BOY_RATE;
  const totalNetPayout = totalGrossPayout - totalAdvance;
  const totalCompanyEarning = totalDelivered * COMPANY_RATE;
  const totalProfit = totalCompanyEarning - totalGrossPayout;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Delivered</CardTitle>
          <PackageCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDelivered.toLocaleString('en-IN')}</div>
          <p className="text-xs text-muted-foreground">parcels delivered</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">COD Collected</CardTitle>
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalCodCollected)}</div>
          <p className="text-xs text-muted-foreground">from customers</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalNetPayout)}</div>
          <p className="text-xs text-muted-foreground">after {formatCurrency(totalAdvance)} advance</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Your Profit</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-500">{formatCurrency(totalProfit)}</div>
          <p className="text-xs text-muted-foreground">after all payouts</p>
        </CardContent>
      </Card>
    </div>
  );
}
