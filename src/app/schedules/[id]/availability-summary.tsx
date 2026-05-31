import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getScheduleById } from '@/lib/mockSchedules';

/**
 * 멤버 연습 가능 스케줄 보기 — 추후 본격 구현 예정.
 * 현재는 라우트 끝점 placeholder.
 */
export default function AvailabilitySummaryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const schedule = id ? getScheduleById(id) : undefined;

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace(`/schedules/${id}`);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 w-full max-w-md mx-auto">
        <View className="px-4 py-2 flex-row items-center gap-2">
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            className="-ml-1 px-1 py-1 active:opacity-60"
          >
            <Text className="text-base text-primary-600">‹ 뒤로</Text>
          </Pressable>
          <Text
            className="flex-1 text-base font-bold text-typography-900"
            numberOfLines={1}
          >
            {schedule?.name ?? '일정'} · 멤버 연습 가능 스케줄
          </Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-typography-500 text-center">
            멤버 연습 가능 스케줄 보기 화면은 곧 제공됩니다.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
