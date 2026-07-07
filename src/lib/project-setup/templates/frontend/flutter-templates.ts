import type { FileTemplate, ProjectSetupConfig } from "@/lib/project-setup/types";
import { defaultApiUrl, frontendRelPrefix } from "@/lib/project-setup/templates/shared";
import { POPPINS_REGULAR_TTF_BASE64 } from "@/lib/project-setup/templates/frontend/poppins-font-base64";

/** Minimal 1x1 PNG for launcher icon placeholder. */
const DUMMY_ICON_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export function flutterPackageName(name: string): string {
  let pkg = name
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!pkg) pkg = "app";
  if (/^[0-9]/.test(pkg)) pkg = `app_${pkg}`;
  if (!/^[a-z]/.test(pkg)) pkg = `app_${pkg}`;
  return pkg;
}

interface FlutterCtx {
  pkg: string;
  projectName: string;
  description: string;
  apiUrl: string;
}

function ctx(config: ProjectSetupConfig): FlutterCtx {
  return {
    pkg: flutterPackageName(config.projectName),
    projectName: config.projectName,
    description: config.description?.trim() || "A new Flutter project.",
    apiUrl: defaultApiUrl(config),
  };
}

function pubspecYaml(c: FlutterCtx): string {
  return `name: ${c.pkg}
description: "${c.description.replace(/"/g, '\\"')}"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.8.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  get: ^4.7.2

  font_awesome_flutter: ^11.0.0
  flutter_svg: ^2.2.1

  gap: ^3.0.1
  shimmer: ^3.0.0

  flutter_native_splash: ^2.4.6

  firebase_core: ^4.0.0
  firebase_messaging: ^16.0.0
  firebase_crashlytics: ^5.0.2

  dio: ^5.8.0+1
  http: ^1.2.0
  http_parser: any
  connectivity_plus: ^7.0.0

  cached_network_image: ^3.4.1
  image_picker: ^1.1.2
  flutter_image_compress: ^2.4.0
  image_gallery_saver_plus: ^4.0.1

  awesome_notifications: ^0.10.1
  flutter_local_notifications: ^19.4.2

  permission_handler: ^12.0.1
  app_settings: ^7.0.0

  shared_preferences: ^2.5.3

  share_plus: ^12.0.0
  url_launcher: ^6.3.2

  uuid: ^4.5.1
  intl: ^0.20.2
  flutter_launcher_icons: ^0.14.4
  badges: ^3.2.0
  dropdown_flutter: ^1.0.3

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0

flutter_launcher_icons:
  android: true
  ios: true
  image_path: "assets/icon/icon.png"

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/icon/
    - .env

  fonts:
    - family: Poppins
      fonts:
        - asset: assets/fonts/Poppins-Regular.ttf
`;
}

function mainDart(c: FlutterCtx): string {
  return `import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:${c.pkg}/app/my_app.dart';
import 'package:${c.pkg}/bootstrap/app_bootstrap.dart';
import 'package:${c.pkg}/notifications/notification_handlers.dart';

void main() async {
  final binding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: binding);

  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  await AppBootstrap.run();

  runApp(MyApp(initialTheme: AppBootstrap.initialTheme));
}
`;
}

function firebaseOptionsDart(c: FlutterCtx): string {
  return `// Run \`flutterfire configure\` to replace this stub with real Firebase options.
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not configured for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'REPLACE_ME',
    appId: 'REPLACE_ME',
    messagingSenderId: 'REPLACE_ME',
    projectId: 'REPLACE_ME',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'REPLACE_ME',
    appId: 'REPLACE_ME',
    messagingSenderId: 'REPLACE_ME',
    projectId: 'REPLACE_ME',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'REPLACE_ME',
    appId: 'REPLACE_ME',
    messagingSenderId: 'REPLACE_ME',
    projectId: 'REPLACE_ME',
    iosBundleId: 'com.example.${c.pkg}',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'REPLACE_ME',
    appId: 'REPLACE_ME',
    messagingSenderId: 'REPLACE_ME',
    projectId: 'REPLACE_ME',
    iosBundleId: 'com.example.${c.pkg}',
  );
}
`;
}

function appBootstrapDart(c: FlutterCtx): string {
  return `import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:${c.pkg}/bootstrap/crashlytics_bootstrap.dart';
import 'package:${c.pkg}/bootstrap/dependency_injection.dart';
import 'package:${c.pkg}/bootstrap/notification_bootstrap.dart';
import 'package:${c.pkg}/bootstrap/theme_bootstrap.dart';
import 'package:${c.pkg}/firebase_options.dart';

class AppBootstrap {
  AppBootstrap._();

  static ThemeMode initialTheme = ThemeMode.system;

  static Future<void> run() async {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);

    initializeApiService();
    await registerCoreServices();
    await setupNotificationsBeforeRunApp();
    setupCrashlyticsHandlers();
    initialTheme = await loadInitialThemeMode();
  }
}
`;
}

function notificationBootstrapDart(c: FlutterCtx): string {
  return `import 'package:awesome_notifications/awesome_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:${c.pkg}/notifications/notification_handlers.dart';
import 'package:${c.pkg}/util/constants/color_resources.dart';

Future<void> initializeAwesomeNotifications() async {
  await AwesomeNotifications().initialize(
    'resource://drawable/ic_notification',
    [
      NotificationChannel(
        channelKey: notificationChannelKey,
        channelName: '${c.projectName} notifications',
        channelDescription:
            'Main notification channel for ${c.projectName} alerts and messages',
        playSound: true,
        defaultColor: ColorResources.colorPrimary,
        ledColor: ColorResources.white,
        importance: NotificationImportance.High,
        channelShowBadge: true,
        locked: true,
        defaultRingtoneType: DefaultRingtoneType.Notification,
        icon: 'resource://drawable/ic_notification',
      ),
    ],
  );
}

Future<void> captureInitialNotificationPayload() async {
  final initialAction = await AwesomeNotifications()
      .getInitialNotificationAction(removeFromActionEvents: false);
  if (initialAction?.payload != null && initialAction!.payload!.isNotEmpty) {
    queueInitialNotificationPayload(
      Map<String, dynamic>.from(initialAction.payload!),
    );
  }

  final initialFcmMessage =
      await FirebaseMessaging.instance.getInitialMessage();
  if (initialFcmMessage != null) {
    queueInitialNotificationPayload(
      Map<String, dynamic>.from(
        notificationPayloadFromMessage(initialFcmMessage),
      ),
    );
  }
}

Future<void> setupNotificationsBeforeRunApp() async {
  await initializeAwesomeNotifications();
  await captureInitialNotificationPayload();
  forwardInitialNotificationPayload();
  registerFirebaseMessagingInteractionHandlers();
}
`;
}

