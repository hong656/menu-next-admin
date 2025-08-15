"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, UtensilsCrossed, Soup, CheckCircle2, Trash2 } from 'lucide-react';
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
const DashboardHeader = ({ currentTime }: { currentTime: Date }) => (
    <header className="flex items-center justify-between p-4 border-b bg-teal-600">
        <div className="flex items-center space-x-3">
            <UtensilsCrossed className="!h-6 !w-6 text-white" />
            <h1 className="text-xl font-bold text-white">Order Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4 rounded-lg px-4 py-2">
             <span className="font-medium text-white">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="w-px h-5 bg-gray-300"></span>
            <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-white" />
                <span className="font-semibold text-white">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
            </div>
        </div>
    </header>
);

// Component for the stat cards (Pending, Total, Completed)
const StatCard = ({ title, value }: { title: string, value: number | string }) => (
    <Card className="bg-gray-500/35 border-gray-200 shadow-sm">
        <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
        </CardHeader>
    </Card>
);

// Component for a single order item in the list on the left
const OrderListItem = ({ order, isSelected, onSelect }: { order: Order; isSelected: boolean; onSelect: (id: string) => void; }) => {
    const statusIcons: Record<OrderStatus, React.ReactNode> = {
        new: <Badge className="absolute top-2 right-2 bg-red-500 text-white">NEW</Badge>,
        pending: <Soup className="h-5 w-5 text-gray-400" />,
        completed: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        rejected: <Trash2 className="h-5 w-5 text-red-500" />,
    };

    return (
        <div
            onClick={() => onSelect(order.id)}
            className={cn(
                "p-4 rounded-lg border-l-4 cursor-pointer transition-all duration-200 relative",
                isSelected
                    ? "bg-teal-600 text-white shadow-lg border-teal-700"
                    : "bg-white hover:bg-gray-50 border-transparent",
                order.status === 'completed' && !isSelected && "bg-green-50",
                order.status === 'rejected' && !isSelected && "bg-red-50",
            )}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className={cn(
                        "font-bold text-lg",
                        isSelected ? "text-white" : "text-gray-900"
                    )}>
                        Order #{order.id}
                    </h3>
                    <p className={cn("text-sm", isSelected ? "text-teal-100" : "text-gray-600")}>
                        {order.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                    <p className={cn("text-sm font-medium", isSelected ? "text-white" : "text-gray-700")}>
                        Table: {order.table}
                    </p>
                </div>
                <div className={cn("absolute top-4 right-4", isSelected && "text-white")}>
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
            <Card className="h-full flex items-center justify-center col-span-2 bg-gray-100/50">
                <div className="text-center">
                    <p className="text-lg font-medium text-gray-500">Select an order to see details</p>
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
                        <p className="text-sm text-gray-500">
                            {order.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                     <div className="text-right">
                        <p className="text-lg font-semibold">Table: {order.table}</p>
                    </div>
                </div>
                 <div className="mt-2 text-sm">
                    <span className="font-semibold text-gray-700">Remark: </span>
                    <span className="text-gray-600">{order.remark || 'N/A'}</span>
                </div>
            </CardHeader>
            <CardContent className="p-6 flex-grow overflow-y-auto">
                <div className="space-y-4">
                    {order.items.map(item => (
                        <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 bg-gray-200 rounded-md flex-shrink-0">
                                {/* Image would go here: <img src={item.image} /> */}
                            </div>
                            <div className="flex-grow">
                                <p className="font-bold text-gray-800">{item.name}</p>
                                <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                            <div className="font-semibold text-gray-700">
                                x{item.quantity}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            { order.status !== 'completed' && order.status !== 'rejected' && (
                <div className="p-4 border-t bg-gray-50">
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            size="lg"
                            className="cursor-pointer bg-teal-600 text-white font-bold py-6 text-lg"
                            onClick={handleAcceptOrder}
                        >
                            ACCEPT ORDER
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="bg-gray-200 hover:bg-gray-300 border-gray-300 text-red-600 font-bold py-6 text-lg"
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
    
    // API STATE: Replace these with API calls in a real application.
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [stats, setStats] = useState<OrderStats>(initialStats);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>('1431');

    // Effect to update the clock every second
    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
        setOrders(currentOrders => 
            currentOrders.map(o => o.id === orderId ? {...o, status} : o)
        );
        // If the updated order was the selected one, unselect it to show the default message
        // Or you might want to keep it selected, depending on desired UX
        // setSelectedOrderId(null); 
    };

    const selectedOrder = orders.find(order => order.id === selectedOrderId) || null;
    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <DashboardHeader currentTime={currentTime} />
            <main className="flex-grow p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                    {/* Left Column */}
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

                    {/* Right Column */}
                    <div className="lg:col-span-2">
                       <OrderDetail order={selectedOrder} onUpdateStatus={handleUpdateOrderStatus} />
                    </div>
                </div>
            </main>
        </div>
    );
}