import { getCellAxis } from '../../views/Models/ModelWorkbook/GridPanel/GridTable/helper';
import { getAlphabetColumnName } from '../../views/Models/ModelWorkbook/helper';

export const parsePaste = str => {
  return str.split(/\r\n|\n|\r/).map(row => row.split('\t'));
};

/**
 * Get Cells from Clipboard to Paste
 *
 * @param {Object}
 *
 * @return {Object}
 */
export const getCellsFromClipBoard = async ({
  selected,
  data,
  copySelection,
  isUpdateMatrix = false,
}) => {
  try {
    const text = await navigator.clipboard.readText();
    const pasteData = parsePaste(text);

    let { start, end } = selected;
    const { start: copyStart } = copySelection;
    let { end: copyEnd } = copySelection;
    const additions = [];
    const changes = [];

    start = { i: Math.min(start.i, end.i), j: Math.min(start.j, end.j) };
    end = { i: Math.max(start.i, end.i), j: Math.max(start.j, end.j) };

    pasteData.forEach((row, i) => {
      row.forEach((value, j) => {
        end = { i: start.i + i, j: start.j + j };
        copyEnd = { i: copyStart.i + i, j: copyStart.j + j };
        const cell = data[end.i] && data[end.i][end.j];

        const regx = /([A-Z])+/;

        if (
          isUpdateMatrix &&
          String(value).charAt(0) == '=' &&
          regx.test(String(value))
        ) {
          const tokens = getCellAxis({
            expr: value,
            row: copyEnd.i,
            col: copyEnd.j,
          });

          const obj = {};
          tokens.forEach(token => {
            const row = end.i - token.x;
            const col = end.j - token.y;

            const updatedIndex =
              col - 1 > 0 && row + 1 > 0
                ? `${getAlphabetColumnName(col - 1)}${row + 1}`
                : `Error`;

            obj[token.cellIndex] = updatedIndex ? updatedIndex : '';
          });

          // Create dynamic regx to replace string
          const reg = new RegExp(Object.keys(obj).join('|'), 'gi');
          value = value.replace(reg, matched => {
            return obj[matched];
          });
        }

        if (!cell) {
          additions.push({ row: end.i, col: end.j, value });
        } else if (!cell.readOnly) {
          changes.push({ cell, row: end.i, col: end.j, value });
        }
      });
    });

    return { changes, additions };
  } catch (err) {
    return { changes: [], additions: [] };
  }
};