function notificationHandlersDart(c: FlutterCtx): string {
  return `import 'dart:async';
import 'dart:io';

import 'package:awesome_notifications/awesome_notifications.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:${c.pkg}/core/routes.dart';
import 'package:${c.pkg}/util/constants/app_constants.dart';
import 'package:${c.pkg}/util/constants/color_resources.dart';
import 'package:${c.pkg}/util/helpers/common_methods.dart';
import 'package:${c.pkg}/util/storage/shared_preference.dart';

import 'notification_constants.dart';

export 'notification_constants.dart';

Map<String, dynamic>? pendingInitialNotificationPayload;

bool _firebaseMessagingInteractionHandlersRegistered = false;
String? _lastForegroundMessageId;
String? _handledNotificationId;

String? _nonEmptyNotificationValue(dynamic value) {
  final normalized = value?.toString().trim() ?? '';
  return normalized.isEmpty ? null : normalized;
}

String _notificationPayloadFingerprint(Map<String, dynamic> data) {
  final entries = data.entries
      .where((entry) => entry.key.trim().isNotEmpty)
      .map((entry) => MapEntry(entry.key.trim(), entry.value?.toString() ?? ''))
      .toList()
    ..sort((a, b) => a.key.compareTo(b.key));

  return entries.map((entry) => '\${entry.key}=\${entry.value}').join('&');
}

String? _notificationIdentityFromPayload(Map<String, dynamic> data) {
  final directId = _nonEmptyNotificationValue(data['notificationId']) ??
      _nonEmptyNotificationValue(data['messageId']) ??
      _nonEmptyNotificationValue(data['id']);
  if (directId != null) {
    return directId;
  }

  final type = _nonEmptyNotificationValue(data['type']);
  final referenceId = _nonEmptyNotificationValue(data['referenceId']);
  final composite = [type, referenceId]
      .whereType<String>()
      .join('|');
  if (composite.isNotEmpty) {
    return composite;
  }

  final fingerprint = _notificationPayloadFingerprint(data);
  return fingerprint.isEmpty ? null : fingerprint;
}

String? _notificationIdentityFromMessage(RemoteMessage message) {
  return _notificationIdentityFromPayload(
    notificationPayloadFromMessage(message),
  );
}

bool _shouldSkipForegroundMessage(RemoteMessage message) {
  final messageId = _notificationIdentityFromMessage(message);
  if (messageId == null) {
    return false;
  }

  if (_lastForegroundMessageId == messageId) {
    return true;
  }

  _lastForegroundMessageId = messageId;
  return false;
}

bool _markNotificationHandled(Map<String, dynamic> payload) {
  final notificationId = _notificationIdentityFromPayload(payload);
  if (notificationId == null) {
    return true;
  }

  if (_handledNotificationId == notificationId) {
    return false;
  }

  _handledNotificationId = notificationId;
  return true;
}

bool _isNotificationNavigationReady() {
  return Get.key.currentState != null ||
      Get.context != null ||
      Get.overlayContext != null;
}

void queueInitialNotificationPayload(Map<String, dynamic> payload) {
  if (payload.isEmpty) return;

  final nextPayload = Map<String, dynamic>.from(payload);
  final pendingPayload = pendingInitialNotificationPayload;
  final nextId = _notificationIdentityFromPayload(nextPayload);
  final pendingId = pendingPayload == null
      ? null
      : _notificationIdentityFromPayload(pendingPayload);

  if (nextId != null && pendingId == nextId) {
    return;
  }

  pendingInitialNotificationPayload = nextPayload;
}

void forwardInitialNotificationPayload() {
  // Payload is consumed on first frame in MyApp.
}

bool _shouldDeferNotificationNavigationDuringStartup() {
  const startupRoutes = <String>{
    '',
    '/',
    Routes.splash,
    Routes.home,
  };
  return startupRoutes.contains(Get.currentRoute);
}

Future<void> routeNotificationPayload(Map<String, dynamic> payload) async {
  final normalizedPayload = payload.isEmpty
      ? <String, dynamic>{'type': 'alert'}
      : Map<String, dynamic>.from(payload);

  if (_shouldDeferNotificationNavigationDuringStartup()) {
    queueInitialNotificationPayload(normalizedPayload);
    return;
  }

  if (!_isNotificationNavigationReady()) {
    queueInitialNotificationPayload(normalizedPayload);
    return;
  }

  if (!_markNotificationHandled(normalizedPayload)) {
    return;
  }

  Get.toNamed(Routes.notificationScreen);
}

void registerFirebaseMessagingInteractionHandlers() {
  if (_firebaseMessagingInteractionHandlersRegistered) return;
  _firebaseMessagingInteractionHandlersRegistered = true;

  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    if (_shouldSkipForegroundMessage(message)) {
      return;
    }

    if (Platform.isIOS) {
      showLocalNotificationFromMessage(message,
          skipWhenSystemNotificationExists: true);
    } else {
      showLocalNotificationFromMessage(message);
    }
  });

  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) async {
    await handleNotificationNavigation(message);
  });
}

Map<String, String> notificationPayloadFromMessage(RemoteMessage message) {
  final Map<String, String> payload = {};
  for (final entry in message.data.entries) {
    final key = entry.key;
    final value = entry.value;
    if (key.isEmpty) continue;
    payload[key] = value?.toString() ?? '';
  }
  payload['type'] = payload['type'] ?? 'alert';
  final messageId = _nonEmptyNotificationValue(message.messageId);
  if (messageId != null) {
    payload['messageId'] = payload['messageId'] ?? messageId;
  }
  final title = message.notification?.title;
  final body = message.notification?.body;
  if (title != null && title.trim().isNotEmpty) {
    payload['title'] = title.trim();
  }
  if (body != null && body.trim().isNotEmpty) {
    payload['body'] = body.trim();
  }
  return payload;
}

Future<String?> _readActiveUserIdForNotificationStamp() async {
  try {
    final value = await SharedPreferencesHelper.getData(AppConstants.userId);
    return _nonEmptyNotificationValue(value);
  } catch (e) {
    if (kDebugMode) {
      debugPrint('Could not read active userId for notification stamp: \$e');
    }
    return null;
  }
}

Future<void> showLocalNotificationFromMessage(
  RemoteMessage message, {
  bool skipWhenSystemNotificationExists = false,
}) async {
  final Map<String, String> payload = notificationPayloadFromMessage(message);
  final String type = (payload['type'] ?? 'alert').trim();
  final String normalizedType = type.toLowerCase();
  final String notificationIdString = payload['notificationId'] ?? '-1';
  final int notificationId = notificationIdString.hashCode.abs();

  if (normalizedType == 'cancel') {
    cancelNotification(notificationId);
    return;
  }

  if (skipWhenSystemNotificationExists && message.notification != null) {
    return;
  }

  final String? title = message.notification?.title ?? payload['title'];
  final String? body = message.notification?.body ?? payload['body'];
  final String image = message.notification?.android?.imageUrl ??
      payload['imageUrl'] ??
      payload['image'] ??
      '';

  if (title != null && title.trim().isNotEmpty) {
    payload['title'] = title.trim();
  }
  if (body != null && body.trim().isNotEmpty) {
    payload['body'] = body.trim();
  }

  final String? activeUserId = await _readActiveUserIdForNotificationStamp();
  if (activeUserId != null &&
      !payload.containsKey(kNotificationRecipientUserIdKey)) {
    payload[kNotificationRecipientUserIdKey] = activeUserId;
  }

  await AwesomeNotifications().createNotification(
    content: NotificationContent(
      id: notificationId,
      channelKey: notificationChannelKey,
      icon: 'resource://drawable/ic_notification',
      color: ColorResources.colorSecondary,
      title: title,
      body: body,
      backgroundColor: ColorResources.orange,
      largeIcon: 'resource://drawable/ic_notification',
      bigPicture: image.isNotEmpty ? image : null,
      notificationLayout: image.isNotEmpty
          ? NotificationLayout.BigPicture
          : NotificationLayout.Default,
      payload: payload,
    ),
  );
}

Future<void> initializeNotificationServices() async {
  try {
    await configureFirebaseMessaging();
  } catch (e) {
    FirebaseCrashlytics.instance.recordError(
      e,
      StackTrace.current,
      reason: 'Failed to initialize notification services',
      fatal: false,
    );
  }
}

Future<void> configureFirebaseMessaging() async {
  await FirebaseMessaging.instance.requestPermission(
    sound: true,
    badge: true,
    alert: true,
    provisional: false,
    criticalAlert: true,
  );

  await FirebaseMessaging.instance.setForegroundNotificationPresentationOptions(
    alert: true,
    badge: true,
    sound: true,
  );

  await CommonMethods().getFCMToken();
}

Future<void> handleNotificationNavigation(RemoteMessage message) async {
  await routeNotificationPayload(
    Map<String, dynamic>.from(notificationPayloadFromMessage(message)),
  );
}

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();

  await AwesomeNotifications().initialize(
    'resource://drawable/ic_notification',
    [
      NotificationChannel(
        channelKey: notificationChannelKey,
        channelName: '${c.projectName} notifications',
        channelDescription:
            'Main notification channel for ${c.projectName} alerts and messages',
        playSound: true,
        defaultColor: ColorResources.colorPrimary,
        ledColor: ColorResources.white,
        importance: NotificationImportance.High,
        channelShowBadge: true,
        locked: true,
        defaultRingtoneType: DefaultRingtoneType.Notification,
        icon: 'resource://drawable/ic_notification',
      ),
    ],
  );

  await showLocalNotificationFromMessage(
    message,
    skipWhenSystemNotificationExists: true,
  );
}

Future<void> startListeningNotificationEvents() async {
  AwesomeNotifications().setListeners(
    onActionReceivedMethod: onActionReceivedMethod,
    onNotificationCreatedMethod: onNotificationCreatedMethod,
    onNotificationDisplayedMethod: onNotificationDisplayedMethod,
    onDismissActionReceivedMethod: onDismissActionReceivedMethod,
  );
}

@pragma('vm:entry-point')
Future<void> onActionReceivedMethod(ReceivedAction receivedAction) async {
  return onActionReceivedImplementationMethod(receivedAction);
}

@pragma('vm:entry-point')
Future<void> onNotificationCreatedMethod(
    ReceivedNotification receivedNotification) async {}

@pragma('vm:entry-point')
Future<void> onNotificationDisplayedMethod(
    ReceivedNotification receivedNotification) async {}

@pragma('vm:entry-point')
Future<void> onDismissActionReceivedMethod(
    ReceivedAction receivedAction) async {}

Future<void> onActionReceivedImplementationMethod(
    ReceivedAction receivedAction) async {
  final Map<String, dynamic> payload =
      Map<String, dynamic>.from(receivedAction.payload ?? {});

  await routeNotificationPayload(payload);
}

void cancelAllNotifications() {
  AwesomeNotifications().cancelAll();
}

void cancelNotification(int id) {
  AwesomeNotifications().cancel(id);
}
`;
}

