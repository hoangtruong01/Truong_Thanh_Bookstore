import 'package:flutter/material.dart';

/// Bo góc theo web (Tailwind): badge `rounded-md`, nút/ô nhập `rounded-xl`,
/// thẻ `rounded-2xl`, panel lớn / bottom sheet `rounded-3xl`, pill `rounded-full`.
abstract final class AppRadii {
  static const double xs = 6; // badge giảm giá
  static const double sm = 8;
  static const double md = 12; // nút, ô nhập
  static const double lg = 16; // thẻ (card)
  static const double xl = 24; // panel lớn, bottom sheet, dialog
  static const double pill = 999;

  static const BorderRadius badge = BorderRadius.all(Radius.circular(xs));
  static const BorderRadius button = BorderRadius.all(Radius.circular(md));
  static const BorderRadius input = BorderRadius.all(Radius.circular(md));
  static const BorderRadius card = BorderRadius.all(Radius.circular(lg));
  static const BorderRadius panel = BorderRadius.all(Radius.circular(xl));
}

/// Khoảng cách chuẩn (bội số 4 như Tailwind).
abstract final class AppSpacing {
  static const double xxs = 2;
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;
}
