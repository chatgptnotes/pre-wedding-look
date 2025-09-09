import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Flag,
  Ban,
  Eye,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Filter
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AppealsQueue } from './AppealsQueue';

interface ModerationStats {
  total_content_checked: number;
  flagged_content: number;
  actions_taken: number;
  appeals_pending: number;
  fraud_events: number;
  high_risk_users: number;
  automated_actions: number;
  human_reviews: number;
}

interface ContentFlags {
  content_type: string;
  count: number;
  avg_risk_score: number;
}

interface ModerationTrend {
  date: string;
  flagged_count: number;
  actions_count: number;
  appeals_count: number;
}

interface HighRiskUser {
  user_id: string;
  email: string;
  risk_score: number;
  risk_category: string;
  last_violation: string;
  violation_count: number;
}

interface ModerationDashboardProps {
  isAdmin?: boolean;
  isModerator?: boolean;
}

export function ModerationDashboard({ isAdmin = false, isModerator = false }: ModerationDashboardProps) {
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [contentFlags, setContentFlags] = useState<ContentFlags[]>([]);
  const [trends, setTrends] = useState<ModerationTrend[]>([]);
  const [highRiskUsers, setHighRiskUsers] = useState<HighRiskUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');

  const { user } = useAuth();

  useEffect(() => {
    if ((isAdmin || isModerator) && user) {
      loadDashboardData();
    }
  }, [isAdmin, isModerator, user, timeRange]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      
      // Set date range based on selection
      switch (timeRange) {
        case '24h':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      // Load moderation stats
      await Promise.all([
        loadModerationStats(startDate, endDate),
        loadContentFlags(startDate, endDate),
        loadTrends(startDate, endDate),
        loadHighRiskUsers()
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load moderation dashboard',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadModerationStats = async (startDate: Date, endDate: Date) => {
    // Load overall moderation statistics
    const [
      contentResults,
      actionResults,
      appealResults,
      fraudResults,
      riskResults
    ] = await Promise.all([
      supabase
        .from('content_moderation_results')
        .select('id, is_flagged, human_review_required')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      supabase
        .from('moderation_actions')
        .select('id, is_automated')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      supabase
        .from('user_appeals')
        .select('id, status')
        .eq('status', 'pending'),
      
      supabase
        .from('fraud_detection_events')
        .select('id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      
      supabase
        .from('user_risk_profiles')
        .select('id, risk_category')
        .in('risk_category', ['high', 'critical'])
    ]);

    const contentData = contentResults.data || [];
    const actionData = actionResults.data || [];
    const appealData = appealResults.data || [];
    const fraudData = fraudResults.data || [];
    const riskData = riskResults.data || [];

    setStats({
      total_content_checked: contentData.length,
      flagged_content: contentData.filter(c => c.is_flagged).length,
      actions_taken: actionData.length,
      appeals_pending: appealData.length,
      fraud_events: fraudData.length,
      high_risk_users: riskData.length,
      automated_actions: actionData.filter(a => a.is_automated).length,
      human_reviews: contentData.filter(c => c.human_review_required).length
    });
  };

  const loadContentFlags = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase
      .from('content_moderation_results')
      .select('content_type, is_flagged, nsfw_score, toxicity_score, violence_score')
      .eq('is_flagged', true)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      console.error('Error loading content flags:', error);
      return;
    }

    // Group by content type
    const flagsByType = data.reduce((acc, item) => {
      if (!acc[item.content_type]) {
        acc[item.content_type] = {
          count: 0,
          total_risk: 0
        };
      }
      acc[item.content_type].count++;
      acc[item.content_type].total_risk += Math.max(
        item.nsfw_score || 0,
        item.toxicity_score || 0,
        item.violence_score || 0
      );
      return acc;
    }, {} as Record<string, { count: number; total_risk: number }>);

    const flagsArray = Object.entries(flagsByType).map(([content_type, data]) => ({
      content_type,
      count: data.count,
      avg_risk_score: data.count > 0 ? data.total_risk / data.count : 0
    }));

    setContentFlags(flagsArray);
  };

  const loadTrends = async (startDate: Date, endDate: Date) => {
    // Generate daily trends for the selected period
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const trendPromises = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      trendPromises.push(
        Promise.all([
          supabase
            .from('content_moderation_results')
            .select('id')
            .eq('is_flagged', true)
            .gte('created_at', date.toISOString())
            .lt('created_at', nextDate.toISOString()),
          
          supabase
            .from('moderation_actions')
            .select('id')
            .gte('created_at', date.toISOString())
            .lt('created_at', nextDate.toISOString()),
          
          supabase
            .from('user_appeals')
            .select('id')
            .gte('submitted_at', date.toISOString())
            .lt('submitted_at', nextDate.toISOString())
        ]).then(([flagged, actions, appeals]) => ({
          date: date.toISOString().split('T')[0],
          flagged_count: flagged.data?.length || 0,
          actions_count: actions.data?.length || 0,
          appeals_count: appeals.data?.length || 0
        }))
      );
    }

    const trendsData = await Promise.all(trendPromises);
    setTrends(trendsData);
  };

  const loadHighRiskUsers = async () => {
    const { data, error } = await supabase
      .from('user_risk_profiles')
      .select(`
        user_id,
        overall_risk_score,
        risk_category,
        updated_at,
        users:user_id(email)
      `)
      .in('risk_category', ['high', 'critical'])
      .order('overall_risk_score', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading high risk users:', error);
      return;
    }

    // Get violation counts for each user
    const userIds = data.map(u => u.user_id);
    const { data: violations } = await supabase
      .from('moderation_actions')
      .select(`
        content_moderation_results!inner(user_id),
        created_at
      `)
      .in('content_moderation_results.user_id', userIds);

    const violationCounts = violations?.reduce((acc, v) => {
      const userId = v.content_moderation_results.user_id;
      if (!acc[userId]) {
        acc[userId] = { count: 0, last_violation: null };
      }
      acc[userId].count++;
      if (!acc[userId].last_violation || v.created_at > acc[userId].last_violation) {
        acc[userId].last_violation = v.created_at;
      }
      return acc;
    }, {} as Record<string, { count: number; last_violation: string }>) || {};

    const highRiskUsersData = data.map(user => ({
      user_id: user.user_id,
      email: user.users?.email || 'Unknown',
      risk_score: user.overall_risk_score,
      risk_category: user.risk_category,
      last_violation: violationCounts[user.user_id]?.last_violation || 'None',
      violation_count: violationCounts[user.user_id]?.count || 0
    }));

    setHighRiskUsers(highRiskUsersData);
  };

  const getRiskCategoryColor = (category: string) => {
    switch (category) {
      case 'critical': return 'bg-red-900 text-white';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeIndicator = (current: number, previous: number) => {
    if (previous === 0) return null;
    
    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    
    return (
      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {Math.abs(change).toFixed(1)}%
      </div>
    );
  };

  if (!isAdmin && !isModerator) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access the moderation dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Moderation Dashboard</h1>
          <p className="text-gray-600">Monitor content safety and user behavior</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={loadDashboardData} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="appeals">Appeals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Content Checked</p>
                      <p className="text-3xl font-bold">{stats.total_content_checked.toLocaleString()}</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Flagged Content</p>
                      <p className="text-3xl font-bold text-red-600">{stats.flagged_content.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">
                        {stats.total_content_checked > 0 
                          ? `${((stats.flagged_content / stats.total_content_checked) * 100).toFixed(1)}% flag rate`
                          : '0% flag rate'
                        }
                      </p>
                    </div>
                    <Flag className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Actions Taken</p>
                      <p className="text-3xl font-bold">{stats.actions_taken.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">
                        {stats.automated_actions} automated
                      </p>
                    </div>
                    <Ban className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Appeals</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.appeals_pending.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">
                        Needs review
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Moderation Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trends.length > 0 ? (
                <div className="space-y-4">
                  {trends.slice(-7).map((trend, index) => (
                    <div key={trend.date} className="flex items-center justify-between py-2">
                      <div className="text-sm font-medium">
                        {new Date(trend.date).toLocaleDateString('en', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-red-600">
                          {trend.flagged_count} flagged
                        </div>
                        <div className="text-sm text-orange-600">
                          {trend.actions_count} actions
                        </div>
                        <div className="text-sm text-yellow-600">
                          {trend.appeals_count} appeals
                        </div>
                        <div className="w-24">
                          <Progress 
                            value={Math.min((trend.flagged_count / Math.max(...trends.map(t => t.flagged_count)) * 100), 100)} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No trend data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {/* Content Flags by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Content Flags by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {contentFlags.length > 0 ? (
                <div className="space-y-4">
                  {contentFlags.map((flag) => (
                    <div key={flag.content_type} className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">
                          {flag.content_type.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {flag.count} flagged items
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          Risk: {(flag.avg_risk_score * 100).toFixed(1)}%
                        </span>
                        <div className="w-24">
                          <Progress 
                            value={flag.avg_risk_score * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No flagged content in selected time range</p>
              )}
            </CardContent>
          </Card>

          {/* Fraud Detection Summary */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Fraud & Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.fraud_events}</div>
                    <div className="text-sm text-gray-600">Fraud Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.high_risk_users}</div>
                    <div className="text-sm text-gray-600">High Risk Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.human_reviews}</div>
                    <div className="text-sm text-gray-600">Human Reviews</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* High Risk Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                High Risk Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {highRiskUsers.length > 0 ? (
                <div className="space-y-3">
                  {highRiskUsers.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge className={getRiskCategoryColor(user.risk_category)}>
                          {user.risk_category}
                        </Badge>
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-gray-600">
                            Risk Score: {(user.risk_score * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{user.violation_count} violations</p>
                        <p className="text-xs text-gray-600">
                          Last: {user.last_violation === 'None' ? 'None' : new Date(user.last_violation).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No high-risk users found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appeals">
          <AppealsQueue isAdmin={isAdmin} isModerator={isModerator} />
        </TabsContent>
      </Tabs>
    </div>
  );
}