function myAppDart(c: FlutterCtx): string {
  return `import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:get/get.dart';
import 'package:${c.pkg}/core/app_pages.dart';
import 'package:${c.pkg}/core/routes.dart';
import 'package:${c.pkg}/notifications/notification_handlers.dart';
import 'package:${c.pkg}/themes/app_themes.dart';
import 'package:${c.pkg}/util/ui/keyboard_dismiss_wrapper.dart';
import 'package:${c.pkg}/view/screen/splash/bindings/splash_binding.dart';

class MyApp extends StatefulWidget {
  const MyApp({super.key, required this.initialTheme});

  final ThemeMode initialTheme;

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  void initState() {
    super.initState();
    FlutterNativeSplash.remove();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await startListeningNotificationEvents();

      final pending = pendingInitialNotificationPayload;
      pendingInitialNotificationPayload = null;
      if (pending != null && pending.isNotEmpty) {
        await routeNotificationPayload(pending);
      }

      Future.delayed(const Duration(milliseconds: 300), () async {
        await initializeNotificationServices();
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return KeyboardDismissWrapper(
      child: GetMaterialApp(
        enableLog: true,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: widget.initialTheme,
        defaultTransition: Transition.fadeIn,
        transitionDuration: const Duration(milliseconds: 200),
        initialBinding: SplashBinding(),
        initialRoute: Routes.splash,
        getPages: appPages,
      ),
    );
  }
}
`;
}

