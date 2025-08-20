"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, UtensilsCrossed, Soup, CheckCircle2, Trash2, Maximize, Minimize, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import axios from 'axios';

// --- 1. TYPESCRIPT INTERFACES ---

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


// --- 2. DATA TRANSFORMATION & MAPPING ---

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
    items: apiOrder.orderItems.map(apiItem => ({
        id: apiItem.id.toString(),
        name: apiItem.menuItem.name,
        description: apiItem.menuItem.description,
        quantity: apiItem.quantity,
        image: apiItem.menuItem.imageUrl,
    })),
});

// Transforms the LIST response from the API
const transformApiListData = (apiData: ApiListResponse): { orders: Order[], stats: OrderStats } => {
    const orders: Order[] = apiData.orders.map(transformSingleApiOrder);

    const stats: OrderStats = {
        new: apiData.summary.receivedCount,
        pending: apiData.summary.preparingCount,
        completed: apiData.summary.completedCount,
        total: apiData.orders.length,
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
    <header className="flex items-center justify-between p-4 border-b bg-teal-600">
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
                className="h-9 w-9 hover:bg-teal-700"
            >
                {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                <span className="sr-only">Toggle Fullscreen</span>
            </Button>
        </div>
    </header>
);

const StatCard = ({ title, value }: { title: string, value: number | string }) => (
    <Card className="border-gray-200 shadow-sm">
        <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <p className="text-3xl font-bold">{value}</p>
        </CardHeader>
    </Card>
);

const OrderListItem = ({ order, isSelected, onSelect }: { order: Order; isSelected: boolean; onSelect: (id: string) => void; }) => {
    const statusConfig: Record<OrderStatus, { icon: React.ReactNode; border: string; bg: string; text: string; }> = {
        new: { icon: <Badge className="absolute top-2 right-2 bg-blue-500">NEW</Badge>, border: "border-blue-500", bg: "hover:bg-blue-50", text: "text-blue-800" },
        pending: { icon: <Soup className="h-5 w-5 text-orange-500" />, border: "border-orange-500", bg: "hover:bg-orange-50", text: "text-orange-800" },
        completed: { icon: <CheckCircle2 className="h-5 w-5 text-green-500" />, border: "border-green-500", bg: "hover:bg-green-50", text: "text-green-800" },
        rejected: { icon: <Trash2 className="h-5 w-5 text-red-500" />, border: "border-red-500", bg: "hover:bg-red-50", text: "text-red-800" },
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
                <div className={cn("absolute top-4 right-4", isSelected && "")}>
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
                <div className="mt-2 text-sm">
                    <span className="font-semibold">Remark: </span>
                    <span>{order.remark || 'N/A'}</span>
                </div>
            </CardHeader>
            <CardContent className="p-6 flex-grow overflow-y-auto">
                <div className="space-y-4">
                    {order.items.map(item => (
                        <div key={item.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                            <div className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center">
                                <UtensilsCrossed className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="flex-grow">
                                <p className="font-bold">{item.name}</p>
                                <p className="text-sm">{item.description}</p>
                            </div>
                            <div className="font-semibold text-lg">
                                x{item.quantity}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            {(order.status === 'new' || order.status === 'pending') && (
                <div className="p-4 border-t">
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            size="lg"
                            className="cursor-pointer bg-teal-600 hover:bg-teal-700 font-bold py-6 text-lg"
                            onClick={handleAcceptOrder}
                            disabled={order.status === 'pending'}
                        >
                            {order.status === 'pending' ? 'ACCEPTED' : 'ACCEPT ORDER'}
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold py-6 text-lg"
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
    const [orders, setOrders] = useState<Order[]>([]); // For the list on the left
    const [detailedOrder, setDetailedOrder] = useState<Order | null>(null); // For the detail view on the right
    const [stats, setStats] = useState<OrderStats>({ new: 0, pending: 0, total: 0, completed: 0 });
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    
    const [listFetchState, setListFetchState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [detailFetchState, setDetailFetchState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const dashboardRef = useRef<HTMLDivElement>(null);

    // --- Data Fetching ---
    const fetchOrders = useCallback(async () => {
        setListFetchState('loading');
        try {
            const { data } = await axios.get<ApiListResponse>('http://localhost:8080/api/orders', {
                headers: { Accept: 'application/json' },
            });
            const { orders: transformedOrders, stats: transformedStats } = transformApiListData(data);
            setOrders(transformedOrders);
            setStats(transformedStats);
            
            if (selectedOrderId === null) {
                const firstActionableOrder = transformedOrders.find(o => o.status === 'new' || o.status === 'pending');
                if (firstActionableOrder) {
                    setSelectedOrderId(firstActionableOrder.id);
                }
            }
            setListFetchState('success');
        } catch (err) {
            console.error('Failed to fetch order list:', err);
            setListFetchState('error');
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

    // --- API ACTION: Update Order Status ---
    const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
        try {
            // EXAMPLE: await axios.put(`http://localhost:8080/api/orders/${orderId}/status`, { status });
            alert(`Order #${orderId} has been updated to ${status}.`);
            
            await Promise.all([
                fetchOrders(),
                fetchOrderDetails(orderId)
            ]);

        } catch (error) {
            console.error(`Failed to update order ${orderId}:`, error);
            alert(`Error: Could not update order #${orderId}.`);
        }
    };
    
    // --- Effects ---
    useEffect(() => {
        fetchOrders(); // Initial fetch
        const intervalId = setInterval(fetchOrders, 10000); // Poll every 10 seconds
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
            dashboardRef.current?.requestFullscreen().catch(err => {
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
        <div ref={dashboardRef} className="flex flex-col h-screen overflow-hidden">
            <DashboardHeader 
                currentTime={currentTime} 
                isFullScreen={isFullScreen}
                onToggleFullScreen={handleToggleFullScreen}
            />
            
            <main className="flex-grow p-6 flex flex-col min-h-0">
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
                        {/* Left Column: Order List & Stats */}
                        <div className="flex flex-col gap-6 min-h-0">
                            <div className="grid grid-cols-3 gap-4">
                                <StatCard title="New Orders" value={stats.new} />
                                <StatCard title="Pending" value={stats.pending} />
                                <StatCard title="Completed Today" value={stats.completed} />
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

                        {/* Right Column: Order Details */}
                        <div className="lg:col-span-2 min-h-0">
                           <OrderDetail 
                                order={detailedOrder} 
                                fetchState={detailFetchState}
                                onUpdateStatus={handleUpdateOrderStatus} 
                           />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}