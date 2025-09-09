import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Calendar,
  User,
  FileText,
  ExternalLink,
  Timer,
  AlertCircle,
  Filter
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Appeal {
  id: string;
  user_id: string;
  moderation_action_id: string;
  appeal_text: string;
  user_evidence_urls: string[];
  status: 'pending' | 'under_review' | 'approved' | 'denied' | 'escalated';
  assigned_reviewer_id?: string;
  reviewer_notes?: string;
  resolution_reason?: string;
  submitted_at: string;
  assigned_at?: string;
  resolved_at?: string;
  moderation_actions: {
    action_type: string;
    reason: string;
    public_reason?: string;
    content_moderation_results: {
      content_type: string;
      content_id: string;
    };
  };
  users?: {
    email: string;
    raw_user_meta_data: any;
  };
}

interface AppealsQueueProps {
  isAdmin?: boolean;
  isModerator?: boolean;
}

export function AppealsQueue({ isAdmin = false, isModerator = false }: AppealsQueueProps) {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [filteredAppeals, setFilteredAppeals] = useState<Appeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [resolutionReason, setResolutionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const { user } = useAuth();

  useEffect(() => {
    if ((isAdmin || isModerator) && user) {
      loadAppeals();
    }
  }, [isAdmin, isModerator, user]);

  useEffect(() => {
    filterAppeals();
  }, [appeals, filterStatus, filterType]);

  const loadAppeals = async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('user_appeals')
        .select(`
          *,
          moderation_actions!inner(
            action_type,
            reason,
            public_reason,
            content_moderation_results!inner(
              content_type,
              content_id,
              user_id
            )
          ),
          users:user_id(
            email,
            raw_user_meta_data
          )
        `)
        .order('submitted_at', { ascending: false });

      // Moderators can only see appeals assigned to them or unassigned
      if (isModerator && !isAdmin) {
        query = query.or(`assigned_reviewer_id.is.null,assigned_reviewer_id.eq.${user?.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAppeals(data || []);
    } catch (error) {
      console.error('Error loading appeals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load appeals queue',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAppeals = () => {
    let filtered = [...appeals];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(appeal => appeal.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(appeal => 
        appeal.moderation_actions.content_moderation_results.content_type === filterType
      );
    }

    setFilteredAppeals(filtered);
  };

  const assignAppeal = async (appealId: string) => {
    if (!user) return;

    try {
      setIsProcessing(true);

      const { error } = await supabase
        .from('user_appeals')
        .update({
          assigned_reviewer_id: user.id,
          status: 'under_review',
          assigned_at: new Date().toISOString()
        })
        .eq('id', appealId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Appeal assigned to you for review'
      });

      await loadAppeals();
    } catch (error) {
      console.error('Error assigning appeal:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign appeal',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resolveAppeal = async (
    appealId: string,
    resolution: 'approved' | 'denied' | 'escalated'
  ) => {
    if (!reviewerNotes.trim()) {
      toast({
        title: 'Error',
        description: 'Reviewer notes are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsProcessing(true);

      const { error } = await supabase
        .from('user_appeals')
        .update({
          status: resolution,
          reviewer_notes: reviewerNotes,
          resolution_reason: resolutionReason || null,
          resolved_at: new Date().toISOString()
        })
        .eq('id', appealId);

      if (error) throw error;

      // If appeal is approved, reverse the moderation action
      if (resolution === 'approved' && selectedAppeal) {
        // This would typically involve reversing bans, restoring content, etc.
        // For now, we'll just log the action
        await supabase
          .from('security_audit_log')
          .insert({
            event_type: 'appeal_approved',
            user_id: selectedAppeal.user_id,
            description: `Appeal approved - reversing ${selectedAppeal.moderation_actions.action_type}`,
            metadata: {
              appeal_id: appealId,
              original_action: selectedAppeal.moderation_actions.action_type,
              reviewer_notes: reviewerNotes
            },
            flagged: false
          });
      }

      toast({
        title: 'Success',
        description: `Appeal ${resolution} successfully`
      });

      setSelectedAppeal(null);
      setReviewerNotes('');
      setResolutionReason('');
      await loadAppeals();
    } catch (error) {
      console.error('Error resolving appeal:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve appeal',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      under_review: { color: 'bg-blue-100 text-blue-800', icon: MessageSquare },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      denied: { color: 'bg-red-100 text-red-800', icon: XCircle },
      escalated: { color: 'bg-purple-100 text-purple-800', icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getActionTypeBadge = (actionType: string) => {
    const actionConfig = {
      flag_content: { color: 'bg-orange-100 text-orange-800' },
      remove_content: { color: 'bg-red-100 text-red-800' },
      warn_user: { color: 'bg-yellow-100 text-yellow-800' },
      suspend_user: { color: 'bg-red-100 text-red-800' },
      ban_user: { color: 'bg-red-900 text-white' },
      shadow_ban: { color: 'bg-gray-100 text-gray-800' }
    };

    const config = actionConfig[actionType as keyof typeof actionConfig] || 
                   { color: 'bg-gray-100 text-gray-800' };

    return (
      <Badge className={config.color}>
        {actionType.replace('_', ' ')}
      </Badge>
    );
  };

  const getSLAStatus = (submittedAt: string, status: string) => {
    const submitted = new Date(submittedAt);
    const now = new Date();
    const hoursElapsed = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60);
    
    const slaHours = status === 'escalated' ? 4 : 24; // 4 hours for escalated, 24 for others
    const isOverdue = hoursElapsed > slaHours && !['approved', 'denied'].includes(status);
    
    return {
      hoursElapsed: Math.floor(hoursElapsed),
      isOverdue,
      slaHours
    };
  };

  if (!isAdmin && !isModerator) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access the appeals queue.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Appeals Queue</h2>
          <p className="text-gray-600">Review and process user appeals for moderation actions</p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="reel">Reel</SelectItem>
              <SelectItem value="profile_image">Profile Image</SelectItem>
              <SelectItem value="comment">Comment</SelectItem>
              <SelectItem value="prompt">Prompt</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={loadAppeals} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {appeals.filter(a => a.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-blue-600">
                  {appeals.filter(a => a.status === 'under_review').length}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {appeals.filter(a => getSLAStatus(a.submitted_at, a.status).isOverdue).length}
                </p>
              </div>
              <Timer className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appeals.filter(a => 
                    new Date(a.submitted_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appeals List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading appeals...</p>
            </CardContent>
          </Card>
        ) : filteredAppeals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No appeals found</h3>
              <p className="text-gray-600">
                {filterStatus === 'all' && filterType === 'all' 
                  ? 'There are no appeals in the queue'
                  : 'No appeals match your current filters'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAppeals.map((appeal) => {
            const slaStatus = getSLAStatus(appeal.submitted_at, appeal.status);
            const canAssign = appeal.status === 'pending' && !appeal.assigned_reviewer_id;
            const canResolve = appeal.assigned_reviewer_id === user?.id && appeal.status === 'under_review';
            
            return (
              <Card key={appeal.id} className={slaStatus.isOverdue ? 'border-red-200 bg-red-50' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(appeal.status)}
                        {getActionTypeBadge(appeal.moderation_actions.action_type)}
                        <Badge variant="outline">
                          {appeal.moderation_actions.content_moderation_results.content_type}
                        </Badge>
                        {slaStatus.isOverdue && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {appeal.users?.email || 'Unknown User'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(appeal.submitted_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer className="w-4 h-4" />
                          {slaStatus.hoursElapsed}h elapsed
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {canAssign && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => assignAppeal(appeal.id)}
                          disabled={isProcessing}
                        >
                          Assign to Me
                        </Button>
                      )}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAppeal(appeal)}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Appeal Review</DialogTitle>
                          </DialogHeader>
                          
                          {selectedAppeal && (
                            <div className="space-y-6">
                              {/* Appeal Info */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Status</label>
                                  <div className="mt-1">
                                    {getStatusBadge(selectedAppeal.status)}
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">Original Action</label>
                                  <div className="mt-1">
                                    {getActionTypeBadge(selectedAppeal.moderation_actions.action_type)}
                                  </div>
                                </div>
                              </div>

                              {/* Original Action Reason */}
                              <div>
                                <label className="text-sm font-medium">Original Action Reason</label>
                                <p className="mt-1 text-sm bg-gray-50 p-3 rounded">
                                  {selectedAppeal.moderation_actions.public_reason || 
                                   selectedAppeal.moderation_actions.reason}
                                </p>
                              </div>

                              {/* Appeal Text */}
                              <div>
                                <label className="text-sm font-medium">User's Appeal</label>
                                <p className="mt-1 text-sm bg-gray-50 p-3 rounded">
                                  {selectedAppeal.appeal_text}
                                </p>
                              </div>

                              {/* Evidence URLs */}
                              {selectedAppeal.user_evidence_urls.length > 0 && (
                                <div>
                                  <label className="text-sm font-medium">Evidence Provided</label>
                                  <div className="mt-1 space-y-2">
                                    {selectedAppeal.user_evidence_urls.map((url, index) => (
                                      <a
                                        key={index}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-blue-600 hover:underline text-sm"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                        Evidence {index + 1}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {canResolve && (
                                <>
                                  <Separator />
                                  
                                  {/* Reviewer Notes */}
                                  <div>
                                    <label className="text-sm font-medium">Reviewer Notes *</label>
                                    <Textarea
                                      value={reviewerNotes}
                                      onChange={(e) => setReviewerNotes(e.target.value)}
                                      placeholder="Explain your decision and reasoning..."
                                      className="mt-1"
                                      rows={4}
                                    />
                                  </div>

                                  {/* Resolution Reason */}
                                  <div>
                                    <label className="text-sm font-medium">Resolution Reason (Optional)</label>
                                    <Textarea
                                      value={resolutionReason}
                                      onChange={(e) => setResolutionReason(e.target.value)}
                                      placeholder="Additional context or public reason..."
                                      className="mt-1"
                                      rows={2}
                                    />
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      onClick={() => resolveAppeal(selectedAppeal.id, 'approved')}
                                      disabled={isProcessing}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Approve Appeal
                                    </Button>
                                    
                                    <Button
                                      onClick={() => resolveAppeal(selectedAppeal.id, 'denied')}
                                      disabled={isProcessing}
                                      variant="destructive"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Deny Appeal
                                    </Button>
                                    
                                    {isAdmin && (
                                      <Button
                                        onClick={() => resolveAppeal(selectedAppeal.id, 'escalated')}
                                        disabled={isProcessing}
                                        variant="outline"
                                      >
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Escalate
                                      </Button>
                                    )}
                                  </div>
                                </>
                              )}

                              {/* Previous Reviews */}
                              {selectedAppeal.reviewer_notes && (
                                <>
                                  <Separator />
                                  <div>
                                    <label className="text-sm font-medium">Previous Review Notes</label>
                                    <p className="mt-1 text-sm bg-blue-50 p-3 rounded">
                                      {selectedAppeal.reviewer_notes}
                                    </p>
                                    {selectedAppeal.resolution_reason && (
                                      <p className="mt-2 text-sm bg-gray-50 p-3 rounded">
                                        <strong>Resolution:</strong> {selectedAppeal.resolution_reason}
                                      </p>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Appeal Preview */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {appeal.appeal_text}
                    </p>
                    {appeal.user_evidence_urls.length > 0 && (
                      <p className="text-xs text-blue-600 mt-2">
                        {appeal.user_evidence_urls.length} evidence file(s) attached
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}