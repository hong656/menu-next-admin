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
  Eye,
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MenuItem = {
  id: number;
  name: string;
  menuType: MenuType;
  description: string;
  priceCents: number;
  imageUrl?: string | null;
  status: number;
};

type MenuType = {
  id: number;
  name: string;
};

type FetchState = 'idle' | 'loading' | 'error' | 'success';

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
] as const;

const isUrlValid = (url: string | null | undefined): url is string => {
    return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

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

  const [pagedMenuItems, setPagedMenuItems] = useState<MenuItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuTypes, setMenuTypes] = useState<MenuType[]>([]);
  const [state, setState] = useState<FetchState>('idle');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [status, setStatus] = useState<typeof STATUS_OPTIONS[number]['value']>('all');
  const [page, setPage] = useState<number>(1); // UI page (1-based index)
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (previewImage) {
      setImageSize({ width: 0, height: 0 });
    }
  }, [previewImage]);

  const [confirmationState, setConfirmationState] = useState<{
    itemId: number;
    action: MenuItemStatusAction;
  } | null>(null);

  const fetchMenuItems = useCallback(async () => {
    setState('loading');
    const params = new URLSearchParams();

    // The API uses a 0-based index for pages
    params.append('page', (page - 1).toString()); 
    params.append('size', rowsPerPage.toString());

    if (debouncedQuery) {
        params.append('q', debouncedQuery);
    }
    if (status !== 'all') {
        const numericStatus = status === 'active' ? 1 : 2;
        params.append('status', numericStatus.toString());
    }

    try {
      const { data } = await axios.get(`http://localhost:8080/api/menu-items?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      // Update state with data from the API response
      setPagedMenuItems(Array.isArray(data.items) ? data.items : []);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setState('success');
    } catch (err) {
      console.error(err);
      setPagedMenuItems([]); // Clear data on error
      setState('error');
    }
  }, [page, rowsPerPage, debouncedQuery, status]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  useEffect(() => {
    if(page !== 1) setPage(1);
  }, [status, rowsPerPage]);

  const fetchMenuTypes = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/menu-types`);
      const activeTypes = data.filter((type: { status: number }) => type.status === 1);
      setMenuTypes(activeTypes);
    } catch (error) {
      console.error("Failed to fetch menu types:", error);
      toast.error("Failed to load menu categories", {
        description: "Could not load categories for the dropdown. Please try refreshing.",
      });
    }
  };

  useEffect(() => {
    fetchMenuTypes();
  }, []);

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
      const numericStatus = status === 'inactive' ? 1 : 2;
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
    {
      name: 'menuTypeId',
      label: 'Type',
      required: true,
      type: 'select',
      placeholder: 'Select a type',
      options: menuTypes.map(type => ({
        label: type.name,
        value: String(type.id)
      }))
    },
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
    {
      name: 'menuTypeId',
      label: 'Type',
      required: true,
      type: 'select',
      placeholder: 'Select a type',
      options: menuTypes.map(type => ({
        label: type.name,
        value: String(type.id)
      }))
    },
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
    await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/menu-items/${editingItem.id}`, formData);
    
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
        <div className='flex'>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name or description..."
            className='mr-3'
          />
          <Select
            value={status}
            onValueChange={(value) => {
              if (value === 'all' || value === 'active' || value === 'inactive') {
                setStatus(value);
              }
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <TableHead className="text-base">Type</TableHead>
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
            {state === 'success' && pagedMenuItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
            {state === 'success' && pagedMenuItems.map((item, idx) => {
              const absoluteImageUrl = item.imageUrl && item.imageUrl.startsWith('/')
                ? `${BACKEND_URL}${item.imageUrl}`
                : item.imageUrl;
              return (
                <TableRow key={item.id}>
                  <TableCell className='font-bold text-md'>{(page - 1) * rowsPerPage + idx + 1}</TableCell>
                  <TableCell>
                    <div className="relative group w-[60px] h-[60px]">
                      {isUrlValid(absoluteImageUrl) ? (
                        <>
                          <NextImage
                            src={absoluteImageUrl}
                            alt={item.name}
                            fill
                            className="rounded-md object-cover z-10" // <-- ADD z-10 HERE
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={currentPage === 1 && idx === 0}
                          />
                          <div
                            className="absolute inset-0 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md z-20" // <-- ADD z-20 HERE
                            onClick={() => setPreviewImage(absoluteImageUrl)}
                          >
                            <Eye className="text-white h-6 w-6" />
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-md text-gray-400 bg-gray-400/20 border-2 border-dashed">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-md font-medium">{item.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge>{item.menuType?.name || 'N/A'}</Badge>
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
          {totalItems === 0
            ? '0 items found.'
            : `Showing ${((page - 1) * rowsPerPage) + 1} to ${Math.min(page * rowsPerPage, totalItems)} of ${totalItems} items.`}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className='font-bold'>Rows per page</span>
            <Select
              value={String(rowsPerPage)}
              onValueChange={(value) => {
                setRowsPerPage(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={rowsPerPage} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      <FileFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Create Menu Item"
        description="Create a new menu item"
        fields={fields}
        layout={{
          fileFields: ['image'],
          dataFields: ['name', 'menuTypeId', 'description', 'priceCents', 'status']
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
          dataFields: ['name', 'menuTypeId', 'description', 'priceCents', 'status']
        }}
        submitLabel="Update"
        cancelLabel="Cancel"
        initialValues={editingItem ? {
          name: editingItem.name,
          description: editingItem.description,
          priceCents: String(editingItem.priceCents),
          status: String(editingItem.status),
          menuTypeId: String(editingItem.menuType?.id),
          image: editingItem.imageUrl && editingItem.imageUrl.startsWith('/')
              ? `${BACKEND_URL}${editingItem.imageUrl}`
              : editingItem.imageUrl ?? '',
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

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 bg-opacity-75 transition-opacity"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative w-[500px] h-[500px] flex items-center justify-center rounded-md" onClick={(e) => e.stopPropagation()}>
            <NextImage
              src={previewImage}
              alt="Image Preview"
              fill
              className="object-contain rounded-md"
              sizes="90vw"
              onLoad={(e) => setImageSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
            />
            {(() => {
              if (!imageSize.width || !imageSize.height) {
                return null;
              }

              const scale = Math.min(500 / imageSize.width, 500 / imageSize.height);
              const renderedWidth = imageSize.width * scale;
              const renderedHeight = imageSize.height * scale;

              const imageArea = renderedWidth * renderedHeight;
              const containerArea = 500 * 500;
              const imageToContainerRatio = imageArea / containerArea;

              let buttonSizeClass = 'h-8 w-8';
              let iconSizeClass = 'h-6 w-6';
              if (imageToContainerRatio < 0.3) {
                buttonSizeClass = 'h-6 w-6';
                iconSizeClass = 'h-4 w-4';
              } else if (imageToContainerRatio > 0.7) {
                buttonSizeClass = 'h-10 w-10';
                iconSizeClass = 'h-8 w-8';
              }
              
              const topOffset = (500 - renderedHeight) / 2;
              const rightOffset = (500 - renderedWidth) / 2;

              return (
                <Button
                  variant="ghost"
                  className={`absolute p-0 cursor-pointer rounded-full bg-gray-800 hover:bg-gray-700 border ${buttonSizeClass}`}
                  style={{ top: topOffset - 16, right: rightOffset - 16 }}
                  onClick={() => setPreviewImage(null)}
                >
                  <XCircle className={`${iconSizeClass} text-white`} />
                </Button>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
