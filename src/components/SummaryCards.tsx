import type { DeliveryEntry, AdvancePayment, CompanyCodPayment, Pincode } from "@/lib/types";
import { DELIVERY_BOY_RATE, COMPANY_RATES, Pincodes } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, PackageCheck, TrendingUp, Wallet, Building, Coins } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

type SummaryCardsProps = {
  entries: DeliveryEntry[];
  advances: AdvancePayment[];
  companyCodPayments: CompanyCodPayment[];
  isLoading: boolean;
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

const SummaryCard = ({ title, value, footer, icon: Icon, isLoading }: { title: string; value: string; footer: string; icon: React.ElementType; isLoading: boolean; }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <>
                        <Skeleton className="h-8 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </>
                ) : (
                    <>
                        <div className="text-2xl font-bold">{value}</div>
                        <p className="text-xs text-muted-foreground">
                            {footer}
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
};


export default function SummaryCards({ entries, advances, companyCodPayments, isLoading }: SummaryCardsProps) {
  const overallMetrics = calculateMetrics(entries, advances, companyCodPayments);

  const bhilaiEntries = entries.filter(e => e.pincode === Pincodes.BHILAI_3);
  const charodaEntries = entries.filter(e => e.pincode === Pincodes.CHARODA);
  const bhilaiMetrics = calculateMetrics(bhilaiEntries, [], []);
  const charodaMetrics = calculateMetrics(charodaEntries, [], []);

  const formatCurrency = (amount: number) => {
    return `Rs ${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
    }).format(amount)}`;
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <SummaryCard 
        title="Total Work" 
        value={overallMetrics.totalWork.toLocaleString('en-IN')} 
        footer={`Bhilai-3: ${bhilaiMetrics.totalWork}, Charoda: ${charodaMetrics.totalWork}`}
        icon={PackageCheck}
        isLoading={isLoading}
      />
      <SummaryCard 
        title="COD in Hand" 
        value={formatCurrency(overallMetrics.codInHand)}
        footer={`${formatCurrency(overallMetrics.totalActualCod)} collected`}
        icon={Coins}
        isLoading={isLoading}
      />
      <SummaryCard 
        title="COD to Company"
        value={formatCurrency(overallMetrics.totalPaidToCompany)}
        footer="Total paid to company"
        icon={Building}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Net Payout to Boys"
        value={formatCurrency(overallMetrics.totalNetPayout)}
        footer={`after ${formatCurrency(overallMetrics.totalAdvance)} advance`}
        icon={Wallet}
        isLoading={isLoading}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <>
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </>
            ) : (
                <>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-500">{formatCurrency(overallMetrics.totalProfit)}</div>
                    <p className="text-xs text-muted-foreground">Total profit from all areas</p>
                </>
            )}
        </CardContent>
       </Card>
    </div>
  );
}
