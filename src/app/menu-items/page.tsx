import ProtectedRoute from '@/components/auth/protected-route';

export default function MenuItems() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Items</h1>
          <p className="text-gray-600 mt-2">Manage your restaurant&apos;s menu items</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-600">Menu items management interface will go here.</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
