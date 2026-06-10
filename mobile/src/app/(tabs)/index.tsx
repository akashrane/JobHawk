import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, StatusBar } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import { Colors } from '@/constants/theme';
import DraftDeck from '@/components/DraftDeck';

export default function DashboardScreen() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ applications: 0, drafts: 0 });
  const [pendingDrafts, setPendingDrafts] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    if (!session?.user) return;
    
    const { count: applicationsCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);
      
    const { count: draftsCount } = await supabase
      .from('drafts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('status', 'pending');
      
    const { data: draftsData } = await supabase
      .from('drafts')
      .select(`
        id, 
        job_id, 
        jobs (title, companies(name))
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10); // Fetch top 10 for the swipe deck

    setStats({
      applications: applicationsCount || 0,
      drafts: draftsCount || 0,
    });
    setPendingDrafts(draftsData || []);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [session]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: Colors.dark.background }]}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          tintColor={Colors.dark.accent} 
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Dashboard</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.applications}</Text>
          <Text style={styles.statLabel}>Applications</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.drafts}</Text>
          <Text style={styles.statLabel}>Drafts</Text>
        </View>
      </View>

      <View style={styles.deckSection}>
        <Text style={styles.sectionTitle}>Action Required</Text>
        <DraftDeck 
          drafts={pendingDrafts} 
          onComplete={() => fetchDashboardData()} 
        />
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: Colors.dark.background, paddingHorizontal: 20 },
  headerContainer: { marginTop: 60, marginBottom: 30 },
  headerText: { fontSize: 32, fontWeight: '900', color: Colors.dark.text, letterSpacing: -0.5 },
  statsContainer: { flexDirection: 'row', gap: 15, marginBottom: 40 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundElement,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statNumber: { fontSize: 36, fontWeight: '900', color: Colors.dark.accent, marginBottom: 4 },
  statLabel: { fontSize: 13, color: Colors.dark.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  deckSection: { marginTop: 10 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.dark.text, marginBottom: 10, paddingLeft: 4 },
});