function androidAppBuildGradleKts(c: FlutterCtx): string {
  const appId = `com.example.${c.pkg}`;
  return `plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "${appId}"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        // Required by flutter_local_notifications and other plugins using Java 8+ APIs.
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        applicationId = "${appId}"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
}
`;
}

function androidNotificationIconXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2zM18,16v-5c0,-3.07 -1.63,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.64,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z"/>
</vector>
`;
}

function gitkeep(): string {
  return "";
}

export function flutterLayeredFiles(config: ProjectSetupConfig): FileTemplate[] {
  const rel = frontendRelPrefix(config);
  const c = ctx(config);
  const writePhase = "post" as const;

  const files: FileTemplate[] = [
    { relativePath: `${rel}pubspec.yaml`, content: pubspecYaml(c), writePhase },
    { relativePath: `${rel}analysis_options.yaml`, content: analysisOptionsYaml(), writePhase },
    { relativePath: `${rel}flutter_native_splash.yaml`, content: flutterNativeSplashYaml(), writePhase },
    { relativePath: `${rel}.env.example`, content: flutterEnvExample(c), writePhase },
    { relativePath: `${rel}lib/main.dart`, content: mainDart(c), writePhase },
    { relativePath: `${rel}lib/firebase_options.dart`, content: firebaseOptionsDart(c), writePhase },
    { relativePath: `${rel}lib/app/my_app.dart`, content: myAppDart(c), writePhase },
    {
      relativePath: `${rel}lib/bootstrap/app_bootstrap.dart`,
      content: appBootstrapDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/bootstrap/dependency_injection.dart`,
      content: dependencyInjectionDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/bootstrap/theme_bootstrap.dart`,
      content: themeBootstrapDart(),
      writePhase,
    },
    {
      relativePath: `${rel}lib/bootstrap/notification_bootstrap.dart`,
      content: notificationBootstrapDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/bootstrap/crashlytics_bootstrap.dart`,
      content: crashlyticsBootstrapDart(),
      writePhase,
    },
    { relativePath: `${rel}lib/core/routes.dart`, content: routesDart(), writePhase },
    { relativePath: `${rel}lib/core/app_pages.dart`, content: appPagesDart(c), writePhase },
    { relativePath: `${rel}lib/core/keys/app_keys.dart`, content: appKeysDart(), writePhase },
    { relativePath: `${rel}lib/themes/app_themes.dart`, content: appThemesDart(c), writePhase },
    {
      relativePath: `${rel}lib/notifications/notification_constants.dart`,
      content: notificationConstantsDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/notifications/notification_handlers.dart`,
      content: notificationHandlersDart(c),
      writePhase,
    },
    { relativePath: `${rel}lib/util/config/app_config.dart`, content: appConfigDart(c), writePhase },
    {
      relativePath: `${rel}lib/util/constants/app_constants.dart`,
      content: appConstantsDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/util/constants/color_resources.dart`,
      content: colorResourcesDart(),
      writePhase,
    },
    {
      relativePath: `${rel}lib/util/constants/dimensions.dart`,
      content: dimensionsDart(),
      writePhase,
    },
    {
      relativePath: `${rel}lib/util/constants/app_strings.dart`,
      content: appStringsDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/util/constants/images.dart`,
      content: imagesDart(),
      writePhase,
    },
    {
      relativePath: `${rel}lib/util/helpers/common_methods.dart`,
      content: commonMethodsDart(),
      writePhase,
    },
    {
      relativePath: `${rel}lib/util/network/api_service.dart`,
      content: apiServiceDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/util/network/api_interceptor.dart`,
      content: apiInterceptorDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/util/storage/shared_preference.dart`,
      content: sharedPreferenceDart(),
      writePhase,
    },
    { relativePath: `${rel}lib/util/ui/keyboard_dismiss_wrapper.dart`, content: keyboardDismissDart(), writePhase },
    {
      relativePath: `${rel}lib/view/screen/splash/bindings/splash_binding.dart`,
      content: splashBindingDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/view/screen/splash/controller/splash_controller.dart`,
      content: splashControllerDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/view/screen/splash/screen/splash_screen.dart`,
      content: splashScreenDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/view/screen/home/binding/home_binding.dart`,
      content: homeBindingDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/view/screen/home/controller/home_controller.dart`,
      content: homeControllerDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/view/screen/home/screen/home_screen.dart`,
      content: homeScreenDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/view/screen/notification/screen/notification_screen.dart`,
      content: notificationScreenDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/view/widget/text/custom_text_medium.dart`,
      content: customTextMediumDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/view/widget/text/custom_text_bold.dart`,
      content: customTextBoldDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/view/widget/buttons/custom_elevated_button.dart`,
      content: customElevatedButtonDart(c),
      writePhase,
    },
    {
      relativePath: `${rel}lib/view/widget/layout/rounded_card.dart`,
      content: roundedCardDart(c),
      writePhase,
    },
    { relativePath: `${rel}test/widget_test.dart`, content: widgetTestDart(c), writePhase },
    {
      relativePath: `${rel}android/app/build.gradle.kts`,
      content: androidAppBuildGradleKts(c),
      writePhase,
    },
    {
      relativePath: `${rel}android/app/src/main/res/drawable/ic_notification.xml`,
      content: androidNotificationIconXml(),
      writePhase,
    },
    {
      relativePath: `${rel}assets/icon/icon.png`,
      content: DUMMY_ICON_PNG_BASE64,
      encoding: "base64",
      writePhase,
    },
    {
      relativePath: `${rel}assets/fonts/Poppins-Regular.ttf`,
      content: POPPINS_REGULAR_TTF_BASE64,
      encoding: "base64",
      writePhase,
    },
    { relativePath: `${rel}assets/images/.gitkeep`, content: gitkeep(), writePhase },
    { relativePath: `${rel}assets/raw/.gitkeep`, content: gitkeep(), writePhase },
    { relativePath: `${rel}lib/data/models/.gitkeep`, content: gitkeep(), writePhase },
    { relativePath: `${rel}lib/data/network/.gitkeep`, content: gitkeep(), writePhase },
    { relativePath: `${rel}lib/data/repositories/.gitkeep`, content: gitkeep(), writePhase },
    { relativePath: `${rel}lib/util/controllers/.gitkeep`, content: gitkeep(), writePhase },
    { relativePath: `${rel}lib/util/extensions/.gitkeep`, content: gitkeep(), writePhase },
    { relativePath: `${rel}lib/util/managers/.gitkeep`, content: gitkeep(), writePhase },
    { relativePath: `${rel}lib/util/notifications/.gitkeep`, content: gitkeep(), writePhase },
    { relativePath: `${rel}lib/util/services/.gitkeep`, content: gitkeep(), writePhase },
    { relativePath: `${rel}lib/view/widget/dialogs/.gitkeep`, content: gitkeep(), writePhase },
    { relativePath: `${rel}lib/view/widget/feedback/.gitkeep`, content: gitkeep(), writePhase },
    { relativePath: `${rel}lib/view/widget/inputs/.gitkeep`, content: gitkeep(), writePhase },
    { relativePath: `${rel}lib/view/widget/layout/.gitkeep`, content: gitkeep(), writePhase },
    { relativePath: `${rel}lib/view/widget/shimmer/.gitkeep`, content: gitkeep(), writePhase },
    { relativePath: `${rel}.env`, content: `API_BASE_URL=${c.apiUrl}\n`, writePhase },
  ];

  return files;
}

