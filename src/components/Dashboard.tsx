"use client";

import { useState } from 'react';
import type { DateRange } from "react-day-picker";
import type { DeliveryEntry, AdvancePayment } from '@/lib/types';
import { PlusCircle, Wallet, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import DeliveryForm from './DeliveryForm';
import AdvanceForm from './AdvanceForm';
import DeliveryTable from './DeliveryTable';
import SummaryCards from './SummaryCards';
import EarningsChart from './EarningsChart';
import { DateRangePicker } from './DateRangePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const initialDeliveries: DeliveryEntry[] = [
  { id: '1', deliveryBoyName: 'Ramesh', date: new Date('2024-07-20'), delivered: 50, returned: 2, expectedCod: 15000, actualCodCollected: 15000, rvp: 3, advance: 500 },
  { id: '2', deliveryBoyName: 'Suresh', date: new Date('2024-07-20'), delivered: 45, returned: 1, expectedCod: 12500, actualCodCollected: 12500, rvp: 1, advance: 0 },
  { id: '3', deliveryBoyName: 'Ramesh', date: new Date('2024-07-21'), delivered: 55, returned: 0, expectedCod: 18000, actualCodCollected: 17500, codShortageReason: 'Lost 500', rvp: 5, advance: 1000 },
  { id: '4', deliveryBoyName: 'Suresh', date: new Date('2024-07-21'), delivered: 62, returned: 3, expectedCod: 22000, actualCodCollected: 22000, rvp: 0, advance: 0 },
];

const initialAdvances: AdvancePayment[] = [
    { id: 'adv-1', deliveryBoyName: 'Suresh', date: new Date('2024-07-19'), amount: 2000 },
];

export default function Dashboard() {
  const [entries, setEntries] = useState<DeliveryEntry[]>(initialDeliveries);
  const [advances, setAdvances] = useState<AdvancePayment[]>(initialAdvances);
  const [isDeliverySheetOpen, setDeliverySheetOpen] = useState(false);
  const [isAdvanceSheetOpen, setAdvanceSheetOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedBoy, setSelectedBoy] = useState('All');

  const addEntry = (entry: Omit<DeliveryEntry, 'id'>) => {
    const newEntry = { ...entry, id: crypto.randomUUID() };
    setEntries(prevEntries => [newEntry, ...prevEntries].sort((a, b) => b.date.getTime() - a.date.getTime()));
    setDeliverySheetOpen(false); // Close sheet after submission
  };

  const addAdvance = (advance: Omit<AdvancePayment, 'id'>) => {
    const newAdvance = { ...advance, id: crypto.randomUUID() };
    setAdvances(prevAdvances => [newAdvance, ...prevAdvances].sort((a, b) => b.date.getTime() - a.date.getTime()));
    setAdvanceSheetOpen(false); // Close sheet after submission
  };

  const deleteEntry = (id: string) => {
    setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
  };
  
  const deliveryBoys = [...new Set([...entries.map(e => e.deliveryBoyName), ...advances.map(a => a.deliveryBoyName)])];
  
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

  const finalFilteredEntries = filteredEntriesByDate.filter(entry => {
      if (selectedBoy === 'All') return true;
      return entry.deliveryBoyName === selectedBoy;
  });

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
        <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <DateRangePicker date={dateRange} onDateChange={setDateRange} className="w-full sm:w-auto" />
            {dateRange && (
                <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)} className="h-9 w-9">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear date filter</span>
                </Button>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Sheet open={isAdvanceSheetOpen} onOpenChange={setAdvanceSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-1/2 sm:w-auto">
                  <Wallet className="mr-2 h-4 w-4" /> Add Advance
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-lg overflow-y-auto">
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
                <Button className="w-1/2 sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Daily Entry
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-lg overflow-y-auto">
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

      <SummaryCards entries={filteredEntriesByDate} advances={filteredAdvancesByDate} />

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4">
            <DeliveryTable 
                data={finalFilteredEntries} 
                onDeleteEntry={deleteEntry}
                deliveryBoys={deliveryBoys}
                selectedBoy={selectedBoy}
                onSelectBoy={setSelectedBoy}
            />
        </div>
        <div className="lg:col-span-3">
            <EarningsChart entries={filteredEntriesByDate} advances={filteredAdvancesByDate} />
        </div>
      </div>
    </div>
  );
}
