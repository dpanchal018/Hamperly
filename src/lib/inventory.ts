export type InventoryStatus = 'IN STOCK' | 'LOW STOCK' | 'CRITICAL' | 'OUT OF STOCK';

/**
 * Returns the availability status of a product based on its stock quantity.
 * @param quantity The current stock quantity
 * @returns The authoritative InventoryStatus string
 */
export function getInventoryStatus(quantity: number): InventoryStatus {
  if (quantity <= 0) return 'OUT OF STOCK';
  if (quantity <= 2) return 'CRITICAL';
  if (quantity <= 5) return 'LOW STOCK';
  return 'IN STOCK';
}

/**
 * Returns the color class for the given inventory status.
 */
export function getInventoryStatusColor(status: InventoryStatus): string {
  switch (status) {
    case 'IN STOCK':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'LOW STOCK':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'CRITICAL':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'OUT OF STOCK':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}
