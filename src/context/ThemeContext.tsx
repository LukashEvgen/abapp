import React, {createContext, useContext, useState, useEffect, ReactNode, useCallback} from 'react';
import {Appearance, ColorSchemeName} from 'react-native';
import {setTheme} from '../utils/theme';

interface ThemeContextValue {
  dark: boolean;
  toggleTheme: () => void;
  setDark: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  dark: false,
  toggleTheme: () => {},
  setDark: () => {},
});

export const ThemeProvider = ({children}: {children: ReactNode}) => {
  const [dark, setDarkState] = useState(() => {
    try {
      const scheme = Appearance.getColorScheme();
      return scheme === 'dark';
    } catch {
      return false;
    }
  });

  const setDark = useCallback((newDark: boolean) => {
    setDarkState(newDark);
    setTheme(newDark);
  }, []);

  const toggleTheme = useCallback(() => {
    setDark(!dark);
  }, [dark, setDark]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}: {colorScheme: ColorSchemeName | null}) => {
      const isDark = colorScheme === 'dark';
      setDarkState(isDark);
      setTheme(isDark);
    });
    return () => subscription?.remove?.();
  }, []);

  return (
    <ThemeContext.Provider value={{dark, toggleTheme, setDark}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);