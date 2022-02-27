import React, { useEffect, useState } from 'react';

import { Box } from '@material-ui/core';
import { bool, func, shape, arrayOf, string } from 'prop-types';
import { get } from 'lodash';

import { getFiscalTotal } from '../../UpdateRecord/helper';
import Chart from './commonImports';
import 'chartjs-plugin-dragdata';

import {
  chartColorSchema,
  getYearsNonSeqCharts,
  legendConfigration,
  updateOriginalDataWithFilteredData,
} from '../helper';

function BarChart({
  data,
  updateState,
  showDataLabels,
  scenarioMeta,
  headers,
  isTableChanges,
  originalData,
  theme,
}) {
  const [isChartDrag, setisChartDrag] = useState(false);

  useEffect(() => {
    !isChartDrag ? formData(data) : setisChartDrag(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, showDataLabels]);

  /**
   *This Function is used to make datasets of given data and show over the particular chart
   */
  const formData = (data = []) => {
    const yearWiseArr = data.map((year = []) =>
      year.map(({ value = '' }) => value || 0)
    );

    const dataSet = yearWiseArr.map((innerArr = [], currentIndex) => {
      /**
       * loop To Add Outline TO ForeCasted Data
       */
      const addBackGroundColorToBars = (data[currentIndex] || [])
        .slice(1, innerArr.length - 1)
        .map(({ isForecast = '' }) => {
          return isForecast
            ? 'transparent'
            : chartColorSchema(theme, currentIndex);
        });

      const { 0: zeroIndexValue = '' } = innerArr;

      return {
        label: zeroIndexValue,
        data: innerArr.slice(1, innerArr.length - 1),
        borderColor: chartColorSchema(theme, currentIndex),
        backgroundColor: addBackGroundColorToBars,
        yAxisID: `y`,
        borderWidth: 2,
      };
    });

    /* using plugin To Show Legend Text Same as Bars  */
    Chart.register({
      id: 'BarChart',
      beforeDraw(chart) {
        const {
          legend: { legendItems = [] },
        } = chart;

        legendItems.forEach((e = { fontColor: '', strokeStyle: '' }, index) => {
          const colorForSchema = chartColorSchema(theme, index);
          e.fontColor = colorForSchema;
          e.strokeStyle = colorForSchema;
        });
      },
    });

    const options = {
      type: 'bar',

      data: {
        labels: [...getYearsNonSeqCharts(headers)],
        datasets: dataSet,
      },

      options: {
        onHover(e) {
          const point = e.chart.getElementsAtEventForMode(
            e,
            'nearest',
            { intersect: true },
            false
          );
          e.native.target.style.cursor = point.length ? 'grab' : 'default';
        },
        responsive: false,

        plugins: {
          ...legendConfigration,

          /**
           *Configurations To Show Data Lables Over the charts
           */

          datalabels: {
            anchor: 'end',
            align: 'end',
            opacity: showDataLabels ? 1 : 0 /* show datalables when its true */,

            labels: {
              value: {
                color(context) {
                  return chartColorSchema(theme, context.datasetIndex);
                },
              },
            },
          },

          dragData: {
            round: 2,
            showTooltip: true,

            onDragStart(e, datasetIndex, index, value) {
              if (!data[datasetIndex]) data[datasetIndex] = [];
              if (!data[datasetIndex][index + 1]) {
                data[datasetIndex][index + 1] = { readOnly: true };
              }

              return !data[datasetIndex][index + 1].readOnly;
            },

            onDrag(e, datasetIndex, index, value) {},

            onDragEnd(e, datasetIndex, index, value) {
              e.target.style.cursor = 'default';

              if (!data[datasetIndex]) data[datasetIndex] = [];
              if (!data[datasetIndex][index + 1]) {
                data[datasetIndex][index + 1] = {
                  value: '',
                  realValue: '',
                  isUpdated: '',
                };
              }

              data[datasetIndex][index + 1] = {
                ...data[datasetIndex][index + 1],
                value,
                realValue: value,
                isUpdated: true,
              };

              const operator = get(scenarioMeta, 'operator');

              const cells = (data[datasetIndex] || [])
                .filter(
                  (value, index) =>
                    index > 0 && index != data[datasetIndex].length - 1 && value
                )
                .map(value => value.value || '');

              data[datasetIndex][data[datasetIndex].length - 1] = {
                ...data[datasetIndex][data[datasetIndex].length - 1],
                value: getFiscalTotal(cells, operator),
              };

              setisChartDrag(true);

              const UpdatedDataWithFilteredData = updateOriginalDataWithFilteredData(
                originalData,
                data
              );

              updateState({ data: [...UpdatedDataWithFilteredData] });
            },
          },
        },
      },
    };

    if (window.BarChartRef) {
      if (isTableChanges) {
        /**
         * This Code Execute When user changes any value from the table and this will refelect the above chart
         */
        updateState({ isTableChanges: false });

        data.forEach((innerArray = [], InnerArrayIndex) => {
          innerArray.forEach(({ isUpdated = '', value = '' }, innerIndex) => {
            if (innerIndex == 0 || innerIndex == innerArray.length - 1) return;
            if (isUpdated) {
              /**
               * Destructure Line Chart Ref to Update Over The Shown Graph
               */
              const { BarChartRef = { data: '' } } = window;

              const { data = { datasets: [] } } = BarChartRef;

              const { datasets = [] } = data;

              if (!datasets[InnerArrayIndex]) {
                datasets[InnerArrayIndex] = { data: [] };
              }

              if (!datasets[InnerArrayIndex].data[innerIndex - 1]) {
                datasets[InnerArrayIndex].data[innerIndex - 1] = '';
              }

              datasets[InnerArrayIndex].data[innerIndex - 1] = value;

              BarChartRef.update();
            }
          });
        });
      } else {
        /**
         * In Case Data is Changed but not updated from table
         */
        document.querySelector('#BarchartReport').innerHTML =
          '<canvas id="BarChartCanvas" style="height:300px; width:100%"></canvas>';
        const ctx = document.getElementById('BarChartCanvas').getContext('2d');

        window.BarChartRef = new Chart(ctx, options);
      }
    } else {
      /**
       * Render Chart when Page Loads with the help of options provided with option object
       */
      const ctx = document.getElementById('BarChartCanvas').getContext('2d');

      window.BarChartRef = new Chart(ctx, options);
    }
  };

  return (
    <Box>
      <Box id="BarchartReport">
        <canvas
          id="BarChartCanvas"
          style={{ height: '300px', width: '100%' }}
        ></canvas>
      </Box>
    </Box>
  );
}

BarChart.propTypes = {
  data: arrayOf(arrayOf(shape({}))),
  headers: arrayOf(shape({})),
  isTableChanges: bool,
  originalData: arrayOf(arrayOf(shape({}))),
  scenarioMeta: shape({}),
  showDataLabels: bool,
  theme: string.isRequired,
  updateState: func,
};

BarChart.defaultProps = {
  updateState: () => {},
  scenarioMeta: {},
  headers: [],
  data: [],
  originalData: [],
  isTableChanges: false,
  showDataLabels: false,
  theme: '',
};

export default BarChart;
