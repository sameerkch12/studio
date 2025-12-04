"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronsUpDown } from "lucide-react";
import type { DeliveryEntry } from "@/lib/types";
import { Pincodes } from "@/lib/types";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import React from "react";

const formSchema = z.object({
  deliveryBoyName: z.string({ required_error: "Please select a delivery boy." }).min(1, { message: "Please select a delivery boy." }),
  date: z.date({
    required_error: "A date is required.",
  }),
  delivered_bhilai3: z.coerce.number().int().min(0, { message: "Cannot be negative." }),
  returned_bhilai3: z.coerce.number().int().min(0, { message: "Cannot be negative." }),
  delivered_charoda: z.coerce.number().int().min(0, { message: "Cannot be negative." }),
  returned_charoda: z.coerce.number().int().min(0, { message: "Cannot be negative." }),
  expectedCod: z.coerce.number().min(0, { message: "Cannot be negative." }),
  actualCodCollected: z.coerce.number().min(0, { message: "Cannot be negative." }),
  codShortageReason: z.string().optional(),
  rvp: z.coerce.number().int().min(0, { message: "Cannot be negative." }),
  advance: z.coerce.number().min(0, { message: "Cannot be negative." }),
}).refine(data => data.delivered_bhilai3 > 0 || data.delivered_charoda > 0 || data.rvp > 0, {
    message: "At least one parcel (delivered or RVP) must be entered.",
    path: ["delivered_bhilai3"], // show error on one of the fields
});


type DeliveryFormProps = {
  onAddEntry: (entry: Omit<DeliveryEntry, 'id' | 'date'> & {date: Date}) => void;
  deliveryBoys: string[];
};

export default function DeliveryForm({ onAddEntry, deliveryBoys }: DeliveryFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deliveryBoyName: "",
      date: new Date(),
      delivered_bhilai3: 0,
      returned_bhilai3: 0,
      delivered_charoda: 0,
      returned_charoda: 0,
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
        delivered_bhilai3: 0,
        returned_bhilai3: 0,
        delivered_charoda: 0,
        returned_charoda: 0,
        expectedCod: 0,
        actualCodCollected: 0,
        codShortageReason: "",
        rvp: 0,
        advance: 0,
    });
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
                            ? deliveryBoys.find(
                                (boy) => boy === field.value
                            )
                            : "Select a name"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                        <CommandInput 
                            placeholder="Search name..."
                         />
                        <CommandList>
                            <CommandEmpty>No delivery boy found.</CommandEmpty>
                            <CommandGroup>
                                {deliveryBoys.map((boy) => (
                                <CommandItem
                                    value={boy}
                                    key={boy}
                                    onSelect={() => {
                                        form.setValue("deliveryBoyName", boy)
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

        <Accordion type="multiple" className="w-full" defaultValue={['pincode_bhilai3']}>
            <AccordionItem value="pincode_bhilai3">
                <AccordionTrigger className="text-base font-semibold">Bhilai-3 ({Pincodes.BHILAI_3})</AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <FormField
                            control={form.control}
                            name="delivered_bhilai3"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Delivered</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g. 50" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="returned_bhilai3"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Returned</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g. 2" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="pincode_charoda">
                <AccordionTrigger className="text-base font-semibold">Charoda ({Pincodes.CHARODA})</AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                         <FormField
                            control={form.control}
                            name="delivered_charoda"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Delivered</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g. 25" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="returned_charoda"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Returned</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g. 1" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
        
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold">Common Details</h3>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="expectedCod"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Expected COD</FormLabel>
                    <FormControl>
                        <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rs</span>
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
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rs</span>
                        <Input type="number" placeholder="e.g. 14500" className="pl-8" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
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
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rs</span>
                        <Input type="number" placeholder="e.g. 500" className="pl-8" {...field} />
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
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
        
        <Button type="submit" className="w-full">Add Entry</Button>
      </form>
    </Form>
  );
}
