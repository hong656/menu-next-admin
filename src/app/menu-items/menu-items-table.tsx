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
  Image,
} from 'lucide-react';


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type MenuItem = {
  id: number;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  available: boolean;
};

type FetchState = 'idle' | 'loading' | 'error' | 'success';

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Unavailable', value: 'unavailable' },
] as const;

export default function MenuItemTable(): React.ReactElement {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [state, setState] = useState<FetchState>('idle');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<typeof STATUS_OPTIONS[number]['value']>('all');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

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

  const availabilityConfig = {
    available: {
      text: 'AVAILABLE',
      classes: 'bg-green-500/20 text-emerald-400 ring-1 ring-emerald-400',
      icon: <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />,
    },
    unavailable: {
      text: 'UNAVAILABLE',
      classes: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-400',
      icon: <XCircle className="h-3.5 w-3.5 fill-yellow-400 text-yellow-700" />,
    },
  } as const;

  type AvailabilityBadgeProps = {
    available: boolean;
  };

  const AvailabilityBadge = ({ available }: AvailabilityBadgeProps) => {
    const currentStatus = available ? availabilityConfig.available : availabilityConfig.unavailable;
  
    return (
      <Badge
        className={cn(
          'inline-flex items-center gap-1 px-3 py-1 text-xm font-semibold transition-colors duration-200',
          currentStatus.classes
        )}
      >
        {currentStatus.icon}
        <span>{currentStatus.text}</span>
      </Badge>
    );
  };

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
      const shouldBeAvailable = status === 'available';
      list = list.filter((item) => item.available === shouldBeAvailable);
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
    { name: 'imageUrl', label: 'Image URL', required: true, placeholder: 'http://example.com/image.jpg' },
    { name: 'available', label: 'Available', type: 'select', required: true, options: [
      { label: 'Available', value: 'true' },
      { label: 'Unavailable', value: 'false' }
    ] },
  ];

  const editFields: FieldConfig[] = [
    { name: 'name', label: 'Name', required: true, placeholder: 'e.g., Orange Juice' },
    { name: 'description', label: 'Description', required: true, placeholder: 'e.g., A juicy orange juice' },
    { name: 'priceCents', label: 'Price (in cents)', type: 'text', required: true, placeholder: '1250' },
    { name: 'imageUrl', label: 'Image URL', required: true, placeholder: 'http://example.com/image.jpg' },
    { name: 'available', label: 'Available', type: 'select', required: true, options: [
      { label: 'Available', value: 'true' },
      { label: 'Unavailable', value: 'false' }
    ] },
  ];

  const handleCreate = async (values: Record<string, string>) => {
    const createData = {
      name: values.name,
      description: values.description,
      priceCents: Number(values.priceCents),
      imageUrl: values.imageUrl,
      available: values.available === 'true',
    };
    await axios.post('http://localhost:8080/api/menu-items', createData, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    await fetchMenuItems();
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  const handleDelete = async (itemId: number) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      try {
        await axios.delete(`http://localhost:8080/api/menu-items/${itemId}`);
        setMenuItems(prev => prev.filter(item => item.id !== itemId));
      } catch (error) {
        console.error('Error deleting menu item:', error);
      }
    }
  };

  const handleUpdate = async (values: Record<string, string>) => {
    if (!editingItem) return;
    
    try {
      const updateData = {
        name: values.name,
        description: values.description,
        priceCents: Number(values.priceCents),
        imageUrl: values.imageUrl,
        available: values.available === 'true',
      };
      
      await axios.put(`http://localhost:8080/api/menu-items/${editingItem.id}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      
      await fetchMenuItems();
      setEditDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
  };

  const formatPrice = (priceCents: number) => {
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
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
          <BadgePlus /> New Item
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead className="text-base w-20">Image</TableHead>
              <TableHead className="text-base">Name</TableHead>
              <TableHead className="text-base">Description</TableHead>
              <TableHead className="text-base">Price</TableHead>
              <TableHead className="text-base">Availability</TableHead>
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
            {state !== 'loading' && pageRows.map((item, idx) => (
              <TableRow key={item.id}>
                <TableCell className='font-bold text-md'>{start + idx + 1}</TableCell>
                <TableCell className="w-20">

                </TableCell>
                <TableCell>
                  <span className="text-md font-medium">{item.name}</span>
                </TableCell>
                <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                <TableCell className="font-medium">{formatPrice(item.priceCents)}</TableCell>
                <TableCell>
                  <AvailabilityBadge available={item.available} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Ellipsis className='cursor-pointer w-5 h-5' />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(item)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        variant="destructive" 
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
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

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Create Menu Item"
        description="Create a new menu item"
        fields={fields}
        submitLabel="Create"
        cancelLabel="Cancel"
        onSubmit={handleCreate}
      />

      <FormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="Edit Menu Item"
        description="Update menu item information"
        fields={editFields}
        submitLabel="Update"
        cancelLabel="Cancel"
        initialValues={editingItem ? {
          name: editingItem.name,
          description: editingItem.description,
          priceCents: String(editingItem.priceCents),
          imageUrl: editingItem.imageUrl,
          available: String(editingItem.available),
        } : undefined}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
