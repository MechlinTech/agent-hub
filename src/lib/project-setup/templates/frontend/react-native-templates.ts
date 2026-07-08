import type { FileTemplate, ProjectSetupConfig } from "@/lib/project-setup/types";
import { defaultApiUrl, frontendRelPrefix } from "@/lib/project-setup/templates/shared";

export function reactNativePackageName(name: string): string {
  let pkg = name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!pkg) pkg = "app";
  if (/^[0-9]/.test(pkg)) pkg = `app-${pkg}`;
  return pkg;
}

export function reactNativeAndroidPackage(name: string): string {
  const segment = reactNativePackageName(name).replace(/-/g, "");
  return `com.example.${segment || "app"}`;
}

interface ReactNativeCtx {
  pkg: string;
  projectName: string;
  description: string;
  apiUrl: string;
  appDisplayName: string;
  androidPackage: string;
  notificationChannelId: string;
}

function ctx(config: ProjectSetupConfig): ReactNativeCtx {
  const pkg = reactNativePackageName(config.projectName);
  return {
    pkg,
    projectName: config.projectName,
    description: config.description?.trim() || "A new React Native project.",
    apiUrl: defaultApiUrl(config),
    appDisplayName: config.projectName,
    androidPackage: reactNativeAndroidPackage(config.projectName),
    notificationChannelId: pkg.replace(/-/g, "_"),
  };
}

function envExample(c: ReactNativeCtx): string {
  return `# Frontend environment

API_BASE_URL="${c.apiUrl}"
`;
}

function babelConfig(): string {
  return `module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@components': './src/components',
          '@configs': './src/configs',
          '@navigation': './src/navigation',
          '@notifications': './src/notifications',
          '@redux': './src/redux',
          '@screens': './src/screens',
          '@theme': './src/theme',
          '@utils': './src/utils',
        },
      },
    ],
  ],
};
`;
}

function appTsx(c: ReactNativeCtx): string {
  return `import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Provider } from 'react-redux';
import { getIsHeadless, getMessaging } from '@react-native-firebase/messaging';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import InnerApp from '@screens/InnerApp';
import { ThemeProvider } from '@theme/ThemeProvider';
import { store } from '@redux/store';

const App = () => {
  const [isHeadless, setIsHeadless] = useState(Platform.OS === 'ios');

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    let cancelled = false;
    getIsHeadless(getMessaging())
      .then(headless => {
        if (!cancelled) {
          setIsHeadless(headless);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsHeadless(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isHeadless) {
    return null;
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <InnerApp />
        </SafeAreaProvider>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
`;
}

function indexJs(c: ReactNativeCtx): string {
  return `import 'react-native-gesture-handler';
/**
 * @format
 */

import { AppRegistry } from 'react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import NotificationUtil, {
  routeNotificationPayload,
} from './src/notifications/NotificationUtil';
import { navigationRef } from './src/navigation/NavigationService';

const messaging = getMessaging();

setBackgroundMessageHandler(messaging, async remoteMessage => {
  if (remoteMessage?.notification) {
    return;
  }

  await NotificationUtil.showLocalNotification(
    remoteMessage?.notification,
    remoteMessage?.data,
  );
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type !== EventType.PRESS) {
    return;
  }

  const payload = detail?.notification?.data ?? {};
  const tryNavigate = (attempts = 0) => {
    if (navigationRef.isReady()) {
      routeNotificationPayload(payload);
      return;
    }
    if (attempts < 20) {
      setTimeout(() => tryNavigate(attempts + 1), 300);
    }
  };
  tryNavigate();
});

AppRegistry.registerComponent(appName, () => App);
`;
}

