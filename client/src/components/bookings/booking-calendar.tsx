import { useState } from "react";
import { Card } from "@/components/ui/card";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from "date-fns";
import { cn, getBookingStatusColor, getBookingStatusText } from "@/lib/utils";

interface Booking {
  id: number;
  date: Date;
  title: string;
  availableSlots: number;
  totalSlots: number;
}

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  booking?: Booking;
  isSelected: boolean;
  onClick: (date: Date) => void;
}

function CalendarDay({ date, isCurrentMonth, booking, isSelected, onClick }: CalendarDayProps) {
  const dayNumber = date.getDate();
  
  const getStatusClass = (booking?: Booking) => {
    if (!booking) return "";
    
    const status = getBookingStatusColor(booking.availableSlots, booking.totalSlots);
    switch (status) {
      case "success": return "calendar-day-available";
      case "warning": return "calendar-day-limited";
      case "error": return "calendar-day-booked";
      default: return "";
    }
  };
  
  const getStatusText = (booking?: Booking) => {
    if (!booking) return null;
    
    return getBookingStatusText(booking.availableSlots, booking.totalSlots);
  };
  
  return (
    <div 
      className={cn(
        "aspect-square p-2 text-center",
        isCurrentMonth 
          ? "cursor-pointer rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" 
          : "text-gray-400 dark:text-gray-600",
        isToday(date) && !isSelected
          ? "bg-primary-DEFAULT text-white rounded-md"
          : "",
        isSelected
          ? "bg-primary-light text-white rounded-md"
          : "",
        getStatusClass(booking)
      )}
      onClick={() => isCurrentMonth && onClick(date)}
    >
      <div className={cn(
        "font-medium",
        isToday(date) ? "" : ""
      )}>
        {dayNumber}
      </div>
      {booking && isCurrentMonth && (
        <div className={cn(
          "text-xs mt-1",
          isToday(date) || isSelected ? "text-white" : `text-${getBookingStatusColor(booking.availableSlots, booking.totalSlots)}`
        )}>
          {getStatusText(booking)}
        </div>
      )}
    </div>
  );
}

interface BookingCalendarProps {
  bookings: Booking[];
  onDateSelect: (date: Date) => void;
}

export function BookingCalendar({ bookings, onDateSelect }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect(date);
  };
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Calculate start day offset (0 = Sunday, 1 = Monday, etc.)
  const startDayOffset = getDay(monthStart);
  
  // Fill in days from previous month
  const prevMonthDays = [];
  if (startDayOffset > 0) {
    const prevMonth = subMonths(monthStart, 1);
    const prevMonthEnd = endOfMonth(prevMonth);
    for (let i = startDayOffset - 1; i >= 0; i--) {
      const day = new Date(prevMonthEnd);
      day.setDate(prevMonthEnd.getDate() - i);
      prevMonthDays.push(day);
    }
  }
  
  // Fill in days from next month
  const nextMonthDays = [];
  const daysNeeded = 42 - (prevMonthDays.length + calendarDays.length); // 6 rows of 7 days
  if (daysNeeded > 0) {
    const nextMonth = addMonths(monthStart, 1);
    for (let i = 1; i <= daysNeeded; i++) {
      const day = new Date(nextMonth);
      day.setDate(i);
      nextMonthDays.push(day);
    }
  }
  
  // Combine all days
  const allDays = [...prevMonthDays, ...calendarDays, ...nextMonthDays];
  
  // Create weeks array for grid
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  
  return (
    <Card className="bg-white dark:bg-gray-800 rounded-lg shadow custom-shadow">
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-heading font-semibold text-gray-900 dark:text-gray-100">Booking Calendar</h2>
      </div>
      <div className="p-4 sm:p-6">
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading font-medium text-gray-900 dark:text-gray-100">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <div className="flex space-x-2">
            <button 
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={handlePreviousMonth}
            >
              <span className="material-icons">chevron_left</span>
            </button>
            <button 
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={handleNextMonth}
            >
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Sun</div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Mon</div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Tue</div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Wed</div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Thu</div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Fri</div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Sat</div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {allDays.map((day, index) => {
            const booking = bookings.find(b => 
              b.date.getDate() === day.getDate() && 
              b.date.getMonth() === day.getMonth() && 
              b.date.getFullYear() === day.getFullYear()
            );
            
            const isSelected = selectedDate 
              ? selectedDate.getDate() === day.getDate() && 
                selectedDate.getMonth() === day.getMonth() && 
                selectedDate.getFullYear() === day.getFullYear()
              : false;
            
            return (
              <CalendarDay 
                key={index}
                date={day}
                isCurrentMonth={isSameMonth(day, currentMonth)}
                booking={booking}
                isSelected={isSelected}
                onClick={handleDateClick}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-success bg-opacity-30 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-warning bg-opacity-30 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Limited Slots</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-error bg-opacity-30 rounded-full mr-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Fully Booked</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