function flutterEnvExample(c: FlutterCtx): string {
  return `# API base URL for Dio requests
API_BASE_URL=${c.apiUrl}

# Run flutterfire configure and add Firebase keys here when ready.
`;
}

function analysisOptionsYaml(): string {
  return `include: package:flutter_lints/flutter.yaml

linter:
  rules:
    avoid_print: true
`;
}

function flutterNativeSplashYaml(): string {
  return `flutter_native_splash:
  color: "#2196F3"
  image: assets/icon/icon.png
  android: true
  ios: true
  android_12:
    color: "#2196F3"
    image: assets/icon/icon.png
`;
}

function dependencyInjectionDart(c: FlutterCtx): string {
  return `import 'package:${c.pkg}/util/network/api_service.dart';

void initializeApiService() {
  ApiService().initialize();
}

Future<void> registerCoreServices() async {}
`;
}

function themeBootstrapDart(): string {
  return `import 'package:flutter/material.dart';

Future<ThemeMode> loadInitialThemeMode() async {
  return ThemeMode.system;
}
`;
}

function crashlyticsBootstrapDart(): string {
  return `void setupCrashlyticsHandlers() {}
`;
}

function routesDart(): string {
  return `class Routes {
  Routes._();

  static const String splash = '/splash';
  static const String home = '/home';
  static const String notificationScreen = '/notification_screen';
}
`;
}

function appPagesDart(c: FlutterCtx): string {
  return `import 'package:get/get.dart';
import 'package:${c.pkg}/core/routes.dart';
import 'package:${c.pkg}/view/screen/home/binding/home_binding.dart';
import 'package:${c.pkg}/view/screen/home/screen/home_screen.dart';
import 'package:${c.pkg}/view/screen/notification/screen/notification_screen.dart';
import 'package:${c.pkg}/view/screen/splash/screen/splash_screen.dart';

final List<GetPage<dynamic>> appPages = [
  GetPage(
    name: Routes.splash,
    page: () => const SplashScreen(),
  ),
  GetPage(
    name: Routes.home,
    page: () => const HomeScreen(),
    binding: HomeBinding(),
  ),
  GetPage(
    name: Routes.notificationScreen,
    page: () => const NotificationScreen(),
  ),
];
`;
}

function appKeysDart(): string {
  return `import 'package:flutter/material.dart';

class AppKeys {
  AppKeys._();

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
}
`;
}