function colorsTs(): string {
  return `export type ThemeColors = {
  primary: string;
  primaryLight: string;
  primaryGradientStart: string;
  primaryGradientEnd: string;
  secondary: string;
  secondaryButtonText: string;
  primaryButtonText: string;
  background: string;
  backgroundLight: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  white: string;
  black: string;
  gray: string;
  lightGray: string;
  green: string;
  yellow: string;
  statusBarStyle: 'light-content' | 'dark-content';
};

export const lightColors: ThemeColors = {
  primary: '#555CC4',
  primaryLight: '#829BF8',
  primaryGradientStart: '#4f44b6',
  primaryGradientEnd: '#4f44b6',
  secondary: '#FF1358',
  secondaryButtonText: '#ffffff',
  primaryButtonText: '#ffffff',
  background: '#F8FBFF',
  backgroundLight: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#5f5f5f',
  border: '#E8ECF4',
  white: '#ffffff',
  black: '#000000',
  gray: '#5f5f5f',
  lightGray: '#9b9b9b',
  green: '#6DD0A3',
  yellow: '#ffc247',
  statusBarStyle: 'dark-content',
};

export const darkColors: ThemeColors = {
  primary: '#2D9AFF',
  primaryLight: '#198EFA',
  primaryGradientStart: '#51A8F9',
  primaryGradientEnd: '#54CBF6',
  secondary: '#FF4D40',
  secondaryButtonText: '#ffffff',
  primaryButtonText: '#ffffff',
  background: '#1E2B5B',
  backgroundLight: '#2D3C72',
  surface: '#2D3C72',
  text: '#FFFFFF',
  textSecondary: '#EBEFFB',
  border: '#3D4F8C',
  white: '#ffffff',
  black: '#000000',
  gray: '#acacac',
  lightGray: '#9b9b9b',
  green: '#6DD0A3',
  yellow: '#ffc247',
  statusBarStyle: 'light-content',
};
`;
}

function themeProviderTs(): string {
  return `import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from './colors';
import { getStoredThemeMode, setStoredThemeMode } from '@utils/storage';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveIsDark(mode: ThemeMode, systemScheme: 'light' | 'dark' | null | undefined) {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return systemScheme === 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark' | null>(
    Appearance.getColorScheme() ?? 'light',
  );

  useEffect(() => {
    getStoredThemeMode().then(stored => {
      if (stored) {
        setModeState(stored);
      }
    });
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? 'light');
    });
    return () => subscription.remove();
  }, []);

  const isDark = resolveIsDark(mode, systemScheme);
  const colors = isDark ? darkColors : lightColors;

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    await setStoredThemeMode(next);
  }, []);

  const value = useMemo(
    () => ({ mode, colors, isDark, setMode }),
    [mode, colors, isDark, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}
`;
}

function themeUseTs(): string {
  return `export { useThemeContext as useTheme } from './ThemeProvider';
`;
}

function storageTs(): string {
  return `import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '@theme/ThemeProvider';

const THEME_MODE_KEY = '@theme_mode';

export async function getStoredThemeMode(): Promise<ThemeMode | null> {
  const value = await AsyncStorage.getItem(THEME_MODE_KEY);
  if (value === 'system' || value === 'light' || value === 'dark') {
    return value;
  }
  return null;
}

export async function setStoredThemeMode(mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(THEME_MODE_KEY, mode);
}
`;
}

function apiConfigTs(c: ReactNativeCtx): string {
  return `import Config from 'react-native-config';

export const API_BASE_URL = Config.API_BASE_URL || '${c.apiUrl}';
`;
}

function navigationServiceTs(): string {
  return `import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetToHome() {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.reset({
    index: 0,
    routes: [{ name: 'MainTabs' }],
  });
}
`;
}

function navigationTypesTs(): string {
  return `export type RootStackParamList = {
  MainTabs: undefined;
  NotificationScreen: {
    payload?: Record<string, string | undefined>;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Settings: undefined;
};
`;
}

function notificationRoutesTs(): string {
  return `export const NOTIFICATION_SCREEN = 'NotificationScreen';

export function normalizeNotificationPayload(
  data: Record<string, unknown> | undefined,
): Record<string, string> {
  if (!data) {
    return {};
  }
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value != null && value !== '') {
      normalized[key] = String(value);
    }
  }
  return normalized;
}
`;
}

