import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'core/theme/app_theme.dart';
import 'core/constants/api_constants.dart';
import 'core/network/api_client.dart';
import 'providers/theme_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/product_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/order_provider.dart';
import 'providers/wishlist_provider.dart';
import 'providers/notification_provider.dart';
import 'providers/review_provider.dart';
import 'screens/main_navigation_screen.dart';
import 'firebase_options.dart';
import 'services/fcm_notification_service.dart';

final navigatorKey = GlobalKey<NavigatorState>();
final messengerKey = GlobalKey<ScaffoldMessengerState>();

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  ApiConstants.baseUrl; // Validate release configuration before starting services.
  var firebaseReady = false;
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    firebaseReady = true;
  } catch (error) {
    debugPrint('Firebase disabled: $error');
  }
  FcmNotificationService.instance.setMessengerKey(messengerKey);
  runApp(const TruongThanhApp());
  unawaited(FcmNotificationService.instance.initialize(
    navKey: navigatorKey,
    firebaseReady: firebaseReady,
  ));
}

class TruongThanhApp extends StatelessWidget {
  const TruongThanhApp({super.key});

  static ApiClient _api(BuildContext context) => Provider.of<ApiClient>(context, listen: false);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // One shared HTTP client; AuthProvider binds its session (401 -> refresh -> retry).
        Provider<ApiClient>(create: (_) => ApiClient(), dispose: (_, api) => api.close()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (ctx) => AuthProvider(apiClient: _api(ctx))),
        ChangeNotifierProvider(create: (ctx) => ProductProvider(apiClient: _api(ctx))),
        ChangeNotifierProvider(create: (ctx) => CartProvider(apiClient: _api(ctx))),
        ChangeNotifierProvider(create: (ctx) => OrderProvider(apiClient: _api(ctx))),
        ChangeNotifierProvider(create: (ctx) => WishlistProvider(apiClient: _api(ctx))),
        ChangeNotifierProvider(create: (ctx) => NotificationProvider(apiClient: _api(ctx))),
        ChangeNotifierProvider(create: (ctx) => ReviewProvider(apiClient: _api(ctx))),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, _) {
          return MaterialApp(
            navigatorKey: navigatorKey,
            scaffoldMessengerKey: messengerKey,
            title: 'Trường Thành Bookstore',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeProvider.themeMode,
            home: const MainNavigationScreen(),
          );
        },
      ),
    );
  }
}
