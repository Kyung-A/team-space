import { View, Text } from 'react-native';
import {
  type ScheduleStatus,
  type PracticeStatus,
  STATUS_LABEL,
  PRACTICE_STATUS_LABEL,
} from '@/lib/mockSchedules';

const SCHEDULE_STYLE: Record<ScheduleStatus, { box: string; text: string }> = {
  upcoming: { box: 'bg-info-50', text: 'text-info-700' },
  ongoing: { box: 'bg-success-50', text: 'text-success-700' },
  done: { box: 'bg-background-100', text: 'text-typography-500' },
  undecided: { box: 'bg-warning-50', text: 'text-warning-700' },
};

const PRACTICE_STYLE: Record<PracticeStatus, { box: string; text: string }> = {
  upcoming: { box: 'bg-info-50', text: 'text-info-700' },
  ongoing: { box: 'bg-success-50', text: 'text-success-700' },
  done: { box: 'bg-background-100', text: 'text-typography-500' },
};

interface ScheduleBadgeProps {
  status: ScheduleStatus;
}

export function ScheduleStatusBadge({ status }: ScheduleBadgeProps) {
  const s = SCHEDULE_STYLE[status];
  return (
    <View className={`px-2 py-0.5 rounded-full ${s.box}`}>
      <Text className={`text-xs font-medium ${s.text}`}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

interface PracticeBadgeProps {
  status: PracticeStatus;
}

export function PracticeStatusBadge({ status }: PracticeBadgeProps) {
  const s = PRACTICE_STYLE[status];
  return (
    <View className={`px-2 py-0.5 rounded-full ${s.box}`}>
      <Text className={`text-xs font-medium ${s.text}`}>
        {PRACTICE_STATUS_LABEL[status]}
      </Text>
    </View>
  );
}
