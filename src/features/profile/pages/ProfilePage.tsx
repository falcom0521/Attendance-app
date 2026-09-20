import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { DetailRow } from '@/components/common/DetailRow';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/feedback/ToastContext';
import { useAuthStore } from '@/store/authStore';
import { useUser, useUpdateUser } from '@/features/users/hooks/useUsers';
import { authService } from '@/features/auth/services/auth.service';
import { formatDate, formatDateTime } from '@/utils/date';
import { ROLE_LABELS } from '@/config/permissions';
import { personName, phoneField, newPasswordField } from '@/lib/validation';


const profileSchema = z.object({
  firstName: personName('First name'),
  lastName: personName('Last name'),
  phone: phoneField,
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: newPasswordField,
    confirmPassword: z.string().min(1, 'Confirm the new password'),
  })
  .superRefine((v, ctx) => {
    if (v.confirmPassword && v.newPassword !== v.confirmPassword) {
      ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match' });
    }
    if (v.currentPassword && v.newPassword === v.currentPassword) {
      ctx.addIssue({ code: 'custom', path: ['newPassword'], message: 'New password must be different from the current one' });
    }
  });
type PasswordForm = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const toast = useToast();
  const { user, updateUser } = useAuthStore();
  const { data: profile } = useUser(user?.id ?? '');
  const updateProfile = useUpdateUser();

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: '' },
  });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema), mode: 'onTouched' });

  // Phone lives on the user record, so fill the form once it loads (without clobbering edits).
  useEffect(() => {
    if (profile && !profileForm.formState.isDirty) {
      profileForm.reset({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone });
    }
  }, [profile, profileForm]);

  if (!user) return null;
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const fullName = `${user.firstName} ${user.lastName}`;

  async function onSaveProfile(data: ProfileForm) {
    try {
      await updateProfile.mutateAsync({ id: user!.id, payload: data });
      updateUser({ firstName: data.firstName, lastName: data.lastName });
      profileForm.reset(data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Could not update profile', err instanceof Error ? err.message : undefined);
    }
  }

  async function onChangePassword(data: PasswordForm) {
    try {
      await authService.changePassword(user!.id, data.currentPassword, data.newPassword);
      toast.success('Password changed', 'Use the new password next time you sign in');
      passwordForm.reset();
    } catch (err) {
      toast.error('Could not change password', err instanceof Error ? err.message : undefined);
    }
  }

  const { errors: pErrors, isDirty } = profileForm.formState;
  const { errors: wErrors, isSubmitting: changingPassword } = passwordForm.formState;

  return (
    <div className="page-container">
      <PageHeader title="My Profile" subtitle="Edit your details and change your password" breadcrumbs={[{ label: roleLabel }, { label: 'My Profile' }]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Edit Profile" subtitle="Your name and phone number" />
          <CardBody className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={fullName} size="xl" />
              <div className="min-w-0">
                <p className="text-lg font-semibold text-surface-900 truncate">{fullName}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="brand" size="sm">{roleLabel}</Badge>
                  <StatusBadge status={user.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>
              </div>
            </div>

            <form noValidate onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First Name" required error={pErrors.firstName?.message} {...profileForm.register('firstName')} />
                <Input label="Last Name" required error={pErrors.lastName?.message} {...profileForm.register('lastName')} />
              </div>
              <Input label="Phone" required error={pErrors.phone?.message} {...profileForm.register('phone')} />
              <div className="flex items-center gap-3">
                <Button type="submit" loading={updateProfile.isPending} disabled={!isDirty}>Save Changes</Button>
                {isDirty && (
                  <Button type="button" variant="ghost" onClick={() => profileForm.reset()}>Discard</Button>
                )}
              </div>
            </form>

            <div className="pt-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 mb-1">Account</p>
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="Username" value={profile ? <span className="font-mono text-xs">{profile.username}</span> : undefined} />
              <DetailRow label="Company" value={user.companyName} />
              <DetailRow label="Sub company" value={user.subCompanyName} />
              <DetailRow label="Last login" value={profile?.lastLogin ? formatDateTime(profile.lastLogin) : undefined} />
              <DetailRow label="Member since" value={profile ? formatDate(profile.createdAt) : undefined} />
              <p className="text-xs text-surface-400 mt-2">Email, username, role and company are managed by your administrator.</p>
            </div>
          </CardBody>
        </Card>

        <Card className="self-start">
          <CardHeader title="Change Password" subtitle="Choose a strong password you don't use elsewhere" />
          <CardBody>
            <form noValidate onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4 max-w-sm">
              <Input label="Current Password" type="password" autoComplete="current-password" required error={wErrors.currentPassword?.message} {...passwordForm.register('currentPassword')} />
              <Input label="New Password" type="password" autoComplete="new-password" required error={wErrors.newPassword?.message} hint="8+ characters with a letter and a number" {...passwordForm.register('newPassword')} />
              <Input label="Confirm New Password" type="password" autoComplete="new-password" required error={wErrors.confirmPassword?.message} {...passwordForm.register('confirmPassword')} />
              <Button type="submit" loading={changingPassword}>Update Password</Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
