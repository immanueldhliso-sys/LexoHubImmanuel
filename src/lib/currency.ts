/**
 * South African Rand (ZAR) currency utilities
 * Provides consistent formatting for financial values across the application
 */

export interface RandFormattingOptions {
  showDecimals?: boolean;
  showSymbol?: boolean;
  compact?: boolean;
}

/**
 * Format a number as South African Rand currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatRand(
  amount: number, 
  options: RandFormattingOptions = {}
): string {
  const {
    showDecimals = true,
    showSymbol = true,
    compact = false
  } = options;

  // Handle compact formatting for large numbers
  if (compact && amount >= 1000000) {
    const millions = amount / 1000000;
    const formatted = millions.toFixed(1);
    return showSymbol ? `R${formatted}M` : `${formatted}M`;
  }
  
  if (compact && amount >= 1000) {
    const thousands = amount / 1000;
    const formatted = thousands.toFixed(1);
    return showSymbol ? `R${formatted}K` : `${formatted}K`;
  }

  // Standard formatting
  const formatter = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  let formatted = formatter.format(amount);
  
  // Replace ZAR with R for shorter display
  formatted = formatted.replace('ZAR', 'R').replace(/\s/g, '');
  
  if (!showSymbol) {
    formatted = formatted.replace('R', '');
  }

  return formatted;
}

/**
 * Format a number as South African Rand without decimals
 */
export function formatRandWhole(amount: number): string {
  return formatRand(amount, { showDecimals: false });
}

/**
 * Format a number as compact South African Rand (e.g., R1.2M, R850K)
 */
export function formatRandCompact(amount: number): string {
  return formatRand(amount, { compact: true });
}

/**
 * Parse a Rand string back to a number
 * @param randString - String like "R1,234.56" or "R1.2M"
 * @returns Parsed number or null if invalid
 */
export function parseRand(randString: string): number | null {
  if (!randString) return null;
  
  // Remove R symbol and spaces
  let cleanString = randString.replace(/R\s*/g, '').replace(/\s/g, '');
  
  // Handle compact notation
  if (cleanString.endsWith('M')) {
    const number = parseFloat(cleanString.slice(0, -1));
    return isNaN(number) ? null : number * 1000000;
  }
  
  if (cleanString.endsWith('K')) {
    const number = parseFloat(cleanString.slice(0, -1));
    return isNaN(number) ? null : number * 1000;
  }
  
  // Remove commas and parse
  cleanString = cleanString.replace(/,/g, '');
  const number = parseFloat(cleanString);
  
  return isNaN(number) ? null : number;
}

/**
 * Calculate percentage of payment made
 */
export function calculatePaymentPercentage(paid: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((paid / total) * 100);
}

/**
 * Get payment status based on amount paid vs total
 */
export function getPaymentStatus(paid: number, total: number): 'unpaid' | 'partial' | 'paid' | 'overpaid' {
  if (paid === 0) return 'unpaid';
  if (paid < total) return 'partial';
  if (paid === total) return 'paid';
  return 'overpaid';
}