function notificationUtilTs(c: ReactNativeCtx): string {
  return `import { Platform } from 'react-native';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { navigationRef } from '@navigation/NavigationService';
import {
  normalizeNotificationPayload,
  NOTIFICATION_SCREEN,
} from './notificationRoutes';

let lastNavId: string | null = null;
let lastNavAt = 0;

async function createChannel() {
  await notifee.createChannel({
    id: '${c.notificationChannelId}',
    name: '${c.appDisplayName}',
    vibration: true,
    importance: AndroidImportance.HIGH,
  });
}

export function routeNotificationPayload(
  data: Record<string, unknown> | undefined,
) {
  const payload = normalizeNotificationPayload(data);
  const referenceId = payload.referenceId || payload.id || payload.messageId;
  if (!referenceId) {
    console.warn('routeNotificationPayload: missing reference id');
    return;
  }

  if (!navigationRef.isReady()) {
    console.warn('routeNotificationPayload: navigation not ready yet');
    return;
  }

  const now = Date.now();
  if (referenceId === lastNavId && now - lastNavAt < 5000) {
    return;
  }
  lastNavId = referenceId;
  lastNavAt = now;

  navigationRef.navigate(NOTIFICATION_SCREEN, { payload });
}

class NotificationUtil {
  static showLocalNotification = async (
    body: { title?: string; body?: string } | undefined,
    customData: Record<string, unknown> | undefined,
  ) => {
    const data = normalizeNotificationPayload(customData);
    const notificationId = data.referenceId || data.id || String(Date.now());

    if (Platform.OS === 'android') {
      await createChannel();
      await notifee.displayNotification({
        id: notificationId,
        title: body?.title ?? data.title ?? '${c.appDisplayName}',
        body: body?.body ?? data.body ?? 'You have a new notification',
        android: {
          channelId: '${c.notificationChannelId}',
          pressAction: { id: 'default' },
        },
        data,
      });
      return;
    }

    await notifee.requestPermission({ alert: true, badge: true, sound: true });
    await notifee.displayNotification({
      id: notificationId,
      title: body?.title ?? data.title ?? '${c.appDisplayName}',
      body: body?.body ?? data.body ?? 'You have a new notification',
      ios: { sound: 'default' },
      data,
    });
  };

  static setupForegroundHandler = () =>
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        routeNotificationPayload(detail?.notification?.data);
      }
    });
}

export default NotificationUtil;
`;
}

function fcmListenersTs(): string {
  return `import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import NotificationUtil from './NotificationUtil';

let lastMessageId: string | null = null;

export function registerNotificationListener() {
  lastMessageId = null;
  const messaging = getMessaging();

  return onMessage(messaging, async remoteMessage => {
    const messageId =
      remoteMessage?.messageId || JSON.stringify(remoteMessage?.data ?? {});

    if (messageId === lastMessageId) {
      return;
    }

    await NotificationUtil.showLocalNotification(
      remoteMessage?.notification,
      remoteMessage?.data,
    );

    lastMessageId = messageId;
  });
}
`;
}

function notificationPermissionTs(): string {
  return `import { PermissionsAndroid, Platform } from 'react-native';
import {
  AuthorizationStatus,
  getMessaging,
  requestPermission,
} from '@react-native-firebase/messaging';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  if (Platform.OS === 'ios') {
    const authStatus = await requestPermission(getMessaging());
    return (
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL
    );
  }

  return true;
}
`;
}

function reduxStoreTs(): string {
  return `import { configureStore, createSlice } from '@reduxjs/toolkit';

type AppState = {
  isBootstrapping: boolean;
};

const initialState: AppState = {
  isBootstrapping: true,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setBootstrapping(state, action: { payload: boolean }) {
      state.isBootstrapping = action.payload;
    },
  },
});

export const { setBootstrapping } = appSlice.actions;

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
`;
}

function reduxHooksTs(): string {
  return `import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
`;
}

function customTextTs(): string {
  return `import React from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@theme/useTheme';

type Props = TextProps & {
  bold?: boolean;
  secondary?: boolean;
  size?: number;
};

export function CustomText({
  bold,
  secondary,
  size = 16,
  style,
  ...props
}: Props) {
  const { colors } = useTheme();
  return (
    <Text
      {...props}
      style={[
        styles.base,
        {
          color: secondary ? colors.textSecondary : colors.text,
          fontSize: size,
          fontWeight: bold ? '700' : '400',
        },
        style as TextStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    lineHeight: 22,
  },
});
`;
}

function buttonTs(): string {
  return `import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { CustomText } from './CustomText';
import { useTheme } from '@theme/useTheme';

type Props = {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  loading,
  variant = 'primary',
  style,
}: Props) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[
        styles.button,
        {
          backgroundColor: isPrimary ? colors.primary : colors.secondary,
          opacity: loading ? 0.7 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <CustomText bold style={{ color: colors.primaryButtonText, textAlign: 'center' }}>
          {title}
        </CustomText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
`;
}

function roundedCardTs(): string {
  return `import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useTheme } from '@theme/useTheme';

export function RoundedCard({ style, children, ...props }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      {...props}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
});
`;
}

