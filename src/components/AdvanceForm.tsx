"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, IndianRupee } from "lucide-react";
import type { AdvancePayment } from "@/lib/types";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  deliveryBoyName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  date: z.date({
    required_error: "A date is required.",
  }),
  amount: z.coerce.number().min(1, { message: "Amount must be greater than 0." }),
});

type AdvanceFormProps = {
  onAddAdvance: (advance: Omit<AdvancePayment, 'id'>) => void;
  deliveryBoys: string[];
};

export default function AdvanceForm({ onAddAdvance, deliveryBoys }: AdvanceFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deliveryBoyName: "",
      date: new Date(),
      amount: 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddAdvance(values);
    toast({
      title: "Success!",
      description: `Advance of ₹${values.amount} for ${values.deliveryBoyName} has been recorded.`,
    });
    form.reset({
        deliveryBoyName: "",
        date: new Date(),
        amount: 0,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="deliveryBoyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Boy Name</FormLabel>
              <FormControl>
                <Input placeholder="Select or type name" {...field} list="delivery-boys" />
              </FormControl>
              <datalist id="delivery-boys">
                {deliveryBoys.map(name => <option key={name} value={name} />)}
              </datalist>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of Advance</FormLabel>
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
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Advance Amount</FormLabel>
              <FormControl>
                 <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="number" placeholder="e.g. 2000" className="pl-8" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Add Advance Payment</Button>
      </form>
    </Form>
  );
}
