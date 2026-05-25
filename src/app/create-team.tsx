import { ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { createTeam } from '@/lib/mockTeams';
import { useSession } from '@/lib/session';
import { markMyParticipation } from '@/lib/mockSchedules';

interface CreateTeamForm {
  name: string;
  memberCode: string;
  adminCode: string;
  ownerName: string;
}

export default function CreateTeam() {
  const router = useRouter();
  const setSession = useSession((s) => s.setSession);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateTeamForm>({
    defaultValues: { name: '', memberCode: '', adminCode: '', ownerName: '' },
  });

  const onSubmit = (values: CreateTeamForm) => {
    const result = createTeam(values);
    if (!result.ok) {
      // 목업 검증 실패: 문제가 된 필드에 메시지 노출
      setError(result.field, { type: 'manual', message: result.message });
      return;
    }
    // 운영진은 생성과 동시에 인증 완료 → 세션 세팅 후 팀 일정 목록으로 진입
    const ownerName = values.ownerName.trim();
    setSession({ teamName: result.teamName, userName: ownerName, role: 'admin' });
    markMyParticipation(ownerName); // 데모: '내가 참여하는 일정' 필터용
    router.replace('/schedules');
  };

  return (
    <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled">
      <View className="w-full max-w-md mx-auto px-6 py-6 gap-5">
        <Field
          label="팀 이름"
          placeholder="예: 드림팀"
          control={control}
          name="name"
          rules={{ required: '팀 이름을 입력해 주세요.' }}
          error={errors.name?.message}
        />
        <Field
          label="멤버 초대 팀 코드"
          placeholder="멤버에게 공유할 코드"
          control={control}
          name="memberCode"
          rules={{ required: '멤버 초대 코드를 입력해 주세요.' }}
          error={errors.memberCode?.message}
          autoCapitalize="characters"
        />
        <Field
          label="운영진 초대 팀 코드"
          placeholder="운영진에게 공유할 코드"
          control={control}
          name="adminCode"
          rules={{ required: '운영진 초대 코드를 입력해 주세요.' }}
          error={errors.adminCode?.message}
          autoCapitalize="characters"
        />
        <Field
          label="본인 이름"
          placeholder="팀 안에서 표시될 이름"
          control={control}
          name="ownerName"
          rules={{ required: '본인 이름을 입력해 주세요.' }}
          error={errors.ownerName?.message}
        />

        <Button size="xl" action="primary" className="mt-2" onPress={handleSubmit(onSubmit)}>
          <ButtonText>생성하기</ButtonText>
        </Button>
      </View>
    </ScrollView>
  );
}

interface FieldProps {
  label: string;
  placeholder: string;
  control: any;
  name: keyof CreateTeamForm;
  rules?: object;
  error?: string;
  autoCapitalize?: 'none' | 'characters';
}

function Field({
  label,
  placeholder,
  control,
  name,
  rules,
  error,
  autoCapitalize = 'none',
}: FieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-typography-700">{label}</Text>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { value, onChange, onBlur } }) => (
          <Input size="xl">
            <InputField
              placeholder={placeholder}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize={autoCapitalize}
              autoCorrect={false}
            />
          </Input>
        )}
      />
      {error ? <Text className="text-sm text-error-600">{error}</Text> : null}
    </View>
  );
}
