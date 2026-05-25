import { ScrollView, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { joinTeam } from '@/lib/mockTeams';
import { notify } from '@/lib/notify';

interface JoinTeamForm {
  code: string;
  name: string;
}

export default function JoinTeam() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<JoinTeamForm>({
    defaultValues: { code: '', name: '' },
  });

  const onSubmit = (values: JoinTeamForm) => {
    const result = joinTeam(values);
    if (!result.ok) {
      setError(result.field, { type: 'manual', message: result.message });
      return;
    }
    const roleLabel = result.role === 'admin' ? '운영진' : '멤버';
    notify(
      '완료',
      `'${result.teamName}' 팀에 ${roleLabel}으로 합류 신청이 완료됐어요.`
    );
    router.replace('/');
  };

  return (
    <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled">
      <View className="w-full max-w-md mx-auto px-6 py-6 gap-5">
        <Field
          label="팀 코드"
          placeholder="받은 팀 코드를 입력하세요"
          control={control}
          name="code"
          rules={{ required: '팀 코드를 입력해 주세요.' }}
          error={errors.code?.message}
          autoCapitalize="characters"
        />
        <Field
          label="본인 이름"
          placeholder="팀 안에서 표시될 이름"
          control={control}
          name="name"
          rules={{ required: '본인 이름을 입력해 주세요.' }}
          error={errors.name?.message}
        />

        <Button size="xl" action="primary" className="mt-2" onPress={handleSubmit(onSubmit)}>
          <ButtonText>완료</ButtonText>
        </Button>
      </View>
    </ScrollView>
  );
}

interface FieldProps {
  label: string;
  placeholder: string;
  control: any;
  name: keyof JoinTeamForm;
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
