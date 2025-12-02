"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronsUpDown } from "lucide-react";
import type { DeliveryEntry } from "@/lib/types";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import React from "react";

const formSchema = z.object({
  deliveryBoyName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  date: z.date({
    required_error: "A date is required.",
  }),
  delivered: z.coerce.number().int().min(0, { message: "Cannot be negative." }),
  returned: z.coerce.number().int().min(0, { message: "Cannot be negative." }),
  expectedCod: z.coerce.number().min(0, { message: "Cannot be negative." }),
  actualCodCollected: z.coerce.number().min(0, { message: "Cannot be negative." }),
  codShortageReason: z.string().optional(),
  rvp: z.coerce.number().int().min(0, { message: "Cannot be negative." }),
  advance: z.coerce.number().min(0, { message: "Cannot be negative." }),
});

type DeliveryFormProps = {
  onAddEntry: (entry: Omit<DeliveryEntry, 'id'>) => void;
  deliveryBoys: string[];
};

export default function DeliveryForm({ onAddEntry, deliveryBoys }: DeliveryFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deliveryBoyName: "",
      date: new Date(),
      delivered: 0,
      returned: 0,
      expectedCod: 0,
      actualCodCollected: 0,
      codShortageReason: "",
      rvp: 0,
      advance: 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.actualCodCollected > values.expectedCod) {
        form.setError("actualCodCollected", {
            type: "manual",
            message: "Actual COD cannot be greater than Expected COD."
        });
        return;
    }
    onAddEntry(values);
    toast({
      title: "Success!",
      description: "New delivery entry has been added.",
    });
    form.reset({
        ...form.getValues(),
        deliveryBoyName: "",
        delivered: 0,
        returned: 0,
        expectedCod: 0,
        actualCodCollected: 0,
        codShortageReason: "",
        rvp: 0,
        advance: 0,
    });
    setInputValue("");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="deliveryBoyName"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Delivery Boy Name</FormLabel>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <FormControl>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                            )}
                        >
                            {field.value
                            ? field.value
                            : "Select or type a name"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                        <CommandInput 
                            placeholder="Search or add new..."
                            value={inputValue}
                            onValueChange={(search) => {
                                setInputValue(search);
                                if (!deliveryBoys.find(boy => boy.toLowerCase() === search.toLowerCase())) {
                                    form.setValue("deliveryBoyName", search);
                                }
                            }}
                         />
                        <CommandList>
                            <CommandEmpty>
                                {inputValue ? `Add "${inputValue}" as a new delivery boy.` : "No delivery boy found."}
                            </CommandEmpty>
                            <CommandGroup>
                                {deliveryBoys.map((boy) => (
                                <CommandItem
                                    value={boy}
                                    key={boy}
                                    onSelect={(currentValue) => {
                                        const val = currentValue === field.value ? "" : currentValue
                                        form.setValue("deliveryBoyName", val)
                                        setInputValue(val)
                                        setOpen(false)
                                    }}
                                >
                                    {boy}
                                </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="delivered"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Parcels Delivered</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g. 50" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="returned"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Parcels Returned</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g. 2" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="expectedCod"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Expected COD</FormLabel>
                <FormControl>
                    <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                    <Input type="number" placeholder="e.g. 15000" className="pl-8" {...field} />
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="actualCodCollected"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Actual COD Collected</FormLabel>
                <FormControl>
                    <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                    <Input type="number" placeholder="e.g. 14500" className="pl-8" {...field} />
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        {form.watch('actualCodCollected') < form.watch('expectedCod') && (
            <FormField
                control={form.control}
                name="codShortageReason"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Reason for COD Shortage</FormLabel>
                    <FormControl>
                        <Textarea placeholder="e.g. Customer paid less, parcel lost..." {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}
        
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="rvp"
            render={({ field }) => (
                <FormItem>
                <FormLabel>RVP Pickups</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g. 3" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="advance"
            render={({ field }) => (
                <FormItem>
                <FormLabel>On-spot Advance</FormLabel>
                <FormControl>
                    <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                    <Input type="number" placeholder="e.g. 500" className="pl-8" {...field} />
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" className="w-full">Add Entry</Button>
      </form>
    </Form>
  );
}
