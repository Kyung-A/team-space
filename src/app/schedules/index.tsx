import { useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/lib/session';
import {
  getSchedules,
  getScheduleStatus,
  type ScheduleStatus,
} from '@/lib/mockSchedules';
import { ScheduleListItem } from '@/components/schedules/ScheduleListItem';
import { ScheduleFilters } from '@/components/schedules/ScheduleFilters';
import { ScheduleCreateSheet } from '@/components/schedules/ScheduleCreateSheet';
import { TabBar } from '@/components/TabBar';
import { Button, ButtonText } from '@/components/ui/button';

export default function Schedules() {
  const { teamName, userName, role } = useSession();
  const isAdmin = role === 'admin';

  const [statuses, setStatuses] = useState<ScheduleStatus[]>([]);
  const [mineOnly, setMineOnly] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  // 인메모리 목업이라 추가 후 강제 리렌더로 목록을 갱신한다
  const [, setRefresh] = useState(0);

  const toggleStatus = (s: ScheduleStatus) =>
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const schedules = getSchedules().filter((s) => {
    const statusOk =
      statuses.length === 0 || statuses.includes(getScheduleStatus(s));
    const mineOk =
      !mineOnly || (!!userName && s.participants.includes(userName));
    return statusOk && mineOk;
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 w-full max-w-md mx-auto">
        {/* 최상단: 제목 + 일정 추가(운영진만) */}
        <View className="px-4 pt-2 pb-3 flex-row items-end justify-between">
          <View>
            {teamName ? (
              <Text className="text-sm text-typography-500">{teamName}</Text>
            ) : null}
            <Text className="text-2xl font-bold text-typography-900">일정</Text>
          </View>
          {isAdmin ? (
            <Button
              size="sm"
              action="primary"
              onPress={() => setSheetOpen(true)}
            >
              <ButtonText>일정 추가하기</ButtonText>
            </Button>
          ) : null}
        </View>

        {/* 개발용 역할 전환 (운영진/멤버 뷰 확인) */}
        <Pressable
          onPress={useSession.getState().toggleRole}
          className="mx-4 mb-2 self-start px-2 py-1 rounded bg-background-100"
        >
          <Text className="text-[11px] text-typography-500">
            개발용 · 현재 역할: {role === 'admin' ? '운영진' : '멤버'} (탭하여 전환)
          </Text>
        </Pressable>

        {/* 필터 */}
        <ScheduleFilters
          statuses={statuses}
          onToggleStatus={toggleStatus}
          mineOnly={mineOnly}
          onToggleMine={() => setMineOnly((m) => !m)}
        />

        {/* 목록 */}
        <FlatList
          data={schedules}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ScheduleListItem schedule={item} />}
          contentContainerClassName="px-4 pt-3 pb-6 gap-3"
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-base text-typography-500">
                조건에 맞는 일정이 없어요.
              </Text>
            </View>
          }
        />
      </View>

      <TabBar />

      <ScheduleCreateSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={() => {
          setSheetOpen(false);
          setRefresh((n) => n + 1);
        }}
      />
    </SafeAreaView>
  );
}
