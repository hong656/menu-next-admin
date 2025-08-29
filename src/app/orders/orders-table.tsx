'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronsLeft,
  ChevronRight,
  ChevronsRight,
  Ellipsis,
  CheckCircle2,
  XCircle,
  Clock9,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Input } from '@/components/ui/input'

type OrderItem = {
    id: number;
    menuItem: {
        id: number;
        name: string;
        description: string;
        priceCents: number;
        imageUrl: string;
        available: boolean;
    };
    quantity: number;
    unitPrice: number;
    lineTotal: number;
};

type TableInfo = {
    id: number;
    number: number;
    orders: any;
}

type OrderEntry = {
  id: number;
  table: TableInfo;
  status: number;
  remark: string;
  totalCents: number;
  placedAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
};

type FetchState = 'idle' | 'loading' | 'error' | 'success';

const statusConfig = {
  1: {
    text: 'Received',
    classes: 'bg-green-500/20 text-emerald-400 ring-1 ring-emerald-400',
    icon: <XCircle className="!h-4 !w-4" />,
  },
  2: {
    text: 'Preparing',
    classes: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-400',
    icon: <Clock9 className="!h-4 !w-4" />,
  },
  3: {
    text: 'Completed',
    classes: 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-400',
    icon: <CheckCircle2 className="!h-4 !w-4" />,
  },
  4: {
    text: 'Canceled',
    classes: 'bg-red-500/20 text-red-400 ring-1 ring-red-400',
    icon: <Trash2 className="!h-4 !w-4" />,
  },
} as const;

interface TableStatusAction {
  status: number;
  label: string;
  confirmMessage: string;
  color: string;
}

const statusActions: TableStatusAction[] = [
  {
    status: 2,
    label: statusConfig[2].text,
    confirmMessage: 'Are you sure you want to mark this order as preparing?',
    color: 'text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10',
  },
  {
    status: 3,
    label: statusConfig[3].text,
    confirmMessage: 'Are you sure you want to mark this order as complete?',
    color: 'text-blue-500 focus:text-blue-500 focus:bg-blue-500/10',
  },
  {
    status: 4,
    label: statusConfig[4].text,
    confirmMessage: 'Are you sure you want to cancel this order?',
    color: 'text-red-500 focus:text-red-500 focus:bg-red-500/10',
  },
];

type Status = keyof typeof statusConfig;

type TableStatusBadgeProps = {
  status: number | null;
};

// Component to render a status badge
const TableStatusBadge = ({ status }: TableStatusBadgeProps) => {
  const currentStatus = status && statusConfig[status as Status] ? statusConfig[status as Status] : statusConfig[2];

  return (
    <Badge
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold transition-colors duration-200',
        currentStatus.classes
      )}
    >
      {currentStatus.icon}
      <span>{currentStatus.text}</span>
    </Badge>
  );
};

