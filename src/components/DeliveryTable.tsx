import { format } from 'date-fns';
import { MoreHorizontal, PackageCheck, PackageOpen, Trash2, Undo2, AlertTriangle, FileDown, Wallet, MapPin } from 'lucide-react';

import type { DeliveryEntry, AdvancePayment, Pincode } from '@/lib/types';
import { DELIVERY_BOY_RATE, Pincodes } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
  onDeleteEntry: (id: string) => void;
  deliveryBoys: string[];
  selectedBoy: string;
  onSelectBoy: (name: string) => void;
  onExport: () => void;
  isLoading: boolean;
  pincodes: string[];
  selectedPincode: string;
  onSelectPincode: (pincode: string) => void;
};

type Transaction = (Omit<DeliveryEntry, 'date'> & { date: Date, type: 'delivery' }) | (Omit<AdvancePayment, 'date'> & { date: Date, type: 'advance' });

export default function DeliveryTable({ 
    data, 
    advances, 
    onDeleteEntry, 
    deliveryBoys, 
    selectedBoy, 
    onSelectBoy, 
    onExport, 
    isLoading,
    pincodes,
    selectedPincode,
    onSelectPincode,
}: DeliveryTableProps) {
  const formatCurrency = (amount: number) => {
    return `Rs ${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
    }).format(amount)}`;
  };
  
  const filteredData = data.filter(d => (selectedBoy === 'All' || d.deliveryBoyName === selectedBoy) && (selectedPincode === 'All' || d.pincode === selectedPincode));
  const filteredAdvances = advances.filter(a => (selectedBoy === 'All' || a.deliveryBoyName === selectedBoy));


  const allTransactions: Transaction[] = [
    ...filteredData.map(d => ({ ...d, type: 'delivery' as const, date: new Date(d.date) })),
    ...filteredAdvances.map(a => ({ ...a, type: 'advance' as const, date: new Date(a.date) }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  const transactionsWithBalance = allTransactions.map(transaction => {
      let payout = 0;
      if (transaction.type === 'delivery') {
          const entry = transaction as DeliveryEntry;
          const codShortage = entry.expectedCod - entry.actualCodCollected;
          payout = (entry.delivered + entry.rvp) * DELIVERY_BOY_RATE - entry.advance - codShortage;
          runningBalance += payout;
      } else {
          const adv = transaction as AdvancePayment;
          payout = -adv.amount;
          runningBalance += payout;
      }
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
            <Select value={selectedPincode} onValueChange={onSelectPincode}>
                <SelectTrigger className="w-full md:min-w-[180px]">
                    <SelectValue placeholder="Select Pincode" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Pincodes</SelectItem>
                    <SelectItem value={Pincodes.BHILAI_3}>Bhilai-3 ({Pincodes.BHILAI_3})</SelectItem>
                    <SelectItem value={Pincodes.CHARODA}>Charoda ({Pincodes.CHARODA})</SelectItem>
                </SelectContent>
            </Select>
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
              {(selectedBoy === 'All' && selectedPincode !== 'All') && <TableHead>Delivery Boy</TableHead>}
              {(selectedPincode === 'All' && selectedBoy !== 'All') && <TableHead>Pincode</TableHead>}
              {(selectedBoy === 'All' && selectedPincode === 'All') && <><TableHead>Delivery Boy</TableHead><TableHead>Pincode</TableHead></>}
              <TableHead className="text-center">Stats</TableHead>
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
              if (transaction.type === 'delivery') {
                const entry = transaction;
                const codShortage = entry.expectedCod - entry.actualCodCollected;
                const totalParcels = entry.delivered + entry.rvp;
                const grossPayout = totalParcels * DELIVERY_BOY_RATE;
                
                const showBoy = selectedBoy === 'All';
                const showPincode = selectedPincode === 'All';
                const colSpan = 4 - (showBoy ? 1 : 0) - (showPincode ? 1 : 0);


                return (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {format(new Date(entry.date), 'dd MMM yyyy')}
                  </TableCell>
                  {showBoy && <TableCell className="whitespace-nowrap">{entry.deliveryBoyName}</TableCell>}
                  {showPincode && <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{entry.pincode}</span>
                    </div>
                  </TableCell>}
                  
                  <TableCell>
                    <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
                      <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100/80">
                        <PackageCheck className="h-3 w-3"/>
                        <span>{entry.delivered} <span className="hidden sm:inline">Delivered</span></span>
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-100/80">
                        <Undo2 className="h-3 w-3"/>
                        <span>{entry.returned} <span className="hidden sm:inline">Returned</span></span>
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100/80">
                        <PackageOpen className="h-3 w-3"/>
                        <span>{entry.rvp} <span className="hidden sm:inline">RVP</span></span>
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold">{totalParcels}</TableCell>
                  <TableCell className="text-right">
                    <div>{formatCurrency(entry.actualCodCollected)}</div>
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
                      <div className="text-xs text-muted-foreground">of {formatCurrency(entry.expectedCod)}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                      <div className="font-semibold text-primary">{formatCurrency(transaction.payout)}</div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                          ({totalParcels} x {DELIVERY_BOY_RATE} = {formatCurrency(grossPayout)})
                      </div>
                      {(entry.advance > 0 || codShortage > 0) && (
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {entry.advance > 0 && ` - Adv ${formatCurrency(entry.advance)}`}
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
              } else { // Render an Advance row
                const advance = transaction;
                const showBoy = selectedBoy === 'All';
                const colSpan = 5 - (showBoy ? 1 : 0);

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
              }
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

    