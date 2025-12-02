import { Truck } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-card border-b p-4 shadow-sm">
      <div className="container mx-auto flex items-center gap-4">
        <Truck className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-foreground font-headline">
          Delivery Tracker Pro
        </h1>
      </div>
    </header>
  );
}
