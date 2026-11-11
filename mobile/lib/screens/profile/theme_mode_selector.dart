import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_tokens.dart';
import '../../providers/theme_provider.dart';

/// Điều khiển giao diện duy nhất của app: Theo hệ thống / Sáng / Tối.
class ThemeModeSelector extends StatelessWidget {
  const ThemeModeSelector({super.key});

  static const _options = <(ThemeMode, String, IconData)>[
    (ThemeMode.system, 'Theo hệ thống', Icons.brightness_auto_outlined),
    (ThemeMode.light, 'Sáng', Icons.light_mode_outlined),
    (ThemeMode.dark, 'Tối', Icons.dark_mode_outlined),
  ];

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final textTheme = Theme.of(context).textTheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Giao diện', style: textTheme.titleSmall),
          const SizedBox(height: AppSpacing.sm),
          SizedBox(
            width: double.infinity,
            child: SegmentedButton<ThemeMode>(
              showSelectedIcon: false,
              segments: [
                for (final (mode, label, icon) in _options)
                  ButtonSegment<ThemeMode>(
                    value: mode,
                    icon: Icon(icon, size: 18),
                    label: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
              ],
              selected: {themeProvider.themeMode},
              onSelectionChanged: (selection) => themeProvider.setThemeMode(selection.first),
            ),
          ),
        ],
      ),
    );
  }
}
