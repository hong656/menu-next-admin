'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { FormDialog, FieldConfig } from '@/components/ui/form-dialog';
import {
  ChevronLeft,
  ChevronsLeft,
  ChevronRight,
  ChevronsRight,
  Ellipsis,
  BadgePlus,
  CheckCircle2,
  XCircle,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import Link from 'next/link';
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

// --- CHANGE HERE ---
type TableEntry = {
  id: number;
  number: number;
  qrToken: string;
  status: number;
  createdAt: string;
  updatedAt: string;
};

type FetchState = 'idle' | 'loading' | 'error' | 'success';

// Configuration for status badges
const statusConfig = {
  1: { // Active
    text: 'ACTIVE',
    classes: 'bg-green-500/20 text-emerald-400 ring-1 ring-emerald-400',
    icon: <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />,
  },
  2: { // Inactive
    text: 'INACTIVE',
    classes: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-400',
    icon: <XCircle className="h-3.5 w-3.5 fill-yellow-400 text-yellow-700" />,
  },
  3: { // Deleted
    text: 'Delete',
    classes: 'bg-red-500/20 text-red-400 ring-1 ring-red-400',
    icon: <Trash2 className="h-3.5 w-3.5 fill-red-400 text-red-700" />,
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
    status: 3,
    label: statusConfig[3].text,
    confirmMessage: 'Are you sure you want to mark this order as complete?',
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


export default function TablesTable(): React.ReactElement {
  const [tables, setTables] = useState<TableEntry[]>([]);
  const [state, setState] = useState<FetchState>('idle');
  const [query, setQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [confirmationState, setConfirmationState] = useState<{
    tableId: number;
    action: TableStatusAction;
  } | null>(null);

  // Fetches all table entries from the API
  const fetchTables = useCallback(async () => {
    setState('loading');
    try {
      const { data } = await axios.get<{ data: TableEntry[] }>(`${process.env.NEXT_PUBLIC_API_URL}/api/tables`, {
        headers: { Accept: 'application/json' },
      });
      // The actual data is nested in a "data" property
      setTables(Array.isArray(data.data) ? data.data : []);
      setState('success');
    } catch (err) {
      console.error(err);
      setState('error');
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    if (!editDialogOpen) {
      setEditingTable(null);
    }
  }, [editDialogOpen]);

  // Filters tables based on the search query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter((t) => String(t.number).toLowerCase().includes(q));
  }, [tables, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageRows = filtered.slice(start, end);

  useEffect(() => {
    setPage(1);
  }, [query, rowsPerPage]);

  // Form configuration for creating a new table
  const createFields: FieldConfig[] = [
    { name: 'number', label: 'Table Number', required: true, placeholder: 'e.g., 15'},
    {
      name: 'status',
      label: 'Status',
      required: true,
      type: 'select',
      options: [
        { label: 'Active', value: '1' },
        { label: 'Inactive', value: '2' },
      ], defaultValue: '1'
    },
  ];

  // Form configuration for editing an existing table
  const editFields: FieldConfig[] = [
    { name: 'number', label: 'Table Number', required: true, placeholder: 'e.g., 15'},
    {
      name: 'status',
      label: 'Status',
      required: true,
      type: 'select',
      options: [
        { label: 'Active', value: '1' },
        { label: 'Inactive', value: '2' },
      ],
    },
  ];

  // Handler for creating a new table entry
  const handleCreate = async (values: Record<string, string>) => {
    try {
      const createData = {
        number: Number(values.number),
        status: Number(values.status),
      };
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/tables`, createData, {
        headers: { 'Content-Type': 'application/json' },
      });
      await fetchTables();
      toast.success("Table Created", {
        description: "The new table has been successfully added.",
      });
    } catch (error) {
      console.error('Failed to create table:', error);
      toast.error("Creation Failed", {
        description: "Could not create the table. Please try again.",
      });
    }
  };

  const handleEdit = (table: TableEntry) => {
    setEditingTable(table); 
    setEditDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmationState) {
      await updateTableStatus(confirmationState.tableId, confirmationState.action);
      setConfirmationState(null);
    }
  };

  const updateTableStatus = async (tableId: number, action: TableStatusAction) => {
    setIsLoading(true);
    try {
      await axios.patch(`http://localhost:8080/api/tables/${tableId}`, {
        status: action.status,
      });
      await fetchTables();
      toast.success("Table Deleted", {
        description: "The table has been successfully deleted.",
      }); 
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || `Failed to update order to ${action.label}`;
      console.error(`Error updating order status to ${action.label}:`, error);
      toast.error("Delete Failed", {
        description: "Could not delete the table. Please try again.",
      });
    } finally {
      setIsLoading(false); // Re-enable buttons
    }
  };

  const handleUpdate = async (values: Record<string, string>) => {
    if (!editingTable) return;
    try {
      const updateData = {
        number: Number(values.number),
        status: Number(values.status),
      };
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/tables/${editingTable.id}`, updateData, {
        headers: { 'Content-Type': 'application/json' },
      });
      await fetchTables();
      toast.success("Table Updated", {
        description: "The table has been successfully updated.",
      });
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating table:', error);
      toast.error("Update Failed", {
        description: "Could not update the table. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Toaster richColors position="top-right" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tables</h1>
          <p className="mt-1 text-sm">A list of all the tables in the system.</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by table number..."
          className="w-64 rounded-md border border-gray-700 px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <Button variant="outline" className="cursor-pointer hover:bg-gray-700 hover:text-white border-black bg-gray-900 text-white" onClick={() => setDialogOpen(true)}>
          <BadgePlus /> New
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead className="text-base">Number</TableHead>
              <TableHead className="text-base">Status</TableHead>
              <TableHead className="text-base">Created At</TableHead>
              <TableHead className="text-base">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state === 'loading' && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">Loading tables...</TableCell>
              </TableRow>
            )}
            {state === 'error' && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-red-500">Failed to load tables.</TableCell>
              </TableRow>
            )}
            {state === 'success' && pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">No results.</TableCell>
              </TableRow>
            )}
            {state === 'success' && pageRows.map((table, idx) => (
              <TableRow key={table.id}>
                <TableCell className='font-bold text-md'>{start + idx + 1}</TableCell>
                <TableCell>
                  <span className="text-md font-medium">{table.number}</span>
                </TableCell>
                <TableCell>
                  <TableStatusBadge status={table.status} />
                </TableCell>
                <TableCell>
                  {/* --- CHANGE HERE --- */}
                  {/* Access table.createdAt instead of table.created_at */}
                  {new Date(table.createdAt).toLocaleDateString('en-US', {
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
                      <Link href={`/tables/${table.id}`}>
                        <DropdownMenuItem className='text-green-500 focus:text-green-500 focus:bg-green-500/10'>Get Qr Code</DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem className='text-blue-500 focus:text-blue-500 focus:bg-blue-500/10' onClick={() => handleEdit(table)}>Edit</DropdownMenuItem>
                      {statusActions.map((action) => (
                        <DropdownMenuItem
                          key={action.status}
                          className={action.color}
                          onClick={() => setConfirmationState({ tableId: table.id, action })}
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
        <div className='font-bold text-muted-foreground'>
          Showing {Math.min(start + 1, filtered.length)} to {Math.min(end, filtered.length)} of {filtered.length} entries
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
              Page {currentPage} of {pageCount}
            </span>
            <div className="ml-2 inline-flex rounded-md shadow-sm space-x-2">
                <Button variant="outline" size="icon" onClick={() => setPage(1)} disabled={currentPage === 1}><ChevronsLeft className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={currentPage === pageCount}><ChevronRight className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" onClick={() => setPage(pageCount)} disabled={currentPage === pageCount}><ChevronsRight className='w-4 h-4' /></Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog for Creating a New Table */}
      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Create New Table"
        description="Add a new table to the system. Only the table number is required."
        fields={createFields}
        submitLabel="Create"
        onSubmit={handleCreate}
      />

      {/* Dialog for Editing an Existing Table */}
      <FormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit Menu Item"
        description="Update menu item information"
        fields={editFields}
        submitLabel="Update"
        cancelLabel="Cancel"
        initialValues={editingTable ? {
          number: String(editingTable.number),
          status: String(editingTable.status),
        } : undefined}
        onSubmit={(values) => handleUpdate(values)}
      />
    </div>
  );
}