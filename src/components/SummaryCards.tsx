import type { DeliveryEntry, AdvancePayment, CompanyCodPayment, OwnerExpense } from "@/lib/types";
import { DELIVERY_BOY_RATE, COMPANY_RATES, Pincodes } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageCheck, TrendingUp, Wallet, Building, Coins } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

type SummaryCardsProps = {
  entries: DeliveryEntry[];
  advances: AdvancePayment[];
  companyCodPayments: CompanyCodPayment[];
  ownerExpenses: OwnerExpense[];
  isLoading: boolean;
};

const calculateMetrics = (entries: DeliveryEntry[], advances: AdvancePayment[], companyCodPayments: CompanyCodPayment[], ownerExpenses: OwnerExpense[]) => {
    const totalWorkBhilai3 = entries.reduce((acc, entry) => acc + (entry.delivered_bhilai3 || 0), 0);
    const totalWorkCharoda = entries.reduce((acc, entry) => acc + (entry.delivered_charoda || 0), 0);
    const totalRVP = entries.reduce((acc, entry) => acc + (entry.rvp || 0), 0);
    
    const totalWork = totalWorkBhilai3 + totalWorkCharoda + totalRVP;
    
    const totalActualCod = entries.reduce((acc, entry) => acc + (entry.actualCodCollected || 0), 0);
    const totalPaidToCompany = companyCodPayments.reduce((acc, payment) => acc + (payment.amount || 0), 0);
    const totalOwnerExpense = ownerExpenses.reduce((acc, expense) => acc + (expense.amount || 0), 0);
    const codInHand = totalActualCod - totalPaidToCompany - totalOwnerExpense;
    
    const totalOnSpotAdvance = entries.reduce((acc, entry) => acc + (entry.advance || 0), 0);
    const totalSeparateAdvance = advances.reduce((acc, adv) => acc + (adv.amount || 0), 0);
    const totalAdvance = totalOnSpotAdvance + totalSeparateAdvance;
    
    const totalCodShortage = entries.reduce((acc, entry) => {
        const shortage = (entry.expectedCod || 0) - (entry.actualCodCollected || 0);
        return acc + (shortage > 0 ? shortage : 0);
    }, 0);

    const totalGrossPayout = totalWork * DELIVERY_BOY_RATE;
    const totalNetPayout = totalGrossPayout - totalAdvance - totalCodShortage;
    
    const profitBhilai3 = totalWorkBhilai3 * (COMPANY_RATES[Pincodes.BHILAI_3] - DELIVERY_BOY_RATE);
    const profitCharoda = totalWorkCharoda * (COMPANY_RATES[Pincodes.CHARODA] - DELIVERY_BOY_RATE);
    const profitRVP = totalRVP * (COMPANY_RATES[Pincodes.BHILAI_3] - DELIVERY_BOY_RATE);
    const totalProfit = profitBhilai3 + profitCharoda + profitRVP - totalOwnerExpense;

    return { totalWork, codInHand, totalPaidToCompany, totalNetPayout, totalProfit, totalWorkBhilai3, totalWorkCharoda, totalActualCod, totalAdvance, totalRVP };
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


export default function SummaryCards({ entries, advances, companyCodPayments, ownerExpenses, isLoading }: SummaryCardsProps) {
  const overallMetrics = calculateMetrics(entries, advances, companyCodPayments, ownerExpenses);

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
        footer={`B3: ${overallMetrics.totalWorkBhilai3}, Ch: ${overallMetrics.totalWorkCharoda}, RVP: ${overallMetrics.totalRVP}`}
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
                    <div className={`text-2xl font-bold ${overallMetrics.totalProfit >= 0 ? 'text-green-600 dark:text-green-500' : 'text-destructive'}`}>{formatCurrency(overallMetrics.totalProfit)}</div>
                    <p className="text-xs text-muted-foreground">After all expenses</p>
                </>
            )}
        </CardContent>
       </Card>
    </div>
  );
}
