import { useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { Calendar, LocaleConfig, type DateData } from 'react-native-calendars';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetScrollView,
} from '@/components/ui/actionsheet';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { MemberAvatar } from './MemberAvatars';
import { addSchedule, getTeamMembers } from '@/lib/mockSchedules';
import { useSession } from '@/lib/session';
import { notify } from '@/lib/notify';

const RANGE_COLOR = '#404040'; // primary 계열 (기본 테마)

// 캘린더 한글화
LocaleConfig.locales['ko'] = {
  monthNames: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월',
  ],
  monthNamesShort: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월',
  ],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';

interface FormValues {
  name: string;
  location: string;
  eventDate: string | null;
  practiceStart: string | null;
  practiceEnd: string | null;
  participants: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function ScheduleCreateSheet({ isOpen, onClose, onCreated }: Props) {
  const insets = useSafeAreaInsets();
  // 상태바(노치) 아래까지만 차지하도록 높이를 인셋 기준으로 계산.
  // snapPoints는 화면 높이 대비 퍼센트라, 상단 여백만큼 빼서 시트 top이 상태바 아래에 오게 한다.
  const windowHeight = Dimensions.get('window').height;
  const topGap = Math.max(insets.top, 12);
  const sheetPercent = Math.round((1 - topGap / windowHeight) * 100);

  const userName = useSession((s) => s.userName);
  const members = getTeamMembers(userName ?? undefined);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      location: '',
      eventDate: null,
      practiceStart: null,
      practiceEnd: null,
      participants: [],
    },
  });

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = (v: FormValues) => {
    addSchedule({
      name: v.name,
      location: v.location,
      eventDate: v.eventDate,
      practiceStart: v.practiceStart,
      practiceEnd: v.practiceEnd,
      participants: v.participants,
    });
    reset();
    onCreated();
    // 백엔드 미연결: 참여 멤버 푸시 알림은 알림으로 시뮬레이션
    notify(
      '등록 완료',
      v.participants.length > 0
        ? `참여 멤버 ${v.participants.length}명에게 일정 등록 요청 알림을 보냈어요.`
        : '일정이 등록되었어요.'
    );
  };

  return (
    <Actionsheet isOpen={isOpen} onClose={close} snapPoints={[sheetPercent]}>
      <ActionsheetBackdrop />
      <ActionsheetContent>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        {/* 최상단: 제목 + 닫기 */}
        <View className="w-full flex-row items-center justify-between px-1 pt-1 pb-2">
          <Text className="text-lg font-bold text-typography-900">일정 추가</Text>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="닫기"
            className="px-2 py-1 active:opacity-60"
          >
            <Text className="text-xl text-typography-500">✕</Text>
          </Pressable>
        </View>

        <ActionsheetScrollView className="w-full flex-1">
          <View className="gap-5 pb-2">
            {/* 일정명 (필수) */}
            <Field label="일정명" required error={errors.name?.message}>
              <Controller
                control={control}
                name="name"
                rules={{ required: '일정명을 입력해 주세요.' }}
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input>
                    <InputField
                      placeholder="예: 정기 공연"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  </Input>
                )}
              />
            </Field>

            {/* 일정일 (선택, 단일 날짜) */}
            <Controller
              control={control}
              name="eventDate"
              render={({ field: { value, onChange } }) => (
                <SingleDateField
                  label="일정일"
                  value={value}
                  onChange={onChange}
                />
              )}
            />

            {/* 장소 (선택) */}
            <Field label="장소">
              <Controller
                control={control}
                name="location"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input>
                    <InputField
                      placeholder="예: 강남 OO홀"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  </Input>
                )}
              />
            </Field>

            {/* 연습 기간 (선택, range 캘린더) */}
            <Controller
              control={control}
              name="practiceStart"
              render={({ field: { value: start, onChange: onStart } }) => (
                <Controller
                  control={control}
                  name="practiceEnd"
                  render={({ field: { value: end, onChange: onEnd } }) => (
                    <RangeDateField
                      label="연습 기간"
                      start={start}
                      end={end}
                      onChange={(s, e) => {
                        onStart(s);
                        onEnd(e);
                      }}
                    />
                  )}
                />
              )}
            />

            {/* 참여 멤버 (선택, 다중 선택) */}
            <Field label="일정 참여 멤버">
              <Controller
                control={control}
                name="participants"
                render={({ field: { value, onChange } }) => (
                  <View className="border border-outline-200 rounded-xl overflow-hidden">
                    {members.map((m, i) => {
                      const selected = value.includes(m);
                      return (
                        <Pressable
                          key={m}
                          onPress={() =>
                            onChange(
                              selected
                                ? value.filter((x) => x !== m)
                                : [...value, m]
                            )
                          }
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected }}
                          className={`flex-row items-center justify-between px-3 py-2.5 active:bg-background-50 ${
                            i > 0 ? 'border-t border-outline-100' : ''
                          }`}
                        >
                          <View className="flex-row items-center gap-2">
                            <MemberAvatar name={m} size="sm" />
                            <Text className="text-sm text-typography-800">
                              {m}
                              {m === userName ? ' (나)' : ''}
                            </Text>
                          </View>
                          <View
                            className={`w-5 h-5 rounded items-center justify-center border ${
                              selected
                                ? 'bg-primary-500 border-primary-500'
                                : 'border-outline-300'
                            }`}
                          >
                            {selected ? (
                              <Text className="text-white text-[11px]">✓</Text>
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
            </Field>
          </View>
        </ActionsheetScrollView>

        {/* 저장 */}
        <View className="w-full pt-3">
          <Button size="xl" action="primary" onPress={handleSubmit(onSubmit)}>
            <ButtonText>저장</ButtonText>
          </Button>
        </View>
      </ActionsheetContent>
    </Actionsheet>
  );
}

// --- 보조 컴포넌트 ---------------------------------------------------------

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, required, error, children }: FieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-typography-700">
        {label}
        {required ? <Text className="text-error-600"> *</Text> : null}
      </Text>
      {children}
      {error ? <Text className="text-sm text-error-600">{error}</Text> : null}
    </View>
  );
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${WEEKDAYS[d.getDay()]})`;
}

interface SingleDateProps {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
}

function SingleDateField({ label, value, onChange }: SingleDateProps) {
  const [open, setOpen] = useState(false);
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-typography-700">{label}</Text>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        className="h-12 px-3 rounded border border-outline-200 flex-row items-center justify-between active:bg-background-50"
      >
        <Text
          className={`text-base ${value ? 'text-typography-900' : 'text-typography-400'}`}
        >
          {value ? formatDate(value) : '날짜 선택 (선택)'}
        </Text>
        {value ? (
          <Pressable onPress={() => onChange(null)} className="px-1">
            <Text className="text-typography-400">✕</Text>
          </Pressable>
        ) : (
          <Text className="text-typography-400 text-xs">{open ? '▲' : '▼'}</Text>
        )}
      </Pressable>
      {open ? (
        <Calendar
          monthFormat="yyyy년 M월"
          onDayPress={(d: DateData) => {
            onChange(value === d.dateString ? null : d.dateString);
            setOpen(false);
          }}
          markedDates={
            value ? { [value]: { selected: true, selectedColor: RANGE_COLOR } } : {}
          }
        />
      ) : null}
    </View>
  );
}

interface RangeDateProps {
  label: string;
  start: string | null;
  end: string | null;
  onChange: (start: string | null, end: string | null) => void;
}

function RangeDateField({ label, start, end, onChange }: RangeDateProps) {
  const [open, setOpen] = useState(false);

  const onDayPress = (d: DateData) => {
    const day = d.dateString;
    if (!start || (start && end)) {
      onChange(day, null); // 새 범위 시작
    } else if (day < start) {
      onChange(day, null); // 시작보다 이전이면 다시 시작점으로
    } else {
      onChange(start, day); // 범위 종료 → 캘린더 닫기
      setOpen(false);
    }
  };

  const summary =
    start && end
      ? `${formatDate(start)} ~ ${formatDate(end)}`
      : start
        ? `${formatDate(start)} ~ (종료일 선택)`
        : '기간 선택 (선택)';

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-typography-700">{label}</Text>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        className="min-h-12 px-3 py-2 rounded border border-outline-200 flex-row items-center justify-between active:bg-background-50"
      >
        <Text
          className={`flex-1 text-base ${start ? 'text-typography-900' : 'text-typography-400'}`}
        >
          {summary}
        </Text>
        {start ? (
          <Pressable onPress={() => onChange(null, null)} className="px-1">
            <Text className="text-typography-400">✕</Text>
          </Pressable>
        ) : (
          <Text className="text-typography-400 text-xs">{open ? '▲' : '▼'}</Text>
        )}
      </Pressable>
      {open ? (
        <Calendar
          monthFormat="yyyy년 M월"
          markingType="period"
          markedDates={buildPeriodMarks(start, end)}
          onDayPress={onDayPress}
        />
      ) : null}
    </View>
  );
}

type PeriodMark = {
  startingDay?: boolean;
  endingDay?: boolean;
  color?: string;
  textColor?: string;
};

function buildPeriodMarks(
  start: string | null,
  end: string | null
): Record<string, PeriodMark> {
  if (!start) return {};
  if (!end) {
    return {
      [start]: {
        startingDay: true,
        endingDay: true,
        color: RANGE_COLOR,
        textColor: 'white',
      },
    };
  }
  const marks: Record<string, PeriodMark> = {};
  const cur = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  while (cur <= last) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const day = String(cur.getDate()).padStart(2, '0');
    const ds = `${y}-${m}-${day}`;
    marks[ds] = {
      color: ds === start || ds === end ? RANGE_COLOR : '#e5e5e5',
      textColor: ds === start || ds === end ? 'white' : '#1f1f1f',
      startingDay: ds === start,
      endingDay: ds === end,
    };
    cur.setDate(cur.getDate() + 1);
  }
  return marks;
}
