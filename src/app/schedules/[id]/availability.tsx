import { useMemo, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSession } from '@/lib/session';
import {
  getScheduleById,
  getMyAvailability,
  saveAvailability,
  type AvailabilityInput,
} from '@/lib/mockSchedules';
import { Button, ButtonText } from '@/components/ui/button';
import { notify } from '@/lib/notify';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const HOURS = Array.from(
  { length: 24 },
  (_, i) => `${String(i).padStart(2, '0')}:00`
);
const DEFAULT_SLOT: Slot = {
  startTime: null,
  endTime: null,
  endsNextDay: false,
};

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  while (cur <= last) {
    dates.push(isoDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function addDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return isoDate(d);
}

function hourOf(t: string): number {
  return Number.parseInt(t.slice(0, 2), 10);
}

/**
 * 폼 상태에서 특정 일자에 이미 다른 슬롯들이 점유한 hour 집합을 계산.
 * - isFullDay 일자: 24시간 전부 점유
 * - 같은 일자의 일반 슬롯: [startHour, endHour) 점유
 * - 다른 일자의 endsNextDay=true 슬롯: 시작 일자의 [startHour, 24) + 다음 일자의 [0, endHour) 중 targetDate 부분만 합산
 * - 편집 중인 슬롯(excludeDate + excludeIndex)은 점유 계산에서 제외
 */
function computeOccupiedHours(
  form: FormState,
  targetDate: string,
  excludeDate: string,
  excludeIndex: number
): Set<number> {
  const occupied = new Set<number>();
  for (const date of Object.keys(form)) {
    const day = form[date];
    if (date === targetDate && day.isFullDay) {
      for (let h = 0; h < 24; h++) occupied.add(h);
      continue;
    }
    day.slots.forEach((slot, i) => {
      if (date === excludeDate && i === excludeIndex) return;
      if (slot.startTime === null || slot.endTime === null) return; // 미완성 슬롯
      const sh = hourOf(slot.startTime);
      const eh = hourOf(slot.endTime);
      if (slot.endsNextDay) {
        if (date === targetDate) {
          for (let h = sh; h < 24; h++) occupied.add(h);
        }
        if (addDay(date) === targetDate) {
          for (let h = 0; h < eh; h++) occupied.add(h);
        }
      } else if (date === targetDate) {
        for (let h = sh; h < eh; h++) occupied.add(h);
      }
    });
  }
  return occupied;
}

interface Slot {
  // 미완성 슬롯은 null. picker로 두 번 클릭하면 둘 다 채워진다.
  startTime: string | null; // 'HH:00'
  endTime: string | null;
  endsNextDay: boolean;
}

interface DayForm {
  isFullDay: boolean;
  slots: Slot[];
}

type FormState = Record<string, DayForm>;

export default function AvailabilityScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userName = useSession((s) => s.userName);

  const schedule = id ? getScheduleById(id) : undefined;

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace(`/schedules/${id}`);

  const dates = useMemo(() => {
    if (!schedule?.practiceStart || !schedule.practiceEnd) return [];
    return getDatesInRange(schedule.practiceStart, schedule.practiceEnd);
  }, [schedule?.practiceStart, schedule?.practiceEnd]);

  // 기존 등록된 슬롯을 폼 상태로 변환 (재진입 시 수정 흐름)
  const [form, setForm] = useState<FormState>(() => {
    const init: FormState = {};
    for (const d of dates) init[d] = { isFullDay: false, slots: [] };
    if (!schedule || !userName) return init;
    const mine = getMyAvailability(schedule.id, userName);
    for (const slot of mine) {
      if (!init[slot.date]) init[slot.date] = { isFullDay: false, slots: [] };
      if (slot.isFullDay) {
        init[slot.date].isFullDay = true;
        init[slot.date].slots = [];
      } else if (slot.startTime && slot.endTime) {
        init[slot.date].slots.push({
          startTime: slot.startTime,
          endTime: slot.endTime,
          endsNextDay: !!slot.endsNextDay,
        });
      }
    }
    return init;
  });

  // --- 가드 ----------------------------------------------------------------

  if (!schedule) {
    return (
      <CenteredMessage onBack={goBack} message="일정을 찾을 수 없어요." />
    );
  }
  if (!userName) {
    return (
      <CenteredMessage
        onBack={goBack}
        message="로그인 정보가 없어요. 시작 화면으로 돌아가 다시 진입해 주세요."
      />
    );
  }
  if (!schedule.participants.includes(userName)) {
    return (
      <CenteredMessage
        onBack={goBack}
        message="이 일정의 참여 멤버만 가능 일정을 등록할 수 있어요."
      />
    );
  }
  if (!schedule.practiceStart || !schedule.practiceEnd) {
    return (
      <CenteredMessage
        onBack={goBack}
        message="연습 기간이 아직 잡혀있지 않은 일정이에요."
      />
    );
  }

  // --- 폼 액션 -------------------------------------------------------------

  const ensureDay = (state: FormState, date: string): DayForm =>
    state[date] ?? { isFullDay: false, slots: [] };

  const toggleFullDay = (date: string) => {
    setForm((prev) => {
      const cur = ensureDay(prev, date);
      const next = !cur.isFullDay;
      return {
        ...prev,
        [date]: { isFullDay: next, slots: next ? [] : cur.slots },
      };
    });
  };

  const addSlot = (date: string) => {
    setForm((prev) => {
      const cur = ensureDay(prev, date);
      return {
        ...prev,
        [date]: { ...cur, slots: [...cur.slots, { ...DEFAULT_SLOT }] },
      };
    });
  };

  const removeSlot = (date: string, idx: number) => {
    setForm((prev) => {
      const cur = ensureDay(prev, date);
      return {
        ...prev,
        [date]: { ...cur, slots: cur.slots.filter((_, i) => i !== idx) },
      };
    });
  };

  const updateSlot = (date: string, idx: number, patch: Partial<Slot>) => {
    setForm((prev) => {
      const cur = ensureDay(prev, date);
      return {
        ...prev,
        [date]: {
          ...cur,
          slots: cur.slots.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
        },
      };
    });
  };

  const onSave = () => {
    const inputs: AvailabilityInput[] = [];
    for (const date of dates) {
      const day = ensureDay(form, date);
      if (day.isFullDay) {
        inputs.push({ date, isFullDay: true });
      } else {
        for (const slot of day.slots) {
          if (slot.startTime === null || slot.endTime === null) continue; // 미완성 슬롯은 저장 안 함
          inputs.push({
            date,
            isFullDay: false,
            startTime: slot.startTime,
            endTime: slot.endTime,
            endsNextDay: slot.endsNextDay,
          });
        }
      }
    }
    const result = saveAvailability(schedule.id, userName, inputs);
    if (!result.ok) {
      notify('오류', result.reason);
      return;
    }
    // 저장 후 멤버 연습 가능 스케줄 보기로 이동 (이 화면은 stack에서 제거)
    router.replace(`/schedules/${schedule.id}/availability-summary`);
  };

  // --- 렌더 ---------------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 w-full max-w-md mx-auto">
        <TopBar onBack={goBack} title={schedule.name} />

        <ScrollView contentContainerClassName="px-4 pt-2 pb-8 gap-3">
          <Text className="text-sm text-typography-500">
            연습 기간의 각 일자에 가능한 시간대를 등록해 주세요. 시간대를 추가하지
            않은 일자는 불가능한 것으로 처리됩니다.
          </Text>

          {dates.map((date) => (
            <DayCard
              key={date}
              date={date}
              dayForm={ensureDay(form, date)}
              form={form}
              onToggleFullDay={() => toggleFullDay(date)}
              onAddSlot={() => addSlot(date)}
              onRemoveSlot={(idx) => removeSlot(date, idx)}
              onUpdateSlot={(idx, patch) => updateSlot(date, idx, patch)}
            />
          ))}
        </ScrollView>

        <View className="px-4 pt-2 pb-3 border-t border-outline-100 bg-white">
          <Button size="xl" action="primary" onPress={onSave}>
            <ButtonText>완료</ButtonText>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- 일자 카드 -------------------------------------------------------------

interface DayCardProps {
  date: string;
  dayForm: DayForm;
  form: FormState;
  onToggleFullDay: () => void;
  onAddSlot: () => void;
  onRemoveSlot: (idx: number) => void;
  onUpdateSlot: (idx: number, patch: Partial<Slot>) => void;
}

function DayCard({
  date,
  dayForm,
  form,
  onToggleFullDay,
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
}: DayCardProps) {
  return (
    <View className="border border-outline-200 rounded-xl p-4 gap-3 bg-background-0">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-typography-900">
          {formatDate(date)}
        </Text>
        <Pressable
          onPress={onToggleFullDay}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: dayForm.isFullDay }}
          className="flex-row items-center gap-1.5 px-1 py-1 active:opacity-60"
        >
          <View
            className={`w-5 h-5 rounded items-center justify-center border ${
              dayForm.isFullDay
                ? 'bg-primary-500 border-primary-500'
                : 'border-outline-300'
            }`}
          >
            {dayForm.isFullDay ? (
              <Text className="text-white text-[11px]">✓</Text>
            ) : null}
          </View>
          <Text className="text-sm text-typography-700">하루 종일 가능</Text>
        </Pressable>
      </View>

      {dayForm.isFullDay ? (
        <Text className="text-sm text-typography-500">
          이 날은 하루 종일 가능으로 등록됩니다.
        </Text>
      ) : (
        <>
          {dayForm.slots.length === 0 ? (
            <Text className="text-sm text-typography-400">
              아직 추가된 시간대가 없어요.
            </Text>
          ) : (
            <View className="gap-2.5">
              {dayForm.slots.map((slot, idx) => (
                <SlotRow
                  key={idx}
                  slot={slot}
                  date={date}
                  index={idx}
                  form={form}
                  onRemove={() => onRemoveSlot(idx)}
                  onUpdate={(patch) => onUpdateSlot(idx, patch)}
                />
              ))}
            </View>
          )}
          <Pressable
            onPress={onAddSlot}
            className="self-start px-3 py-1.5 rounded-full border border-outline-300 active:bg-background-50"
          >
            <Text className="text-sm text-typography-700">＋ 시간 추가</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

// --- 슬롯 한 행 (시작 ~ 종료 + 다음날 + 삭제) ------------------------------

interface SlotRowProps {
  slot: Slot;
  date: string;
  index: number;
  form: FormState;
  onRemove: () => void;
  onUpdate: (patch: Partial<Slot>) => void;
}

type PickerState =
  | null
  | { mode: 'idle' }
  | { mode: 'awaiting-end'; startHour: number };

function SlotRow({ slot, date, index, form, onRemove, onUpdate }: SlotRowProps) {
  // 새 슬롯(시간 미정)은 자동으로 picker가 열린 상태로 시작
  const [picker, setPicker] = useState<PickerState>(() =>
    slot.startTime === null ? { mode: 'idle' } : null
  );

  const sameDayOccupied = useMemo(
    () => computeOccupiedHours(form, date, date, index),
    [form, date, index]
  );
  const nextDayOccupied = useMemo(
    () => computeOccupiedHours(form, addDay(date), date, index),
    [form, date, index]
  );

  const disabledHours = useMemo<Set<number>>(() => {
    if (picker === null) return new Set();
    if (picker.mode === 'idle') return sameDayOccupied;
    // awaiting-end — 후보 종료 h마다 [start, h) 또는 [start, 24)+[0, h)가 겹치면 disable
    const s = picker.startHour;
    const disabled = new Set<number>();
    disabled.add(s); // 시작과 같은 시간 종료는 무의미
    for (let h = 0; h < 24; h++) {
      if (h === s) continue;
      if (h > s) {
        let blocked = false;
        for (let i = s; i < h; i++) {
          if (sameDayOccupied.has(i)) { blocked = true; break; }
        }
        if (blocked) disabled.add(h);
      } else {
        let blocked = false;
        for (let i = s; i < 24; i++) {
          if (sameDayOccupied.has(i)) { blocked = true; break; }
        }
        if (!blocked) {
          for (let i = 0; i < h; i++) {
            if (nextDayOccupied.has(i)) { blocked = true; break; }
          }
        }
        if (blocked) disabled.add(h);
      }
    }
    return disabled;
  }, [picker, sameDayOccupied, nextDayOccupied]);

  const onHourClick = (hour: string) => {
    const h = hourOf(hour);
    if (!picker) return;
    if (picker.mode === 'idle') {
      setPicker({ mode: 'awaiting-end', startHour: h });
      return;
    }
    // awaiting-end
    if (h === picker.startHour) return; // 같은 시간 클릭은 무시
    const endsNextDay = h < picker.startHour;
    const startTime = `${String(picker.startHour).padStart(2, '0')}:00`;
    onUpdate({ startTime, endTime: hour, endsNextDay });
    setPicker(null);
  };

  const toggleBox = () => {
    setPicker(picker === null ? { mode: 'idle' } : null);
  };

  // 박스에 표시할 라벨
  let boxLabel: string;
  if (picker?.mode === 'awaiting-end') {
    boxLabel = `${String(picker.startHour).padStart(2, '0')}:00 ~ (종료 선택)`;
  } else if (slot.startTime && slot.endTime) {
    boxLabel = slot.endsNextDay
      ? `${slot.startTime} ~ 다음날 ${slot.endTime}`
      : `${slot.startTime} ~ ${slot.endTime}`;
  } else {
    boxLabel = '시간 선택';
  }
  const isPlaceholder = !slot.startTime && picker?.mode !== 'awaiting-end';

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={toggleBox}
          className={`flex-1 h-11 px-3 rounded border flex-row items-center justify-between ${
            picker ? 'border-primary-500 bg-primary-50' : 'border-outline-300'
          } active:bg-background-50`}
        >
          <Text
            className={`text-base ${
              isPlaceholder ? 'text-typography-400' : 'text-typography-900'
            }`}
          >
            {boxLabel}
          </Text>
          <Text className="text-typography-400 text-xs">
            {picker ? '▲' : '▼'}
          </Text>
        </Pressable>
        <Pressable
          onPress={onRemove}
          accessibilityLabel="시간대 삭제"
          className="w-9 h-9 rounded items-center justify-center active:opacity-60"
        >
          <Text className="text-typography-400 text-base">✕</Text>
        </Pressable>
      </View>

      {picker ? (
        <HourGrid
          startHour={picker.mode === 'awaiting-end' ? picker.startHour : null}
          disabledHours={disabledHours}
          mode={picker.mode}
          onSelect={onHourClick}
        />
      ) : null}
    </View>
  );
}

function HourGrid({
  startHour,
  disabledHours,
  mode,
  onSelect,
}: {
  startHour: number | null;
  disabledHours: Set<number>;
  mode: 'idle' | 'awaiting-end';
  onSelect: (t: string) => void;
}) {
  return (
    <View className="gap-1.5 p-2 rounded border border-outline-200 bg-background-50">
      <Text className="text-xs text-typography-500 px-0.5">
        {mode === 'idle'
          ? '시작 시간을 선택해 주세요.'
          : '종료 시간을 선택해 주세요. (시작보다 이른 시간을 누르면 다음날로 등록돼요)'}
      </Text>
      <View className="flex-row flex-wrap gap-1.5">
        {HOURS.map((h, i) => {
          const isStart = i === startHour;
          const isDisabled = !isStart && disabledHours.has(i);
          return (
            <Pressable
              key={h}
              onPress={() => onSelect(h)}
              disabled={isDisabled}
              className={`w-[64px] h-9 rounded items-center justify-center ${
                isStart
                  ? 'bg-primary-500'
                  : isDisabled
                    ? 'bg-background-100 border border-outline-100'
                    : 'bg-white border border-outline-200'
              } ${isDisabled ? '' : 'active:opacity-60'}`}
            >
              <Text
                className={`text-sm ${
                  isStart
                    ? 'text-white'
                    : isDisabled
                      ? 'text-typography-300'
                      : 'text-typography-800'
                }`}
              >
                {h}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// --- 상단 바 / 가드 화면 ---------------------------------------------------

function TopBar({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View className="px-4 py-2 flex-row items-center gap-2">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        className="-ml-1 px-1 py-1 active:opacity-60"
      >
        <Text className="text-base text-primary-600">‹ 뒤로</Text>
      </Pressable>
      <Text
        className="flex-1 text-base font-bold text-typography-900"
        numberOfLines={1}
      >
        {title}
      </Text>
    </View>
  );
}

function CenteredMessage({
  onBack,
  message,
}: {
  onBack: () => void;
  message: string;
}) {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 w-full max-w-md mx-auto px-4">
        <TopBar onBack={onBack} title="연습 가능 일정 등록" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-typography-500 text-center">
            {message}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
