import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { haptics } from '@/services/haptics';

interface RestTimerModalProps {
  visible: boolean;
  initialSeconds?: number;
  onClose: () => void;
  onComplete?: () => void;
}

export function RestTimerModal({
  visible,
  initialSeconds = 90,
  onClose,
  onComplete,
}: RestTimerModalProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [totalTime, setTotalTime] = useState(initialSeconds);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      setTimeLeft(initialSeconds);
      setTotalTime(initialSeconds);
      setIsRunning(true);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [visible, initialSeconds]);

  useEffect(() => {
    if (visible && isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            haptics.success();
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, isRunning, onComplete]);

  const setPreset = (sec: number) => {
    haptics.selection();
    setTotalTime(sec);
    setTimeLeft(sec);
    setIsRunning(true);
  };

  const addTime = (delta: number) => {
    haptics.selection();
    setTimeLeft((prev) => Math.max(prev + delta, 0));
    setTotalTime((prev) => Math.max(prev + delta, 0));
  };

  const toggleRunning = () => {
    haptics.light();
    setIsRunning((prev) => !prev);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Rest Timer</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={26} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Time Display */}
          <View style={styles.displayArea}>
            <Text style={[styles.timerNumber, { color: timeLeft === 0 ? theme.accent : theme.text }]}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={[styles.subText, { color: theme.textMuted }]}>
              {timeLeft === 0 ? 'Rest complete — start your set!' : isRunning ? 'Resting...' : 'Paused'}
            </Text>

            {/* Progress Bar */}
            <View style={[styles.progressTrack, { backgroundColor: theme.subtle }]}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: timeLeft === 0 ? theme.accent : theme.accent,
                  },
                ]}
              />
            </View>
          </View>

          {/* Preset Buttons */}
          <View style={styles.presetRow}>
            {[60, 90, 120, 180].map((sec) => (
              <TouchableOpacity
                key={sec}
                style={[
                  styles.presetBtn,
                  {
                    backgroundColor: totalTime === sec ? theme.text : theme.subtle,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setPreset(sec)}
              >
                <Text
                  style={[
                    styles.presetText,
                    { color: totalTime === sec ? (colorScheme === 'dark' ? '#000' : '#FFF') : theme.text },
                  ]}
                >
                  {sec}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Time adjustment controls */}
          <View style={styles.adjustRow}>
            <TouchableOpacity
              style={[styles.adjustBtn, { backgroundColor: theme.subtle }]}
              onPress={() => addTime(-15)}
            >
              <Text style={[styles.adjustText, { color: theme.text }]}>-15s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mainControlBtn,
                { backgroundColor: isRunning ? theme.subtle : theme.accent },
              ]}
              onPress={toggleRunning}
            >
              <Ionicons
                name={isRunning ? 'pause' : 'play'}
                size={22}
                color={isRunning ? theme.text : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.mainControlText,
                  { color: isRunning ? theme.text : '#FFFFFF', marginLeft: 6 },
                ]}
              >
                {isRunning ? 'Pause' : 'Resume'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.adjustBtn, { backgroundColor: theme.subtle }]}
              onPress={() => addTime(15)}
            >
              <Text style={[styles.adjustText, { color: theme.text }]}>+15s</Text>
            </TouchableOpacity>
          </View>

          {/* Dismiss button */}
          <TouchableOpacity
            style={[styles.doneBtn, { borderColor: theme.border }]}
            onPress={onClose}
          >
            <Text style={[styles.doneText, { color: theme.textMuted }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  displayArea: {
    alignItems: 'center',
    marginVertical: 12,
    width: '100%',
  },
  timerNumber: {
    fontSize: 54,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  subText: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 16,
  },
  presetBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
  },
  adjustBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  adjustText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mainControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
  },
  mainControlText: {
    fontSize: 14,
    fontWeight: '600',
  },
  doneBtn: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  doneText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
