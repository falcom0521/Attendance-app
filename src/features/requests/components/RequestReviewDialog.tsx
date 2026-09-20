import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Ban } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/feedback/ToastContext';
import { useAuthStore } from '@/store/authStore';
import { useActor } from '@/hooks/useActor';
import { hasPermission } from '@/utils/permissions';
import { formatDateTime } from '@/utils/date';
import type { AttendanceRequest } from '@/types/request';
import { useReviewRequest, useCancelRequest } from '../hooks/useRequests';
import { REQUEST_TYPE_LABEL, REQUEST_TYPE_VARIANT, requestDateLabel, requestSummary } from '../utils';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-2 border-b border-surface-50 last:border-0">
      <dt className="text-xs text-surface-400 pt-0.5">{label}</dt>
      <dd className="text-sm text-surface-800">{children}</dd>
    </div>
  );
}

/** Read-only detail for everyone; Admins additionally get approve / reject, and cancel is available on pending requests. */
export function RequestReviewDialog({ request, onClose }: { request: AttendanceRequest | null; onClose: () => void }) {
  const toast = useToast();
  const { user } = useAuthStore();
  const actor = useActor();
  const review = useReviewRequest();
  const cancel = useCancelRequest();
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    setComment('');
    setCommentError('');
  }, [request?.id]);

  if (!request || !user || !actor) return null;

  const pending = request.status === 'PENDING';
  const canApprove = pending && hasPermission(user.role, 'requests:approve');
  const canCancel =
    hasPermission(user.role, 'requests:create') &&
    (pending || (user.role === 'ADMIN' && request.status === 'APPROVED' && request.type === 'LEAVE'));

  async function decide(decision: 'APPROVED' | 'REJECTED') {
    if (!request || !actor) return;
    if (decision === 'REJECTED' && comment.trim().length < 3) {
      setCommentError('Add a short comment explaining the rejection');
      return;
    }
    try {
      await review.mutateAsync({ id: request.id, decision, comment, reviewer: actor });
      toast.success(decision === 'APPROVED' ? 'Request approved' : 'Request rejected', request.employeeName);
      onClose();
    } catch (err) {
      toast.error('Could not update request', err instanceof Error ? err.message : undefined);
    }
  }

  async function handleCancel() {
    if (!request || !actor) return;
    try {
      await cancel.mutateAsync({ id: request.id, actor });
      toast.success(pending ? 'Request cancelled' : 'Leave revoked', request.employeeName);
      onClose();
    } catch (err) {
      toast.error('Could not cancel request', err instanceof Error ? err.message : undefined);
    }
  }

  const busy = review.isPending || cancel.isPending;

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={`${REQUEST_TYPE_LABEL[request.type]} request`}
      description={`${request.employeeName} · ${request.employeeCode} · ${request.subCompanyName}`}
      footer={
        <>
          {canCancel && (
            <Button variant="outline" className="whitespace-nowrap" leftIcon={<Ban className="h-4 w-4" />} onClick={handleCancel} loading={cancel.isPending} disabled={busy}>
              {pending ? 'Cancel request' : 'Revoke leave'}
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={busy}>Close</Button>
          {canApprove && (
            <>
              <Button variant="danger" leftIcon={<XCircle className="h-4 w-4" />} onClick={() => decide('REJECTED')} loading={review.isPending && review.variables?.decision === 'REJECTED'} disabled={busy}>
                Reject
              </Button>
              <Button leftIcon={<CheckCircle2 className="h-4 w-4" />} onClick={() => decide('APPROVED')} loading={review.isPending && review.variables?.decision === 'APPROVED'} disabled={busy}>
                Approve
              </Button>
            </>
          )}
        </>
      }
    >
      <dl>
        <Row label="Status"><StatusBadge status={request.status} /></Row>
        <Row label="Type"><Badge variant={REQUEST_TYPE_VARIANT[request.type]} size="sm">{REQUEST_TYPE_LABEL[request.type]}</Badge></Row>
        <Row label={request.type === 'LEAVE' ? 'Dates' : 'Date'}>{requestDateLabel(request)}</Row>
        <Row label={request.type === 'LEAVE' ? 'Leave' : 'Punches'}>{requestSummary(request)}</Row>
        <Row label="Reason">{request.reason}</Row>
        <Row label="Requested by">{request.requestedBy} ({request.requestedByRole === 'HR' ? 'HR' : 'Admin'}) · {formatDateTime(request.requestedAt)}</Row>
        {request.reviewedBy && (
          <Row label="Reviewed by">
            {request.reviewedBy}{request.reviewedAt && ` · ${formatDateTime(request.reviewedAt)}`}
          </Row>
        )}
        {request.reviewComment && <Row label="Comment">{request.reviewComment}</Row>}
      </dl>

      {canApprove && (
        <div className="mt-4">
          <label className="form-label" htmlFor="review-comment">Comment <span className="text-surface-400 font-normal">(required to reject)</span></label>
          <textarea
            id="review-comment"
            rows={3}
            value={comment}
            maxLength={500}
            onChange={(e) => { setComment(e.target.value); setCommentError(''); }}
            placeholder="Add a note for the requester…"
            className={`form-input resize-none text-sm ${commentError ? 'form-input-error' : ''}`}
          />
          {commentError && <p className="form-error">{commentError}</p>}
        </div>
      )}
      {pending && !canApprove && (
        <p className="mt-4 text-xs text-surface-500">Waiting for an Admin to approve or reject this request.</p>
      )}
    </Dialog>
  );
}
