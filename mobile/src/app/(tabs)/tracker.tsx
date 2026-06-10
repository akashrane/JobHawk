import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import { Colors } from '@/constants/theme';

export default function TrackerScreen() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);

  const fetchApplications = async () => {
    if (!session?.user) return;
    
    const { data, error } = await supabase
      .from('applications')
      .select(`
        id, 
        stage, 
        updated_at,
        jobs (title, companies(name))
      `)
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });

    if (!error) setApplications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, [session]);

  const renderApplication = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.jobTitle}>{item.jobs?.title}</Text>
        <View style={[styles.stageBadge, styles[`stage_${item.stage}` as keyof typeof styles] || styles.stageDefault]}>
          <Text style={[styles.stageText, styles[`stageText_${item.stage}` as keyof typeof styles] || styles.stageTextDefault]}>
            {item.stage.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.company}>{item.jobs?.companies?.name || 'Unknown Company'}</Text>
      <Text style={styles.date}>Last updated: {new Date(item.updated_at).toLocaleDateString()}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: Colors.dark.background }]}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Tracker</Text>
      </View>
      {applications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No applications yet. Go discover some jobs!</Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          renderItem={renderApplication}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: Colors.dark.background, paddingHorizontal: 20 },
  headerContainer: { marginTop: 60, marginBottom: 20 },
  headerText: { fontSize: 32, fontWeight: '900', color: Colors.dark.text, letterSpacing: -0.5 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyStateText: { color: Colors.dark.textSecondary, fontSize: 16 },
  card: { 
    backgroundColor: Colors.dark.backgroundElement, 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  jobTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark.text, flex: 1, marginRight: 10 },
  company: { fontSize: 14, color: Colors.dark.textSecondary, marginTop: 4, fontWeight: '500' },
  date: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 12 },
  
  stageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  stageText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  
  stageDefault: { backgroundColor: 'rgba(255,255,255,0.1)' },
  stageTextDefault: { color: Colors.dark.textSecondary },
  
  stage_applied: { backgroundColor: 'rgba(0, 229, 255, 0.15)' },
  stageText_applied: { color: '#00e5ff' },
  
  stage_interview: { backgroundColor: 'rgba(255, 159, 28, 0.15)' },
  stageText_interview: { color: '#ff9f1c' },
  
  stage_offer: { backgroundColor: 'rgba(0, 208, 132, 0.15)' },
  stageText_offer: { color: '#00d084' },
  
  stage_rejected: { backgroundColor: 'rgba(255, 42, 85, 0.15)' },
  stageText_rejected: { color: '#ff2a55' },
});
