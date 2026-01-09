import type { GlobalThemeOverrides } from 'naive-ui';

// 主色调：专业蓝
const primaryColor = '#2563eb';
const primaryColorHover = '#1d4ed8';
const primaryColorPressed = '#1e40af';
const primaryColorSuppl = '#3b82f6';

export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor,
    primaryColorHover,
    primaryColorPressed,
    primaryColorSuppl,
    borderRadius: '8px',
    borderRadiusSmall: '6px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  Button: {
    borderRadiusMedium: '8px',
    borderRadiusSmall: '6px',
    fontWeightStrong: '500',
  },
  Card: {
    borderRadius: '12px',
    paddingMedium: '20px',
  },
  Input: {
    borderRadius: '8px',
  },
  Modal: {
    borderRadius: '12px',
  },
  Message: {
    borderRadius: '8px',
  },
  Tag: {
    borderRadius: '6px',
  },
  DataTable: {
    borderRadius: '8px',
  },
  Dropdown: {
    borderRadius: '8px',
  },
};
