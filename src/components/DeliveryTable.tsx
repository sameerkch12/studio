import { format } from 'date-fns';
import { MoreHorizontal, Trash2, AlertTriangle, FileDown, Wallet, Briefcase } from 'lucide-react';

import type { DeliveryEntry, AdvancePayment, OwnerExpense } from '@/lib/types';
import { DELIVERY_BOY_RATE } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from './ui/skeleton';

type DeliveryTableProps = {
  data: DeliveryEntry[];
  advances: AdvancePayment[];
  ownerExpenses: OwnerExpense[];
  onDeleteEntry: (id: string) => void;
  deliveryBoys: string[];
  selectedBoy: string;
  onSelectBoy: (name: string) => void;
  onExport: () => void;
  isLoading: boolean;
};

type Transaction = 
    | (Omit<DeliveryEntry, 'date'> & { date: Date, type: 'delivery' }) 
    | (Omit<AdvancePayment, 'date'> & { date: Date, type: 'advance' })
    | (Omit<OwnerExpense, 'date'> & { date: Date, type: 'owner_expense' });


export default function DeliveryTable({ 
    data, 
    advances, 
    ownerExpenses,
    onDeleteEntry, 
    deliveryBoys, 
    selectedBoy, 
    onSelectBoy, 
    onExport, 
    isLoading,
}: DeliveryTableProps) {
  const formatCurrency = (amount: number) => {
    return `Rs ${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
    }).format(amount)}`;
  };
  
  const filteredData = data.filter(d => (selectedBoy === 'All' || d.deliveryBoyName === selectedBoy));
  const filteredAdvances = advances.filter(a => (selectedBoy === 'All' || a.deliveryBoyName === selectedBoy));
  const filteredOwnerExpenses = ownerExpenses; // Owner expenses are not boy-specific


  const allTransactions: Transaction[] = [
    ...filteredData.map(d => ({ ...d, type: 'delivery' as const, date: new Date(d.date) })),
    ...filteredAdvances.map(a => ({ ...a, type: 'advance' as const, date: new Date(a.date) })),
    ...filteredOwnerExpenses.map(e => ({ ...e, type: 'owner_expense' as const, date: new Date(e.date) }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  const transactionsWithBalance = allTransactions.map(transaction => {
      let payout = 0;
      if (transaction.type === 'delivery') {
          const entry = transaction as DeliveryEntry;
          const codShortage = (entry.expectedCod || 0) - (entry.actualCodCollected || 0);
          const totalWork = (entry.delivered_bhilai3 || 0) + (entry.delivered_charoda || 0) + (entry.rvp || 0);
          payout = totalWork * DELIVERY_BOY_RATE - (entry.advance || 0) - codShortage;
          runningBalance += payout;
      } else if (transaction.type === 'advance') {
          const adv = transaction as AdvancePayment;
          payout = -adv.amount;
          runningBalance += payout;
      }
      // Owner expense does not affect boy's running balance, so we don't calculate it here.
      // It is only for display in the table.
      return { ...transaction, payout, balance: runningBalance };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle>Daily Records</CardTitle>
          <CardDescription>A list of all delivery and payment records.</CardDescription>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
            <Select value={selectedBoy} onValueChange={onSelectBoy}>
                <SelectTrigger className="w-full md:min-w-[180px]">
                <SelectValue placeholder="Select Delivery Boy" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="All">All Delivery Boys</SelectItem>
                {deliveryBoys.map(boy => (
                    <SelectItem key={boy} value={boy}>{boy}</SelectItem>
                ))}
                </SelectContent>
            </Select>
            <Button onClick={onExport} variant="outline" className="w-full md:w-auto">
                <FileDown className="mr-2 h-4 w-4" />
                Download
            </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table className="min-w-[900px] md:min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {selectedBoy === 'All' && <TableHead>Delivery Boy</TableHead>}
              <TableHead className="text-center">Parcels (B3)</TableHead>
              <TableHead className="text-center">Parcels (Ch)</TableHead>
              <TableHead className="text-center">RVP</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-right">COD</TableHead>
              <TableHead className="text-right">Payout / Advance</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : transactionsWithBalance.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                    No records found for the selected filter.
                    </TableCell>
                </TableRow>
            ) : transactionsWithBalance.map((transaction) => {
              const showBoy = selectedBoy === 'All';

              if (transaction.type === 'delivery') {
                const entry = transaction;
                const codShortage = (entry.expectedCod || 0) - (entry.actualCodCollected || 0);
                const totalWork = (entry.delivered_bhilai3 || 0) + (entry.delivered_charoda || 0) + (entry.rvp || 0);
                const grossPayout = totalWork * DELIVERY_BOY_RATE;
                
                return (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {format(new Date(entry.date), 'dd MMM yyyy')}
                  </TableCell>
                  {showBoy && <TableCell className="whitespace-nowrap">{entry.deliveryBoyName}</TableCell>}
                  
                  <TableCell className="text-center">
                    <div className="flex flex-col">
                        <span>{entry.delivered_bhilai3 || 0} <span className='text-muted-foreground'>Del</span></span>
                        <span className="text-xs text-yellow-600">{entry.returned_bhilai3 || 0} <span className='text-muted-foreground'>Ret</span></span>
                    </div>
                  </TableCell>
                   <TableCell className="text-center">
                    <div className="flex flex-col">
                        <span>{entry.delivered_charoda || 0} <span className='text-muted-foreground'>Del</span></span>
                        <span className="text-xs text-yellow-600">{entry.returned_charoda || 0} <span className='text-muted-foreground'>Ret</span></span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{entry.rvp || 0}</TableCell>
                  <TableCell className="text-center font-bold">{totalWork}</TableCell>
                  <TableCell className="text-right">
                    <div>{formatCurrency(entry.actualCodCollected || 0)}</div>
                    {codShortage > 0 ? (
                      <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <div className="text-xs text-destructive flex items-center justify-end gap-1 cursor-help">
                                      <AlertTriangle className="h-3 w-3" /> ({formatCurrency(codShortage)} short)
                                  </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>{entry.codShortageReason || 'Reason not specified'}</p>
                              </TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <div className="text-xs text-muted-foreground">of {formatCurrency(entry.expectedCod || 0)}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                      <div className="font-semibold text-primary">{formatCurrency(transaction.payout)}</div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                          ({totalWork} x {DELIVERY_BOY_RATE} = {formatCurrency(grossPayout)})
                      </div>
                      {((entry.advance || 0) > 0 || codShortage > 0) && (
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {(entry.advance || 0) > 0 && ` - Adv ${formatCurrency(entry.advance || 0)}`}
                              {codShortage > 0 && ` - Short ${formatCurrency(codShortage)}`}
                          </div>
                      )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(entry.balance)}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this delivery record.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteEntry(entry.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
                )
              } else if (transaction.type === 'advance') {
                const advance = transaction;
                const colSpan = 6 - (showBoy ? 1 : 0);

                return (
                    <TableRow key={advance.id} className="bg-muted/30">
                         <TableCell className="font-medium whitespace-nowrap">
                            {format(new Date(advance.date), 'dd MMM yyyy')}
                        </TableCell>
                        {showBoy && <TableCell className="whitespace-nowrap">{advance.deliveryBoyName}</TableCell>}
                        <TableCell colSpan={colSpan} className="text-center text-sm text-muted-foreground italic">
                            <div className="flex items-center justify-center gap-2">
                                <Wallet className="h-4 w-4"/>
                                <span>Separate Advance Paid</span>
                            </div>
                        </TableCell>
                         <TableCell className="text-right font-semibold text-destructive">
                           ({formatCurrency(advance.amount)})
                        </TableCell>
                        <TableCell className="text-right font-bold">
                            {formatCurrency(advance.balance)}
                        </TableCell>
                        <TableCell>
                            {/* Add delete functionality for advances if needed */}
                        </TableCell>
                    </TableRow>
                )
              } else { // Render an Owner Expense row
                const expense = transaction;
                const colSpan = 8 - (showBoy ? 1 : 0);

                return (
                    <TableRow key={expense.id} className="bg-yellow-100/30 dark:bg-yellow-900/30">
                         <TableCell className="font-medium whitespace-nowrap">
                            {format(new Date(expense.date), 'dd MMM yyyy')}
                        </TableCell>
                        {showBoy && <TableCell></TableCell>}
                        <TableCell colSpan={colSpan} className="text-center text-sm text-muted-foreground italic">
                            <div className="flex items-center justify-center gap-2">
                                <Briefcase className="h-4 w-4"/>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="cursor-help">Owner Expense</span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{expense.description}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                ({formatCurrency(expense.amount)})
                            </div>
                        </TableCell>
                         <TableCell>
                            {/* No actions for owner expense yet */}
                        </TableCell>
                    </TableRow>
                )
              }
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
