import React from 'react';
import {
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  TextFormat as TextFormatIcon,
  FormatColorFill as FormatColorFillIcon,
  FormatAlignLeft as FormatAlignLeftIcon,
  FormatAlignCenter as FormatAlignCenterIcon,
  FormatAlignRight as FormatAlignRightIcon,
  FileCopy as FileCopyIcon,
  Description as DescriptionIcon,
} from '@material-ui/icons';

export const FORMATTING_KEYS = {
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
  divider: 'divider',
  bold: 'bold',
  italic: 'italic',
  underlined: 'underlined',
  color: 'color',
  backgroundColor: 'backgroundColor',
  textAlignLeft: 'textAlignLeft',
  textAlignCenter: 'textAlignCenter',
  textAlignRight: 'textAlignRight',
  copy: 'copy',
  paste: 'paste',
  noFill: 'noFill',
};

export const FORMATTING_TOOLS = [
  {
    key: FORMATTING_KEYS.fontFamily,
    icon: '',
    label: 'Font Family',
    inputStyles: { width: '120px', margin: 0 },
    styles: {},
    isVisible: true,
    defaultValue: 'Roboto',
    options: [
      {
        label: 'Lato',
        value: 'Lato',
        styles: {
          fontFamily: 'Lato',
        },
      },
      {
        label: 'Montserrat',
        value: 'Montserrat',
        styles: {
          fontFamily: 'Montserrat',
        },
      },
      {
        label: 'Nunito',
        value: 'Nunito',
        styles: {
          fontFamily: 'Nunito',
        },
      },
      {
        label: 'Open Sans',
        value: 'Open Sans',
        styles: {
          fontFamily: 'Open Sans',
        },
      },
      {
        label: 'Oswald',
        value: 'Oswald',
        styles: {
          fontFamily: 'Oswald',
        },
      },
      {
        label: 'Playfair Display',
        value: 'Playfair Display',
        styles: {
          fontFamily: 'Playfair Display',
        },
      },
      {
        label: 'Poppins',
        value: 'Poppins',
        styles: {
          fontFamily: 'Poppins',
        },
      },
      {
        label: 'Raleway',
        value: 'Raleway',
        styles: {
          fontFamily: 'Raleway',
        },
      },
      {
        label: 'Roboto',
        value: 'Roboto',
        styles: {
          fontFamily: 'Roboto',
        },
      },
      {
        label: 'Source Sans Pro',
        value: 'Source Sans Pro',
        styles: {
          fontFamily: 'Source Sans Pro',
        },
      },
    ],
  },
  {
    key: FORMATTING_KEYS.fontSize,
    icon: '',
    defaultValue: '14px',
    label: 'Font Size',
    inputStyles: { width: '65px', margin: 0 },
    styles: {},
    isVisible: true,
    options: [
      {
        label: '6px',
        value: '6px',
      },
      {
        label: '7px',
        value: '7px',
      },
      {
        label: '8px',
        value: '8px',
      },
      {
        label: '9px',
        value: '9px',
      },
      {
        label: '10px',
        value: '10px',
      },
      {
        label: '11px',
        value: '11px',
      },
      {
        label: '12px',
        value: '12px',
      },
      {
        label: '14px',
        value: '14px',
      },
      {
        label: '18px',
        value: '18px',
      },
      {
        label: '24px',
        value: '24px',
      },
      {
        label: '36px',
        value: '36px',
      },
    ],
  },
  {
    key: FORMATTING_KEYS.divider,
    isVisible: true,
  },
  {
    key: FORMATTING_KEYS.bold,
    icon: <FormatBoldIcon fontSize="small" />,
    label: 'Bold ',
    isVisible: true,
    styles: {
      fontWeight: 700,
    },
  },
  {
    key: FORMATTING_KEYS.italic,
    icon: <FormatItalicIcon fontSize="small" />,
    label: 'Italic ',
    isVisible: true,
    styles: {
      fontStyle: 'italic',
    },
  },
  {
    key: FORMATTING_KEYS.underlined,
    icon: <FormatUnderlinedIcon fontSize="small" />,
    label: 'Underlined',
    isVisible: true,
    styles: {
      textDecoration: 'underline',
    },
  },
  {
    key: FORMATTING_KEYS.color,
    icon: <TextFormatIcon fontSize="default" />,
    label: 'Text Color',
    isVisible: true,
    styles: {
      color: '#COLOR# !important',
    },
  },
  {
    key: FORMATTING_KEYS.backgroundColor,
    icon: <FormatColorFillIcon fontSize="small" />,
    label: 'Background Color',
    isVisible: true,
    styles: {
      backgroundColor: '#COLOR# !important',
    },
  },
  {
    key: FORMATTING_KEYS.divider,
    isVisible: true,
  },
  {
    key: FORMATTING_KEYS.textAlignLeft,
    icon: <FormatAlignLeftIcon fontSize="small" />,
    label: 'Align Left',
    isVisible: true,
    styles: {
      textAlign: 'left',
    },
  },
  {
    key: FORMATTING_KEYS.textAlignCenter,
    icon: <FormatAlignCenterIcon fontSize="small" />,
    label: 'Align Center',
    isVisible: true,
    styles: {
      textAlign: 'center',
    },
  },
  {
    key: FORMATTING_KEYS.textAlignRight,
    icon: <FormatAlignRightIcon fontSize="small" />,
    isVisible: true,
    styles: {
      textAlign: 'right',
    },
  },
  {
    key: FORMATTING_KEYS.divider,
    isVisible: true,
  },
  {
    key: FORMATTING_KEYS.copy,
    icon: <FileCopyIcon fontSize="small" />,
    isVisible: true,
    label: 'Copy',
  },
  {
    key: FORMATTING_KEYS.paste,
    icon: <DescriptionIcon fontSize="small" />,
    isVisible: true,
    label: 'Paste',
  },
];

