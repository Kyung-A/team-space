import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  type Schedule,
  type PracticeSession,
  getScheduleStatus,
  getPracticeStatus,
} from '@/lib/mockSchedules';
import { ScheduleStatusBadge, PracticeStatusBadge } from './StatusBadge';
import { MemberAvatarRow } from './MemberAvatars';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}.${String(m).padStart(2, '0')}.${String(day).padStart(2, '0')} (${WEEKDAYS[d.getDay()]})`;
}

interface Props {
  schedule: Schedule;
}

export function ScheduleListItem({ schedule }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const status = getScheduleStatus(schedule);

  const goDetail = () =>
    router.push({
      pathname: '/schedules/[id]',
      params: { id: schedule.id },
    });

  return (
    <View className="border border-outline-200 rounded-xl bg-background-0 overflow-hidden">
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        className="p-4 flex-row items-center justify-between active:bg-background-50"
      >
        <View className="flex-1 pr-3">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-base font-bold text-typography-900"
              numberOfLines={1}
            >
              {schedule.name}
            </Text>
            <ScheduleStatusBadge status={status} />
          </View>
          <Text className="mt-1 text-sm text-typography-500" numberOfLines={1}>
            {schedule.eventDate ? formatDate(schedule.eventDate) : '공연일 미정'}
            {'  ·  '}
            {schedule.location || '장소 미정'}
          </Text>
        </View>
        <Text className="text-typography-400 text-xs">{open ? '▲' : '▼'}</Text>
      </Pressable>

      {open ? (
        <ScheduleDetail schedule={schedule} onPressDetail={goDetail} />
      ) : null}
    </View>
  );
}

interface DetailProps extends Props {
  onPressDetail: () => void;
}

function ScheduleDetail({ schedule, onPressDetail }: DetailProps) {
  return (
    // 펼친 요약 영역 전체를 누르면 상세 화면으로 이동
    <Pressable
      onPress={onPressDetail}
      accessibilityRole="button"
      accessibilityHint="상세 화면으로 이동"
      className="px-4 pb-3 pt-3 border-t border-outline-100 gap-4 bg-background-50 active:bg-background-100"
    >
      <View>
        <Text className="text-xs font-medium text-typography-500 mb-2">
          참여 멤버
        </Text>
        <MemberAvatarRow names={schedule.participants} />
      </View>

      <View>
        <Text className="text-xs font-medium text-typography-500 mb-2">
          연습 일정
        </Text>
        {schedule.practiceSessions.length === 0 ? (
          <Text className="text-sm text-typography-400">
            등록된 연습이 없어요.
          </Text>
        ) : (
          <View className="gap-3">
            {schedule.practiceSessions.map((p) => (
              <PracticeRow key={p.id} session={p} />
            ))}
          </View>
        )}
      </View>

      {/* 영역 탭 = 상세 이동 힌트 */}
      <View className="flex-row items-center justify-end pt-1">
        <Text className="text-sm font-medium text-primary-600">상세 보기</Text>
        <Text className="text-sm font-medium text-primary-600"> ›</Text>
      </View>
    </Pressable>
  );
}

function PracticeRow({ session }: { session: PracticeSession }) {
  const status = getPracticeStatus(session);
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-1">
        <Text className="text-sm text-typography-800">
          {formatDate(session.date)}
        </Text>
        <Text className="text-xs text-typography-400">
          {session.startTime}~{session.endTime} · {session.location}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <MemberAvatarRow
          names={session.participants.map((p) => p.name)}
          size="sm"
          max={4}
        />
        <PracticeStatusBadge status={status} />
      </View>
    </View>
  );
}
