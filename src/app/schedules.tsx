import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function Schedules() {
  const { teamName } = useLocalSearchParams<{ teamName?: string }>();

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 w-full max-w-md mx-auto px-6 pt-16">
        {/* 헤더: 현재 팀 */}
        <Text className="text-sm text-typography-500">팀</Text>
        <Text className="text-2xl font-bold text-typography-900">
          {teamName ?? '내 팀'}
        </Text>

        {/* 빈 상태 (일정 목록 기능은 추후 추가) */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-typography-500">
            아직 등록된 일정이 없어요.
          </Text>
          <Text className="mt-1 text-sm text-typography-400">
            곧 일정 등록 기능이 추가됩니다.
          </Text>
        </View>
      </View>
    </View>
  );
}
