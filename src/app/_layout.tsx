import '@/global.css';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GluestackUIProvider mode="light">
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'white' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="create-team"
            options={{ headerShown: true, title: '팀 생성하기', headerBackTitle: '뒤로' }}
          />
          <Stack.Screen
            name="join-team"
            options={{ headerShown: true, title: '팀 합류하기', headerBackTitle: '뒤로' }}
          />
          <Stack.Screen name="schedules/index" options={{ gestureEnabled: false }} />
          <Stack.Screen name="schedules/[id]/index" />
          <Stack.Screen name="schedules/[id]/availability" />
          <Stack.Screen name="schedules/[id]/availability-summary" />
        </Stack>
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}