function appThemesDart(c: FlutterCtx): string {
  return `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:${c.pkg}/util/constants/color_resources.dart';
import 'package:${c.pkg}/util/constants/dimensions.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      fontFamily: 'Poppins',
      colorScheme: ColorScheme.fromSeed(seedColor: ColorResources.colorPrimary),
      scaffoldBackgroundColor: const Color(0xFFF8FBFF),
      textTheme: const TextTheme(
        bodyLarge: TextStyle(color: ColorResources.black),
        bodyMedium: TextStyle(color: ColorResources.textSecondary),
      ),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        centerTitle: false,
        backgroundColor: Colors.transparent,
        foregroundColor: ColorResources.white,
        titleTextStyle: TextStyle(
          color: ColorResources.white,
          fontSize: Dimensions.fontSizeTitle,
          fontWeight: FontWeight.w700,
          fontFamily: 'Poppins',
        ),
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarBrightness: Brightness.dark,
          statusBarIconBrightness: Brightness.light,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: ColorResources.colorPrimary,
          foregroundColor: ColorResources.white,
          padding: const EdgeInsets.symmetric(
            horizontal: Dimensions.paddingXXLarge,
            vertical: Dimensions.paddingLarge,
          ),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Dimensions.radiusLarge),
          ),
          textStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontFamily: 'Poppins',
          ),
        ),
      ),
      cardTheme: CardThemeData(
        color: ColorResources.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Dimensions.radiusExtraLarge),
          side: const BorderSide(color: ColorResources.borderLight),
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      fontFamily: 'Poppins',
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: ColorResources.colorPrimary,
        brightness: Brightness.dark,
      ),
      scaffoldBackgroundColor: const Color(0xFF101820),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: ColorResources.white,
      ),
    );
  }
}
`;
}

function notificationConstantsDart(c: FlutterCtx): string {
  return `const String kNotificationRecipientUserIdKey = '_recipientUserId';

const String notificationChannelKey = '${c.pkg}_notifications';
`;
}

function appConfigDart(c: FlutterCtx): string {
  return `class AppConfig {
  AppConfig._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '${c.apiUrl}',
  );
}
`;
}

function appConstantsDart(c: FlutterCtx): string {
  return `import 'package:${c.pkg}/util/config/app_config.dart';

class AppConstants {
  AppConstants._();

  static const String baseUrl = AppConfig.apiBaseUrl;
  static const String userId = 'user_id';
}
`;
}

function colorResourcesDart(): string {
  return `import 'package:flutter/material.dart';

class ColorResources {
  ColorResources._();

  static const Color colorPrimary = Color(0xFF2196F3);
  static const Color colorPrimaryDark = Color(0xFF1976D2);
  static const Color colorSecondary = Color(0xFF03A9F4);
  static const Color orange = Color(0xFFFF9800);
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF1A1A1A);
  static const Color grey = Color(0xFF9E9E9E);
  static const Color textSecondary = Color(0xFF616161);
  static const Color cardBackground = Color(0xFFF5F9FF);
  static const Color borderLight = Color(0xFFE3F2FD);

  static const LinearGradient splashGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF2196F3),
      Color(0xFF03A9F4),
      Color(0xFF00BCD4),
    ],
  );

  static const LinearGradient homeHeaderGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF2196F3),
      Color(0xFF1976D2),
    ],
  );
}
`;
}

function commonMethodsDart(): string {
  return `import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

class CommonMethods {
  Future<String?> getFCMToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (kDebugMode) {
        debugPrint('FCM token: \$token');
      }
      return token;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('FCM token error: \$e');
      }
      return null;
    }
  }
}
`;
}

function apiServiceDart(c: FlutterCtx): string {
  return `import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:${c.pkg}/util/constants/app_constants.dart';
import 'package:${c.pkg}/util/network/api_interceptor.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late final Dio _dio;

  void initialize() {
    _dio = Dio();
    _dio.interceptors.add(ApiInterceptor(_dio));
    _dio.options.baseUrl = AppConstants.baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 60);
    _dio.options.receiveTimeout = const Duration(seconds: 60);
    _dio.options.sendTimeout = const Duration(seconds: 60);

    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
        requestHeader: true,
        responseHeader: false,
        logPrint: (object) => debugPrint(object.toString()),
      ));
    }
  }

  Dio get dio => _dio;

  Future<Response<dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.get(path, queryParameters: queryParameters, options: options);
  }
}
`;
}

function apiInterceptorDart(c: FlutterCtx): string {
  return `import 'package:dio/dio.dart';

class ApiInterceptor extends Interceptor {
  ApiInterceptor(this._dio);

  final Dio _dio;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    options.headers.putIfAbsent('Accept', () => 'application/json');
    handler.next(options);
  }
}
`;
}

function sharedPreferenceDart(): string {
  return `import 'package:shared_preferences/shared_preferences.dart';

class SharedPreferencesHelper {
  static Future<String?> getData(String key) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(key);
  }

  static Future<bool> setData(String key, String value) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.setString(key, value);
  }
}
`;
}

function keyboardDismissDart(): string {
  return `import 'package:flutter/material.dart';

class KeyboardDismissWrapper extends StatelessWidget {
  const KeyboardDismissWrapper({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: child,
    );
  }
}
`;
}

function splashBindingDart(c: FlutterCtx): string {
  return `import 'package:get/get.dart';
import 'package:${c.pkg}/view/screen/splash/controller/splash_controller.dart';

class SplashBinding extends Bindings {
  @override
  void dependencies() {
    Get.put(SplashController());
  }
}
`;
}

function splashControllerDart(c: FlutterCtx): string {
  return `import 'dart:async';

import 'package:get/get.dart';
import 'package:${c.pkg}/core/routes.dart';

class SplashController extends GetxController {
  @override
  void onInit() {
    super.onInit();
    Timer(const Duration(seconds: 2), () {
      Get.offAllNamed(Routes.home);
    });
  }
}
`;
}

