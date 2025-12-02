"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Truck, Users, LayoutDashboard } from 'lucide-react';
import { cn } from "@/lib/utils";

const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/boys', label: 'Delivery Boys', icon: Users },
]

export default function Header() {
    const pathname = usePathname();

  return (
    <header className="bg-card border-b p-4 shadow-sm">
      <div className="container mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
            <Truck className="h-7 w-7 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground font-headline truncate">
            Delivery Tracker Pro
            </h1>
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-2 sm:px-3 text-sm font-medium transition-colors",
                            isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                    >
                        <link.icon className="h-5 w-5 sm:h-4 sm:w-4"/>
                        <span className="hidden sm:inline">{link.label}</span>
                    </Link>
                )
            })}
        </nav>
      </div>
    </header>
  );
}