function splashScreenTs(c: ReactNativeCtx): string {
  return `import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { CustomText } from '@components/CustomText';
import { useTheme } from '@theme/useTheme';

/** Shown before NavigationContainer mounts (farewell-style bootstrap). */
export function SplashView() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomText bold size={28}>
        ${c.appDisplayName}
      </CustomText>
      <ActivityIndicator color={colors.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginTop: 24,
  },
});
`;
}

function homeScreenTs(c: ReactNativeCtx): string {
  return `import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { CustomText } from '@components/CustomText';
import { RoundedCard } from '@components/RoundedCard';
import { useTheme } from '@theme/useTheme';

export function HomeScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <CustomText bold size={28} style={{ color: colors.white }}>
          ${c.appDisplayName}
        </CustomText>
        <CustomText size={15} style={{ color: colors.white, marginTop: 8, opacity: 0.92 }}>
          ${c.description.replace(/'/g, "\\'")}
        </CustomText>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.content}>
        <RoundedCard>
          <CustomText bold size={20}>
            Welcome
          </CustomText>
          <CustomText secondary style={{ marginTop: 8 }}>
            Your React Native CLI starter is ready with App/InnerApp architecture,
            light and dark themes, and FCM + Notifee notifications.
          </CustomText>
        </RoundedCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  content: {
    padding: 24,
    gap: 16,
  },
});
`;
}

function notificationScreenTs(): string {
  return `import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomText } from '@components/CustomText';
import { RoundedCard } from '@components/RoundedCard';
import { useTheme } from '@theme/useTheme';
import type { RootStackParamList } from '@navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationScreen'>;

export function NotificationScreen({ route }: Props) {
  const { colors } = useTheme();
  const payload = route.params?.payload ?? {};

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <RoundedCard>
          <CustomText bold size={22}>
            Notification
          </CustomText>
          <CustomText secondary style={{ marginTop: 8 }}>
            Tap a push notification to land here with its payload.
          </CustomText>
          {Object.keys(payload).length === 0 ? (
            <CustomText secondary style={{ marginTop: 16 }}>
              No payload attached.
            </CustomText>
          ) : (
            Object.entries(payload).map(([key, value]) => (
              <View key={key} style={styles.row}>
                <CustomText bold>{key}</CustomText>
                <CustomText secondary>{value}</CustomText>
              </View>
            ))
          )}
        </RoundedCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  row: { marginTop: 12, gap: 4 },
});
`;
}

function settingsScreenTs(): string {
  return `import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CustomText } from '@components/CustomText';
import { RoundedCard } from '@components/RoundedCard';
import { useTheme } from '@theme/useTheme';
import type { ThemeMode } from '@theme/ThemeProvider';
import { requestNotificationPermission } from '@notifications/notificationPermission';

const MODES: ThemeMode[] = ['system', 'light', 'dark'];

export function SettingsScreen() {
  const { colors, mode, setMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RoundedCard style={styles.card}>
        <CustomText bold size={20}>
          Appearance
        </CustomText>
        <View style={styles.options}>
          {MODES.map(option => {
            const selected = mode === option;
            return (
              <Pressable
                key={option}
                onPress={() => setMode(option)}
                style={[
                  styles.option,
                  {
                    backgroundColor: selected ? colors.primary : colors.backgroundLight,
                    borderColor: colors.border,
                  },
                ]}>
                <CustomText
                  bold
                  style={{
                    color: selected ? colors.white : colors.text,
                    textTransform: 'capitalize',
                  }}>
                  {option}
                </CustomText>
              </Pressable>
            );
          })}
        </View>
      </RoundedCard>
      <RoundedCard style={styles.card}>
        <CustomText bold size={20}>
          Notifications
        </CustomText>
        <Pressable
          onPress={() => requestNotificationPermission()}
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}>
          <CustomText bold style={{ color: colors.white }}>
            Request permission
          </CustomText>
        </Pressable>
      </RoundedCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  card: { marginBottom: 8 },
  options: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  option: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  permissionButton: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
`;
}

function rootNavigatorTs(): string {
  return `import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@screens/HomeScreen';
import { NotificationScreen } from '@screens/NotificationScreen';
import { SettingsScreen } from '@screens/SettingsScreen';
import type { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="NotificationScreen"
        component={NotificationScreen}
        options={{ headerShown: true, title: 'Notification' }}
      />
    </Stack.Navigator>
  );
}
`;
}

