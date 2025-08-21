'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import NextImage from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { FileFormDialog, FieldConfig } from '@/components/ui/file-form-dialog';
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
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

type MenuItem = {
  id: number;
  name: string;
  description: string;
  priceCents: number;
  imageUrl?: string | null;
  status: number;
};

type FetchState = 'idle' | 'loading' | 'error' | 'success';

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Unavailable', value: 'unavailable' },
] as const;

const isUrlValid = (url: string | null | undefined): url is string => {
    return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

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

interface MenuItemStatusAction {
  status: number;
  label: string;
  confirmMessage: string;
  color: string;
}

const statusActions: MenuItemStatusAction[] = [
    {
        status: 3,
        label: 'Delete',
        confirmMessage: 'Are you sure you want to delete this item?',
        color: 'text-red-500 focus:text-red-500 focus:bg-red-500/10',
    },
];

type Status = keyof typeof statusConfig;

type MenuItemStatusBadgeProps = {
  status: number | null;
};

// Component to render a status badge
const MenuItemStatusBadge = ({ status }: MenuItemStatusBadgeProps) => {
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


export default function MenuItemTable(): React.ReactElement {
  const BACKEND_URL = 'http://localhost:8080';

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [state, setState] = useState<FetchState>('idle');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<typeof STATUS_OPTIONS[number]['value']>('all');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [confirmationState, setConfirmationState] = useState<{
    itemId: number;
    action: MenuItemStatusAction;
  } | null>(null);

  const fetchMenuItems = useCallback(async () => {
    setState('loading');
    try {
      const { data } = await axios.get<MenuItem[]>('http://localhost:8080/api/menu-items', {
        headers: { Accept: 'application/json' },
      });
      setMenuItems(Array.isArray(data) ? data : []);
      setState('success');
    } catch (err) {
      console.error(err);
      setState('error');
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  useEffect(() => {
    if (!editDialogOpen) {
      setEditingItem(null);
    }
  }, [editDialogOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = menuItems;

    if (q) {
      list = list.filter((item) => {
        const name = item.name.toLowerCase();
        const description = item.description.toLowerCase();
        return name.includes(q) || description.includes(q);
      });
    }

    if (status !== 'all') {
      const numericStatus = status === 'available' ? 1 : 2;
      list = list.filter((item) => item.status === numericStatus);
    }

    return list;
  }, [menuItems, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageRows = filtered.slice(start, end);

  useEffect(() => {
    setPage(1);
  }, [query, status, rowsPerPage]);

  const fields: FieldConfig[] = [
    { name: 'name', label: 'Name', required: true, placeholder: 'e.g., Orange Juice' },
    { name: 'description', label: 'Description', required: true, placeholder: 'e.g., A juicy orange juice' },
    { name: 'priceCents', label: 'Price (in cents)', type: 'text', required: true, placeholder: '1250' },
    { name: 'image', label: 'Image URL', type: 'file', required: true, placeholder: '/images/your-image.jpg' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { label: 'Active', value: '1' },
      { label: 'Inactive', value: '2' }
    ], defaultValue: '1' },
  ];

  const editFields: FieldConfig[] = [
    { name: 'name', label: 'Name', required: true, placeholder: 'e.g., Orange Juice' },
    { name: 'description', label: 'Description', required: true, placeholder: 'e.g., A juicy orange juice' },
    { name: 'priceCents', label: 'Price (in cents)', type: 'text', required: true, placeholder: '1250' },
    { name: 'image', label: 'Image URL', type: 'file', required: true, placeholder: '/images/your-image.jpg' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [
      { label: 'Active', value: '1' },
      { label: 'Inactive', value: '2' }
    ] },
  ];

  const handleCreate = async (formData: FormData) => {
  try {
    await axios.post(`http://localhost:8080/api/menu-items`, formData);
    await fetchMenuItems();
    setDialogOpen(false);
    toast.success("Menu Item Created", {
      description: "The new item has been successfully added.",
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    toast.error("Creation Failed", {
      description: "Could not create the menu item. Please try again.",
    });
  }
};

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmationState) {
      await updateMenuItemStatus(confirmationState.itemId, confirmationState.action);
      setConfirmationState(null);
    }
  };

  const updateMenuItemStatus = async (itemId: number, action: MenuItemStatusAction) => {
    setIsLoading(true);
    try {
      await axios.patch(`http://localhost:8080/api/menu-items/${itemId}`, {
        status: action.status,
      });
      await fetchMenuItems();
      toast.success("Menu Item Deleted", {
        description: "has been successfully deleted.",
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || `Failed to update item to ${action.label}`;
      console.error(`Error updating item status to ${action.label}:`, error);
      toast.error("Delete Failed", {
      description: "The menu item could not be delete. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (formData: FormData) => {
  if (!editingItem) return;
  try {
    await axios.put(`http://localhost:8080/api/menu-items/${editingItem.id}`, formData);
    
    await fetchMenuItems();
    setEditDialogOpen(false);
    toast.success("Menu Item Updated", {
      description: "has been successfully updated.",
    });
    setEditingItem(null);
  } catch (error) {
    console.error('Error updating menu item:', error);
    toast.error("Update Failed", {
      description: "The menu item could not be updated. Please try again.",
    });
  }
};

  const formatPrice = (priceCents: number) => {
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      <Toaster richColors position="top-right" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu Items</h1>
          <p className="mt-1 text-sm">Here a list of Menu Items!</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name or description..."
            className="mr-3 w-64 rounded-md border border-gray-700 px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <select
            value={status}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'all' || val === 'available' || val === 'unavailable') {
                setStatus(val);
              }
            }}
            className="rounded-md border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-gray-900">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <Button variant="outline" className="cursor-pointer hover:bg-gray-700 hover:text-white border-black bg-gray-900 text-white" onClick={() => setDialogOpen(true)}>
          <BadgePlus /> New
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead className="text-base w-[150px]">Image</TableHead>
              <TableHead className="text-base">Name</TableHead>
              <TableHead className="text-base">Description</TableHead>
              <TableHead className="text-base">Price</TableHead>
              <TableHead className="text-base">Status</TableHead>
              <TableHead className="text-base">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state === 'loading' && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center">
                  Loading menu items...
                </TableCell>
              </TableRow>
            )}
            {state === 'error' && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center">
                  Failed to load menu items.
                </TableCell>
              </TableRow>
            )}
            {state === 'success' && pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
            {state !== 'loading' && pageRows.map((item, idx) => {
              // --- CONSTRUCT THE FULL, ABSOLUTE URL ---
              const absoluteImageUrl = item.imageUrl && item.imageUrl.startsWith('/')
                ? `${BACKEND_URL}${item.imageUrl}`
                : item.imageUrl;

              return (
                <TableRow key={item.id}>
                  <TableCell className='font-bold text-md'>{start + idx + 1}</TableCell>
                  <TableCell>
                    {isUrlValid(absoluteImageUrl) ? (
                      <NextImage
                        src={absoluteImageUrl}
                        alt={item.name}
                        width={60}
                        height={60}
                        className="aspect-square rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex border border-3 border-gray-400 h-[60px] w-[60px] items-center justify-center rounded-md text-gray-400 bg-gray-400/20">
                        <ImageIcon className="h-10 w-10" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-md font-medium">{item.name}</span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                  <TableCell className="font-medium">{formatPrice(item.priceCents)}</TableCell>
                  <TableCell>
                    <MenuItemStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                          <Ellipsis className='h-5 w-5' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className='text-blue-500 focus:text-blue-500 focus:bg-blue-500/10' onClick={() => handleEdit(item)}>
                          Edit
                        </DropdownMenuItem>
                        {statusActions.map((action) => (
                            <DropdownMenuItem
                                key={action.status}
                                className={action.color}
                                onClick={() => setConfirmationState({ itemId: item.id, action })}
                                disabled={isLoading || item.status === action.status}
                            >
                                {action.label}
                            </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )}
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className='font-bold'>
          {filtered.length === 0
            ? '0 of 0 row(s) selected.'
            : `${pageRows.length} of ${filtered.length} row(s) shown.`}
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
            <div className="ml-2 inline-flex rounded-md space-x-3">
              <button
                className="border cursor-pointer border-gray-700 rounded-sm px-2 py-1"
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className='w-4 h-4' />
              </button>
              <button
                className="border cursor-pointer border-gray-700 rounded-sm px-2 py-1"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className='w-4 h-4' />
              </button>
              <button
                className="border cursor-pointer border-gray-700 rounded-sm px-2 py-1"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
              >
                <ChevronRight className='w-4 h-4' />
              </button>
              <button
                className="border cursor-pointer border-gray-700 rounded-sm px-2 py-1"
                onClick={() => setPage(pageCount)}
                disabled={currentPage === pageCount}
              >
                <ChevronsRight className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>
      </div>

      <FileFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Create Menu Item"
        description="Create a new menu item"
        fields={fields}
        layout={{
          fileFields: ['image'],
          dataFields: ['name', 'description', 'priceCents', 'status']
        }}
        submitLabel="Create"
        cancelLabel="Cancel"
        onSubmit={handleCreate}
      />

      <FileFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit Menu Item"
        description="Update menu item information"
        fields={editFields}
        layout={{
          fileFields: ['image'],
          dataFields: ['name', 'description', 'priceCents', 'status']
        }}
        submitLabel="Update"
        cancelLabel="Cancel"
        initialValues={editingItem ? {
            name: editingItem.name,
            description: editingItem.description,
            priceCents: String(editingItem.priceCents),
            status: String(editingItem.status),
            image: editingItem.imageUrl ?? '', 
        } : undefined}
        onSubmit={handleUpdate}
      />

      <ConfirmationDialog
          isOpen={!!confirmationState}
          onClose={() => setConfirmationState(null)}
          onConfirm={handleConfirmAction}
          title={`Confirm Action: ${confirmationState?.action.label || ''}`}
          description={confirmationState?.action.confirmMessage || ''}
        />
    </div>
  );
}
