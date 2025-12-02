import type { DeliveryEntry, AdvancePayment } from "@/lib/types";
import { DELIVERY_BOY_RATE, COMPANY_RATE } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, PackageCheck, TrendingUp, Wallet, PackageOpen } from "lucide-react";

type SummaryCardsProps = {
  entries: DeliveryEntry[];
  advances: AdvancePayment[];
};

export default function SummaryCards({ entries, advances }: SummaryCardsProps) {
  const totalDelivered = entries.reduce((acc, entry) => acc + entry.delivered, 0);
  const totalRVP = entries.reduce((acc, entry) => acc + entry.rvp, 0);
  const totalWork = totalDelivered + totalRVP;
  
  const totalActualCod = entries.reduce((acc, entry) => acc + entry.actualCodCollected, 0);
  
  const totalOnSpotAdvance = entries.reduce((acc, entry) => acc + entry.advance, 0);
  const totalSeparateAdvance = advances.reduce((acc, adv) => acc + adv.amount, 0);
  const totalAdvance = totalOnSpotAdvance + totalSeparateAdvance;
  
  const totalCodShortage = entries.reduce((acc, entry) => acc + (entry.expectedCod - entry.actualCodCollected), 0);

  const totalGrossPayout = totalWork * DELIVERY_BOY_RATE;
  const totalNetPayout = totalGrossPayout - totalAdvance - totalCodShortage;
  
  const totalCompanyEarning = totalWork * COMPANY_RATE;
  const totalProfit = totalCompanyEarning - totalGrossPayout;

  const formatCurrency = (amount: number) => {
    return `Rs ${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
    }).format(amount)}`;
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Work Done</CardTitle>
          <PackageCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalWork.toLocaleString('en-IN')}</div>
          <p className="text-xs text-muted-foreground">{totalDelivered} Delivered + {totalRVP} RVP</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">COD Collected</CardTitle>
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalActualCod)}</div>
          <p className="text-xs text-muted-foreground">
            {totalCodShortage > 0 ? `${formatCurrency(totalCodShortage)} short from customers` : 'from customers'}
          </p>
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
