import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  Calendar, 
  Gift, 
  Trophy, 
  Flame,
  Clock,
  Sparkles,
  Target,
  Zap,
  Award
} from 'lucide-react';
import { dailyChallengeService, DailyChallenge, UserStreak } from '@/services/dailyChallengeService';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface DailyChallengeProps {
  onChallengeComplete?: (challengeId: string, creditsEarned: number) => void;
}

export function DailyChallengeComponent({ onChallengeComplete }: DailyChallengeProps) {
  const [todaysChallenge, setTodaysChallenge] = useState<DailyChallenge | null>(null);
  const [userStreak, setUserStreak] = useState<UserStreak | null>(null);
  const [hasParticipated, setHasParticipated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isParticipating, setIsParticipating] = useState(false);
  const [challengeStats, setChallengeStats] = useState<any>(null);
  
  const { user } = useAuth();

  const themeEmojis = {
    romantic_sunset: '🌅',
    bollywood_glam: '✨',
    vintage_classic: '🎞️',
    modern_chic: '🏙️',
    cultural_fusion: '🎭',
    destination_wedding: '🏝️',
    minimalist_elegance: '🤍'
  };

  const themeColors = {
    romantic_sunset: 'from-orange-400 to-pink-400',
    bollywood_glam: 'from-purple-400 to-pink-400',
    vintage_classic: 'from-amber-400 to-orange-400',
    modern_chic: 'from-gray-400 to-blue-400',
    cultural_fusion: 'from-green-400 to-blue-400',
    destination_wedding: 'from-cyan-400 to-blue-400',
    minimalist_elegance: 'from-gray-300 to-gray-400'
  };

  useEffect(() => {
    if (user) {
      loadChallengeData();
    }
  }, [user]);

  const loadChallengeData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const [challenge, streak, participated, stats] = await Promise.all([
        dailyChallengeService.getTodaysChallenge(),
        dailyChallengeService.getUserStreak(user.id),
        dailyChallengeService.hasUserParticipatedToday(user.id),
        dailyChallengeService.getChallengeStats(user.id)
      ]);

      setTodaysChallenge(challenge);
      setUserStreak(streak);
      setHasParticipated(participated);
      setChallengeStats(stats);
    } catch (error) {
      console.error('Error loading challenge data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load daily challenge. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleParticipate = async () => {
    if (!user || !todaysChallenge) return;

    try {
      setIsParticipating(true);
      
      const result = await dailyChallengeService.participateInChallenge(
        user.id,
        todaysChallenge.id
      );

      if (result.success) {
        setHasParticipated(true);
        setUserStreak(prev => prev ? {
          ...prev,
          current_streak: result.current_streak || prev.current_streak,
          longest_streak: result.longest_streak || prev.longest_streak,
          total_challenges_completed: prev.total_challenges_completed + 1
        } : null);

        toast({
          title: '🎉 Challenge Completed!',
          description: `You earned ${result.credits_awarded} credits! Your streak is now ${result.current_streak} days.`,
        });

        if (onChallengeComplete) {
          onChallengeComplete(todaysChallenge.id, result.credits_awarded || 0);
        }

        // Refresh stats
        const updatedStats = await dailyChallengeService.getChallengeStats(user.id);
        setChallengeStats(updatedStats);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to participate in challenge',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error participating in challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to participate in challenge. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsParticipating(false);
    }
  };

  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getStreakBonus = (streak: number): number => {
    return dailyChallengeService.calculateStreakBonus(streak);
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!todaysChallenge) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Challenge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Challenge Today</h3>
            <p className="text-gray-600">Check back tomorrow for a new creative challenge!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Challenge Card */}
      <Card className="w-full max-w-4xl mx-auto overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${themeColors[todaysChallenge.theme as keyof typeof themeColors]}`} />
        
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">
                  {themeEmojis[todaysChallenge.theme as keyof typeof themeEmojis]}
                </span>
                <Badge variant="secondary" className="capitalize">
                  {todaysChallenge.theme.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  {todaysChallenge.bonus_credits} credits
                </Badge>
              </div>
              
              <CardTitle className="text-2xl mb-2">
                {todaysChallenge.title}
              </CardTitle>
              
              <p className="text-gray-600">
                {todaysChallenge.description}
              </p>
            </div>
            
            <div className="text-right text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {getTimeUntilReset()} left
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Challenge Prompt */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Today's Creative Prompt
            </h4>
            <p className="text-sm text-gray-700">
              {todaysChallenge.prompt_template}
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            {hasParticipated ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                  <Award className="w-5 h-5" />
                  <span className="font-medium">Challenge Completed!</span>
                </div>
                <p className="text-sm text-gray-600">
                  Come back tomorrow for a new challenge
                </p>
              </div>
            ) : (
              <Button
                onClick={handleParticipate}
                disabled={isParticipating}
                size="lg"
                className="flex items-center gap-2 px-8"
              >
                {isParticipating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Participating...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    Accept Challenge
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Streak & Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Streak Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Your Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userStreak ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-orange-500">
                      {userStreak.current_streak}
                    </div>
                    <div className="text-sm text-gray-600">days in a row</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {userStreak.longest_streak}
                    </div>
                    <div className="text-sm text-gray-600">best streak</div>
                  </div>
                </div>

                {userStreak.current_streak > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Streak Bonus</span>
                      <span className="font-medium text-green-600">
                        +{getStreakBonus(userStreak.current_streak)} credits
                      </span>
                    </div>
                    
                    {userStreak.current_streak >= 3 && (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <Zap className="w-4 h-4" />
                        <span>Streak bonus active!</span>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">
                    Total Challenges
                  </div>
                  <div className="text-xl font-semibold">
                    {userStreak.total_challenges_completed}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Flame className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-600">Start your first challenge to begin your streak!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Challenge Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {challengeStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      {challengeStats.totalCreditsEarned}
                    </div>
                    <div className="text-sm text-gray-600">credits earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">
                      {challengeStats.participationRate}%
                    </div>
                    <div className="text-sm text-gray-600">participation</div>
                  </div>
                </div>

                <Separator />

                {challengeStats.favoriteTheme && (
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">
                      Favorite Theme
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">
                        {themeEmojis[challengeStats.favoriteTheme as keyof typeof themeEmojis]}
                      </span>
                      <span className="font-medium capitalize">
                        {challengeStats.favoriteTheme.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span>This Month</span>
                    <span className="font-medium">
                      {challengeStats.totalParticipations} challenges
                    </span>
                  </div>
                  <Progress 
                    value={(challengeStats.participationRate)} 
                    className="mt-2 h-2" 
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Trophy className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-600">Complete challenges to see your stats!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}