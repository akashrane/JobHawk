import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

interface Draft {
  id: string;
  jobs: { title: string; companies: { name: string } };
}

export default function DraftDeck({ drafts, onComplete }: { drafts: Draft[], onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleAction = async (draftId: string, action: 'approved' | 'rejected') => {
    setCurrentIndex(prev => prev + 1);
    
    // Update in supabase
    const { error } = await supabase
      .from('drafts')
      .update({ status: action })
      .eq('id', draftId);
      
    if (error) console.error(`Failed to ${action} draft:`, error);
    
    if (currentIndex >= drafts.length - 1) {
      onComplete();
    }
  };

  if (currentIndex >= drafts.length || drafts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>You're all caught up!</Text>
        <Text style={styles.emptySubtext}>Check back later for new AI drafts.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {drafts.map((draft, index) => {
        if (index < currentIndex) return null;
        if (index > currentIndex + 2) return null; // Only render top 3 to save memory

        return (
          <SwipeableCard
            key={draft.id}
            draft={draft}
            index={index}
            currentIndex={currentIndex}
            totalDrafts={drafts.length}
            onAction={(action: any) => handleAction(draft.id, action)}
          />
        );
      }).reverse()}
    </View>
  );
}

const SwipeableCard = ({ draft, index, currentIndex, totalDrafts, onAction }: any) => {
  const isTop = index === currentIndex;
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = Math.sign(event.translationX);
        translateX.value = withTiming(direction * width * 1.5, { duration: 250 }, () => {
          runOnJS(onAction)(direction > 0 ? 'approved' : 'rejected');
        });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    if (!isTop) {
      const offset = (index - currentIndex) * 12;
      const scale = 1 - (index - currentIndex) * 0.05;
      return {
        transform: [
          { translateY: offset },
          { scale }
        ],
        zIndex: totalDrafts - index,
      };
    }

    const rotate = interpolate(translateX.value, [-width / 2, 0, width / 2], [-10, 0, 10]) + 'deg';
    
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate }
      ],
      zIndex: totalDrafts - index,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.cardHeader}>
          <Text style={styles.draftBadge}>✨ AI Generated Draft</Text>
        </View>
        <Text style={styles.jobTitle}>{draft.jobs?.title}</Text>
        <Text style={styles.company}>{draft.jobs?.companies?.name || 'Unknown Company'}</Text>
        
        <View style={styles.overlayWrapper}>
          <Text style={styles.instruction}>Swipe Left to Pass  •  Swipe Right to Apply</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: { height: 260, width: '100%', alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  emptyContainer: { height: 200, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.dark.backgroundElement, borderRadius: 24, marginVertical: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyText: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold' },
  emptySubtext: { color: Colors.dark.textSecondary, fontSize: 14, marginTop: 8 },
  card: {
    position: 'absolute',
    width: '100%',
    height: 240,
    backgroundColor: Colors.dark.backgroundSelected,
    borderRadius: 24,
    padding: 24,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  cardHeader: { marginBottom: 20, alignItems: 'flex-start' },
  draftBadge: { backgroundColor: Colors.dark.accentLight, color: Colors.dark.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  jobTitle: { color: Colors.dark.text, fontSize: 24, fontWeight: '800', marginBottom: 8 },
  company: { color: Colors.dark.textSecondary, fontSize: 18, fontWeight: '500' },
  overlayWrapper: { position: 'absolute', bottom: 24, left: 24, right: 24, alignItems: 'center' },
  instruction: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700' }
});
