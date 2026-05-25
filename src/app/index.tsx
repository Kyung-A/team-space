import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ButtonText } from '@/components/ui/button';

export default function Index() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 w-full max-w-md mx-auto px-6">
        {/* 중앙: 앱 제목 (추후 로고로 교체 가능) */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-3xl font-bold text-typography-900">팀스페이스</Text>
          <Text className="mt-2 text-base text-typography-500">
            팀의 일정을 한곳에서
          </Text>
        </View>

        {/* 중앙 아래: 진입 버튼 */}
        <View className="pb-12 gap-3">
          <Button
            size="xl"
            action="primary"
            onPress={() => router.push('/create-team')}
          >
            <ButtonText>팀 시작하기</ButtonText>
          </Button>
          <Button
            size="xl"
            variant="outline"
            action="secondary"
            onPress={() => router.push('/join-team')}
          >
            <ButtonText>팀 합류하기</ButtonText>
          </Button>
        </View>
      </View>
    </View>
  );
}
