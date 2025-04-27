import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookingTest() {
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // Get current user data
    fetch("/api/auth/me", {
      credentials: "include"
    })
    .then(res => res.json())
    .then(data => {
      console.log("User data:", data);
      setUser(data);
    })
    .catch(err => {
      console.error("Error fetching user:", err);
    });
  }, []);
  
  const createTestBooking = async () => {
    if (!user?.teamId) {
      setError("User not associated with a team");
      return;
    }
    
    try {
      // Make sure the object schema exactly matches what's expected
      const testBooking = {
        title: "Test Booking",
        location: "Test Location",
        format: "7-a-side",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
        totalSlots: 14,
        availableSlots: 14,
        teamId: user.teamId,
        status: "active",
        isRecurring: false
      };
      
      console.log("Sending test booking:", testBooking);
      
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testBooking),
        credentials: "include"
      });
      
      const responseText = await response.text();
      console.log("Response:", response.status, responseText);
      
      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          console.error("Validation errors:", errorData);
          setError(JSON.stringify(errorData, null, 2));
        } catch {
          setError(`${response.status}: ${responseText}`);
        }
      } else {
        setResponse(responseText);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Error creating test booking:", err);
    }
  };
  
  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>Booking Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h2 className="font-semibold">Current User:</h2>
            <pre className="bg-slate-100 p-2 rounded-md mt-2 overflow-auto max-h-60 text-xs">
              {user ? JSON.stringify(user, null, 2) : "Loading..."}
            </pre>
          </div>
          
          <Button onClick={createTestBooking}>
            Create Test Booking
          </Button>
          
          {error && (
            <div className="mt-4">
              <h2 className="font-semibold text-destructive">Error:</h2>
              <pre className="bg-red-50 p-2 rounded-md mt-2 overflow-auto max-h-60 text-xs text-red-700">
                {error}
              </pre>
            </div>
          )}
          
          {response && (
            <div className="mt-4">
              <h2 className="font-semibold text-green-600">Success:</h2>
              <pre className="bg-green-50 p-2 rounded-md mt-2 overflow-auto max-h-60 text-xs text-green-700">
                {response}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}