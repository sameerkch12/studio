"use client";

import { useState } from 'react';
import type { DeliveryEntry } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import DeliveryForm from './DeliveryForm';
import DeliveryTable from './DeliveryTable';
import SummaryCards from './SummaryCards';
import EarningsChart from './EarningsChart';

const initialData: DeliveryEntry[] = [
  { id: '1', deliveryBoyName: 'Ramesh', date: new Date('2024-07-20'), delivered: 50, returned: 2, codCollected: 15000, rvp: 3, advance: 500 },
  { id: '2', deliveryBoyName: 'Suresh', date: new Date('2024-07-20'), delivered: 45, returned: 1, codCollected: 12500, rvp: 1, advance: 0 },
  { id: '3', deliveryBoyName: 'Ramesh', date: new Date('2024-07-21'), delivered: 55, returned: 0, codCollected: 18000, rvp: 5, advance: 1000 },
  { id: '4', deliveryBoyName: 'Suresh', date: new Date('2024-07-21'), delivered: 62, returned: 3, codCollected: 22000, rvp: 0, advance: 0 },
];

export default function Dashboard() {
  const [entries, setEntries] = useState<DeliveryEntry[]>(initialData);
  const [isSheetOpen, setSheetOpen] = useState(false);

  const addEntry = (entry: Omit<DeliveryEntry, 'id'>) => {
    const newEntry = { ...entry, id: crypto.randomUUID() };
    setEntries(prevEntries => [newEntry, ...prevEntries].sort((a, b) => b.date.getTime() - a.date.getTime()));
    setSheetOpen(false); // Close sheet after submission
  };

  const deleteEntry = (id: string) => {
    setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
  };
  
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
        <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button>
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
              <DeliveryForm onAddEntry={addEntry} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <SummaryCards entries={entries} />

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-7">
        <div className="lg:col-span-4">
            <DeliveryTable data={entries} onDeleteEntry={deleteEntry} />
        </div>
        <div className="lg:col-span-3">
            <EarningsChart entries={entries} />
        </div>
      </div>
    </div>
  );
}
