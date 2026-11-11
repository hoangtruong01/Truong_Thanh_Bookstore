import 'dart:async';
import 'package:flutter/widgets.dart';

/// Auto-advance is skipped when the user asked for less motion or uses a screen
/// reader / switch access (the focused slide must not change under them).
bool carouselAutoplayAllowed(BuildContext context) {
  final media = MediaQuery.maybeOf(context);
  if (media == null) return true;
  return !media.disableAnimations && !media.accessibleNavigation;
}

/// Periodic auto-advance for a home carousel. Pauses while the user drags a page and
/// restarts the full interval after the swipe, so a page never jumps right after a
/// manual swipe (WCAG 2.2.2).
class CarouselAutoplay {
  CarouselAutoplay({required this.interval, required this.onTick});

  final Duration interval;
  final VoidCallback onTick;
  Timer? _timer;
  bool _dragging = false;

  void start() {
    _timer?.cancel();
    _timer = Timer.periodic(interval, (_) => onTick());
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  /// Use as `NotificationListener<ScrollNotification>(onNotification: autoplay.handleScroll)`.
  bool handleScroll(ScrollNotification notification) {
    if (notification.depth != 0) return false;
    if (notification is ScrollStartNotification && notification.dragDetails != null) {
      _dragging = true;
      stop();
    } else if (notification is ScrollEndNotification && _dragging) {
      _dragging = false;
      start();
    }
    return false;
  }
}
