import ProtectedRoute from '@/components/auth/protected-route';
import SystemUsersTable from './system-users-table';

export default function SystemUsersPage() {
  return (
    <ProtectedRoute requiredPermissions={['user:read']}>
      <div className="space-y-6">
        <SystemUsersTable />
      </div>
    </ProtectedRoute>
  );
}
