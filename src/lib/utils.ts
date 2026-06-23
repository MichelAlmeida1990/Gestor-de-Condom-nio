import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(dateString: string) {
  if (!dateString) return "Data inválida";
  
  try {
    // Handle different date formats
    let normalized = dateString;
    
    // If it's just YYYY-MM-DD, append time
    if (!dateString.includes("T") && !dateString.includes(" ")) {
      normalized = `${dateString}T00:00:00`;
    }
    
    const date = new Date(normalized);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Data inválida";
    }
    
    return date.toLocaleDateString("pt-BR", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return "Data inválida";
  }
}

export function formatDateTime(dateString: string, timeString?: string) {
  if (!dateString) return "Data inválida";
  
  try {
    let normalized = dateString;
    
    // If it's just YYYY-MM-DD, append time if provided
    if (!dateString.includes("T") && !dateString.includes(" ")) {
      normalized = timeString ? `${dateString}T${timeString}` : `${dateString}T00:00:00`;
    }
    
    const date = new Date(normalized);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Data inválida";
    }
    
    const formattedDate = date.toLocaleDateString("pt-BR", {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    if (timeString) {
      return `${formattedDate} às ${timeString}`;
    }
    
    return formattedDate;
  } catch {
    return "Data inválida";
  }
}
