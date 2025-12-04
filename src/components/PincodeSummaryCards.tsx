import type { DeliveryEntry, Pincode } from "@/lib/types";
import { DELIVERY_BOY_RATE, COMPANY_RATES } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, PackageCheck, TrendingUp, Wallet, Coins } from "lucide-react";

type PincodeSummaryCardsProps = {
  entries: DeliveryEntry[];
  pincode: Pincode;
};

const calculateMetrics = (entries: DeliveryEntry[], pincode: Pincode) => {
    const totalDelivered = entries.reduce((acc, entry) => acc + entry.delivered, 0);
    const totalRVP = entries.reduce((acc, entry) => acc + entry.rvp, 0);
    const totalWork = totalDelivered + totalRVP;
    
    const totalActualCod = entries.reduce((acc, entry) => acc + entry.actualCodCollected, 0);
    
    const totalOnSpotAdvance = entries.reduce((acc, entry) => acc + entry.advance, 0);
    
    const totalCodShortage = entries.reduce((acc, entry) => acc + (entry.expectedCod - entry.actualCodCollected), 0);

    const totalGrossPayout = totalWork * DELIVERY_BOY_RATE;
    const totalNetPayout = totalGrossPayout - totalOnSpotAdvance - totalCodShortage;
    
    const companyRate = COMPANY_RATES[pincode];
    const totalCompanyEarning = totalWork * companyRate;

    const totalProfit = totalCompanyEarning - totalGrossPayout;

    return { totalWork, totalActualCod, totalNetPayout, totalProfit };
}


export default function PincodeSummaryCards({ entries, pincode }: PincodeSummaryCardsProps) {
  const metrics = calculateMetrics(entries, pincode);

  const formatCurrency = (amount: number) => {
    return `Rs ${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
    }).format(amount)}`;
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Work</CardTitle>
          <PackageCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalWork.toLocaleString('en-IN')}</div>
          <p className="text-xs text-muted-foreground">Total parcels for this area</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">COD Collected</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.totalActualCod)}</div>
          <p className="text-xs text-muted-foreground">
            Total cash collected in this area
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Payout to Boys</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.totalNetPayout)}</div>
          <p className="text-xs text-muted-foreground">After advances and shortages</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Your Profit</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-500">{formatCurrency(metrics.totalProfit)}</div>
          <p className="text-xs text-muted-foreground">Profit from this area</p>
        </CardContent>
      </Card>
    </div>
  );
}
