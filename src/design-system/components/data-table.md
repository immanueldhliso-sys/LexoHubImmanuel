# Data Table Component

## Overview

The Data Table component provides a robust, accessible table for displaying structured data with sorting, filtering, pagination, and bulk actions. Optimized for legal practice data like invoices, matters, and client information.

## Anatomy

```
┌─────────────────────────────────────────────────────────────┐
│  [Search] [Filter] [Actions]                    [Settings]  │  ← Toolbar
├─────────────────────────────────────────────────────────────┤
│  ☐ Column 1 ↕  │ Column 2 ↕  │ Column 3 ↕  │ Actions      │  ← Header
├─────────────────────────────────────────────────────────────┤
│  ☐ Data 1      │ Data 2      │ Data 3      │ [•••]        │  ← Row
│  ☐ Data 1      │ Data 2      │ Data 3      │ [•••]        │  ← Row
│  ☐ Data 1      │ Data 2      │ Data 3      │ [•••]        │  ← Row
├─────────────────────────────────────────────────────────────┤
│  Showing 1-10 of 156 results        [← 1 2 3 ... 16 →]     │  ← Footer
└─────────────────────────────────────────────────────────────┘
```

## Props/Variants

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | `[]` | Array of data objects |
| `columns` | `ColumnDef<T>[]` | - | Column definitions |
| `loading` | `boolean` | `false` | Loading state |
| `error` | `string` | - | Error message |
| `emptyMessage` | `string` | `'No data available'` | Empty state message |
| `selectable` | `boolean` | `false` | Enable row selection |
| `sortable` | `boolean` | `true` | Enable column sorting |
| `filterable` | `boolean` | `true` | Enable filtering |
| `searchable` | `boolean` | `true` | Enable search |
| `pagination` | `PaginationConfig` | - | Pagination configuration |
| `bulkActions` | `BulkAction[]` | `[]` | Available bulk actions |
| `rowActions` | `RowAction<T>[]` | `[]` | Row-level actions |
| `variant` | `'default' \| 'compact' \| 'comfortable'` | `'default'` | Table density |
| `stickyHeader` | `boolean` | `false` | Sticky table header |
| `onRowClick` | `(row: T) => void` | - | Row click handler |
| `onSelectionChange` | `(selectedRows: T[]) => void` | - | Selection change handler |
| `className` | `string` | - | Additional CSS classes |

## Column Definition

```typescript
interface ColumnDef<T> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => any;
  cell?: (info: CellContext<T>) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  sticky?: 'left' | 'right';
}
```

## State Specifications

### Default State
- Clean, minimal appearance with subtle borders
- Proper spacing and typography hierarchy
- Clear visual separation between header and data rows

### Loading State
- Skeleton rows with animated placeholders
- Disabled interactions
- Loading indicator in toolbar

### Empty State
- Centered empty state illustration
- Helpful message and optional action button
- Maintains table structure

### Error State
- Error message displayed in place of data
- Retry action available
- Error styling without being alarming

### Hover State
- Row background: `bg-surface-hover`
- Smooth transition: `transition-colors duration-150`

### Selected State
- Row background: `bg-primary-50`
- Left border: `border-l-4 border-l-primary-500`
- Checkbox checked state

## Accessibility

### ARIA Attributes
```jsx
<table
  role="table"
  aria-label="Data table"
  aria-rowcount={totalRows}
  aria-colcount={columns.length}
>
  <thead role="rowgroup">
    <tr role="row">
      <th
        role="columnheader"
        aria-sort={sortDirection}
        tabIndex={0}
        onKeyDown={handleSort}
      >
        Column Header
      </th>
    </tr>
  </thead>
  <tbody role="rowgroup">
    <tr role="row" aria-rowindex={index + 1}>
      <td role="gridcell">Cell content</td>
    </tr>
  </tbody>
</table>
```

### Keyboard Navigation
- **Tab**: Navigate through interactive elements
- **Arrow keys**: Navigate between cells
- **Enter/Space**: Activate buttons, toggle selection
- **Escape**: Close dropdowns, clear selection

### Screen Reader Support
- Table structure properly announced
- Sort states communicated
- Selection states announced
- Loading and error states announced

## Code Examples

### Basic Data Table
```jsx
import { DataTable } from '@/components/ui/data-table';

const columns = [
  {
    id: 'invoice',
    header: 'Invoice #',
    accessorKey: 'invoiceNumber',
    sortable: true,
  },
  {
    id: 'client',
    header: 'Client',
    accessorKey: 'clientName',
    sortable: true,
    filterable: true,
  },
  {
    id: 'amount',
    header: 'Amount',
    accessorKey: 'amount',
    sortable: true,
    align: 'right',
    cell: ({ getValue }) => {
      const amount = getValue() as number;
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
      }).format(amount);
    },
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'status',
    cell: ({ getValue }) => {
      const status = getValue() as string;
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'paid' ? 'bg-success-100 text-success-700' :
          status === 'overdue' ? 'bg-error-100 text-error-700' :
          'bg-warning-100 text-warning-700'
        }`}>
          {status}
        </span>
      );
    },
  },
];

<DataTable
  data={invoices}
  columns={columns}
  searchable
  selectable
  pagination={{
    pageSize: 10,
    showSizeSelector: true,
  }}
