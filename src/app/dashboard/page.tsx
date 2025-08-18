"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, UtensilsCrossed, Soup, CheckCircle2, Trash2, Maximize, Minimize } from 'lucide-react';
import { cn } from "@/lib/utils"; // shadcn's utility for conditional classes

// --- 1. TYPESCRIPT INTERFACES ---
// Defines the shape of our data for type safety and clarity.

type OrderStatus = 'new' | 'pending' | 'completed' | 'rejected';

interface OrderItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  image?: string; // Optional image URL
}

interface Order {
  id: string; // e.g., '1431'
  timestamp: Date;
  table: string;
  status: OrderStatus;
  remark?: string;
  items: OrderItem[];
}

interface OrderStats {
    pending: number;
    total: number;
    completed: number;
}

// --- 2. MOCK DATA ---
// This data simulates what you would fetch from your backend API.

const initialOrders: Order[] = [
  {
    id: "1434",
    timestamp: new Date(),
    table: "42",
    status: "new",
    items: [
      { id: 'item-1', name: 'Margherita Pizza', description: 'Classic cheese and tomato', quantity: 1 },
      { id: 'item-2', name: 'Coke', description: '330ml can', quantity: 2 },
    ],
    remark: "Extra napkins please."
  },
    {
    id: "1438",
    timestamp: new Date(),
    table: "42",
    status: "new",
    items: [
      { id: 'item-1', name: 'Margherita Pizza', description: 'Classic cheese and tomato', quantity: 1 },
      { id: 'item-2', name: 'Coke', description: '330ml can', quantity: 2 },
    ],
    remark: "Extra napkins please."
  },
  {
    id: "1431",
    timestamp: new Date(),
    table: "Order Online",
    status: "pending",
    items: [
      { id: 'sushi-1', name: 'Sushi', description: 'Japanese delicacy', quantity: 1 },
      { id: 'sushi-2', name: 'Sushi', description: 'Japanese delicacy', quantity: 1 },
      { id: 'sushi-3', name: 'Sushi', description: 'Japanese delicacy', quantity: 1 },
      { id: 'sushi-4', name: 'Sushi', description: 'Japanese delicacy', quantity: 1 },
    ],
    remark: "N/A"
  },
  {
    id: "1430",
    timestamp: new Date(),
    table: "3",
    status: "pending",
    items: [{ id: 'burger-1', name: 'Cheeseburger', description: 'Beef patty with cheese', quantity: 1 }],
  },
  {
    id: "1429",
    timestamp: new Date(),
    table: "12",
    status: "rejected",
    items: [{ id: 'taco-1', name: 'Fish Tacos', description: 'Crispy fish with slaw', quantity: 2 }],
  },
  {
    id: "1428",
    timestamp: new Date(),
    table: "6",
    status: "completed",
    items: [{ id: 'salad-1', name: 'Caesar Salad', description: 'With grilled chicken', quantity: 1 }],
  },
   {
    id: "1427",
    timestamp: new Date(),
    table: "8",
    status: "completed",
    items: [{ id: 'pasta-1', name: 'Carbonara', description: 'Creamy pasta with bacon', quantity: 1 }],
  },
];

const initialStats: OrderStats = {
    pending: 15,
    total: 27,
    completed: 12,
};


// --- 3. HELPER COMPONENTS ---

