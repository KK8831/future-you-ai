import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  requirement_value: number;
  xp_reward: number;
}

export interface UserAchievement {
  achievement_id: string;
  earned_at: string;
}

export const useAchievements = (userId?: string) => {
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [totalXp, setTotalXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAchievements = useCallback(async () => {
    if (!userId) return;

    const [catalogRes, earnedRes, profileRes] = await Promise.all([
      (supabase as any).from('achievements').select('*').order('category').order('requirement_value'),
      (supabase as any).from('user_achievements').select('achievement_id, earned_at').eq('user_id', userId),
      supabase.from('profiles').select('xp, level').eq('user_id', userId).maybeSingle(),
    ]);

    if (catalogRes.data) setAllAchievements(catalogRes.data as Achievement[]);
    if (earnedRes.data) {
      setEarnedIds(new Set((earnedRes.data as unknown as UserAchievement[]).map(a => a.achievement_id)));
    }
    if (profileRes.data) {
      const p = profileRes.data as any;
      setTotalXp(p.xp || 0);
      setLevel(p.level || 1);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const awardAchievement = async (achievementId: string) => {
    if (!userId || earnedIds.has(achievementId)) return false;

    const achievement = allAchievements.find(a => a.id === achievementId);
    if (!achievement) return false;

    // Insert the user_achievement record
    const { error } = await (supabase as any).from('user_achievements').insert({
      user_id: userId,
      achievement_id: achievementId,
    });

    if (error) {
      // Likely a duplicate — silently ignore
      if (error.code === '23505') return false;
      console.error('Failed to award achievement:', error);
      return false;
    }

    // Calculate new XP and level
    const newXp = totalXp + achievement.xp_reward;
    const newLevel = Math.floor(newXp / 100) + 1;

    await (supabase as any).from('profiles').update({ xp: newXp, level: newLevel }).eq('user_id', userId);

    // Update local state
    setEarnedIds(prev => new Set([...prev, achievementId]));
    setTotalXp(newXp);
    setLevel(newLevel);

    // Show a celebration toast!
    toast({
      title: `${achievement.icon} Achievement Unlocked!`,
      description: `${achievement.name} — +${achievement.xp_reward} XP`,
    });

    return true;
  };

  /**
   * Check progression milestones and award any earned achievements.
   * Call this from the Dashboard on data load.
   */
  const checkAndAwardAll = async (stats: {
    currentStreak: number;
    totalEntries: number;
    totalAiRuns?: number;
    totalFriends?: number;
  }) => {
    if (!userId || allAchievements.length === 0) return;

    const streakAchievements = [
      { id: 'streak_3', threshold: 3 },
      { id: 'streak_7', threshold: 7 },
      { id: 'streak_30', threshold: 30 },
      { id: 'streak_100', threshold: 100 },
    ];

    const logAchievements = [
      { id: 'log_1', threshold: 1 },
      { id: 'log_10', threshold: 10 },
      { id: 'log_50', threshold: 50 },
      { id: 'log_100', threshold: 100 },
    ];

    for (const sa of streakAchievements) {
      if (stats.currentStreak >= sa.threshold && !earnedIds.has(sa.id)) {
        await awardAchievement(sa.id);
      }
    }

    for (const la of logAchievements) {
      if (stats.totalEntries >= la.threshold && !earnedIds.has(la.id)) {
        await awardAchievement(la.id);
      }
    }

    if (stats.totalAiRuns && stats.totalAiRuns >= 1 && !earnedIds.has('ai_first')) {
      await awardAchievement('ai_first');
    }
    if (stats.totalAiRuns && stats.totalAiRuns >= 5 && !earnedIds.has('ai_5')) {
      await awardAchievement('ai_5');
    }

    if (stats.totalFriends && stats.totalFriends >= 1 && !earnedIds.has('social_first')) {
      await awardAchievement('social_first');
    }
  };

  return {
    allAchievements,
    earnedIds,
    totalXp,
    level,
    loading,
    awardAchievement,
    checkAndAwardAll,
    refetch: fetchAchievements,
  };
};