export default function OrderTable(): React.ReactElement {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const [orders, setOrders] = useState<OrderEntry[]>([]);
  const [pagedOrders, setPagedOrders] = useState<OrderEntry[]>([]);
  const [state, setState] = useState<FetchState>('idle');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [confirmationState, setConfirmationState] = useState<{
    orderId: number;
    action: TableStatusAction;
  } | null>(null);

  const fetchOrders = useCallback(async () => {
    setState('loading');
    const params = new URLSearchParams();

    // API uses 0-based page index, UI uses 1-based
    params.append('page', (page - 1).toString());
    params.append('size', rowsPerPage.toString());

    if (debouncedQuery) {
        // Assuming the API uses 'q' for table number search
        params.append('q', debouncedQuery);
    }

    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/orders?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      
      // Update state with pagination data from the API response
      setPagedOrders(Array.isArray(data.items) ? data.items : []);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      
      setState('success');
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setPagedOrders([]); // Clear data on error
      setState('error');
    }
  }, [BACKEND_URL, page, rowsPerPage, debouncedQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

    useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (page !== 1) setPage(1);
    }, 500); // 500ms delay

    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [rowsPerPage]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) => String(order.table.number).toLowerCase().includes(q));
  }, [orders, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageRows = filtered.slice(start, end);

  useEffect(() => {
    setPage(1);
  }, [query, rowsPerPage]);

  const handleConfirmAction = async () => {
    if (confirmationState) {
      await updateOrderStatus(confirmationState.orderId, confirmationState.action);
      setConfirmationState(null);
    }
  };

  const updateOrderStatus = async (orderId: number, action: TableStatusAction) => {
    setIsLoading(true);
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`, {
        status: action.status,
      });
      await fetchOrders();
      if (action.status === 4) {
        toast.success("Order cancelled", {
          description: `Order has been successfully cancelled.`,
        });
      } else {
        toast.success(`Order updated to "${action.label}"`, {
          description: `Order has been successfully updated.`,
        });
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || `Failed to update order to ${action.label}`;
      console.error(`Error updating order status to ${action.label}:`, error);
      toast.error("Order Update Failed", {
        description: `Error updating order status`,
      });
    } finally {
      setIsLoading(false); // Re-enable buttons
    }
  };

  return (
    <div className="space-y-4">
      <Toaster richColors position="top-right" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="mt-1 text-sm">A list of all the orders in the system.</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by table number..."
          className="w-64"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead className="text-base">Table</TableHead>
              <TableHead className="text-base">Status</TableHead>
              <TableHead className="text-base">Total Price</TableHead>
              <TableHead className="text-base">Order Items</TableHead>
              <TableHead className="text-base">Placed At</TableHead>
              <TableHead className="text-base">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state === 'loading' && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center">Loading orders...</TableCell>
              </TableRow>
            )}
            {state === 'error' && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-red-500">Failed to load orders.</TableCell>
              </TableRow>
            )}
            {state === 'success' && pagedOrders.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center">No results found.</TableCell></TableRow>}
            {state === 'success' && pagedOrders.map((order, idx) => (
              <TableRow key={order.id}>
                <TableCell className='font-bold text-md'>{(page - 1) * rowsPerPage + idx + 1}</TableCell>
                <TableCell>
                  <span className="text-md font-medium">{order.table.number}</span>
                </TableCell>
                <TableCell>
                  <TableStatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  <span className='text-md font-medium'>${(order.totalCents / 100).toFixed(2)}</span>
                </TableCell>
                <TableCell>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className='cursor-pointer'>View Items</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[825px]">
                        <DialogHeader>
                            <DialogTitle>Order Items (Table {order.table.number})</DialogTitle>
                        </DialogHeader>
                        <div className='max-h-96 overflow-y-auto rounded-md p-4 border'>
                            <pre className="text-sm">
                            {JSON.stringify(order.orderItems, null, 2)}
                            </pre>
                        </div>
                        </DialogContent>
                    </Dialog>
                </TableCell>
                <TableCell>
                  {new Date(order.placedAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                        <Ellipsis className='h-5 w-5' />
                      </Button>
                    </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {statusActions.map((action) => (
                          <DropdownMenuItem
                            key={action.status}
                            className={action.color}
                            onClick={() => setConfirmationState({ orderId: order.id, action })}
                            disabled={isLoading}
                          >
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ConfirmationDialog
          isOpen={!!confirmationState}
          onClose={() => setConfirmationState(null)} // Handles Cancel/Esc/Overlay click
          onConfirm={handleConfirmAction}            // Handles the Confirm click
          title={`Confirm Action: ${confirmationState?.action.label || ''}`}
          description={confirmationState?.action.confirmMessage || ''}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className='font-bold'>
          {totalItems === 0
            ? '0 items found.'
            : `Showing ${((page - 1) * rowsPerPage) + 1} to ${Math.min(page * rowsPerPage, totalItems)} of ${totalItems} items.`}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className='font-bold'>Rows per page</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="rounded-md border border-gray-700 bg-transparent px-2 py-1 focus:outline-none"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n} className="bg-gray-900">{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className='font-bold'>
              Page {page} of {totalPages}
            </span>
            <div className="ml-2 inline-flex rounded-md shadow-sm space-x-2">
                <Button variant="outline" size="icon" onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}><ChevronRight className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0}><ChevronsRight className='w-4 h-4' /></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}