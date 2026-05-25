import { View, Text, Pressable } from 'react-native';

/**
 * 하단 탭바 (UI 플레이스홀더).
 * 기획서에 탭 종류가 확정되지 않아 '일정' 탭만 활성으로 두고
 * 나머지는 비활성(추후 연결)으로 시각만 표현한다.
 */
interface TabItem {
  key: string;
  label: string;
  active?: boolean;
}

const TABS: TabItem[] = [
  { key: 'schedules', label: '일정', active: true },
  { key: 'members', label: '멤버' },
  { key: 'settings', label: '설정' },
];

export function TabBar() {
  return (
    <View className="flex-row border-t border-outline-100 bg-background-0">
      {TABS.map((tab) => (
        <Pressable
          key={tab.key}
          disabled={!tab.active}
          accessibilityRole="tab"
          accessibilityState={{ selected: !!tab.active, disabled: !tab.active }}
          className="flex-1 items-center justify-center py-2.5 gap-1"
        >
          <View
            className={`w-1.5 h-1.5 rounded-full ${tab.active ? 'bg-primary-500' : 'bg-transparent'}`}
          />
          <Text
            className={`text-xs ${tab.active ? 'text-primary-600 font-semibold' : 'text-typography-300'}`}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
