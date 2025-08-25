"use client";

import ProtectedRoute from "@/components/auth/protected-route";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, UtensilsCrossed, Soup, CheckCircle2, Trash2, Maximize, Minimize, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import axios from 'axios';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// --- 1. IMPORT TOAST AND TOASTER ---
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

// ... (All your interfaces and helper functions remain the same) ...
// (Order interfaces, Api interfaces, transform functions, DashboardHeader, StatCard, OrderListItem, etc.)

type OrderStatus = 'new' | 'pending' | 'completed' | 'rejected';

interface OrderItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  timestamp: Date;
  table: string;
  status: OrderStatus;
  remark?: string;
  items: OrderItem[];
}

interface OrderStats {
    pending: number;
    new: number;
    total: number;
    completed: number;
    canceled: number;
}

// API-level interfaces
interface ApiMenuItem {
    id: number;
    name: string;
    description: string;
    priceCents: number;
    imageUrl: string;
    available: boolean;
}

interface ApiOrderItem {
    id: number;
    menuItem: ApiMenuItem;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

interface ApiOrder {
    id: number;
    table: { id: number; number: number; };
    status: number;
    remark: string;
    totalCents: number;
    placedAt: string;
    updatedAt: string;
    orderItems: ApiOrderItem[];
}

interface ApiSummary {
    preparingCount: number;
    receivedCount: number;
    completedCount: number;
    canceledCount: number;
}

interface ApiListResponse {
    orders: ApiOrder[];
    summary: ApiSummary;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

const statusMapping: { [key: number]: OrderStatus } = {
    1: 'new',
    2: 'pending',
    3: 'completed',
    4: 'rejected',
};

// Transforms a SINGLE order from the API
const transformSingleApiOrder = (apiOrder: ApiOrder): Order => ({
    id: apiOrder.id.toString(),
    timestamp: new Date(apiOrder.placedAt),
    table: apiOrder.table ? apiOrder.table.number.toString() : "Online",
    status: statusMapping[apiOrder.status] || 'pending',
    remark: apiOrder.remark,
    items: apiOrder.orderItems.map(apiItem => {
        const imageUrl = apiItem.menuItem.imageUrl;
        
        const absoluteImageUrl = imageUrl && imageUrl.startsWith('/')
            ? `${BACKEND_URL}${imageUrl}`
            : imageUrl;

        return {
            id: apiItem.id.toString(),
            name: apiItem.menuItem.name,
            description: apiItem.menuItem.description,
            quantity: apiItem.quantity,
            image: absoluteImageUrl,
        };
    }),
});

// Transforms the LIST response from the API
const transformApiListData = (apiData: ApiListResponse): { orders: Order[], stats: OrderStats } => {
    const orders: Order[] = apiData.orders.map(transformSingleApiOrder);

    const stats: OrderStats = {
        new: apiData.summary.receivedCount,
        pending: apiData.summary.preparingCount,
        completed: apiData.summary.completedCount,
        total: apiData.orders.length,
        canceled: apiData.summary.canceledCount,
    };

    return { orders, stats };
};


// --- 3. HELPER COMPONENTS ---

const DashboardHeader = ({
    currentTime,
    isFullScreen,
    onToggleFullScreen
}: {
    currentTime: Date;
    isFullScreen: boolean;
    onToggleFullScreen: () => void;
}) => (
    <header className="flex items-center justify-between px-4 py-2 border-b bg-teal-600">
        <div className="flex items-center space-x-3">
            <UtensilsCrossed className="h-6 w-6" />
            <h1 className="text-xl font-bold">Order Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
                <span className="font-medium">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                <span className="block text-sm opacity-90">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </span>
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFullScreen}
                className="cursor-pointer h-9 w-9 hover:bg-teal-700"
            >
                {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                <span className="sr-only">Toggle Fullscreen</span>
            </Button>
        </div>
    </header>
);

const StatCard = ({ title, value }: { title: string, value: number | string }) => (
    <Card className="border shadow-sm h-26">
        <CardHeader className='p-0 !pt-1 text-center'>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <p className="text-xl font-bold text-teal-600">{value}</p>
        </CardHeader>
    </Card>
);

const OrderListItem = ({ order, isSelected, onSelect }: { order: Order; isSelected: boolean; onSelect: (id: string) => void; }) => {
    const statusConfig: Record<OrderStatus, { icon: React.ReactNode; border: string; bg: string; text: string; }> = {
        new: { icon: <Badge className="absolute top-2 right-2 bg-green-500">NEW</Badge>, border: "border-green-500", bg: "hover:bg-green-500/10", text: "text-green-800" },
        pending: { icon: <Soup className="h-5 w-5 text-yellow-500" />, border: "border-yellow-500", bg: "hover:bg-yellow-500/10", text: "text-yellow-800" },
        completed: { icon: <CheckCircle2 className="h-5 w-5 text-blue-500" />, border: "border-blue-500", bg: "hover:bg-blue-500/10", text: "text-blue-800" },
        rejected: { icon: <Trash2 className="h-5 w-5 text-red-500" />, border: "border-red-500", bg: "hover:bg-red-500/10", text: "text-red-800" },
    };
    
    const config = statusConfig[order.status];

    return (
        <div
            onClick={() => onSelect(order.id)}
            className={cn(
                "p-4 border rounded-lg border-l-4 cursor-pointer transition-all duration-200 relative",
                isSelected
                    ? "bg-teal-600 shadow-lg border-teal-700"
                    : `${config.border} ${config.bg} ${config.text}`,
            )}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg">Order #{order.id}</h3>
                    <p className="text-sm">
                        {order.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm font-medium">Table: {order.table}</p>
                </div>
                <div className={cn("absolute top-4 right-4", isSelected && "text-white")}>
                    {isSelected ? <Soup className="h-5 w-5" /> : config.icon}
                </div>
            </div>
        </div>
    );
};

const OrderDetail = ({ order, fetchState, onUpdateStatus }: {
    order: Order | null;
    fetchState: 'idle' | 'loading' | 'success' | 'error';
    onUpdateStatus: (id: string, status: OrderStatus) => void;
}) => {
    if (fetchState === 'loading') {
        return (
            <Card className="h-full flex items-center justify-center col-span-2">
                <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
            </Card>
        );
    }
    
    if (fetchState === 'error') {
        return (
            <Card className="h-full flex items-center justify-center col-span-2 bg-red-50 text-red-700">
                <div className="text-center">
                    <AlertCircle className="h-10 w-10 mx-auto" />
                    <p className="mt-2 font-medium">Failed to load order details.</p>
                </div>
            </Card>
        );
    }

    if (!order) {
        return (
            <Card className="h-full flex items-center justify-center col-span-2">
                <div className="text-center">
                    <p className="text-lg font-medium">Select an order to see details</p>
                </div>
            </Card>
        );
    }
    
    const handleAcceptOrder = () => onUpdateStatus(order.id, 'pending');
    const handleRejectOrder = () => onUpdateStatus(order.id, 'rejected');

    return (
        <Card className="col-span-2 flex flex-col h-full shadow-lg">
            <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Order #{order.id}</h2>
                        <p className="text-sm">
                            {order.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-semibold">Table: {order.table}</p>
                    </div>
                </div>
                {order.remark && (
                    <div className="mt-2 text-sm p-2 bg-yellow-300/40 border-l-4 border-yellow-500 rounded-r-md">
                        <span className="font-semibold">Remark: </span>
                        <span>{order.remark}</span>
                    </div>
                )}
            </CardHeader>
            <CardContent className="px-4 pt-0 flex-grow overflow-y-auto">
                <div>
                    {order.items.map(item => (
                        <div key={item.id} className="flex items-center space-x-4 p-2 rounded-lg border">
                            <div className="w-12 h-12 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-md object-cover" />
                                ) : (
                                    <UtensilsCrossed className="h-8 w-8 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-grow">
                                <p className="font-bold">{item.name}</p>
                            </div>
                            <div className="font-semibold text-lg">
                                x{item.quantity}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            {(order.status === 'new' || order.status === 'pending') && (
                <div className="p-2 border-t">
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            size="lg"
                            className="cursor-pointer bg-teal-600 hover:bg-teal-700 font-bold py-2 text-lg"
                            onClick={handleAcceptOrder}
                            disabled={order.status === 'pending'}
                        >
                            {order.status === 'pending' ? 'ACCEPTED' : 'ACCEPT ORDER'}
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold py-2 text-lg"
                            onClick={handleRejectOrder}
                        >
                            REJECT ORDER
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
};


// --- 4. MAIN DASHBOARD COMPONENT ---

export default function RestaurantDashboard() {
    // --- State Management ---
    const [currentTime, setCurrentTime] = useState(new Date());
    const [orders, setOrders] = useState<Order[]>([]);
    const [detailedOrder, setDetailedOrder] = useState<Order | null>(null);
    const [stats, setStats] = useState<OrderStats>({ new: 0, pending: 0, total: 0, completed: 0, canceled: 0 });
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    
    const [listFetchState, setListFetchState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [detailFetchState, setDetailFetchState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    // --- REMOVED dialogState ---

    const [pendingAction, setPendingAction] = useState<{
        orderId: string;
        status: OrderStatus;
    } | null>(null);

    const initiateOrderStatusUpdate = (orderId: string, status: OrderStatus) => {
        setPendingAction({ orderId, status });
    };

    const isInitialLoad = useRef(true);

    const fetchOrders = useCallback(async () => {
        if (isInitialLoad.current) {
            setListFetchState('loading');
        }

        try {
            const { data } = await axios.get<ApiListResponse>('http://localhost:8080/api/orders/all', {
                headers: { Accept: 'application/json' },
            });
            const { orders: transformedOrders, stats: transformedStats } = transformApiListData(data);
            setOrders(transformedOrders);
            setStats(transformedStats);
            
            if (isInitialLoad.current && transformedOrders.length > 0) {
                const firstActionableOrder = transformedOrders.find(o => o.status === 'new' || o.status === 'pending');
                if (firstActionableOrder) {
                    setSelectedOrderId(firstActionableOrder.id);
                }
                isInitialLoad.current = false; 
            }

            setListFetchState('success');
        } catch (err) {
            console.error('Failed to fetch order list:', err);
            if (isInitialLoad.current) {
                setListFetchState('error');
            }
        }
    }, []);

    const fetchOrderDetails = async (id: string) => {
        setDetailFetchState('loading');
        try {
            const { data } = await axios.get<ApiOrder>(`http://localhost:8080/api/orders/${id}`);
            setDetailedOrder(transformSingleApiOrder(data));
            setDetailFetchState('success');
        } catch (error) {
            console.error(`Failed to fetch details for order ${id}:`, error);
            setDetailFetchState('error');
            setDetailedOrder(null);
        }
    };

    const handleUpdateOrderStatus = async () => {
        if (!pendingAction) return;

        const { orderId, status } = pendingAction;

        const apiStatusMapping: Record<OrderStatus, number> = {
            pending: 2,
            rejected: 4,
            new: 1,
            completed: 3,
        };
        const numericStatus = apiStatusMapping[status];

        try {
            await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`, {
                status: numericStatus,
            });
            
            // --- 2. SHOW SUCCESS TOAST ---
            toast.success("Update Successful", {
                description: `Order #${orderId} has been set to '${status}'.`,
            });
            
            await Promise.all([
                fetchOrders(),
                fetchOrderDetails(orderId)
            ]);

        } catch (error) {
            console.error(`Failed to update order ${orderId}:`, error);
            
            // --- 3. SHOW ERROR TOAST ---
            toast.error("Update Failed", {
                description: `There was an error updating order #${orderId}. Please try again.`,
            });

        } finally {
            setPendingAction(null);
        }
    };
    
    // --- Effects ---
    useEffect(() => {
        fetchOrders();
        const intervalId = setInterval(fetchOrders, 10000);
        return () => clearInterval(intervalId);
    }, [fetchOrders]);
    
    useEffect(() => {
        if (selectedOrderId) {
            fetchOrderDetails(selectedOrderId);
        } else {
            setDetailedOrder(null);
            setDetailFetchState('idle');
        }
    }, [selectedOrderId]);

    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const handleToggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };
    
    useEffect(() => {
        const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const sortedOrders = [...orders].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return (
        <ProtectedRoute>
            <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
                {/* --- 4. ADD TOASTER COMPONENT HERE --- */}
                <Toaster richColors position="top-right" />
                
                <DashboardHeader 
                    currentTime={currentTime} 
                    isFullScreen={isFullScreen}
                    onToggleFullScreen={handleToggleFullScreen}
                />
                
                <main className="flex-grow px-4 pt-4 pb-0 flex flex-col min-h-0">
                    {listFetchState === 'loading' && orders.length === 0 && (
                        <div className="flex-grow flex items-center justify-center">
                            <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
                            <p className="ml-4 text-xl font-medium text-gray-600">Loading Orders...</p>
                        </div>
                    )}
                    {listFetchState === 'error' && (
                         <div className="flex-grow flex flex-col items-center justify-center bg-red-50 text-red-700 rounded-lg p-8">
                            <AlertCircle className="h-12 w-12" />
                            <p className="mt-4 text-xl font-medium">Failed to Load Orders</p>
                            <p className="text-sm">Please check the connection and try again.</p>
                            <Button onClick={() => fetchOrders()} className="mt-4">Retry</Button>
                        </div>
                    )}
                    
                    {(listFetchState === 'success' || orders.length > 0) && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
                            <div className="flex flex-col gap-6 min-h-0">
                                <div className="grid grid-cols-4 gap-2">
                                    <StatCard title="New Orders" value={stats.new}/>
                                    <StatCard title="Preparing" value={stats.pending}/>
                                    <StatCard title="Completed" value={stats.completed} />
                                    <StatCard title="Canceled" value={stats.canceled} />
                                </div>
                                <Card className="flex-grow flex flex-col min-h-0">
                                    <CardHeader>
                                        <CardTitle>All Orders</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow overflow-y-auto space-y-3 pr-2">
                                       {sortedOrders.map(order => (
                                           <OrderListItem
                                                key={order.id}
                                                order={order}
                                                isSelected={order.id === selectedOrderId}
                                                onSelect={setSelectedOrderId}
                                           />
                                       ))}
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-2 min-h-0">
                               <OrderDetail 
                                    order={detailedOrder} 
                                    fetchState={detailFetchState}
                                    onUpdateStatus={initiateOrderStatusUpdate}
                                />
                            </div>
                        </div>
                    )}
                </main>

                <AlertDialog
                    open={!!pendingAction}
                    onOpenChange={() => setPendingAction(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action will update the status of Order #{pendingAction?.orderId} to "{pendingAction?.status}".
                                This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <Button variant="outline" onClick={() => setPendingAction(null)}>
                                Cancel
                            </Button>
                            <AlertDialogAction onClick={handleUpdateOrderStatus}>
                                Proceed
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </div>
        </ProtectedRoute>
    );
}