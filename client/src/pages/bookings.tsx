import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BookingDetailsModal } from "@/components/bookings/booking-details-modal";
import { CreateBookingModal } from "@/components/bookings/create-booking-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { formatTimeRange, getBookingStatusColor, getBookingStatusText } from "@/lib/utils";
import { useLocation } from "wouter";

export default function Bookings() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  const [filterFormat, setFilterFormat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["/api/bookings"],
    queryFn: undefined, // Using the default query function from queryClient
  });
  
  // Filter bookings based on selected filters and search query
  const filteredBookings = bookings ? bookings.filter((booking: any) => {
    // Format filter
    if (filterFormat !== "all" && booking.format !== filterFormat) {
      return false;
    }
    
    // Status filter
    if (filterStatus === "available" && booking.availableSlots === 0) {
      return false;
    } else if (filterStatus === "full" && booking.availableSlots > 0) {
      return false;
    } else if (filterStatus === "upcoming" && new Date(booking.startTime) < new Date()) {
      return false;
    } else if (filterStatus === "past" && new Date(booking.startTime) > new Date()) {
      return false;
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        booking.title.toLowerCase().includes(query) ||
        booking.location.toLowerCase().includes(query)
      );
    }
    
    return true;
  }) : [];
  
  // Sort bookings by date (newest first)
  const sortedBookings = [...(filteredBookings || [])].sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  
  return (
    <AppShell user={{ name: user?.name || "User", role: user?.role || "player" }}>
      <PageHeader 
        title="Bookings" 
        description="Manage your team's practice and match sessions"
        actions={
          user?.role === "admin" && (
            <Button onClick={() => setShowCreateBooking(true)}>
              <span className="material-icons text-sm mr-2">add</span>
              Create Booking
            </Button>
          )
        }
      />
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-gray-400">
                  <span className="material-icons text-sm">search</span>
                </span>
                <Input
                  id="search"
                  placeholder="Search by title or location..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="format-filter">Format</Label>
              <Select
                value={filterFormat}
                onValueChange={setFilterFormat}
              >
                <SelectTrigger id="format-filter">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="5-a-side">5-a-side</SelectItem>
                  <SelectItem value="7-a-side">7-a-side</SelectItem>
                  <SelectItem value="11-a-side">11-a-side</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available Slots</SelectItem>
                  <SelectItem value="full">Fully Booked</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past Sessions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-DEFAULT border-t-transparent rounded-full"></div>
          </div>
        ) : sortedBookings.length > 0 ? (
          sortedBookings.map((booking: any) => {
            const isPast = new Date(booking.endTime) < new Date();
            const statusColor = getBookingStatusColor(booking.availableSlots, booking.totalSlots);
            const statusText = getBookingStatusText(booking.availableSlots, booking.totalSlots);
            
            return (
              <Card 
                key={booking.id} 
                className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className={`h-2 bg-${statusColor}`}></div>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{booking.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-md bg-${statusColor}-DEFAULT bg-opacity-10 text-${statusColor}-DEFAULT dark:text-${statusColor}-light`}>
                      {statusText}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{booking.location}</p>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <span className="material-icons text-sm mr-1">calendar_today</span>
                    {formatTimeRange(booking.startTime, booking.endTime)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs rounded-md ${
                      booking.format === "5-a-side" 
                        ? "bg-secondary-DEFAULT bg-opacity-10 text-secondary-DEFAULT"
                        : booking.format === "11-a-side"
                        ? "bg-accent-DEFAULT bg-opacity-10 text-accent-DEFAULT"
                        : "bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT"
                    }`}>
                      {booking.format}
                    </span>
                    {isPast && user?.role === "admin" && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/statistics?bookingId=${booking.id}`);
                        }}
                      >
                        <span className="material-icons text-sm mr-1">analytics</span>
                        Stats
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center">
            <span className="material-icons text-4xl text-gray-400 dark:text-gray-600 mb-2">event_busy</span>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No bookings found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {user?.role === "admin" 
                ? "Create a new booking to get started"
                : "No bookings match your filters"}
            </p>
          </div>
        )}
      </div>
      
      {/* Modals */}
      {showCreateBooking && (
        <CreateBookingModal 
          isOpen={showCreateBooking}
          onClose={() => setShowCreateBooking(false)}
        />
      )}
      
      {selectedBooking && (
        <BookingDetailsModal 
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          booking={selectedBooking}
          onEnterStats={() => navigate(`/statistics?bookingId=${selectedBooking.id}`)}
        />
      )}
    </AppShell>
  );
}