function innerAppTs(c: ReactNativeCtx): string {
  return `import React, { useEffect, useState } from 'react';
import { StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  getInitialNotification,
  getMessaging,
  getToken,
  onNotificationOpenedApp,
  requestPermission,
} from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { navigationRef } from '@navigation/NavigationService';
import { RootNavigator } from '@navigation/RootNavigator';
import { registerNotificationListener } from '@notifications/FCMListeners';
import NotificationUtil, {
  routeNotificationPayload,
} from '@notifications/NotificationUtil';
import { requestNotificationPermission } from '@notifications/notificationPermission';
import { SplashView } from '@screens/SplashScreen';
import { useTheme } from '@theme/useTheme';
import { useAppDispatch } from '@redux/hooks';
import { setBootstrapping } from '@redux/store';

const messagingInstance = getMessaging();
const SPLASH_DURATION_MS = 1200;

async function getFcmToken() {
  try {
    await requestPermission(messagingInstance);
    const token = await getToken(messagingInstance);
    console.log('[FCM] token:', token);
    return token;
  } catch (error) {
    console.warn('[FCM] token unavailable:', error);
    return null;
  }
}

function MainComp() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setBootstrapping(false));
    const unsubscribeNotifications = registerNotificationListener();
    requestNotificationPermission();
    getFcmToken();

    const unsubscribeForeground = NotificationUtil.setupForegroundHandler();
    const unsubscribeBackground = onNotificationOpenedApp(
      messagingInstance,
      remoteMessage => {
        routeNotificationPayload(remoteMessage?.data);
      },
    );

    return () => {
      unsubscribeNotifications?.();
      unsubscribeForeground();
      unsubscribeBackground();
    };
  }, [dispatch]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        getInitialNotification(messagingInstance)
          .then(remoteMessage => {
            if (!remoteMessage?.data) {
              return;
            }
            const tryNavigate = (attempts = 0) => {
              if (navigationRef.isReady()) {
                routeNotificationPayload(remoteMessage.data);
                return;
              }
              if (attempts < 20) {
                setTimeout(() => tryNavigate(attempts + 1), 300);
              }
            };
            tryNavigate();
          })
          .catch(error =>
            console.error('Error getting initial notification:', error),
          );

        notifee
          .getInitialNotification()
          .then(initialNotification => {
            const data = initialNotification?.notification?.data;
            if (!data) {
              return;
            }
            const tryNavigate = (attempts = 0) => {
              if (navigationRef.isReady()) {
                routeNotificationPayload(data);
                return;
              }
              if (attempts < 20) {
                setTimeout(() => tryNavigate(attempts + 1), 300);
              }
            };
            tryNavigate();
          })
          .catch(error =>
            console.error('Error getting Notifee initial notification:', error),
          );
      }}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function InnerApp() {
  const { colors } = useTheme();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar
          barStyle={colors.statusBarStyle}
          backgroundColor={colors.background}
        />
        {showSplash ? <SplashView /> : <MainComp />}
      </View>
    </GestureHandlerRootView>
  );
}
`;
}

function firebaseSetupMd(c: ReactNativeCtx): string {
  return `# Firebase setup

Replace the placeholder Firebase config files before testing push notifications:

1. Create a Firebase project at https://console.firebase.google.com
2. Add an Android app with package name \`${c.androidPackage}\`
3. Download \`google-services.json\` → \`android/app/google-services.json\`
4. Add an iOS app and download \`GoogleService-Info.plist\` → \`ios/GoogleService-Info.plist\`
5. Run \`cd ios && pod install\`
6. Rebuild the app

Notification payload should include \`referenceId\` (or \`id\`) in the \`data\` block for deep-link routing.
`;
}

function googleServicesJson(c: ReactNativeCtx): string {
  return `{
  "project_info": {
    "project_number": "000000000000",
    "project_id": "placeholder-project",
    "storage_bucket": "placeholder-project.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:000000000000:android:0000000000000000000000",
        "android_client_info": {
          "package_name": "${c.androidPackage}"
        }
      },
      "oauth_client": [],
      "api_key": [{ "current_key": "REPLACE_ME" }],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": []
        }
      }
    }
  ],
  "configuration_version": "1"
}
`;
}

