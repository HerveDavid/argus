import { ColorToken, ThemePlugin, ThemeTokens } from "@/types/theme";

export class ThemeManager {
    private themes: Map<string, ThemeTokens>;
    private activeTheme: string;
  
    constructor() {
      this.themes = new Map();
      this.activeTheme = 'default';
    }
  
    registerTheme(plugin: ThemePlugin): void {
      this.themes.set(plugin.name, plugin.tokens);
      this.updateCSSVariables(plugin.name);
    }
  
    setTheme(themeName: string): void {
      if (!this.themes.has(themeName)) {
        throw new Error(`Theme ${themeName} not found`);
      }
      this.activeTheme = themeName;
      this.updateCSSVariables(themeName);
    }
  
    private updateCSSVariables(themeName: string): void {
      const tokens = this.themes.get(themeName);
      if (!tokens) return;
  
      const root = document.documentElement;
      
      // Mettre à jour les couleurs
      this.updateColorTokens(root, tokens.colors);
  
      // Mettre à jour les autres tokens
      type TokenCategory = 'borderRadius' | 'spacing' | 'fonts';
      const categories: TokenCategory[] = ['borderRadius', 'spacing', 'fonts'];
  
      categories.forEach((category) => {
        const tokenCategory = tokens[category];
        if (tokenCategory) {
          Object.entries(tokenCategory).forEach(([key, value]) => {
            if (typeof value === 'string') {
              root.style.setProperty(`--${category}-${key}`, value);
            }
          });
        }
      });
    }
  
    private updateColorTokens(root: HTMLElement, colors: ThemeTokens['colors']): void {
      Object.entries(colors).forEach(([key, value]) => {
        if (this.isColorToken(value)) {
          // Gérer les objets ColorToken
          Object.entries(value).forEach(([subKey, subValue]) => {
            root.style.setProperty(
              `--colors-${key}-${subKey}`,
              subValue
            );
          });
        } else if (typeof value === 'string') {
          // Gérer les valeurs de couleur simples
          root.style.setProperty(`--colors-${key}`, value);
        }
      });
    }
  
    private isColorToken(value: unknown): value is ColorToken {
      return (
        typeof value === 'object' &&
        value !== null &&
        'DEFAULT' in value &&
        'foreground' in value
      );
    }
  
    getActiveTheme(): string {
      return this.activeTheme;
    }
  
    getThemeTokens(themeName: string): ThemeTokens | undefined {
      return this.themes.get(themeName);
    }
  }
  
  export const themeManager = new ThemeManager();