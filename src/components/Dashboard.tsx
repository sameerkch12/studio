"use client";

import { useState, useMemo } from 'react';
import type { DateRange } from "react-day-picker";
import { PlusCircle, Wallet, X, FileDown, Building } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { collection, doc, Timestamp } from 'firebase/firestore';

import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import type { DeliveryEntry, AdvancePayment, DeliveryBoy, CompanyCodPayment } from '@/lib/types';
import { DELIVERY_BOY_RATE } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import DeliveryForm from './DeliveryForm';
import AdvanceForm from './AdvanceForm';
import CompanyCodForm from './CompanyCodForm';
import DeliveryTable from './DeliveryTable';
import SummaryCards from './SummaryCards';
import EarningsChart from './EarningsChart';
import { DateRangePicker } from './DateRangePicker';

export default function Dashboard() {
  const [isDeliverySheetOpen, setDeliverySheetOpen] = useState(false);
  const [isAdvanceSheetOpen, setAdvanceSheetOpen] = useState(false);
  const [isCompanyCodSheetOpen, setCompanyCodSheetOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedBoy, setSelectedBoy] = useState('All');

  const firestore = useFirestore();

  const deliveryRecordsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'delivery_records') : null, [firestore]);
  const advancePaymentsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'advance_payments') : null, [firestore]);
  const deliveryBoysCollection = useMemoFirebase(() => firestore ? collection(firestore, 'delivery_boys') : null, [firestore]);
  const companyCodPaymentsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'company_cod_payments') : null, [firestore]);

  const { data: entriesData, isLoading: entriesLoading } = useCollection<Omit<DeliveryEntry, 'id'>>(deliveryRecordsCollection);
  const { data: advancesData, isLoading: advancesLoading } = useCollection<Omit<AdvancePayment, 'id'>>(advancePaymentsCollection);
  const { data: deliveryBoysData, isLoading: boysLoading } = useCollection<Omit<DeliveryBoy, 'id'>>(deliveryBoysCollection);
  const { data: companyCodPaymentsData, isLoading: companyCodPaymentsLoading } = useCollection<Omit<CompanyCodPayment, 'id'>>(companyCodPaymentsCollection);


  const entries = useMemo(() => entriesData?.map(e => ({...e, date: (e.date as Timestamp).toDate()})) || [], [entriesData]);
  const advances = useMemo(() => advancesData?.map(a => ({...a, date: (a.date as Timestamp).toDate()})) || [], [advancesData]);
  const deliveryBoys = useMemo(() => deliveryBoysData?.map(b => b.name).sort((a, b) => a.localeCompare(b)) || [], [deliveryBoysData]);
  const companyCodPayments = useMemo(() => companyCodPaymentsData?.map(p => ({...p, date: (p.date as Timestamp).toDate()})) || [], [companyCodPaymentsData]);


  const addEntry = (entry: Omit<DeliveryEntry, 'id'>) => {
    if (!deliveryRecordsCollection) return;
    addDocumentNonBlocking(deliveryRecordsCollection, {
      ...entry,
      date: Timestamp.fromDate(entry.date as Date)
    });
    setDeliverySheetOpen(false); // Close sheet after submission
  };

  const addAdvance = (advance: Omit<AdvancePayment, 'id'>) => {
    if (!advancePaymentsCollection) return;
     addDocumentNonBlocking(advancePaymentsCollection, {
       ...advance,
       date: Timestamp.fromDate(advance.date as Date)
      });
    setAdvanceSheetOpen(false); // Close sheet after submission
  };

  const addCompanyCodPayment = (payment: Omit<CompanyCodPayment, 'id'>) => {
    if (!companyCodPaymentsCollection) return;
    addDocumentNonBlocking(companyCodPaymentsCollection, {
        ...payment,
        date: Timestamp.fromDate(payment.date as Date)
    });
    setCompanyCodSheetOpen(false);
  }

  const deleteEntry = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'delivery_records', id));
  };
  
  const filteredEntriesByDate = entries.filter(entry => {
    if (!dateRange?.from) return true; // No start date, return all
    const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
    // Set time to end of the day for the 'to' date
    toDate.setHours(23, 59, 59, 999);
    return entry.date >= dateRange.from && entry.date <= toDate;
  });

  const filteredAdvancesByDate = advances.filter(adv => {
    if (!dateRange?.from) return true; // No start date, return all
    const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
    // Set time to end of the day for the 'to' date
    toDate.setHours(23, 59, 59, 999);
    return adv.date >= dateRange.from && adv.date <= toDate;
  });

  const filteredCompanyCodByDate = companyCodPayments.filter(payment => {
    if (!dateRange?.from) return true; // No start date, return all
    const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
    // Set time to end of the day for the 'to' date
    toDate.setHours(23, 59, 59, 999);
    return payment.date >= dateRange.from && payment.date <= toDate;
  });

  const finalFilteredEntries = filteredEntriesByDate.filter(entry => {
      if (selectedBoy === 'All') return true;
      return entry.deliveryBoyName === selectedBoy;
  });

  const handleExcelExport = () => {
    const dataToExport = finalFilteredEntries.map(entry => {
        const codShortage = entry.expectedCod - entry.actualCodCollected;
        const payout = (entry.delivered + entry.rvp) * DELIVERY_BOY_RATE - entry.advance - codShortage;
        return {
            'Date': new Date(entry.date).toLocaleDateString('en-GB'),
            'Delivery Boy': entry.deliveryBoyName,
            'Delivered': entry.delivered,
            'Returned': entry.returned,
            'RVP': entry.rvp,
            'Total Parcels': entry.delivered + entry.rvp,
            'Expected COD': entry.expectedCod,
            'Actual COD': entry.actualCodCollected,
            'COD Shortage': codShortage > 0 ? codShortage : 0,
            'Shortage Reason': entry.codShortageReason || '',
            'On-spot Advance': entry.advance,
            'Final Payout': payout
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Delivery Records');
    
    if(selectedBoy !== 'All') {
        const totalDelivered = finalFilteredEntries.reduce((acc, e) => acc + e.delivered, 0);
        const totalRVP = finalFilteredEntries.reduce((acc, e) => acc + e.rvp, 0);
        const totalCODShortage = finalFilteredEntries.reduce((acc, e) => acc + (e.expectedCod - e.actualCodCollected), 0);
        const totalOnSpotAdvance = finalFilteredEntries.reduce((acc, e) => acc + e.advance, 0);
        const totalSeparateAdvance = filteredAdvancesByDate
            .filter(a => a.deliveryBoyName === selectedBoy)
            .reduce((acc, a) => acc + a.amount, 0);
        const totalAdvance = totalOnSpotAdvance + totalSeparateAdvance;
        const totalPayout = ((totalDelivered + totalRVP) * DELIVERY_BOY_RATE) - totalCODShortage - totalAdvance;

        const summaryData = [
            {}, 
            { 'Summary Metric': `Summary for ${selectedBoy}`, 'Value': ''},
            { 'Summary Metric': 'Total Delivered', 'Value': totalDelivered},
            { 'Summary Metric': 'Total RVP', 'Value': totalRVP},
            { 'Summary Metric': 'Total Parcels (Delivered + RVP)', 'Value': totalDelivered + totalRVP},
            { 'Summary Metric': 'Total COD Shortage', 'Value': totalCODShortage},
            { 'Summary Metric': 'Total Advance Paid', 'Value': totalAdvance },
            { 'Summary Metric': 'Final Net Payout', 'Value': totalPayout }
        ];
        XLSX.utils.sheet_add_json(worksheet, summaryData, { origin: -1, skipHeader: true });
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(data, `delivery_records_${selectedBoy}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
  
  const isLoading = entriesLoading || advancesLoading || boysLoading || companyCodPaymentsLoading;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
        <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <DateRangePicker date={dateRange} onDateChange={setDateRange} className="w-full sm:w-auto" />
            {dateRange && (
                <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)} className="h-9 w-9 flex-shrink-0">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear date filter</span>
                </Button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            <Sheet open={isCompanyCodSheetOpen} onOpenChange={setCompanyCodSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" className="w-full">
                        <Building className="mr-2 h-4 w-4" /> Company
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-full max-w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Add COD to Company</SheetTitle>
                        <SheetDescription>
                            Record a COD payment made to the company.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                        <CompanyCodForm onAddPayment={addCompanyCodPayment} />
                    </div>
                </SheetContent>
            </Sheet>
            <Sheet open={isAdvanceSheetOpen} onOpenChange={setAdvanceSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Wallet className="mr-2 h-4 w-4" /> Advance
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full max-w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Add Advance Payment</SheetTitle>
                  <SheetDescription>
                    Record an advance payment given to a delivery boy.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <AdvanceForm deliveryBoys={deliveryBoys} onAddAdvance={addAdvance} />
                </div>
              </SheetContent>
            </Sheet>
            <Sheet open={isDeliverySheetOpen} onOpenChange={setDeliverySheetOpen}>
              <SheetTrigger asChild>
                <Button className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" /> Entry
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full max-w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Add New Delivery Record</SheetTitle>
                  <SheetDescription>
                    Fill in the details for a delivery boy's daily activity.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <DeliveryForm onAddEntry={addEntry} deliveryBoys={deliveryBoys} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <SummaryCards entries={filteredEntriesByDate} advances={filteredAdvancesByDate} companyCodPayments={filteredCompanyCodByDate} />

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4">
            <DeliveryTable 
                data={finalFilteredEntries}
                advances={filteredAdvancesByDate}
                onDeleteEntry={deleteEntry}
                deliveryBoys={deliveryBoys}
                selectedBoy={selectedBoy}
                onSelectBoy={setSelectedBoy}
                onExport={handleExcelExport}
                isLoading={isLoading}
            />
        </div>
        <div className="lg:col-span-3">
            <EarningsChart entries={filteredEntriesByDate} advances={filteredAdvancesByDate} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
