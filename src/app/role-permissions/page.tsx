'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  CheckCircle,
  XCircle,
  Trash2,
  Pencil,
  Filter,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
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
import {useTranslations} from 'next-intl';
import { MenuTypeDialog, MenuTypeRequestData } from '@/components/ui/menu-type-dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';

type MenuTypeTranslation = {
  languageCode: string;
  name: string;
};

export type MenuType = {
  id: number;
  status: number;
  createdAt: string;
  updatedAt: string;
  translations: MenuTypeTranslation[];
};

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
] as const;

type FetchState = 'idle' | 'loading' | 'error' | 'success';

const statusConfig = {
  1: {
    text: 'ACTIVE',
    classes: 'bg-green-500/20 text-emerald-400 ring-1 ring-emerald-400',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  2: {
    text: 'INACTIVE',
    classes: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-400',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  3: {
    text: 'DELETED',
    classes: 'bg-red-500/20 text-red-400 ring-1 ring-red-400',
    icon: <Trash2 className="h-3.5 w-3.5" />,
  },
} as const;

interface StatusAction {
  status: number;
  label: string;
  confirmMessage: string;
  color: string;
  icon: React.ReactElement;
}

const statusActions: StatusAction[] = [
  {
    status: 3,
    label: 'Delete',
    confirmMessage: 'Are you sure you want to delete this menu type? It will be hidden from use.',
    color: 'text-red-500 focus:text-red-500 focus:bg-red-500/10',
    icon: <Trash2 className="mr-2 h-4 w-4" />,
  },
];

type Status = keyof typeof statusConfig;
type TableStatusBadgeProps = { status: number | null };

const TableStatusBadge = ({ status }: TableStatusBadgeProps) => {
  const currentStatus = status && statusConfig[status as Status] ? statusConfig[status as Status] : statusConfig[2];
  return (
    <Badge className={cn('inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold', currentStatus.classes)}>
      {currentStatus.icon}
      <span>{currentStatus.text}</span>
    </Badge>
  );
};

export default function RolePermission(): React.ReactElement {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const t = useTranslations('Button');
  const thead = useTranslations('Sidebar');
  const tdialog = useTranslations('DialogHeader');
  const [pagedMenuTypes, setPagedMenuTypes] = useState<MenuType[]>([]);
  const [state, setState] = useState<FetchState>('idle');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMenuType, setEditingMenuType] = useState<MenuType | null>(null);
  const [status, setStatus] = useState<typeof STATUS_OPTIONS[number]['value']>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [tempStatus, setTempStatus] = useState(status);
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [itemForDetail, setItemForDetail] = useState<MenuType | null>(null);

  const [confirmationState, setConfirmationState] = useState<{
    menuTypeId: number;
    action: StatusAction;
  } | null>(null);

  const fetchMenuTypes = useCallback(async () => {
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

    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/menu-types?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      setPagedMenuTypes(Array.isArray(data.items) ? data.items : []);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setState('success');
    } catch (err) {
      console.error(err);
      setPagedMenuTypes([]);
      setState('error');
    }
  }, [BACKEND_URL, page, rowsPerPage, debouncedQuery, status]);
  
  useEffect(() => { fetchMenuTypes(); }, [fetchMenuTypes]);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedQuery(query); if (page !== 1) setPage(1); }, 500);
    return () => clearTimeout(handler);
  }, [query]);
  useEffect(() => { if (page !== 1) setPage(1); }, [rowsPerPage]);
  useEffect(() => { if (!editDialogOpen) { setEditingMenuType(null); } }, [editDialogOpen]);



  const handleCreate = async (data: MenuTypeRequestData) => {
    try {
      await axios.post(`${BACKEND_URL}/api/menu-types`, data);
      await fetchMenuTypes();
      toast.success("Menu Type Created");
    } catch (error) {
      console.error('Failed to create menu type:', error);
      toast.error("Creation Failed");
    }
  };

  const handleEdit = (menuType: MenuType) => {
    setEditingMenuType(menuType);
    setEditDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmationState) {
      await updateMenuTypeStatus(confirmationState.menuTypeId, confirmationState.action);
      setConfirmationState(null);
    }
  };

  const updateMenuTypeStatus = async (menuTypeId: number, action: StatusAction) => {
    setIsLoading(true);
    try {
      await axios.patch(`${BACKEND_URL}/api/menu-types/${menuTypeId}/status`, {
        status: action.status,
      });
      await fetchMenuTypes();
      toast.success("Menu Type Deleted", { description: "The menu type has been marked as deleted." });
    } catch (error: any) {
      console.error(`Error deleting menu type:`, error);
      toast.error("Delete Failed", { description: "Could not delete the menu type. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: MenuTypeRequestData) => {
    if (!editingMenuType) return;
    try {
      await axios.put(`${BACKEND_URL}/api/menu-types/${editingMenuType.id}`, data);
      await fetchMenuTypes();
      toast.success("Menu Type Updated");
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating menu type:', error);
      toast.error("Update Failed");
    }
  };

  const handleFilterOpenChange = (open: boolean) => {
    if (open) {
      setTempStatus(status);
    }
    setFilterOpen(open);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{thead('menu_types')}</h1>
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
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setFilterOpen(false)} className='border cursor-pointer h-8'>{t('cancel')}</Button>
                <Button onClick={() => {
                  setStatus(tempStatus);
                  setFilterOpen(false);
                }}
                className='border cursor-pointer h-8'>{t('apply')}</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Button variant="outline" className="cursor-pointer hover:bg-gray-700 hover:text-white border-black bg-gray-900 text-white" onClick={() => setDialogOpen(true)}>
          <BadgePlus/> {t('new')}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state === 'loading' && <TableRow><TableCell colSpan={5} className="py-10 text-center">Loading menu types...</TableCell></TableRow>}
            {state === 'error' && <TableRow><TableCell colSpan={5} className="py-10 text-center text-red-500">Failed to load menu types.</TableCell></TableRow>}
            {state === 'success' && pagedMenuTypes.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center">No results found.</TableCell></TableRow>}
            {state === 'success' && pagedMenuTypes.map((menuType, idx) => {
              const englishTranslation = menuType.translations.find(t => t.languageCode === 'en') || { name: 'N/A' };
              return (
                <TableRow key={menuType.id}>
                  <TableCell className='font-bold'>{(page - 1) * rowsPerPage + idx + 1}</TableCell>
                  <TableCell>
                    <span className="font-medium">{englishTranslation.name}</span>
                  </TableCell>
                  <TableCell><TableStatusBadge status={menuType.status} /></TableCell>
                  <TableCell>{new Date(menuType.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <Ellipsis className='h-5 w-5' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => { setItemForDetail(menuType); setDetailDialogOpen(true); }}>
                        <Eye className="mr-2 h-4 w-4" /> View Detail
                      </DropdownMenuItem>
                      <DropdownMenuItem className='text-blue-500 focus:text-blue-500 focus:bg-blue-500/10' onClick={() => handleEdit(menuType)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      {statusActions.map((action) => (
                        <DropdownMenuItem
                          key={action.status}
                          className={action.color}
                          onClick={() => setConfirmationState({ menuTypeId: menuType.id, action })}
                          disabled={isLoading}
                        >
                          {action.icon} {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmationDialog
          isOpen={!!confirmationState}
          onClose={() => setConfirmationState(null)}
          onConfirm={handleConfirmAction}
          title={`Confirm: ${confirmationState?.action.label || ''}`}
          description={confirmationState?.action.confirmMessage || ''}
        />

      <div className="flex items-center justify-between text-sm">
        <div className='font-bold text-muted-foreground'>
          {totalItems === 0
            ? '0 items found.'
            : `Showing ${((page - 1) * rowsPerPage) + 1} to ${Math.min(page * rowsPerPage, totalItems)} of ${totalItems} items.`}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className='font-bold'>Rows per page</span>
            <Select value={String(rowsPerPage)} onValueChange={(val) => setRowsPerPage(Number(val))}>
              <SelectTrigger className="w-[70px] !h-7">
                <SelectValue placeholder={rowsPerPage} />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className='font-bold'>Page {page} of {totalPages}</span>
            <div className="ml-2 inline-flex rounded-md space-x-2">
                <Button variant="outline" size="icon" className='h-7' onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" className='h-7' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" className='h-7' onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}><ChevronRight className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" className='h-7' onClick={() => setPage(totalPages)} disabled={page === totalPages || totalPages === 0}><ChevronsRight className='w-4 h-4' /></Button>
            </div>
          </div>
        </div>
      </div>

      <MenuTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
      />

      <MenuTypeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleUpdate}
        initialData={editingMenuType}
      />

      <AlertDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Menu Type Details</AlertDialogTitle>
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
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
