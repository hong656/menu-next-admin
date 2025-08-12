import ProtectedRoute from '@/components/auth/protected-route';

export default function MenuItems() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Menu Items</h1>
          <p className="text-muted-foreground mt-2">Manage your restaurant&apos;s menu items</p>
        </div>
        
        <div className="bg-card text-card-foreground p-6 rounded-lg shadow-sm border border-border">
          <p className="text-muted-foreground">Menu items management interface will go here.</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
