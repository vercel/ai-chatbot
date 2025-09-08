'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ReviewActionsProps {
  reportId: string;
  currentStatus: string;
}

export function ReviewActions({ reportId, currentStatus }: ReviewActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [responseContent, setResponseContent] = useState('');
  const [priority, setPriority] = useState('medium');
  const router = useRouter();

  const responseTemplates = {
    acknowledge: `Conflict of Interest Disclosure Response

Ethics & Compliance
Subject: Evaluating Conflict of Interest Disclosure

To: [USER_EMAIL]
Cc: [MANAGER_EMAIL]
Date: [DATE]

Background

We acknowledge the conflict of interest situation you have disclosed regarding [CONFLICT_DETAILS].

Conclusion and conditions of approval:

We believe the disclosed relationship does not constitute a significant conflict of interest. However, to mitigate perceptions of conflicting interests, you agree to implement and adhere to the conditions below:

1) Any business decisions related to this matter must not be made by you but rather by your manager.

2) You must continue to exercise your best judgment and recuse yourself from participating in any discussions (formal or informal) of the Company's confidential information that could create a conflict.

If any of the facts and assumptions on which this clearance is based should change, you will proactively contact Ethics & Compliance.

Thank you for coming forward with this inquiry.

Author on behalf of Ethics & Compliance`,
    request_more_info: `Thank you for submitting your conflict of interest disclosure.

After reviewing the information provided, we require additional details to complete our assessment:

[SPECIFY REQUIRED INFORMATION]

Please provide the requested information at your earliest convenience so we can proceed with the review.

Best regards,
Ethics & Compliance Team`,
    approve: `Your conflict of interest disclosure has been reviewed and approved.

The disclosed relationship has been assessed and does not present a significant conflict with your role and responsibilities.

Please continue to monitor this situation and contact Ethics & Compliance if circumstances change.

Best regards,
Ethics & Compliance Team`,
    reject: `After careful review of your conflict of interest disclosure, we have determined that the disclosed relationship presents a significant conflict with your role and responsibilities.

[EXPLANATION OF DECISION AND REQUIRED ACTIONS]

Please contact Ethics & Compliance to discuss next steps and resolution options.

Best regards,
Ethics & Compliance Team`
  };

  const handleActionSelect = (action: string) => {
    setSelectedAction(action);
    setResponseContent(responseTemplates[action as keyof typeof responseTemplates] || '');
  };

  const handleSubmit = async () => {
    if (!selectedAction || !responseContent.trim()) {
      toast.error('Please select an action and provide a response');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit review response
      const reviewResponse = await fetch(`/admin/api/conflict-reports/${reportId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionType: selectedAction,
          responseContent: responseContent.trim(),
          updateStatus: getStatusFromAction(selectedAction),
        }),
      });

      const reviewResult = await reviewResponse.json();

      if (reviewResponse.ok) {
        toast.success('Review response submitted successfully');
        router.refresh();
        setSelectedAction('');
        setResponseContent('');
      } else {
        toast.error(reviewResult.error || 'Failed to submit review response');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('Failed to submit review response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePriorityUpdate = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/admin/api/conflict-reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priority,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Priority updated successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update priority');
      }
    } catch (error) {
      console.error('Failed to update priority:', error);
      toast.error('Failed to update priority');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusFromAction = (action: string) => {
    switch (action) {
      case 'acknowledge':
      case 'approve':
        return 'approved';
      case 'reject':
        return 'rejected';
      case 'request_more_info':
        return 'requires_more_info';
      default:
        return 'under_review';
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Priority Management</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="priority-select">Priority Level</label>
            <select
              id="priority-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full mt-1 border rounded px-3 py-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handlePriorityUpdate}
            disabled={isSubmitting}
            className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-secondary/80 disabled:opacity-50"
          >
            Update Priority
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Review Actions</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="action-select">Action</label>
            <select
              id="action-select"
              value={selectedAction}
              onChange={(e) => handleActionSelect(e.target.value)}
              className="w-full mt-1 border rounded px-3 py-2 text-sm"
            >
              <option value="">Select an action</option>
              <option value="acknowledge">Acknowledge & Approve</option>
              <option value="request_more_info">Request More Information</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
            </select>
          </div>

          {selectedAction && (
            <div>
              <label className="text-sm font-medium" htmlFor="response-textarea">Response</label>
              <textarea
                id="response-textarea"
                value={responseContent}
                onChange={(e) => setResponseContent(e.target.value)}
                rows={12}
                className="w-full mt-1 border rounded px-3 py-2 text-sm"
                placeholder="Enter your response..."
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedAction || !responseContent.trim()}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>

      {currentStatus === 'under_review' && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Status Update</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleActionSelect('acknowledge')}
              className="w-full bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700"
            >
              Quick Approve
            </button>
            <button
              type="button"
              onClick={() => handleActionSelect('request_more_info')}
              className="w-full bg-yellow-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-yellow-700"
            >
              Request More Info
            </button>
            <button
              type="button"
              onClick={() => handleActionSelect('reject')}
              className="w-full bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}