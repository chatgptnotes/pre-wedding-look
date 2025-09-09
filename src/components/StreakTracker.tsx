import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  Calendar,
  Trophy,
  Zap,
  Freeze,
  Star,
  Gift,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';
import { dailyChallengeService, UserStreak } from '@/services/dailyChallengeService';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface StreakTrackerProps {
  compact?: boolean;
  showFreeze?: boolean;
}

export function StreakTracker({ compact = false, showFreeze = true }: StreakTrackerProps) {
  const [userStreak, setUserStreak] = useState<UserStreak | null>(null);
  const [canUseFreeze, setCanUseFreeze] = useState(false);
  const [isUsingFreeze, setIsUsingFreeze] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<boolean[]>([]);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadStreakData();
    }
  }, [user]);

  const loadStreakData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const [streak, freezeAvailable] = await Promise.all([
        dailyChallengeService.getUserStreak(user.id),
        dailyChallengeService.canUseStreakFreeze(user.id)
      ]);

      setUserStreak(streak);
      setCanUseFreeze(freezeAvailable);
      
      // Generate weekly activity data (last 7 days)
      await generateWeeklyData();
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeeklyData = async () => {
    if (!user) return;
    
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6); // Last 7 days

      const participationHistory = await dailyChallengeService.getUserParticipationHistory(
        user.id,
        7
      );

      const weekData: boolean[] = [];
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(startDate.getDate() + i);
        const dateString = checkDate.toISOString().split('T')[0];
        
        const participated = participationHistory.some(p => 
          p.challenge.challenge_date === dateString
        );
        weekData.push(participated);
      }
      
      setWeeklyData(weekData);
    } catch (error) {
      console.error('Error generating weekly data:', error);
    }
  };

  const handleUseStreakFreeze = async () => {
    if (!user || !canUseFreeze) return;

    try {
      setIsUsingFreeze(true);
      
      const success = await dailyChallengeService.useStreakFreeze(user.id);
      
      if (success) {
        setCanUseFreeze(false);
        toast({
          title: '❄️ Streak Frozen!',
          description: 'Your streak has been protected for today. Use it wisely!',
        });
        
        // Reload streak data
        await loadStreakData();
      } else {
        toast({
          title: 'Error',
          description: 'Could not use streak freeze. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error using streak freeze:', error);
      toast({
        title: 'Error',
        description: 'Failed to use streak freeze. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUsingFreeze(false);
    }
  };

  const getStreakLevel = (streak: number): { level: string; color: string; emoji: string } => {
    if (streak >= 365) return { level: 'Legendary', color: 'text-purple-600', emoji: '👑' };
    if (streak >= 180) return { level: 'Master', color: 'text-gold-600', emoji: '🏆' };
    if (streak >= 90) return { level: 'Expert', color: 'text-orange-600', emoji: '🔥' };
    if (streak >= 30) return { level: 'Advanced', color: 'text-red-500', emoji: '⚡' };
    if (streak >= 14) return { level: 'Intermediate', color: 'text-yellow-500', emoji: '🌟' };
    if (streak >= 7) return { level: 'Getting Hot', color: 'text-orange-400', emoji: '🔥' };
    if (streak >= 3) return { level: 'Building', color: 'text-blue-500', emoji: '📈' };
    if (streak >= 1) return { level: 'Started', color: 'text-green-500', emoji: '🌱' };
    return { level: 'New', color: 'text-gray-500', emoji: '💫' };
  };

  const getNextMilestone = (streak: number): { target: number; remaining: number } => {
    const milestones = [3, 7, 14, 30, 90, 180, 365];
    const nextMilestone = milestones.find(m => m > streak) || milestones[milestones.length - 1];
    return {
      target: nextMilestone,
      remaining: nextMilestone - streak
    };
  };

  const calculateBonus = (streak: number): number => {
    return dailyChallengeService.calculateStreakBonus(streak);
  };

  if (isLoading || !userStreak) {
    return (
      <Card className={compact ? 'p-3' : ''}>
        <CardContent className={compact ? 'p-0' : ''}>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="flex gap-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="w-8 h-8 bg-gray-200 rounded-full"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const streakLevel = getStreakLevel(userStreak.current_streak);
  const milestone = getNextMilestone(userStreak.current_streak);
  const bonus = calculateBonus(userStreak.current_streak);

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-2xl ${streakLevel.color}`}>
              {streakLevel.emoji}
            </div>
            <div>
              <div className="font-semibold text-lg">
                {userStreak.current_streak} days
              </div>
              <div className="text-sm text-gray-600">
                {streakLevel.level} streak
              </div>
            </div>
          </div>
          
          <div className="text-right">
            {bonus > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Gift className="w-3 h-3" />
                +{bonus} credits
              </Badge>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Next: {milestone.remaining} days
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Streak Tracker
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Streak Display */}
        <div className="text-center">
          <div className={`text-4xl mb-2 ${streakLevel.color}`}>
            {streakLevel.emoji}
          </div>
          <div className="text-5xl font-bold text-orange-500 mb-2">
            {userStreak.current_streak}
          </div>
          <div className="text-lg text-gray-600 mb-1">
            day{userStreak.current_streak !== 1 ? 's' : ''} in a row
          </div>
          <Badge variant="outline" className={`${streakLevel.color} border-current`}>
            {streakLevel.level}
          </Badge>
        </div>

        {/* Weekly Activity Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">This Week</span>
            <span className="text-xs text-gray-500">Last 7 days</span>
          </div>
          
          <div className="flex gap-2 justify-center">
            {weeklyData.map((completed, index) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - index));
              const dayName = date.toLocaleDateString('en', { weekday: 'short' });
              
              return (
                <div key={index} className="text-center">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                      completed
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300'
                    }`}
                  >
                    {completed ? <Flame className="w-4 h-4" /> : dayName.charAt(0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {dayName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress to Next Milestone */}
        {milestone.remaining > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Next Milestone</span>
              <span className="text-sm text-gray-600">
                {milestone.remaining} more days to {milestone.target}
              </span>
            </div>
            
            <Progress 
              value={((milestone.target - milestone.remaining) / milestone.target) * 100}
              className="h-2"
            />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Trophy className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
            <div className="text-lg font-semibold">{userStreak.longest_streak}</div>
            <div className="text-xs text-gray-600">Best Streak</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Star className="w-5 h-5 mx-auto text-purple-500 mb-1" />
            <div className="text-lg font-semibold">{userStreak.total_challenges_completed}</div>
            <div className="text-xs text-gray-600">Total Challenges</div>
          </div>
        </div>

        {/* Streak Benefits */}
        {bonus > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Active Streak Bonus</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              +{bonus} credits
            </div>
            <div className="text-xs text-gray-600">
              Earned on challenge completion
            </div>
          </div>
        )}

        {/* Streak Freeze Option */}
        {showFreeze && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Freeze className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Streak Freeze</span>
              </div>
              <Badge variant={canUseFreeze ? 'secondary' : 'outline'}>
                {canUseFreeze ? 'Available' : 'Used'}
              </Badge>
            </div>
            
            <p className="text-xs text-gray-600 mb-3">
              Use a streak freeze to maintain your streak if you miss a day. 
              You get 1 freeze per week.
            </p>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleUseStreakFreeze}
              disabled={!canUseFreeze || isUsingFreeze}
              className="w-full flex items-center gap-2"
            >
              {isUsingFreeze ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                  Activating...
                </>
              ) : (
                <>
                  <Freeze className="w-3 h-3" />
                  {canUseFreeze ? 'Use Streak Freeze' : 'Freeze Used This Week'}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}