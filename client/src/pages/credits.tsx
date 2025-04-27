import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, PlusCircle, ArrowDown, ArrowUp, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import RequireAuth from "@/components/auth/require-auth";

interface CreditTransaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  status: string;
  bookingId: number | null;
  createdAt: string | Date;
}

interface UserCreditInfo {
  credits: number;
  transactions: CreditTransaction[];
}

export default function CreditsPage() {
  return (
    <RequireAuth>
      <CreditsManager />
    </RequireAuth>
  );
}

function CreditsManager() {
  const [isAddCreditsOpen, setIsAddCreditsOpen] = useState(false);
  const [amount, setAmount] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: creditInfo, isLoading } = useQuery<UserCreditInfo>({
    queryKey: ['/api/credits'],
    staleTime: 60000, // 1 minute
  });

  const addCreditsMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/credits/add', { amount });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add credits');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credits'] });
      toast({
        title: "Credits Added",
        description: `Successfully added ${amount} credits to your account.`,
      });
      setIsAddCreditsOpen(false);
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add credits. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  const handleAddCredits = () => {
    setIsSubmitting(true);
    addCreditsMutation.mutate(amount);
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Credit Purchase';
      case 'booking':
        return 'Booking Payment';
      case 'booking_payment':
        return 'Booking Revenue';
      case 'referral_bonus':
        return 'Referral Bonus';
      case 'admin_adjustment':
        return 'Admin Adjustment';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Credits</h1>
          <p className="text-muted-foreground">Manage your credits and transactions</p>
        </div>
        <Button onClick={() => setIsAddCreditsOpen(true)} className="flex items-center gap-2">
          <PlusCircle size={16} />
          Add Credits
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <CreditCard className="h-10 w-10 text-primary" />
              <div className="text-4xl font-bold">{creditInfo?.credits || 0}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your credit transactions for bookings and purchases</CardDescription>
        </CardHeader>
        <CardContent>
          {creditInfo?.transactions && creditInfo.transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditInfo.transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {typeof transaction.createdAt === 'string' 
                        ? formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })
                        : formatDistanceToNow(transaction.createdAt, { addSuffix: true })}
                    </TableCell>
                    <TableCell>{formatTransactionType(transaction.type)}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      transaction.amount > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      <span className="flex items-center justify-end gap-1">
                        {transaction.amount > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        {Math.abs(transaction.amount)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Transactions Yet</h3>
              <p className="text-muted-foreground mt-2">When you make purchases or bookings, your transactions will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddCreditsOpen} onOpenChange={setIsAddCreditsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
            <DialogDescription>Purchase credits to use for team bookings.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                min="5"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddCreditsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddCredits}
              disabled={isSubmitting || amount < 5}
            >
              {isSubmitting ? 'Processing...' : 'Purchase Credits'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}