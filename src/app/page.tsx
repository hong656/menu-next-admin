import ProtectedRoute from '@/components/auth/protected-route';

export default function Home() {
  return (
    <ProtectedRoute requiredPermissions={[]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome to Admin Dashboard</h1>
          <p className="mt-2">You are now logged in and can access all features.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold">Quick Stats</h3>
            <p>View your restaurant&apos;s performance metrics</p>
          </div>
          
          <div className="p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold">Menu Management</h3>
            <p>Update your restaurant&apos;s menu items</p>
          </div>
          
          <div className="p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold">Orders</h3>
            <p>Manage incoming orders and deliveries</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
