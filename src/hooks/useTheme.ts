import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './useRedux';
import { setDarkMode } from '../redux/slices/uiSlice';

export function useTheme() {
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const shouldBeDark = savedTheme ? savedTheme === 'true' : prefersDark;
    dispatch(setDarkMode(shouldBeDark));
  }, [dispatch]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return { isDarkMode };
}