function googleServiceInfoPlist(c: ReactNativeCtx): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CLIENT_ID</key>
  <string>REPLACE_ME.apps.googleusercontent.com</string>
  <key>REVERSED_CLIENT_ID</key>
  <string>com.googleusercontent.apps.REPLACE_ME</string>
  <key>API_KEY</key>
  <string>REPLACE_ME</string>
  <key>GCM_SENDER_ID</key>
  <string>000000000000</string>
  <key>PLIST_VERSION</key>
  <string>1</string>
  <key>BUNDLE_ID</key>
  <string>${c.androidPackage}</string>
  <key>PROJECT_ID</key>
  <string>placeholder-project</string>
  <key>STORAGE_BUCKET</key>
  <string>placeholder-project.appspot.com</string>
  <key>IS_ADS_ENABLED</key>
  <false/>
  <key>IS_ANALYTICS_ENABLED</key>
  <false/>
  <key>IS_APPINVITE_ENABLED</key>
  <true/>
  <key>IS_GCM_ENABLED</key>
  <true/>
  <key>IS_SIGNIN_ENABLED</key>
  <true/>
  <key>GOOGLE_APP_ID</key>
  <string>1:000000000000:ios:0000000000000000000000</string>
</dict>
</plist>
`;
}

function configureAndroidFirebaseScript(): string {
  return `import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const manifestPath = join(root, 'android/app/src/main/AndroidManifest.xml');
const rootGradlePath = join(root, 'android/build.gradle');
const appGradlePath = join(root, 'android/app/build.gradle');

function patchManifest() {
  let content = readFileSync(manifestPath, 'utf8');
  if (content.includes('POST_NOTIFICATIONS')) {
    return;
  }
  if (!content.includes('xmlns:tools')) {
    content = content.replace(
      '<manifest',
      '<manifest\\n  xmlns:tools="http://schemas.android.com/tools"',
    );
  }
  content = content.replace(
    '<application',
    '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\\n\\n  <application',
  );
  writeFileSync(manifestPath, content);
}

function patchRootGradle() {
  let content = readFileSync(rootGradlePath, 'utf8');
  if (content.includes('google-services')) {
    return;
  }
  if (content.includes('kotlin-gradle-plugin')) {
    content = content.replace(
      'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin")',
      'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin")\\n        classpath("com.google.gms:google-services:4.4.4")',
    );
  } else {
    content = content.replace(
      'dependencies {',
      'dependencies {\\n        classpath("com.google.gms:google-services:4.4.4")',
    );
  }
  writeFileSync(rootGradlePath, content);
}

