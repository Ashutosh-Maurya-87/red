import { makeStyles } from '@material-ui/core/styles';
import { APP_THEMES } from './reducers/Theme/constants';

const [lightTheme, darkTheme, yellowTheme] = APP_THEMES;

const COMMOM_THEME_CONFIGS = {
  typography: {
    h1: {
      fontSize: 28,
      fontWeight: 300,
    },
    h2: {
      fontSize: 26,
      fontWeight: 300,
    },
    h3: {
      fontSize: 24,
      fontWeight: 400,
    },
    h4: {
      fontSize: 22,
      fontWeight: 400,
    },
    h5: {
      fontSize: 20,
      fontWeight: 400,
    },
    h6: {
      fontSize: 18,
      fontWeight: 400,
    },
    subtitle1: {
      fontSize: 16,
      fontWeight: 400,
    },
    subtitle2: {
      fontSize: 14,
      fontWeight: 500,
    },
    body1: {
      fontSize: 16,
      fontWeight: 400,
    },
    body2: {
      fontSize: 14,
      fontWeight: 400,
    },
    button: {
      fontSize: 14,
      fontWeight: 500,
    },
    caption: {
      fontSize: 12,
      fontWeight: 400,
    },
    overline: {
      fontSize: 10,
      fontWeight: 400,
    },
  },
};

export const THEME_CONFIGS = {
  [lightTheme]: {
    palette: {
      type: 'light',
      primary: {
        main: '#0094FF',
        contrastText: '#fff',
        light: 'rgba(0, 148, 255, 0.2)',
      },
      secondary: {
        main: '#5C5E63',
        dark: '#f5f5f5',
        stepColor: '#fff',
        stepBorderColor: '#e8e8e8',
        light: 'rgba(255,255,255,0.12)',
        contrastText: '#fff',
        processTable: '#E9E9E9',
        sidebar: '#f1f1f1',
        textHoverBg: '#f5f5f5',
        modelTab: 'rgba(0,0,0,0.06)',
        footer: '#f1f1f1',
        filterColor: `invert(51%) sepia(61%) saturate(5046%) hue-rotate(184deg) brightness(100%) contrast(110%)`,
        defaultFilterColor: `invert(100%) sepia(100%) saturate(14%) hue-rotate(212deg) brightness(104%) contrast(104%)`,
      },
      text: {
        secondary: '#000',
        footer: '#f1f1f1',
      },
    },
    typography: { ...COMMOM_THEME_CONFIGS.typography },
    // snackBar: {
    //   backgroundColor: 'rgb(49, 49, 49) !important',
    //   color: '#fff !important',
    // },
    relationshipMap: {
      portText: 'rgba(0, 0, 0, 0.8)',
      nodeBackground: '#fff',
      portInColor: '#0094FF',
      titleColor: 'rgba(0, 0, 0, 0.6)',
      border: '#ccc',
    },
    chartsColorSchema: [
      '#a46342',
      '#567abe',
      '#09f0ba',
      '#6dc464',
      '#ea449b',
      '#63bbbf',
      '#e2ab89',
      '#cd96e8',
    ],
    drawerBackground: '#f1f1f1',
  },
  [darkTheme]: {
    palette: {
      type: 'dark',
      primary: {
        main: '#00B398',
        contrastText: '#fff',
        light: 'rgba(0, 179, 152, 0.2)',
      },
      secondary: {
        main: '#292929',
        dark: '#1e1e1e',
        stepBorderColor: '#3b3b3b',
        stepColor: '#242424',
        light: 'rgba(255,255,255,0.12)',
        contrastText: '#fff',
        processTable: '#191919',
        sidebar: 'rgba(0,0,0,0.17)',
        textHoverBg: 'rgb(15, 15, 15, 0.75)',
        modelTab: 'rgba(255,255,255,0.12)',
        footer: '#303030',
        filterColor: `invert(56%) sepia(91%) saturate(327%) hue-rotate(118deg) brightness(87%) contrast(93%)`,
        defaultFilterColor: `invert(0%) sepia(9%) saturate(3%) hue-rotate(250deg) brightness(101%) contrast(101%)`,
      },
    },
    typography: { ...COMMOM_THEME_CONFIGS.typography },
    // snackBar: {
    //   backgroundColor: '#fff !important',
    //   color: 'rgb(49, 49, 49) !important',
    // },
    relationshipMap: {
      portText: 'rgba(255, 255, 255, 0.8)',
      nodeBackground: '#242424',
      portInColor: '#00B398',
      titleColor: 'rgba(255, 255, 255, 0.6)',
      border: 'rgb(59, 59, 59)',
    },
    chartsColorSchema: [
      '#723719',
      '#254274',
      '#55a696',
      '#4b7244',
      '#a85f86',
      '#4aa6a9',
      '#d79a73',
      '#ab6ec9',
    ],
    drawerBackground: '#424242',
  },
  [yellowTheme]: {
    palette: {
      type: 'dark',
      primary: {
        main: '#FFC001',
        contrastText: '#000',
        light: 'rgba(255, 192, 1, 0.2)',
      },
      secondary: {
        main: '#292929',
        dark: 'rgba(0, 0, 0, 0.17)',
        stepBorderColor: '#36383C',
        stepColor: '#1A1C21',
        light: 'rgba(255,255,255,0.12)',
        contrastText: '#fff',
        processTable: 'rgb(32, 32, 37)',
        sidebar: 'rgba(0,0,0,0.17)',
        textHoverBg: 'rgb(32, 32, 37)',
        modelTab: 'rgba(255,255,255,0.12)',
        footer: '#1b1c22',
        filterColor: `invert(56%) sepia(91%) saturate(327%) hue-rotate(118deg) brightness(87%) contrast(93%)`,
        defaultFilterColor: `invert(0%) sepia(9%) saturate(3%) hue-rotate(250deg) brightness(101%) contrast(101%)`,
      },
    },
    chartsColorSchema: [
      '#723719',
      '#254274',
      '#55a696',
      '#4b7244',
      '#a85f86',
      '#4aa6a9',
      '#d79a73',
      '#ab6ec9',
    ],
    typography: { ...COMMOM_THEME_CONFIGS.typography },
    // snackBar: {
    //   backgroundColor: '#25262c',
    //   color: '#000',
    // },
    relationshipMap: {
      portText: 'rgba(255, 255, 255, 0.8)',
      nodeBackground: '#242424',
      portInColor: '#FFC001',
      titleColor: 'rgba(255, 255, 255, 0.6)',
      border: 'rgb(59, 59, 59)',
    },
    drawerBackground: '#25262c',
  },
};

/**
 * Get Theme Configs
 *
 * @param {Object}
 *
 * @return {Object}
 */
export const getThemeConfigs = ({ theme, isAuthenticated }) => {
  if (!isAuthenticated) {
    return THEME_CONFIGS[lightTheme];
  }

  return THEME_CONFIGS[theme] || THEME_CONFIGS[darkTheme];
};

export const snackBarStyles = theme => {
  // if (!APP_THEMES.includes(theme)) theme = DEFAULT_THEME;

  return makeStyles({
    // success: THEME_CONFIGS[theme || lightTheme].snackBar,
    // error: THEME_CONFIGS[theme || lightTheme].snackBar,
    // warning: THEME_CONFIGS[theme || lightTheme].snackBar,
    // info: THEME_CONFIGS[theme || lightTheme].snackBar,
  });
};
