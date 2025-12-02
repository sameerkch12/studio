"use client";

import { useState } from "react";
import { collection, addDoc, deleteDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import type { DeliveryBoy } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, UserPlus, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from "@/components/ui/alert-dialog";
import { Skeleton } from "./ui/skeleton";
import { format } from 'date-fns';


const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
});

export default function DeliveryBoysManager() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const deliveryBoysCollection = useMemoFirebase(() => collection(firestore, 'delivery_boys'), [firestore]);
  
  const { data: deliveryBoys, isLoading } = useCollection<Omit<DeliveryBoy, 'id'>>(deliveryBoysCollection);

  const sortedBoys = deliveryBoys?.map(b => ({ ...b, createdAt: (b.createdAt as Timestamp)?.toDate() })).sort((a, b) => a.name.localeCompare(b.name)) || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Check if boy with same name already exists
    if (sortedBoys.some(boy => boy.name.toLowerCase() === values.name.toLowerCase())) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "A delivery boy with this name already exists.",
        });
        return;
    }

    await addDoc(deliveryBoysCollection, {
      name: values.name,
      createdAt: serverTimestamp(),
    });

    toast({
      title: "Success!",
      description: `Delivery boy "${values.name}" has been added.`,
    });
    form.reset();
  };

  const deleteBoy = async (id: string) => {
    await deleteDoc(doc(firestore, 'delivery_boys', id));
    toast({
        title: "Success!",
        description: `Delivery boy has been removed.`,
    })
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
                <Users className="h-10 w-10 text-primary"/>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Manage Delivery Boys</h2>
                    <p className="text-muted-foreground">Add, view, or remove delivery boys from your team.</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus />
                            Add New Boy
                        </CardTitle>
                        <CardDescription>Add a new delivery boy to the list.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Delivery Boy Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Ramesh Kumar" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <Button type="submit" className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4"/>
                                Add Delivery Boy
                            </Button>
                        </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                         <CardTitle>All Delivery Boys</CardTitle>
                         <CardDescription>Total: {sortedBoys.length} boys</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Date Added</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={3}>
                                                <Skeleton className="h-8 w-full" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : sortedBoys.length > 0 ? (
                                    sortedBoys.map((boy) => (
                                <TableRow key={boy.id}>
                                    <TableCell className="font-medium">{boy.name}</TableCell>
                                    <TableCell>{boy.createdAt ? format(boy.createdAt, 'dd MMM yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete "{boy.name}". This action cannot be undone.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteBoy(boy.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                Delete
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                     </AlertDialog>
                                    </TableCell>
                                </TableRow>
                                ))
                                ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No delivery boys added yet.
                                    </TableCell>
                                </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
