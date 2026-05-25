import { View, Text, Pressable, ScrollView } from 'react-native';
import { type ScheduleStatus, STATUS_LABEL } from '@/lib/mockSchedules';

const STATUS_ORDER: ScheduleStatus[] = [
  'upcoming',
  'ongoing',
  'done',
  'undecided',
];

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`h-9 px-3.5 rounded-full items-center justify-center border ${
        active
          ? 'bg-primary-500 border-primary-500'
          : 'bg-background-0 border-outline-200'
      }`}
    >
      <Text
        className={`text-sm ${active ? 'text-white font-medium' : 'text-typography-700'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface Props {
  /** 활성화된 상태 필터 (비어 있으면 전체) */
  statuses: ScheduleStatus[];
  onToggleStatus: (status: ScheduleStatus) => void;
  mineOnly: boolean;
  onToggleMine: () => void;
}

export function ScheduleFilters({
  statuses,
  onToggleStatus,
  mineOnly,
  onToggleMine,
}: Props) {
  return (
    <View className="gap-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4"
      >
        {STATUS_ORDER.map((s) => (
          <FilterChip
            key={s}
            label={STATUS_LABEL[s]}
            active={statuses.includes(s)}
            onPress={() => onToggleStatus(s)}
          />
        ))}
      </ScrollView>

      <View className="px-4">
        <FilterChip
          label="내가 참여하는 일정"
          active={mineOnly}
          onPress={onToggleMine}
        />
      </View>
    </View>
  );
}