export const FORMATTING_TOOLS_WITH_KEYS = {};
FORMATTING_TOOLS.forEach(tool => {
  FORMATTING_TOOLS_WITH_KEYS[tool.key] = tool;
});
export const DEFAULT_COLOR_PALETTE_COLORS = [
  // Row 1
  '#FFFFFF',
  '#000000',
  '#EEECE1',
  '#1F497D',
  '#4F81BD',
  '#C0504D',
  '#9BBB59',
  '#8064A2',
  '#4BACC6',
  '#F79646',

  // Row 2
  '#F2F2F2',
  '#808080',
  '#DDD9C4',
  '#C5D9F1',
  '#DCE6F1',
  '#F2DCDB',
  '#EBF1DE',
  '#E4DFEC',
  '#DAEEF3',
  '#FDE9D9',

  // Row 3
  '#D9D9D9',
  '#595959',
  '#C4BD97',
  '#8DB4E2',
  '#B8CCE4',
  '#E6B8B7',
  '#D8E4BC',
  '#CCC0DA',
  '#B7DEE8',
  '#FCD5B4',

  // Row 4
  '#BFBFBF',
  '#404040',
  '#948A54',
  '#538DD5',
  '#95B3D7',
  '#DA9694',
  '#C4D79B',
  '#B1A0C7',
  '#92CDDC',
  '#FABF8F',

  // Row 5
  '#A6A6A6',
  '#262626',
  '#494529',
  '#16365C',
  '#366092',
  '#963634',
  '#76933C',
  '#60497A',
  '#31869B',
  '#E26B0A',

  // Row 6
  '#0D0D0D',
  '#1D1B10',
  '#0F243E',
  '#244062',
  '#632523',
  '#4F6228',
  '#403151',
  '#215967',
  '#974706',

  // Row 7 as Standard Colors
  '#C00000',
  '#FF0000',
  '#FFC000',
  '#FFFF00',
  '#92D050',
  '#00B050',
  '#00B0F0',
  '#0070C0',
  '#002060',
  '#7030A0',
  '#e6e200',
];
