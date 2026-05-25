import { View, Text } from 'react-native';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md';
}

/** 프로필 이미지가 없으므로 이름 앞글자로 원형 아바타를 표현 */
export function MemberAvatar({ name, size = 'md' }: AvatarProps) {
  const initial = name.trim().charAt(0) || '?';
  const dim = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const font = size === 'sm' ? 'text-[10px]' : 'text-xs';
  return (
    <View
      className={`${dim} rounded-full bg-primary-100 border border-background-0 items-center justify-center`}
    >
      <Text className={`${font} font-semibold text-primary-700`}>{initial}</Text>
    </View>
  );
}

interface AvatarRowProps {
  names: string[];
  size?: 'sm' | 'md';
  /** 이 개수를 넘으면 나머지는 +N 으로 표기 */
  max?: number;
}

export function MemberAvatarRow({ names, size = 'md', max = 5 }: AvatarRowProps) {
  if (names.length === 0) {
    return <Text className="text-sm text-typography-400">참여 멤버 없음</Text>;
  }
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  const dim = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const font = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <View className="flex-row items-center">
      {shown.map((name, i) => (
        <View key={`${name}-${i}`} className={i === 0 ? '' : '-ml-2'}>
          <MemberAvatar name={name} size={size} />
        </View>
      ))}
      {rest > 0 ? (
        <View
          className={`${dim} -ml-2 rounded-full bg-background-100 border border-background-0 items-center justify-center`}
        >
          <Text className={`${font} font-semibold text-typography-500`}>
            +{rest}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
