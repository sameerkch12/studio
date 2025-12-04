"use client";

import { useState, useMemo } from 'react';
import type { DateRange } from "react-day-picker";
import { PlusCircle, Wallet, X, FileDown, Building } from 'lucide-react';
import { collection, Timestamp } from 'firebase/firestore';

import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { AdvancePayment, DeliveryBoy, CompanyCodPayment, DeliveryEntry } from '@/lib/types';


import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import AdvanceForm from './AdvanceForm';
import CompanyCodForm from './CompanyCodForm';
import SummaryCards from './SummaryCards';
import { DateRangePicker } from './DateRangePicker';

export default function Dashboard() {
  const [isAdvanceSheetOpen, setAdvanceSheetOpen] = useState(false);
  const [isCompanyCodSheetOpen, setCompanyCodSheetOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
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
  
  const isLoading = entriesLoading || advancesLoading || boysLoading || companyCodPaymentsLoading;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Overall Dashboard</h2>
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
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            <Sheet open={isCompanyCodSheetOpen} onOpenChange={setCompanyCodSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" className="w-full">
                        <Building className="mr-2 h-4 w-4" /> To Company
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
                    Record an advance payment given to a delivery boy (not on-spot).
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <AdvanceForm deliveryBoys={deliveryBoys} onAddAdvance={addAdvance} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <SummaryCards entries={filteredEntriesByDate} advances={filteredAdvancesByDate} companyCodPayments={filteredCompanyCodByDate} isLoading={isLoading} />
      
      <div className="text-center p-8 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold">Detailed Views</h3>
        <p className="text-muted-foreground mt-2">
            Select a pincode from the navigation bar above to see detailed records, charts and add new entries for that area.
        </p>
      </div>

    </div>
  );
}
