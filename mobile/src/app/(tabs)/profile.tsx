import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthProvider';
import { Colors } from '@/constants/theme';
import * as DocumentPicker from 'expo-document-picker';

export default function ProfileScreen() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>({});
  const [resumes, setResumes] = useState<any[]>([]);

  const fetchProfileData = async () => {
    if (!session?.user) return;
    
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileData) setProfile(profileData);

    const { data: resumeData } = await supabase
      .from('resumes')
      .select('id, label, file_name')
      .eq('user_id', session.user.id);

    if (resumeData) setResumes(resumeData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchProfileData();
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('user_profiles')
      .update({
        full_name: profile.full_name,
        target_roles: profile.target_roles, 
      })
      .eq('id', session?.user.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Profile updated');
    }
    setLoading(false);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        Alert.alert('Upload Started', 'In a full app, this would upload to Supabase Storage.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: Colors.dark.background }]}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Profile</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={profile.full_name || ''}
          onChangeText={(text) => setProfile({ ...profile, full_name: text })}
          placeholder="John Doe"
          placeholderTextColor="rgba(255,255,255,0.3)"
        />
        
        <Text style={styles.label}>Target Roles (comma separated)</Text>
        <TextInput
          style={styles.input}
          value={profile.target_roles ? profile.target_roles.join(', ') : ''}
          onChangeText={(text) => setProfile({ ...profile, target_roles: text.split(',').map((s: string) => s.trim()) })}
          placeholder="Software Engineer, Data Scientist"
          placeholderTextColor="rgba(255,255,255,0.3)"
        />
        
        <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdateProfile}>
          <Text style={styles.primaryBtnText}>Save Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Resumes</Text>
        {resumes.length === 0 ? (
          <Text style={styles.emptyText}>No resumes uploaded yet.</Text>
        ) : (
          resumes.map(r => (
            <View key={r.id} style={styles.resumeCard}>
              <Text style={styles.resumeTitle}>{r.label || r.file_name}</Text>
            </View>
          ))
        )}
        <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
          <Text style={styles.uploadBtnText}>+ Upload PDF Resume</Text>
        </TouchableOpacity>
        <Text style={styles.hintText}>* Use web version if mobile upload fails</Text>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: Colors.dark.background, paddingHorizontal: 20 },
  headerContainer: { marginTop: 60, marginBottom: 20 },
  headerText: { fontSize: 32, fontWeight: '900', color: Colors.dark.text, letterSpacing: -0.5 },
  section: { 
    backgroundColor: Colors.dark.backgroundElement, 
    padding: 24, 
    borderRadius: 20, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark.text, marginBottom: 15 },
  label: { fontSize: 13, color: Colors.dark.textSecondary, marginBottom: 8, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  input: { 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 20, 
    fontSize: 16,
    color: Colors.dark.text,
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  primaryBtn: {
    backgroundColor: Colors.dark.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  primaryBtnText: { color: Colors.dark.background, fontSize: 16, fontWeight: '800' },
  emptyText: { color: Colors.dark.textSecondary, fontStyle: 'italic', marginBottom: 15 },
  resumeCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  resumeTitle: { fontWeight: '600', color: Colors.dark.text },
  uploadBtn: { padding: 16, borderRadius: 12, backgroundColor: 'rgba(0, 229, 255, 0.1)', alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: Colors.dark.accent },
  uploadBtnText: { color: Colors.dark.accent, fontWeight: '800' },
  hintText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 12, textAlign: 'center' },
  signOutBtn: { marginTop: 20, padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: 'rgba(255, 42, 85, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 42, 85, 0.3)' },
  signOutText: { color: Colors.dark.danger, fontWeight: '800', fontSize: 16 },
});
