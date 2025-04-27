import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isTomorrow, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isToday(dateObj)) return `Today, ${format(dateObj, "h:mm a")}`;
  if (isTomorrow(dateObj)) return `Tomorrow, ${format(dateObj, "h:mm a")}`;
  return format(dateObj, "MMM d, yyyy • h:mm a");
}

export function formatTimeRange(start: Date | string, end: Date | string): string {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  return `${format(startDate, "MMM d, yyyy • h:mm a")} - ${format(endDate, "h:mm a")}`;
}

export function formatDistanceToNowShort(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const distance = formatDistanceToNow(dateObj, { addSuffix: false });
  
  // Simplify the distance text
  if (distance.includes("days")) {
    const days = parseInt(distance.split(" ")[0]);
    if (days <= 7) return `${days} days`;
    
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""}`;
  }
  
  return distance;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map(part => part.charAt(0))
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function getBookingStatusColor(availableSlots: number, totalSlots: number) {
  const ratio = availableSlots / totalSlots;
  
  if (availableSlots === 0) return "error";
  if (ratio <= 0.33) return "warning";
  return "success";
}

export function getBookingStatusText(availableSlots: number, totalSlots: number) {
  if (availableSlots === 0) return "Booked";
  if (availableSlots === totalSlots) return "Available";
  return `${availableSlots} slots`;
}

export function downloadCSV(data: any[], filename: string) {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => 
        JSON.stringify(row[header] === null ? '' : row[header])
      ).join(',')
    )
  ];
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
