import { format } from 'date-fns';
import { MoreHorizontal, PackageCheck, PackageOpen, Trash2, Undo2, AlertTriangle, FileDown } from 'lucide-react';

import type { DeliveryEntry } from '@/lib/types';
import { DELIVERY_BOY_RATE } from '@/lib/types';
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

type DeliveryTableProps = {
  data: DeliveryEntry[];
  onDeleteEntry: (id: string) => void;
  deliveryBoys: string[];
  selectedBoy: string;
  onSelectBoy: (name: string) => void;
  onExport: () => void;
};

export default function DeliveryTable({ data, onDeleteEntry, deliveryBoys, selectedBoy, onSelectBoy, onExport }: DeliveryTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle>Daily Records</CardTitle>
          <CardDescription>A list of all delivery records.</CardDescription>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
            <Select value={selectedBoy} onValueChange={onSelectBoy}>
                <SelectTrigger className="w-full md:min-w-[200px]">
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
                Download Excel
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Delivery Boy</TableHead>
              <TableHead className="text-center">Stats</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-right">COD</TableHead>
              <TableHead className="text-right">Payout</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                    No records found for the selected criteria.
                    </TableCell>
                </TableRow>
            ) : data.map((entry) => {
              const codShortage = entry.expectedCod - entry.actualCodCollected;
              const payout = entry.delivered * DELIVERY_BOY_RATE - entry.advance - codShortage;
              const totalParcels = entry.delivered + entry.rvp;

              return (
              <TableRow key={entry.id}>
                <TableCell className="font-medium whitespace-nowrap">
                  {format(entry.date, 'dd MMM yyyy')}
                </TableCell>
                <TableCell className="whitespace-nowrap">{entry.deliveryBoyName}</TableCell>
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
                <TableCell className="text-right font-semibold text-primary">
                    <div>{formatCurrency(payout)}</div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {entry.advance > 0 && `(Adv: ${formatCurrency(entry.advance)})`}
                        {codShortage > 0 && ` (Short: ${formatCurrency(codShortage)})`}
                    </div>
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
            )})}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

    