function patchAppGradle() {
  let content = readFileSync(appGradlePath, 'utf8');
  if (!content.includes("com.google.gms.google-services")) {
    content = \`apply plugin: 'com.google.gms.google-services'\\n\${content}\`;
    writeFileSync(appGradlePath, content);
  }
}

patchManifest();
patchRootGradle();
patchAppGradle();
console.log('Android Firebase configuration patched.');
`;
}

function configureAndroidFirebaseScriptPath(rel: string): string {
  return `${rel}scripts/configure-firebase-android.mjs`;
}


function appDelegateSwift(c: ReactNativeCtx): string {
  const moduleName = c.projectName.replace(/[^a-zA-Z0-9_]/g, "") || "App";
  return `import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import FirebaseMessaging
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseApp.configure()

    UNUserNotificationCenter.current().delegate = self
    application.registerForRemoteNotifications()

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "${moduleName}",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    Messaging.messaging().apnsToken = deviceToken
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

extension AppDelegate: UNUserNotificationCenterDelegate {
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    completionHandler([[.banner, .badge, .sound]])
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    completionHandler()
  }
}
`;
}

function tsconfigJson(): string {
  return `${JSON.stringify(
    {
      extends: "@react-native/typescript-config",
      compilerOptions: {
        types: ["jest"],
        paths: {
          "@components/*": ["./src/components/*"],
          "@configs/*": ["./src/configs/*"],
          "@navigation/*": ["./src/navigation/*"],
          "@notifications/*": ["./src/notifications/*"],
          "@redux/*": ["./src/redux/*"],
          "@screens/*": ["./src/screens/*"],
          "@theme/*": ["./src/theme/*"],
          "@utils/*": ["./src/utils/*"],
        },
      },
      include: ["**/*.ts", "**/*.tsx"],
      exclude: ["**/node_modules", "**/Pods"],
    },
    null,
    2
  )}\n`;
}

export function reactNativeLayeredFiles(config: ProjectSetupConfig): FileTemplate[] {
  const c = ctx(config);
  const rel = frontendRelPrefix(config);
  const writePhase = "post" as const;

  return [
    { relativePath: `${rel}.env.example`, content: envExample(c), writePhase },
    { relativePath: `${rel}babel.config.js`, content: babelConfig(), writePhase },
    { relativePath: `${rel}App.tsx`, content: appTsx(c), writePhase },
    { relativePath: `${rel}index.js`, content: indexJs(c), writePhase },
    { relativePath: `${rel}FIREBASE_SETUP.md`, content: firebaseSetupMd(c), writePhase },
    { relativePath: `${rel}tsconfig.json`, content: tsconfigJson(), writePhase },
    { relativePath: `${rel}src/theme/colors.ts`, content: colorsTs(), writePhase },
    { relativePath: `${rel}src/theme/ThemeProvider.tsx`, content: themeProviderTs(), writePhase },
    { relativePath: `${rel}src/theme/useTheme.ts`, content: themeUseTs(), writePhase },
    { relativePath: `${rel}src/utils/storage.ts`, content: storageTs(), writePhase },
    { relativePath: `${rel}src/configs/api.ts`, content: apiConfigTs(c), writePhase },
    { relativePath: `${rel}src/navigation/NavigationService.ts`, content: navigationServiceTs(), writePhase },
    { relativePath: `${rel}src/navigation/types.ts`, content: navigationTypesTs(), writePhase },
    { relativePath: `${rel}src/navigation/RootNavigator.tsx`, content: rootNavigatorTs(), writePhase },
    { relativePath: `${rel}src/notifications/notificationRoutes.ts`, content: notificationRoutesTs(), writePhase },
    { relativePath: `${rel}src/notifications/NotificationUtil.ts`, content: notificationUtilTs(c), writePhase },
    { relativePath: `${rel}src/notifications/FCMListeners.ts`, content: fcmListenersTs(), writePhase },
    { relativePath: `${rel}src/notifications/notificationPermission.ts`, content: notificationPermissionTs(), writePhase },
    { relativePath: `${rel}src/redux/store.ts`, content: reduxStoreTs(), writePhase },
    { relativePath: `${rel}src/redux/hooks.ts`, content: reduxHooksTs(), writePhase },
    { relativePath: `${rel}src/components/CustomText.tsx`, content: customTextTs(), writePhase },
    { relativePath: `${rel}src/components/Button.tsx`, content: buttonTs(), writePhase },
    { relativePath: `${rel}src/components/RoundedCard.tsx`, content: roundedCardTs(), writePhase },
    { relativePath: `${rel}src/screens/SplashScreen/index.tsx`, content: splashScreenTs(c), writePhase },
    { relativePath: `${rel}src/screens/HomeScreen/index.tsx`, content: homeScreenTs(c), writePhase },
    { relativePath: `${rel}src/screens/NotificationScreen/index.tsx`, content: notificationScreenTs(), writePhase },
    { relativePath: `${rel}src/screens/SettingsScreen/index.tsx`, content: settingsScreenTs(), writePhase },
    { relativePath: `${rel}src/screens/InnerApp.tsx`, content: innerAppTs(c), writePhase },
    {
      relativePath: `${rel}android/app/google-services.json`,
      content: googleServicesJson(c),
      writePhase,
    },
    {
      relativePath: `${rel}ios/GoogleService-Info.plist`,
      content: googleServiceInfoPlist(c),
      writePhase,
    },
    {
      relativePath: configureAndroidFirebaseScriptPath(rel),
      content: configureAndroidFirebaseScript(),
      writePhase: "pre",
    },
    {
      relativePath: `${rel}ios/AppDelegate.swift`,
      content: appDelegateSwift(c),
      writePhase,
    },
  ];
}

export const REACT_NATIVE_EXTRA_DEPENDENCIES = [
  "@react-native-firebase/app",
  "@react-native-firebase/messaging",
  "@notifee/react-native",
  "@react-navigation/native",
  "@react-navigation/native-stack",
  "@react-navigation/bottom-tabs",
  "react-native-screens",
  "react-native-gesture-handler",
  "react-native-safe-area-context",
  "react-native-linear-gradient",
  "@reduxjs/toolkit",
  "react-redux",
  "@react-native-async-storage/async-storage",
  "react-native-config",
] as const;

export const REACT_NATIVE_EXTRA_DEV_DEPENDENCIES = [
  "babel-plugin-module-resolver",
] as const;
