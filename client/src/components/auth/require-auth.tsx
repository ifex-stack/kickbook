import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

interface RequireAuthProps {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const [, setLocation] = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    onSuccess: () => {
      setIsCheckingAuth(false);
    },
    onError: () => {
      setIsCheckingAuth(false);
    }
  });

  useEffect(() => {
    if (!isLoading && !isCheckingAuth && !user) {
      navigate('/login');
    }
  }, [user, isLoading, isCheckingAuth, navigate]);

  if (isLoading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
            <CardDescription className="text-center">You need to be logged in to view this page</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <User className="h-16 w-16 text-muted-foreground" />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}