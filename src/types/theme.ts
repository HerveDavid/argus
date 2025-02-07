export type ColorToken = {
    DEFAULT: string;
    foreground: string;
  };
  
  export type ThemeColors = {
    background: string;
    foreground: string;
    primary: ColorToken;
    secondary: ColorToken;
    muted: ColorToken;
    accent: ColorToken;
    destructive: ColorToken;
    card: ColorToken;
    border: string;
    ring: string;
  };
  
  export type ThemeTokens = {
    colors: ThemeColors;
    borderRadius: {
      sm: string;
      md: string;
      lg: string;
      full: string;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fonts: {
      body: string;
      heading: string;
      mono: string;
    };
  };
  
  export interface ThemePlugin {
    name: string;
    tokens: ThemeTokens;
  }