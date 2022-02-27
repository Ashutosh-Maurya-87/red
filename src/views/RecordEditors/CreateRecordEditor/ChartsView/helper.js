import { THEME_CONFIGS } from '../../../../theme';

/**
 *  This Functions return the months in the headers of the table.
 */
export const getYearsNonSeqCharts = (data = []) => {
  return data
    .filter((value, index) => index > 0 && index != data.length - 1 && value)
    .map(value => value.value || '');
};

/**
 *  This Functions return null array to skip the lines on sequentails charts.
 */
export const skipPoints = number => {
  return [...Array(number * 12).keys()].map(e => null);
};

/**
 *  This Functions return the months in the headers of the table for line sequentail and bar sequential charts.
 */
export const getYearsSeqCharts = (headers, number) => {
  const YAxis = [];
  [...Array(number).keys()].forEach(e => {
    YAxis.push(...getYearsNonSeqCharts(headers));
  });
  return YAxis;
};

/**
 *  This Functions Helps To Show Dashed Line Over the chart when data is in forecasted state.
 */
export const dashNonSeqCharts = (
  data = [],
  { datasetIndex = '', p1DataIndex = '' },
  value = ''
) => {
  if (!data[datasetIndex]) data[datasetIndex] = [];
  if (!data[datasetIndex][p1DataIndex + 1]) {
    data[datasetIndex][p1DataIndex + 1] = { isForecast: false };
  }

  /**
   *  Do not nest ternary expressions.
   */

  if (data[datasetIndex][p1DataIndex + 1].isForecast) return value;

  return data[datasetIndex][p1DataIndex].isForecast ? value : [6, 0];
};

/**
 *  This Functions Helps To Show Dashed Line Over Line Sequential Charts when data is in forecasted state.
 */
export const dashSeqCharts = (
  data = [],
  { datasetIndex = '', p1DataIndex = '' },
  value = ''
) => {
  if (!data[datasetIndex]) data[datasetIndex] = [];
  if (!data[datasetIndex][p1DataIndex - datasetIndex * 12 + 1]) {
    data[datasetIndex][p1DataIndex + 1] = { isForecast: false };
  }

  if (data[datasetIndex][p1DataIndex - datasetIndex * 12 + 1].isForecast) {
    return value;
  }

  return data[datasetIndex][p1DataIndex - datasetIndex * 12].isForecast
    ? value
    : [6, 0];
};

/**
 *  This Functions Helps To Update Filtered Data With Original Data.
 */
export const updateOriginalDataWithFilteredData = (
  originalData = [],
  filteredData = []
) => {
  const checkWhetherNewValueExist = yearArr => {
    return filteredData.filter((item = []) => {
      const [firstChildItem = {}] = item;
      const { value = '' } = firstChildItem;

      return value == yearArr ? item : null;
    });
  };

  return originalData.map((item = []) => {
    const [firstChildItem = {}] = item;
    const { value = '' } = firstChildItem;
    const [firstArr] = checkWhetherNewValueExist(value);

    return firstArr ? firstArr : item;
  });
};

export const legendConfigration = {
  legend: {
    position: 'top',
    align: 'end',
    labels: {
      boxWidth: 0,
      font: {
        size: 14,
        weight: 'bolder',
      },
    },
  },
};

/**
 *  This Functions return color of charts according to the theme.
 */
export const chartColorSchema = (theme, currentIndex = 0) => {
  const themeConfigs = THEME_CONFIGS[theme] || {};
  const { chartsColorSchema = [] } = themeConfigs;

  const totalLength = chartsColorSchema.length || 0;
  let arrIndex = currentIndex;
  if (currentIndex > totalLength - 1) {
    const OriginalIndex = parseInt(currentIndex / totalLength, 10);
    arrIndex = currentIndex - OriginalIndex * totalLength;
  }

  return chartsColorSchema[arrIndex] || '';
};

/**
 *  Charts Types Used To distinguish
 */
export const CHART_TYPE = {
  LINE: '1',
  LINE_SEQUENTIAL: '2',
  BAR: '3',
  BAR_SEQUENTIAL: '4',
};

/**
 *  Charts Names used in sidebars
 */
export const CHART_NAME = {
  LINE: 'Line Series',
  LINE_SEQUENTIAL: 'Line Sequential',
  BAR: 'Bar Series',
  BAR_SEQUENTIAL: 'Bar Sequential',
};
