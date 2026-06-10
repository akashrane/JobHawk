import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import { Colors } from '@/constants/theme';

export default function JobsScreen() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);

  const fetchJobs = async () => {
    if (!session?.user) return;
    
    const { data, error } = await supabase
      .from('jobs')
      .select('*, companies(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) console.error('Error fetching jobs:', error);
    else setJobs(data || []);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [session]);

  const handleApply = async (jobId: string) => {
    if (!session?.user) return;
    
    const { data: resumes } = await supabase
      .from('resumes')
      .select('id')
      .eq('user_id', session.user.id)
      .limit(1);
      
    if (!resumes || resumes.length === 0) {
      Alert.alert('No Resume Found', 'Please upload a resume in your profile before applying.');
      return;
    }

    const { error } = await supabase
      .from('drafts')
      .insert({
        user_id: session.user.id,
        job_id: jobId,
        resume_id: resumes[0].id,
        status: 'pending'
      });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Draft Created', 'Your AI agent is drafting your application. Check your Dashboard to review it soon!');
      setJobs(jobs.filter(j => j.id !== jobId));
    }
  };

  const renderJob = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.jobTitle}>{item.title}</Text>
      <Text style={styles.company}>{item.companies?.name || 'Unknown Company'} • {item.location}</Text>
      <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.passButton} onPress={() => setJobs(jobs.filter(j => j.id !== item.id))}>
          <Text style={styles.passText}>Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyButton} onPress={() => handleApply(item.id)}>
          <Text style={styles.applyText}>1-Click Apply</Text>
        </TouchableOpacity>
      </View>
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
        <Text style={styles.headerText}>Discover</Text>
      </View>
      <FlatList
        data={jobs}
        renderItem={renderJob}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: Colors.dark.background, paddingHorizontal: 20 },
  headerContainer: { marginTop: 60, marginBottom: 20 },
  headerText: { fontSize: 32, fontWeight: '900', color: Colors.dark.text, letterSpacing: -0.5 },
  card: { 
    backgroundColor: Colors.dark.backgroundElement, 
    padding: 24, 
    borderRadius: 20, 
    marginBottom: 16, 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  jobTitle: { fontSize: 20, fontWeight: '800', color: Colors.dark.text, marginBottom: 6 },
  company: { fontSize: 15, color: Colors.dark.accent, fontWeight: '600' },
  description: { fontSize: 14, color: Colors.dark.textSecondary, marginTop: 12, lineHeight: 20 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  passButton: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 14, 
    backgroundColor: 'transparent', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  passText: { color: Colors.dark.textSecondary, fontWeight: '700', fontSize: 15 },
  applyButton: { 
    flex: 1, 
    padding: 14, 
    borderRadius: 14, 
    backgroundColor: Colors.dark.accent, 
    alignItems: 'center',
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  applyText: { color: Colors.dark.background, fontWeight: '800', fontSize: 15 },
});