// Component for the Header section
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
            <UtensilsCrossed className="!h-6 !w-6" />
            <h1 className="text-xl font-bold">Order Dashboard</h1>
        </div>
        <div className="flex items-center space-x-2 rounded-lg px-4 py-2">
             <span className="font-medium">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="w-px h-5"></span>
            <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
            </div>
            {/* Fullscreen Toggle Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onToggleFullScreen}
                className="h-9 w-9 hover:bg-teal-700"
            >
                {isFullScreen ? (
                    <Minimize className="h-5 w-5" />
                ) : (
                    <Maximize className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle Fullscreen</span>
            </Button>
        </div>
    </header>
);

// Component for the stat cards (Pending, Total, Completed)
const StatCard = ({ title, value }: { title: string, value: number | string }) => (
    <Card className="border-gray-200 shadow-sm">
        <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <p className="text-3xl font-bold">{value}</p>
        </CardHeader>
    </Card>
);

// Component for a single order item in the list on the left
const OrderListItem = ({ order, isSelected, onSelect }: { order: Order; isSelected: boolean; onSelect: (id: string) => void; }) => {
    const statusIcons: Record<OrderStatus, React.ReactNode> = {
        new: <Badge className="absolute top-2 right-2">NEW</Badge>,
        pending: <Soup className="h-5 w-5" />,
        completed: <CheckCircle2 className="h-5 w-5" />,
        rejected: <Trash2 className="h-5 w-5" />,
    };

    return (
        <div
            onClick={() => onSelect(order.id)}
            className={cn(
                "p-4 border rounded-lg border-l-4 cursor-pointer transition-all duration-200 relative",
                isSelected
                    ? "bg-teal-600 shadow-lg border-teal-700"
                    : "border-transparent border-gray-200",
            )}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className={cn(
                        "font-bold text-lg",
                    )}>
                        Order #{order.id}
                    </h3>
                    <p className={cn("text-sm", isSelected ? "" : "")}>
                        {order.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                    <p className={cn("text-sm font-medium", isSelected ? "" : "")}>
                        Table: {order.table}
                    </p>
                </div>
                <div className={cn("absolute top-4 right-4", isSelected && "")}>
                    {statusIcons[isSelected ? 'pending' : order.status]}
                </div>
            </div>
        </div>
    );
};

// Component for the detailed view of the selected order on the right
const OrderDetail = ({ order, onUpdateStatus }: { order: Order | null; onUpdateStatus: (id: string, status: OrderStatus) => void; }) => {
    if (!order) {
        return (
            <Card className="h-full flex items-center justify-center col-span-2">
                <div className="text-center">
                    <p className="text-lg font-medium">Select an order to see details</p>
                </div>
            </Card>
        );
    }
    
    // API HANDLER: This is where you would call your API to accept an order.
    const handleAcceptOrder = () => {
        console.log("Accepting order:", order.id);
        alert(`Order #${order.id} accepted!`);
        onUpdateStatus(order.id, 'pending');
    };
    
    // API HANDLER: This is where you would call your API to reject an order.
    const handleRejectOrder = () => {
        console.log("Rejecting order:", order.id);
        alert(`Order #${order.id} rejected!`);
        onUpdateStatus(order.id, 'rejected');
    };

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
                        <div key={item.id} className="flex items-center space-x-4 p-3 rounded-lg">
                            <div className="w-12 h-12 rounded-md flex-shrink-0">
                                {/* Image would go here: <img src={item.image} /> */}
                            </div>
                            <div className="flex-grow">
                                <p className="font-bold">{item.name}</p>
                                <p className="text-sm">{item.description}</p>
                            </div>
                            <div className="font-semibold">
                                x{item.quantity}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            { order.status !== 'completed' && order.status !== 'rejected' && (
                <div className="p-4 border-t">
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            size="lg"
                            className="cursor-pointer bg-teal-600 font-bold py-6 text-lg"
                            onClick={handleAcceptOrder}
                        >
                            ACCEPT ORDER
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-gray-300 font-bold py-6 text-lg"
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
    const [currentTime, setCurrentTime] = useState(new Date());
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [stats, setStats] = useState<OrderStats>(initialStats);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>('1431');
    const [isFullScreen, setIsFullScreen] = useState(false);

    // --- NEW: Create a ref for the main dashboard element ---
    const dashboardRef = useRef<HTMLDivElement>(null);

    // Effect to update the clock every second
    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    // --- UPDATED: Handler to toggle native fullscreen ---
    const handleToggleFullScreen = () => {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            dashboardRef.current?.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };
    
    // --- NEW: Effect to sync state with browser fullscreen changes (e.g., pressing ESC) ---
    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, []);


    const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
        setOrders(currentOrders => 
            currentOrders.map(o => o.id === orderId ? {...o, status} : o)
        );
    };

    const selectedOrder = orders.find(order => order.id === selectedOrderId) || null;
    
    return (
        // --- UPDATED: Attach the ref to the main container ---
        <div ref={dashboardRef} className="flex flex-col h-screen overflow-scroll hide-scrollbar">
            <DashboardHeader 
                currentTime={currentTime} 
                isFullScreen={isFullScreen}
                onToggleFullScreen={handleToggleFullScreen}
            />
            {/* The :fullscreen pseudo-class in Tailwind can be used for styling, e.g., :fullscreen:bg-gray-100 */}
            <main className="flex-grow p-6 flex flex-col">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    {/* Left Column (ensure it can flex and scroll if needed) */}
                    <div className="flex flex-col gap-6">
                         {/* Stats Section */}
                        <div className="grid grid-cols-3 gap-4">
                            <StatCard title="Pending Orders" value={stats.pending} />
                            <StatCard title="Total Order" value={stats.total} />
                            <StatCard title="Completed Orders" value={stats.completed} />
                        </div>
                        {/* Orders List Section */}
                        <Card className="flex-grow flex flex-col">
                            <CardHeader>
                                <CardTitle>Orders</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow overflow-y-auto space-y-3 pr-2">
                               {orders.map(order => (
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

                    <div className="lg:col-span-2">
                       <OrderDetail order={selectedOrder} onUpdateStatus={handleUpdateOrderStatus} />
                    </div>
                </div>
            </main>
        </div>
    );
}