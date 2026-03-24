import { useMutation } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useInstanceStore } from '../../store/instanceStore';
import { palette } from '../../theme/colors';
import { radius, spacing } from '../../theme';
import { validateInstance } from '../../utils/instance';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Instance'>;

export function InstanceScreen({ navigation }: Props) {
  const isDark = useColorScheme() !== 'light';
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recentInstances = useInstanceStore((state) => state.recentInstanceUrls);
  const setActiveInstance = useInstanceStore((state) => state.setActiveInstance);

  const validationMutation = useMutation({
    mutationFn: validateInstance,
    onSuccess: (result) => {
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setError(null);
      setActiveInstance(result.normalizedUrl);
      navigation.replace('Login');
    },
    onError: () => {
      setError('Die Instanz konnte nicht validiert werden.');
    },
  });

  const handleContinue = () => {
    setError(null);
    validationMutation.mutate(input);
  };

  const handleRecent = (value: string) => {
    setInput(value);
    setError(null);
  };

  const handlePaste = async () => {
    const clipboard = await Clipboard.getStringAsync();
    if (clipboard.trim()) {
      setInput(clipboard.trim());
    }
  };

  return (
    <Screen
      scrollable
      footer={<Button label="Instanz prüfen" onPress={handleContinue} loading={validationMutation.isPending} />}
    >
      <View style={styles.hero}>
        <Text style={[styles.eyebrow, { color: isDark ? palette.accent : palette.accentStrong }]}>FediSuite</Text>
        <Text style={[styles.title, { color: isDark ? palette.text : palette.lightText }]}>Instanz zuerst, Login danach.</Text>
        <Text style={[styles.subtitle, { color: isDark ? palette.textMuted : palette.lightTextMuted }]}>
          Verbinde die App mit einer FediSuite-Instanz deiner Wahl, zum Beispiel mit `app.fedisuite.com` oder mit deiner eigenen gehosteten Instanz.
        </Text>
      </View>

      <Card>
        <TextField
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          label="FediSuite-Instanz"
          placeholder="https://app.fedisuite.com"
          value={input}
          onChangeText={setInput}
          error={error}
          hint="Gib die URL der Instanz an, bei der du dich anmelden willst. HTTPS ist Standard. HTTP ist nur für lokale Entwicklung oder LAN zulässig."
        />
        <Button label="Aus Zwischenablage" onPress={handlePaste} variant="secondary" />
      </Card>

      {recentInstances.length > 0 ? (
        <Card>
          <Text style={[styles.sectionTitle, { color: isDark ? palette.text : palette.lightText }]}>Zuletzt verwendet</Text>
          <View style={styles.recentList}>
            {recentInstances.map((value) => (
              <Pressable
                key={value}
                onPress={() => handleRecent(value)}
                style={({ pressed }) => [
                  styles.recentChip,
                  {
                    backgroundColor: isDark ? palette.panelMuted : palette.surfaceMuted,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={{ color: isDark ? palette.text : palette.lightText }}>{value}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  recentList: {
    gap: spacing.sm,
  },
  recentChip: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
