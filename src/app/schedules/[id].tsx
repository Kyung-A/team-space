import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSession } from '@/lib/session';
import {
  getScheduleById,
  getScheduleStatus,
  getPracticeStatus,
  type PracticeSession,
} from '@/lib/mockSchedules';
import { ScheduleStatusBadge, PracticeStatusBadge } from '@/components/schedules/StatusBadge';
import { MemberAvatarRow, MemberAvatar } from '@/components/schedules/MemberAvatars';
import { Button, ButtonText } from '@/components/ui/button';
import { notify } from '@/lib/notify';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${WEEKDAYS[d.getDay()]})`;
}

function formatPeriod(start: string | null, end: string | null): string {
  if (!start || !end) return '미정';
  return `${formatDate(start)} ~ ${formatDate(end)}`;
}

export default function ScheduleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userName, role } = useSession();

  const schedule = id ? getScheduleById(id) : undefined;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/schedules'));

  if (!schedule) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-1 w-full max-w-md mx-auto px-4">
          <TopBar onBack={goBack} />
          <View className="flex-1 items-center justify-center">
            <Text className="text-base text-typography-500">
              일정을 찾을 수 없어요.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isAdmin = role === 'admin';
  const isParticipant = !!userName && schedule.participants.includes(userName);
  const status = getScheduleStatus(schedule);
  // 연습 기간이 잡혀 있어야 연습 가능 일정 관련 기능을 노출한다
  const hasPracticePeriod = !!schedule.practiceStart && !!schedule.practiceEnd;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 w-full max-w-md mx-auto">
        {/* 최상단: 목록으로 돌아가기 + 운영진 수정/삭제 */}
        <TopBar onBack={goBack}>
          {isAdmin ? (
            <View className="flex-row items-center gap-1">
              <HeaderTextButton
                label="수정"
                onPress={() => notify('준비 중', '일정 수정 기능은 곧 제공됩니다.')}
              />
              <HeaderTextButton
                label="삭제"
                tone="danger"
                onPress={() =>
                  notify('준비 중', '일정 삭제 기능은 곧 제공됩니다.')
                }
              />
            </View>
          ) : null}
        </TopBar>

        <ScrollView contentContainerClassName="px-4 pb-8 gap-6">
          {/* 타이틀 영역 */}
          <View className="gap-3 pt-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl font-bold text-typography-900">
                {schedule.name}
              </Text>
              <ScheduleStatusBadge status={status} />
            </View>

            <View className="gap-1.5">
              <InfoRow label="일정일" value={schedule.eventDate ? formatDate(schedule.eventDate) : '공연일 미정'} />
              <InfoRow label="장소" value={schedule.location || '장소 미정'} />
              <InfoRow label="연습 기간" value={formatPeriod(schedule.practiceStart, schedule.practiceEnd)} />
            </View>

            <View>
              <Text className="text-xs font-medium text-typography-500 mb-2">
                일정 참여 멤버
              </Text>
              <MemberAvatarRow names={schedule.participants} />
            </View>
          </View>

          {/* 액션 버튼 (미구현 화면 → placeholder). 연습 기간이 없으면 숨김 */}
          {hasPracticePeriod ? (
            <View className="gap-2">
              {isParticipant ? (
                <Button
                  action="primary"
                  onPress={() =>
                    notify('준비 중', '연습 가능 일정 등록 화면은 곧 제공됩니다.')
                  }
                >
                  <ButtonText>연습 가능 일정 등록하기</ButtonText>
                </Button>
              ) : null}
              <Button
                variant="outline"
                action="secondary"
                onPress={() =>
                  notify(
                    '준비 중',
                    isAdmin
                      ? '참여 멤버들의 연습 가능 스케줄 보기 화면은 곧 제공됩니다.'
                      : '연습 가능 스케줄 보기 화면은 곧 제공됩니다.'
                  )
                }
              >
                <ButtonText>
                  {isAdmin ? '멤버 연습 가능 스케줄 보기' : '연습 가능 스케줄 보기'}
                </ButtonText>
              </Button>
            </View>
          ) : null}

          {/* 세부 연습 일정 목록 */}
          <View className="gap-3">
            <Text className="text-base font-bold text-typography-900">
              세부 연습 일정
            </Text>
            {schedule.practiceSessions.length === 0 ? (
              <Text className="text-sm text-typography-400">
                등록된 연습이 없어요.
              </Text>
            ) : (
              schedule.practiceSessions.map((p) => (
                <PracticeCard key={p.id} session={p} />
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

interface TopBarProps {
  onBack: () => void;
  children?: React.ReactNode;
}

function TopBar({ onBack, children }: TopBarProps) {
  return (
    <View className="px-4 py-2 flex-row items-center justify-between">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        className="flex-row items-center -ml-1 px-1 py-1 active:opacity-60"
      >
        <Text className="text-base text-primary-600">‹ 목록으로</Text>
      </Pressable>
      {children}
    </View>
  );
}

interface HeaderTextButtonProps {
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
}

function HeaderTextButton({ label, onPress, tone = 'default' }: HeaderTextButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="px-2 py-1 active:opacity-60"
    >
      <Text
        className={`text-base ${tone === 'danger' ? 'text-error-600' : 'text-typography-700'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row">
      <Text className="w-20 text-sm text-typography-500">{label}</Text>
      <Text className="flex-1 text-sm text-typography-800">{value}</Text>
    </View>
  );
}

function PracticeCard({ session }: { session: PracticeSession }) {
  const status = getPracticeStatus(session);
  return (
    <View className="border border-outline-200 rounded-xl p-4 gap-3 bg-background-0">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-sm font-semibold text-typography-900">
            {formatDate(session.date)}
          </Text>
          <Text className="text-xs text-typography-400">
            {session.startTime}~{session.endTime} · {session.location}
          </Text>
        </View>
        <PracticeStatusBadge status={status} />
      </View>

      {/* 연습 날짜별 참여 멤버 + 비고란 */}
      <View className="gap-2">
        {session.participants.map((p) => (
          <View key={p.name} className="flex-row items-center gap-2">
            <MemberAvatar name={p.name} size="sm" />
            <Text className="text-sm text-typography-800">{p.name}</Text>
            {p.note ? (
              <Text className="flex-1 text-xs text-typography-400" numberOfLines={1}>
                · {p.note}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
