import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RequireAuth from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowUpDown, Check, CircleDollarSign, Clock, CreditCard, UserPlus } from "lucide-react";

const creditPurchaseSchema = z.object({
  amount: z.coerce.number()
    .min(5, { message: "Minimum purchase amount is 5 credits" })
    .max(1000, { message: "Maximum purchase amount is 1000 credits" }),
  paymentMethod: z.string({ required_error: "Please select a payment method" })
});

type CreditPurchaseData = z.infer<typeof creditPurchaseSchema>;

export default function Credits() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("balance");
  
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });
  
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['/api/credits/transactions'],
    retry: false,
    enabled: !!user,
  });

  const form = useForm<CreditPurchaseData>({
    resolver: zodResolver(creditPurchaseSchema),
    defaultValues: {
      amount: 10,
      paymentMethod: "stripe"
    }
  });

  const purchaseMutation = useMutation({
    mutationFn: async (data: CreditPurchaseData) => {
      const response = await apiRequest("POST", "/api/credits/purchase", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to purchase credits");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Purchase Initiated",
        description: "You will be redirected to the payment page.",
      });
      
      // Redirect to checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/credits/transactions'] });
    },
    onError: (error) => {
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "An error occurred while purchasing credits",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: CreditPurchaseData) => {
    purchaseMutation.mutate(data);
  };

  const getTransactionStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><Check className="w-3 h-3 mr-1" />Completed</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Failed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">{status}</span>;
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'purchase':
        return <CircleDollarSign className="w-5 h-5 text-green-500" />;
      case 'booking':
        return <CreditCard className="w-5 h-5 text-blue-500" />;
      case 'referral':
        return <UserPlus className="w-5 h-5 text-purple-500" />;
      default:
        return <ArrowUpDown className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <RequireAuth>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Credits</h1>
        
        <Tabs defaultValue="balance" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="balance">Balance & Purchase</TabsTrigger>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="balance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Balance</CardTitle>
                  <CardDescription>Your available credits for bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  {isUserLoading ? (
                    <div className="flex justify-center py-4">
                      <Icons.spinner className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="flex items-center text-4xl font-bold text-primary">
                      <CircleDollarSign className="mr-2 h-10 w-10" />
                      <span>{user?.credits || 0}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="text-sm text-muted-foreground">
                  1 credit = 1 booking slot
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Credits</CardTitle>
                  <CardDescription>
                    Add more credits to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="10" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="stripe">Credit/Debit Card</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" disabled={purchaseMutation.isPending}>
                        {purchaseMutation.isPending ? (
                          <>
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>Purchase Credits</>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Record of your credit transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isTransactionsLoading ? (
                  <div className="flex justify-center py-4">
                    <Icons.spinner className="h-6 w-6 animate-spin" />
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Type</th>
                          <th className="text-left py-3 px-4">Description</th>
                          <th className="text-center py-3 px-4">Amount</th>
                          <th className="text-center py-3 px-4">Date</th>
                          <th className="text-center py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction: any) => (
                          <tr key={transaction.id} className="border-b">
                            <td className="py-3 px-4 flex items-center">
                              {getTransactionTypeIcon(transaction.type)}
                              <span className="ml-2 capitalize">{transaction.type}</span>
                            </td>
                            <td className="py-3 px-4">{transaction.description || '-'}</td>
                            <td className={`py-3 px-4 text-center ${transaction.type === 'purchase' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'purchase' ? '+' : '-'}{transaction.amount}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getTransactionStatusBadge(transaction.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No transactions found</p>
                    <Button 
                      variant="link" 
                      onClick={() => setSelectedTab("balance")}
                      className="mt-2"
                    >
                      Purchase your first credits
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RequireAuth>
  );
}