function splashScreenDart(c: FlutterCtx): string {
  return `import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:${c.pkg}/util/constants/app_strings.dart';
import 'package:${c.pkg}/util/constants/color_resources.dart';
import 'package:${c.pkg}/util/constants/dimensions.dart';
import 'package:${c.pkg}/util/constants/images.dart';
import 'package:${c.pkg}/view/widget/text/custom_text_bold.dart';
import 'package:${c.pkg}/view/widget/text/custom_text_medium.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: ColorResources.splashGradient,
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                height: 112,
                width: 112,
                decoration: BoxDecoration(
                  color: ColorResources.white,
                  borderRadius: BorderRadius.circular(Dimensions.radiusXXLarge),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.12),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(Dimensions.paddingLarge),
                child: Image.asset(
                  Images.appIcon,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const Icon(
                    Icons.rocket_launch_rounded,
                    size: Dimensions.iconSizeHero,
                    color: ColorResources.colorPrimary,
                  ),
                ),
              ),
              const Gap(Dimensions.gapXXLarge),
              CustomTextBold(
                '${c.projectName}',
                fontSize: Dimensions.fontSizeTitleLarge,
                color: ColorResources.white,
                textAlign: TextAlign.center,
              ),
              const Gap(Dimensions.gapSmall),
              const CustomTextMedium(
                AppStrings.splashTagline,
                color: ColorResources.white,
                textAlign: TextAlign.center,
              ),
              const Gap(Dimensions.gapUltra),
              const SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  color: ColorResources.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`;
}

function homeBindingDart(c: FlutterCtx): string {
  return `import 'package:get/get.dart';
import 'package:${c.pkg}/view/screen/home/controller/home_controller.dart';

class HomeBinding extends Bindings {
  @override
  void dependencies() {
    Get.put(HomeController());
  }
}
`;
}

function homeControllerDart(c: FlutterCtx): string {
  return `import 'package:get/get.dart';
import 'package:${c.pkg}/util/constants/app_strings.dart';

class HomeController extends GetxController {
  final title = '${c.projectName}'.obs;
  final subtitle = AppStrings.homeSubtitle.obs;

  final features = <String>[
    AppStrings.featureGetX,
    AppStrings.featureFirebase,
    AppStrings.featureApi,
  ].obs;
}
`;
}

function homeScreenDart(c: FlutterCtx): string {
  return `import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:get/get.dart';
import 'package:${c.pkg}/util/constants/app_strings.dart';
import 'package:${c.pkg}/util/constants/color_resources.dart';
import 'package:${c.pkg}/util/constants/dimensions.dart';
import 'package:${c.pkg}/view/screen/home/controller/home_controller.dart';
import 'package:${c.pkg}/view/widget/buttons/custom_elevated_button.dart';
import 'package:${c.pkg}/view/widget/layout/rounded_card.dart';
import 'package:${c.pkg}/view/widget/text/custom_text_bold.dart';
import 'package:${c.pkg}/view/widget/text/custom_text_medium.dart';

class HomeScreen extends GetView<HomeController> {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Container(
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: ColorResources.homeHeaderGradient,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(Dimensions.radiusXXLarge),
                bottomRight: Radius.circular(Dimensions.radiusXXLarge),
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  Dimensions.paddingXXLarge,
                  Dimensions.paddingLarge,
                  Dimensions.paddingXXLarge,
                  Dimensions.paddingXXLarge,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Obx(
                      () => CustomTextBold(
                        controller.title.value,
                        fontSize: Dimensions.fontSizeTitle,
                        color: ColorResources.white,
                      ),
                    ),
                    const Gap(Dimensions.gapSmall),
                    Obx(
                      () => CustomTextMedium(
                        controller.subtitle.value,
                        color: ColorResources.white.withValues(alpha: 0.92),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(Dimensions.paddingXXLarge),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  RoundedCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const CustomTextBold(
                          AppStrings.homeCardTitle,
                          fontSize: Dimensions.fontSizeExtraLarge,
                        ),
                        const Gap(Dimensions.gapMedium),
                        const CustomTextMedium(
                          AppStrings.homeCardBody,
                          color: ColorResources.textSecondary,
                        ),
                        const Gap(Dimensions.gapLarge),
                        Obx(
                          () => Column(
                            children: controller.features
                                .map(
                                  (feature) => Padding(
                                    padding: const EdgeInsets.only(
                                      bottom: Dimensions.gapMedium,
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(
                                          Icons.check_circle_rounded,
                                          color: ColorResources.colorPrimary,
                                          size: Dimensions.iconSizeDefault,
                                        ),
                                        const Gap(Dimensions.gapMedium),
                                        Expanded(
                                          child: CustomTextMedium(feature),
                                        ),
                                      ],
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Gap(Dimensions.gapXXLarge),
                  CustomElevatedButton(
                    text: AppStrings.homePrimaryAction,
                    onPressed: () {
                      Get.snackbar(
                        AppStrings.homeSnackbarTitle,
                        AppStrings.homeSnackbarBody,
                        snackPosition: SnackPosition.BOTTOM,
                        margin: const EdgeInsets.all(Dimensions.paddingLarge),
                        borderRadius: Dimensions.radiusLarge,
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
`;
}

