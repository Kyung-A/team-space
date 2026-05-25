import { Alert, Platform } from 'react-native';

/**
 * 크로스플랫폼 간단 알림.
 * react-native-web의 Alert.alert는 웹에서 동작하지 않으므로 웹은 window.alert로 대체한다.
 */
export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}
