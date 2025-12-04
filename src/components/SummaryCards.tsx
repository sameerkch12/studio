import type { DeliveryEntry, AdvancePayment, CompanyCodPayment, Pincode } from "@/lib/types";
import { DELIVERY_BOY_RATE, COMPANY_RATES, Pincodes } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, PackageCheck, TrendingUp, Wallet, Building, Coins } from "lucide-react";

type SummaryCardsProps = {
  entries: DeliveryEntry[];
  advances: AdvancePayment[];
  companyCodPayments: CompanyCodPayment[];
};

const calculateMetrics = (entries: DeliveryEntry[], advances: AdvancePayment[], companyCodPayments: CompanyCodPayment[]) => {
    const totalDelivered = entries.reduce((acc, entry) => acc + entry.delivered, 0);
    const totalRVP = entries.reduce((acc, entry) => acc + entry.rvp, 0);
    const totalWork = totalDelivered + totalRVP;
    
    const totalActualCod = entries.reduce((acc, entry) => acc + entry.actualCodCollected, 0);
    const totalPaidToCompany = companyCodPayments.reduce((acc, payment) => acc + payment.amount, 0);
    const codInHand = totalActualCod - totalPaidToCompany;
    
    const totalOnSpotAdvance = entries.reduce((acc, entry) => acc + entry.advance, 0);
    const totalSeparateAdvance = advances.reduce((acc, adv) => acc + adv.amount, 0);
    const totalAdvance = totalOnSpotAdvance + totalSeparateAdvance;
    
    const totalCodShortage = entries.reduce((acc, entry) => acc + (entry.expectedCod - entry.actualCodCollected), 0);

    const totalGrossPayout = totalWork * DELIVERY_BOY_RATE;
    const totalNetPayout = totalGrossPayout - totalAdvance - totalCodShortage;
    
    const totalCompanyEarning = entries.reduce((acc, entry) => {
        const workDone = entry.delivered + entry.rvp;
        const companyRate = COMPANY_RATES[entry.pincode as Pincode] || 0;
        return acc + (workDone * companyRate);
    }, 0);

    const totalProfit = totalCompanyEarning - totalGrossPayout;

    return { totalWork, codInHand, totalPaidToCompany, totalNetPayout, totalProfit, totalDelivered, totalRVP, totalActualCod, totalAdvance };
}


export default function SummaryCards({ entries, advances, companyCodPayments }: SummaryCardsProps) {
  const overallMetrics = calculateMetrics(entries, advances, companyCodPayments);

  const bhilaiEntries = entries.filter(e => e.pincode === Pincodes.BHILAI_3);
  const bhilaiMetrics = calculateMetrics(bhilaiEntries, [], []);

  const charodaEntries = entries.filter(e => e.pincode === Pincodes.CHARODA);
  const charodaMetrics = calculateMetrics(charodaEntries, [], []);

  const formatCurrency = (amount: number) => {
    return `Rs ${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
    }).format(amount)}`;
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Work</CardTitle>
          <PackageCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overallMetrics.totalWork.toLocaleString('en-IN')}</div>
          <p className="text-xs text-muted-foreground">
            Bhilai-3: {bhilaiMetrics.totalWork}, Charoda: {charodaMetrics.totalWork}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">COD in Hand</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(overallMetrics.codInHand)}</div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(overallMetrics.totalActualCod)} collected
          </p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">COD to Company</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(overallMetrics.totalPaidToCompany)}</div>
          <p className="text-xs text-muted-foreground">Total paid to company</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Payout</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(overallMetrics.totalNetPayout)}</div>
          <p className="text-xs text-muted-foreground">after {formatCurrency(overallMetrics.totalAdvance)} advance</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Your Profit</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-500">{formatCurrency(overallMetrics.totalProfit)}</div>
          <p className="text-xs text-muted-foreground">Total profit from all areas</p>
        </CardContent>
      </Card>
    </div>
  );
}
