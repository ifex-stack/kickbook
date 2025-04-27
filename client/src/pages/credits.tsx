import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Plus, ArrowDown, ArrowUp, Clock, Check } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Credits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddCreditsOpen, setIsAddCreditsOpen] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user credits
  const { data: userCredits } = useQuery({
    queryKey: ["/api/user/credits"],
    queryFn: undefined,
    enabled: !!user,
  });

  // Fetch credit transactions
  const { data: transactions } = useQuery({
    queryKey: ["/api/user/transactions"],
    queryFn: undefined,
    enabled: !!user,
  });

  // Calculate total spent and remaining credits
  const totalCredits = userCredits?.credits || 0;
  
  // Handle purchasing credits
  const handleAddCredits = async () => {
    if (creditsAmount < 1) {
      toast({
        title: "Invalid amount",
        description: "Please enter a positive number of credits",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/user/credits/purchase", {
        amount: creditsAmount,
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/user/credits"] });
        queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
        setIsAddCreditsOpen(false);
        
        toast({
          title: "Credits purchased",
          description: `Successfully added ${creditsAmount} credits to your account`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to purchase credits");
      }
    } catch (error: any) {
      toast({
        title: "Error purchasing credits",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Get transaction status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" /> Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get transaction type icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "use":
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <AppShell user={user}>
      <PageHeader
        title="Credits"
        description="Manage your credit balance and transactions"
        actions={
          <Button onClick={() => setIsAddCreditsOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Credits
          </Button>
        }
      />

      <div className="container mx-auto px-4 py-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Credit Balance Card */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Credit Balance</CardTitle>
            <CardDescription>Your current available credits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="text-3xl font-bold">{totalCredits}</div>
                <div className="text-sm text-muted-foreground">Available Credits</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" onClick={() => setIsAddCreditsOpen(true)}>Add More Credits</Button>
          </CardFooter>
        </Card>

        {/* Credit Usage Info */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Credit Information</CardTitle>
            <CardDescription>How credits work in KickBook</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">What are credits?</h3>
                <p className="text-sm text-muted-foreground">
                  Credits are a virtual currency used in KickBook to book slots for your team's football games.
                  Each player slot in a booking requires 1 credit.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">How to use credits?</h3>
                <p className="text-sm text-muted-foreground">
                  When creating a booking or joining a match, credits are automatically deducted from your account.
                  As a team owner, you can use credits to book slots for your entire team.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Credit expiry</h3>
                <p className="text-sm text-muted-foreground">
                  Credits expire 12 months after the purchase date. Make sure to use them before they expire!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Transaction History</CardTitle>
            <CardDescription>Your credit purchase and usage history</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions && transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTransactionIcon(transaction.type)}
                          <span className="capitalize">{transaction.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className={transaction.type === 'purchase' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'purchase' ? '+' : '-'}{transaction.amount}
                      </TableCell>
                      <TableCell>{transaction.description || '-'}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found. Start by adding credits to your account.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Credits Dialog */}
      <Dialog open={isAddCreditsOpen} onOpenChange={setIsAddCreditsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
            <DialogDescription>
              Purchase credits to use for booking slots. Each credit costs $1.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="credits">Number of credits</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between">
                <span>Credits:</span>
                <span>{creditsAmount}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>${(creditsAmount * 1).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCreditsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCredits} disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Purchase Credits'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}