/>
```

### Table with Bulk Actions
```jsx
const bulkActions = [
  {
    id: 'mark-paid',
    label: 'Mark as Paid',
    icon: <CheckCircle className="w-4 h-4" />,
    action: (selectedRows) => markInvoicesAsPaid(selectedRows),
    variant: 'success',
  },
  {
    id: 'send-reminder',
    label: 'Send Reminder',
    icon: <Mail className="w-4 h-4" />,
    action: (selectedRows) => sendReminders(selectedRows),
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    action: (selectedRows) => deleteInvoices(selectedRows),
    variant: 'error',
    confirmMessage: 'Are you sure you want to delete the selected invoices?',
  },
];

<DataTable
  data={invoices}
  columns={columns}
  selectable
  bulkActions={bulkActions}
/>
```

### Table with Row Actions
```jsx
const rowActions = [
  {
    id: 'view',
    label: 'View Details',
    icon: <Eye className="w-4 h-4" />,
    action: (row) => viewInvoice(row.id),
  },
  {
    id: 'edit',
    label: 'Edit',
    icon: <Edit className="w-4 h-4" />,
    action: (row) => editInvoice(row.id),
  },
  {
    id: 'duplicate',
    label: 'Duplicate',
    icon: <Copy className="w-4 h-4" />,
    action: (row) => duplicateInvoice(row.id),
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    action: (row) => deleteInvoice(row.id),
    variant: 'error',
    confirmMessage: 'Are you sure you want to delete this invoice?',
  },
];

<DataTable
  data={invoices}
  columns={columns}
  rowActions={rowActions}
/>
```

### Compact Variant
```jsx
<DataTable
  data={matters}
  columns={matterColumns}
  variant="compact"
  stickyHeader
  pagination={{
    pageSize: 25,
    showSizeSelector: false,
  }}
/>
```

## Implementation

### React Component Structure
```jsx
import React, { useState, useMemo } from 'react';
import { 
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';

export const DataTable = <T,>({
  data,
  columns,
  loading = false,
  error,
  emptyMessage = 'No data available',
  selectable = false,
  sortable = true,
  filterable = true,
  searchable = true,
  pagination,
  bulkActions = [],
  rowActions = [],
  variant = 'default',
  stickyHeader = false,
  onRowClick,
  onSelectionChange,
  className,
}: DataTableProps<T>) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});

  // Table configuration
  const table = useReactTable({
    data,
    columns: useMemo(() => {
      const cols = [...columns];
      
      if (selectable) {
        cols.unshift({
          id: 'select',
          header: ({ table }) => (
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={table.getIsSomePageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={row.getToggleSelectedHandler()}
            />
          ),
          enableSorting: false,
          enableHiding: false,
        });
      }

      if (rowActions.length > 0) {
        cols.push({
          id: 'actions',
          header: '',
          cell: ({ row }) => (
            <RowActionsMenu row={row.original} actions={rowActions} />
          ),
          enableSorting: false,
          enableHiding: false,
        });
      }

      return cols;
    }, [columns, selectable, rowActions]),
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: selectable,
    enableSorting: sortable,
  });

  // Handle selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, onSelectionChange]);

  const variantClasses = {
    default: '',
    compact: 'text-sm',
    comfortable: 'text-base',
  };

  if (loading) {
    return <TableSkeleton columns={columns.length} rows={10} />;
  }

  if (error) {
    return <TableError message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <TableToolbar
        table={table}
        searchable={searchable}
        filterable={filterable}
        bulkActions={bulkActions}
        selectedRows={Object.keys(rowSelection).length}
      />

      {/* Table */}
      <div className="border border-surface-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className={cn('w-full', variantClasses[variant])}>
            <thead className={cn(
              'bg-surface-secondary border-b border-surface-border',
              stickyHeader && 'sticky top-0 z-10'
            )}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        'px-4 py-3 text-left text-sm font-medium text-content-secondary',
                        header.column.getCanSort() && 'cursor-pointer hover:text-content-primary',
                        header.column.columnDef.align === 'center' && 'text-center',
                        header.column.columnDef.align === 'right' && 'text-right'
                      )}
                      style={{
                        width: header.column.columnDef.width,
                        minWidth: header.column.columnDef.minWidth,
                        maxWidth: header.column.columnDef.maxWidth,
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center space-x-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <SortIcon direction={header.column.getIsSorted()} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <EmptyState message={emptyMessage} />
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-surface-border hover:bg-surface-hover transition-colors duration-150',
                      row.getIsSelected() && 'bg-primary-50 border-l-4 border-l-primary-500',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          'px-4 py-3 text-sm text-content-primary',
                          cell.column.columnDef.align === 'center' && 'text-center',
                          cell.column.columnDef.align === 'right' && 'text-right'
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <TablePagination
          table={table}
          pagination={pagination}
        />
      )}
    </div>
  );
};
```

### CSS Classes
```css
.mpondo-data-table {
  @apply border border-surface-border rounded-lg overflow-hidden;
}

.mpondo-data-table th {
  @apply px-4 py-3 text-left text-sm font-medium text-content-secondary bg-surface-secondary border-b border-surface-border;
}

.mpondo-data-table td {
  @apply px-4 py-3 text-sm text-content-primary border-b border-surface-border;
}

.mpondo-data-table tr:hover {
  @apply bg-surface-hover;
}

.mpondo-data-table tr[data-selected="true"] {
  @apply bg-primary-50 border-l-4 border-l-primary-500;
}
```