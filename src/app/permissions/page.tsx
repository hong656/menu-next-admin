import ProtectedRoute from '@/components/auth/protected-route';
import AssignPermissionsTable from './permission-form';

export default function RolesPage() {
  return (
    <ProtectedRoute requiredPermissions={['permission:read']}>
      <div className="space-y-6">
        <AssignPermissionsTable/>
      </div>
    </ProtectedRoute>
  );
}