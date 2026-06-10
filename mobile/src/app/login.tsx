import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error', error.message);
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      Alert.alert('Error', error.message);
    } else if (!data.session) {
      Alert.alert('Success', 'Check your email for the confirmation link!');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>JobHawk</Text>
          <Text style={styles.brandSubtitle}>Your AI-powered application agent</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor={Colors.dark.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.dark.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={[styles.primaryBtn, loading && styles.disabledBtn]} 
            onPress={handleSignIn} 
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryBtn, loading && styles.disabledBtn]} 
            onPress={handleSignUp} 
            disabled={loading}
          >
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  brandContainer: { alignItems: 'center', marginBottom: 60 },
  brandTitle: { fontSize: 48, fontWeight: '900', color: Colors.dark.text, letterSpacing: -1 },
  brandSubtitle: { fontSize: 16, color: Colors.dark.accent, marginTop: 8, fontWeight: '500' },
  formContainer: { width: '100%' },
  input: {
    backgroundColor: Colors.dark.backgroundElement,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: Colors.dark.accent,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: { color: Colors.dark.background, fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: {
    backgroundColor: 'transparent',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  secondaryBtnText: { color: Colors.dark.text, fontSize: 16, fontWeight: '600' },
  disabledBtn: { opacity: 0.6 },
});
