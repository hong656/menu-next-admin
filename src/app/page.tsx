import ProtectedRoute from '@/components/auth/protected-route';

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">You are now logged in and can access all features.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Stats</h3>
            <p className="text-gray-600">View your restaurant&apos;s performance metrics</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Menu Management</h3>
            <p className="text-gray-600">Update your restaurant&apos;s menu items</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Orders</h3>
            <p className="text-gray-600">Manage incoming orders and deliveries</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