function notificationScreenDart(c: FlutterCtx): string {
  return `import 'package:flutter/material.dart';
import 'package:gap/gap.dart';
import 'package:${c.pkg}/util/constants/app_strings.dart';
import 'package:${c.pkg}/util/constants/color_resources.dart';
import 'package:${c.pkg}/util/constants/dimensions.dart';
import 'package:${c.pkg}/view/widget/layout/rounded_card.dart';
import 'package:${c.pkg}/view/widget/text/custom_text_bold.dart';
import 'package:${c.pkg}/view/widget/text/custom_text_medium.dart';

class NotificationScreen extends StatelessWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const CustomTextBold(
          AppStrings.notificationsTitle,
          color: ColorResources.black,
        ),
        backgroundColor: ColorResources.white,
        foregroundColor: ColorResources.black,
        elevation: 0.5,
      ),
      body: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingXXLarge),
        child: RoundedCard(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(
                Icons.notifications_none_rounded,
                size: Dimensions.iconSizeHero,
                color: ColorResources.colorPrimary,
              ),
              Gap(Dimensions.gapLarge),
              CustomTextBold(
                AppStrings.notificationsEmptyTitle,
                fontSize: Dimensions.fontSizeExtraLarge,
                textAlign: TextAlign.center,
              ),
              Gap(Dimensions.gapSmall),
              CustomTextMedium(
                AppStrings.notificationsEmptyBody,
                color: ColorResources.textSecondary,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`;
}

function dimensionsDart(): string {
  return `class Dimensions {
  Dimensions._();

  static const double fontSizeDefault = 14.0;
  static const double fontSizeLarge = 16.0;
  static const double fontSizeExtraLarge = 18.0;
  static const double fontSizeTitle = 24.0;
  static const double fontSizeTitleLarge = 30.0;

  static const double paddingLarge = 16.0;
  static const double paddingXXLarge = 24.0;

  static const double gapSmall = 8.0;
  static const double gapMedium = 12.0;
  static const double gapLarge = 16.0;
  static const double gapXXLarge = 24.0;
  static const double gapUltra = 40.0;

  static const double radiusLarge = 12.0;
  static const double radiusExtraLarge = 16.0;
  static const double radiusXXLarge = 24.0;

  static const double iconSizeDefault = 20.0;
  static const double iconSizeHero = 56.0;
}
`;
}

function appStringsDart(c: FlutterCtx): string {
  return `class AppStrings {
  AppStrings._();

  static const String splashTagline = 'Getting things ready...';
  static const String homeSubtitle = 'Your Flutter starter is ready to build on.';
  static const String homeCardTitle = 'What is included';
  static const String homeCardBody =
      '${c.projectName} ships with a Tapsy-inspired structure, notifications, and API wiring.';
  static const String featureGetX = 'GetX routing, bindings, and controllers';
  static const String featureFirebase = 'Firebase messaging and notification handlers';
  static const String featureApi = 'Dio API client with configurable base URL';
  static const String homePrimaryAction = 'Get started';
  static const String homeSnackbarTitle = 'Ready to go';
  static const String homeSnackbarBody = 'Replace this screen with your first feature.';
  static const String notificationsTitle = 'Notifications';
  static const String notificationsEmptyTitle = 'No notifications yet';
  static const String notificationsEmptyBody =
      'Notification taps will land here until you wire custom routing.';
}
`;
}

function imagesDart(): string {
  return `class Images {
  Images._();

  static const String appIcon = 'assets/icon/icon.png';
}
`;
}

function customTextMediumDart(c: FlutterCtx): string {
  return `import 'package:flutter/material.dart';
import 'package:${c.pkg}/util/constants/dimensions.dart';

class CustomTextMedium extends StatelessWidget {
  const CustomTextMedium(
    this.text, {
    super.key,
    this.maxLines,
    this.textAlign,
    this.fontSize,
    this.color,
  });

  final String text;
  final int? maxLines;
  final TextAlign? textAlign;
  final double? fontSize;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: fontSize ?? Dimensions.fontSizeDefault,
        color: color,
        fontWeight: FontWeight.w500,
      ),
      overflow: maxLines != null ? TextOverflow.ellipsis : null,
      maxLines: maxLines,
      textAlign: textAlign ?? TextAlign.left,
    );
  }
}
`;
}

function customTextBoldDart(c: FlutterCtx): string {
  return `import 'package:flutter/material.dart';
import 'package:${c.pkg}/util/constants/dimensions.dart';

class CustomTextBold extends StatelessWidget {
  const CustomTextBold(
    this.text, {
    super.key,
    this.maxLines,
    this.textAlign,
    this.fontSize,
    this.color,
  });

  final String text;
  final int? maxLines;
  final TextAlign? textAlign;
  final double? fontSize;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: fontSize ?? Dimensions.fontSizeLarge,
        color: color,
        fontWeight: FontWeight.w700,
      ),
      overflow: maxLines != null ? TextOverflow.ellipsis : null,
      maxLines: maxLines,
      textAlign: textAlign ?? TextAlign.left,
    );
  }
}
`;
}

function customElevatedButtonDart(c: FlutterCtx): string {
  return `import 'package:flutter/material.dart';
import 'package:${c.pkg}/util/constants/color_resources.dart';
import 'package:${c.pkg}/util/constants/dimensions.dart';

class CustomElevatedButton extends StatelessWidget {
  const CustomElevatedButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
  });

  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        child: isLoading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: ColorResources.white,
                ),
              )
            : Text(text),
      ),
    );
  }
}
`;
}

function roundedCardDart(c: FlutterCtx): string {
  return `import 'package:flutter/material.dart';
import 'package:${c.pkg}/util/constants/color_resources.dart';
import 'package:${c.pkg}/util/constants/dimensions.dart';

class RoundedCard extends StatelessWidget {
  const RoundedCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(Dimensions.paddingXXLarge),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: ColorResources.white,
        borderRadius: BorderRadius.circular(Dimensions.radiusExtraLarge),
        border: Border.all(color: ColorResources.borderLight),
        boxShadow: [
          BoxShadow(
            color: ColorResources.colorPrimary.withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}
`;
}

function widgetTestDart(c: FlutterCtx): string {
  return `import 'package:flutter_test/flutter_test.dart';
import 'package:${c.pkg}/core/routes.dart';

void main() {
  test('routes are defined', () {
    expect(Routes.splash, '/splash');
    expect(Routes.home, '/home');
    expect(Routes.notificationScreen, '/notification_screen');
  });
}
`;
}
