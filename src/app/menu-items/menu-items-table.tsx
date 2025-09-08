'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import NextImage from 'next/image';
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
  BadgePlus,
  CheckCircle,
  XCircle,
  Trash2,
  Image as ImageIcon,
  Eye,
  Filter,
  Pencil,
  Trash,
} from 'lucide-react';
import { toast } from "sonner";
import { Can } from '@/components/auth/can';

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { MenuItemDialog } from '@/components/ui/menu-item-dialog';
import {useTranslations} from 'next-intl';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';

type MenuTypeTranslation = {
  languageCode: string;
  name: string;
};

type MenuItemTranslation = {
  languageCode: string;
  name: string;
  description: string;
};

export type MenuItem = {
  id: number;
  menuType: MenuType;
  priceCents: number;
  imageUrl?: string | null;
  status: number;
  translations: MenuItemTranslation[];
};

export type MenuType = {
  id: number;
  status: number;
  translations: MenuTypeTranslation[];
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
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  2: { // Inactive
    text: 'INACTIVE',
    classes: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-400',
    icon: <XCircle className="h-3.5 w-3.5" />,
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
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const t = useTranslations('Button');
  const thead = useTranslations('Sidebar');
  const [pagedMenuItems, setPagedMenuItems] = useState<MenuItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuTypes, setMenuTypes] = useState<MenuType[]>([]);
  const [state, setState] = useState<FetchState>('idle');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [status, setStatus] = useState<typeof STATUS_OPTIONS[number]['value']>('all');
  const [type, setType] = useState('all');
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [tempStatus, setTempStatus] = useState(status);
  const [tempType, setTempType] = useState(type);
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [itemForDetail, setItemForDetail] = useState<MenuItem | null>(null);

  const handleClosePreview = useCallback(() => {
    setIsPreviewVisible(false);
    const timer = setTimeout(() => {
      setPreviewImage(null);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (previewImage) {
      setImageSize({ width: 0, height: 0 });
      // For fade-in effect
      const timer = setTimeout(() => setIsPreviewVisible(true), 10);
      return () => clearTimeout(timer);
    }
  }, [previewImage]);

  const [confirmationState, setConfirmationState] = useState<{
    itemId: number;
    action: MenuItemStatusAction;
  } | null>(null);

    const fetchMenuItems = useCallback(async () => {
    setState('loading');
    const params = new URLSearchParams();

    params.append('page', (page - 1).toString()); 
    params.append('size', rowsPerPage.toString());

    if (debouncedQuery) {
        params.append('search', debouncedQuery);
    }
    if (status !== 'all') {
        const numericStatus = status === 'active' ? 1 : 2;
        params.append('status', numericStatus.toString());
    }
    if (type !== 'all') {
        params.append('menuTypeId', type);
    }

    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/menu-items?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      setPagedMenuItems(Array.isArray(data.items) ? data.items : []);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setState('success');
    } catch (err) {
      console.error(err);
      setPagedMenuItems([]);
      setState('error');
    }
  }, [BACKEND_URL, page, rowsPerPage, debouncedQuery, status, type]);

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
  }, [status, type, rowsPerPage]);

    const fetchMenuTypes = async () => {
    try {
      const { data } = await axios.get<MenuType[]>(`${BACKEND_URL}/api/menu-types/get-all`);
      const activeTypes = data.filter((type) => type.status === 1);
      setMenuTypes(activeTypes);
    } catch (error) {
      console.error("Failed to fetch menu types:", error);
      toast.error("Failed to load menu categories");
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

  const handleCreate = async (formData: FormData) => {
    try {
      await axios.post(`${BACKEND_URL}/api/menu-items`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
      });
      await fetchMenuItems();
      setDialogOpen(false);
      toast.success("Menu Item Created");
    } catch (error) {
      console.error('Error creating menu item:', error);
      toast.error("Creation Failed");
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
      await axios.patch(`${BACKEND_URL}/api/menu-items/${itemId}`, {
        status: action.status,
      });
      await fetchMenuItems();
      toast.success("Menu Item Deleted", {
        description: "has been successfully deleted.",
      });
    } catch (error: any) {
      const errorMessage =error.response?.data?.message || `Failed to update item to ${action.label}`;
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
      
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/menu-items/${editingItem.id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
      });
      
      await fetchMenuItems();
      setEditDialogOpen(false);
      toast.success("Menu Item Updated");
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast.error("Update Failed");
    }
  };

  const handleFilterOpenChange = (open: boolean) => {
    if (open) {
      setTempStatus(status);
      setTempType(type);
    }
    setFilterOpen(open);
  };

  const formatPrice = (priceCents: number) => {
    return `${(priceCents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{thead('menu_items')}</h1>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className='flex'>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title..."
            className="mr-3 w-60"
          />
          <Popover open={filterOpen} onOpenChange={handleFilterOpenChange}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="border-gray-300 hover:bg-gray-50 focus:border-blue-500 focus:ring-blue-500/20 cursor-pointer"
              >
                <Filter className="h-4 w-4" />
                {t('filter')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status-filter" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select
                    value={tempStatus}
                    onValueChange={(value) => {
                      if (value === 'all' || value === 'active' || value === 'inactive') {
                        setTempStatus(value);
                      }
                    }}
                  >
                    <SelectTrigger 
                      id="status-filter" 
                      className="border-gray-300 w-50"
                    >
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem 
                          key={opt.value} 
                          value={opt.value}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type-filter" className="text-sm font-medium">
                    Type
                  </Label>
                  <Select
                    value={tempType}
                    onValueChange={(value) => setTempType(value)}
                  >
                    <SelectTrigger id="type-filter" className="border-gray-300 w-50">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {menuTypes.map((opt) => {
                        const englishName = opt.translations.find(t => t.languageCode === 'en')?.name || `Type #${opt.id}`;
                        return (
                          <SelectItem key={opt.id} value={String(opt.id)}>
                            {englishName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setFilterOpen(false)} className='border cursor-pointer h-8'>{t('cancel')}</Button>
                <Button onClick={() => {
                  setStatus(tempStatus);
                  setType(tempType);
                  setFilterOpen(false);
                }}
                className='border cursor-pointer h-8'>{t('apply')}</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Can requiredPermissions={['menu:create']}>
          <Button onClick={() => setDialogOpen(true)}>
            <BadgePlus /> {t('new')}
          </Button>
        </Can>
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
              <TableHead className="text-base">Type</TableHead>
              <TableHead className="text-base">Status</TableHead>
              <TableHead className="text-base">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state === 'loading' && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center">
                  Loading menu items...
                </TableCell>
              </TableRow>
            )}
            {state === 'error' && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center">
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
                const englishTranslation = item.translations.find(t => t.languageCode === 'en') || { name: 'N/A', description: '' };
                const menuTypeName = item.menuType.translations.find(t => t.languageCode === 'en')?.name || 'N/A';
              return (
                <TableRow key={item.id}>
                  <TableCell className='font-bold text-md'>{(page - 1) * rowsPerPage + idx + 1}</TableCell>
                  <TableCell>
                    <div className="relative group w-[60px] h-[60px]">
                      {isUrlValid(absoluteImageUrl) ? (
                        <>
                          <NextImage
                            src={absoluteImageUrl}
                            alt="image"
                            fill
                            className="rounded-md object-cover z-10"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={currentPage === 1 && idx === 0}
                          />
                          <div
                            className="absolute inset-0 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md z-20"
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
                    <span className="text-md font-medium">{englishTranslation.name}</span>
                  </TableCell>
                  <TableCell className="w-80 truncate">
                    {englishTranslation.description.length > 40
                      ? englishTranslation.description.slice(0, 40) + '...'
                      : englishTranslation.description}
                  </TableCell>
                  <TableCell className="font-medium">{formatPrice(item.priceCents)}</TableCell>
                  <TableCell>
                    <Badge>{menuTypeName}</Badge>
                  </TableCell>
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
                        <Can requiredPermissions={['menu:read']}>
                          <DropdownMenuItem onSelect={() => { setItemForDetail(item); setDetailDialogOpen(true); }}>
                            <Eye className="mr-2 h-4 w-4" /> View Detail
                          </DropdownMenuItem>    
                        </Can>
                        <Can requiredPermissions={['menu:update']}>
                          <DropdownMenuItem className='text-blue-500 focus:text-blue-500 focus:bg-blue-500/10' onClick={() => handleEdit(item)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        </Can>
                        <Can requiredPermissions={['menu:delete']}>
                          {statusActions.map((action) => (
                            <DropdownMenuItem
                                key={action.status}
                                className={action.color}
                                onClick={() => setConfirmationState({ itemId: item.id, action })}
                                disabled={isLoading || item.status === action.status}
                            >
                              <Trash className="mr-2 h-4 w-4" />  {action.label}
                            </DropdownMenuItem>
                          ))}
                        </Can>
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
              <SelectTrigger className="!h-7 w-[70px]">
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
            <div className="ml-2 inline-flex rounded-md space-x-2">
                <Button variant="outline" size="icon" className='h-7' onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" className='h-7' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" className='h-7' onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}><ChevronRight className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" className='h-7' onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0}><ChevronsRight className='w-4 h-4' /></Button>
            </div>
          </div>
        </div>
      </div>

      <MenuItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        menuTypes={menuTypes}
      />

      <MenuItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleUpdate}
        menuTypes={menuTypes}
        initialData={editingItem}
      />

      <ConfirmationDialog
          isOpen={!!confirmationState}
          onClose={() => setConfirmationState(null)}
          onConfirm={handleConfirmAction}
          title={`Confirm Action: ${confirmationState?.action.label || ''}`}
          description={confirmationState?.action.confirmMessage || ''}
        />

      <AlertDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Item Details</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            {itemForDetail?.translations.map((translation) => (
              <div key={translation.languageCode} className="space-y-2">
                <h4 className="font-medium leading-none">
                  {translation.languageCode.toUpperCase()}
                </h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Name:</strong> {translation.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Description:</strong> {translation.description}
                </p>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {previewImage && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 transition-opacity duration-300",
            isPreviewVisible ? "opacity-100" : "opacity-0"
          )}
          onClick={handleClosePreview}
        >
          <div
            className={cn(
              "relative w-[500px] h-[500px] flex items-center justify-center rounded-md transition-all duration-300",
              isPreviewVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            )}
            onClick={(e) => e.stopPropagation()}
          >
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
                  onClick={handleClosePreview}
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