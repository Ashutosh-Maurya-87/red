import { APP_THEMES } from '../reducers/Theme/constants';
import { DEFAULT_COL_WIDTH } from '../views/SourceTables/ImportSourceTable';

export const DEFAULT_RESET_STYLES = 'text-align: center; overflow: hidden;';

export const DEFAULT_CELL_PROPS = {
  readOnly: true,
  disableEvents: true,
  width: DEFAULT_COL_WIDTH,
};

const [lightTheme, darkTheme, yellowTheme] = APP_THEMES;

export const EXCEL_COLORS = {
  // Light
  [lightTheme]: {
    imported: '#DCEFFF',
    transposed: '#FEF6E7',
  },
  // Dark
  [darkTheme]: {
    imported: 'rgb(31, 55, 52)',
    transposed: 'rgb(58, 51, 66)',
  },
  // Yellow
  [yellowTheme]: {
    imported: '#413A1F',
    transposed: 'rgb(58, 51, 66)',
  },
};

export const DEFAULT_JEXCEL_CONFIGS = {
  tableOverflow: true,
  columnSorting: false,
  columnResize: true,
  rowResize: true,
  allowInsertRow: false,
  allowManualInsertRow: false,
  allowDeleteRow: false,
  allowDeletingAllRows: false,
  allowInsertColumn: false,
  allowManualInsertColumns: true,
  allowDeleteColumn: false,
  allowRenameColumn: false,
  allowDeletingAllColumns: false,
  allowComments: false,
  columnDrag: false,
  rowDrag: false,
  editable: false,
  allowExport: false,
  selectionCopy: true,
  about: '',
  toolbar: false,
  tableWidth: '100%',
  tableHeight: '400px',
  defaultColWidth: DEFAULT_COL_WIDTH,
};
