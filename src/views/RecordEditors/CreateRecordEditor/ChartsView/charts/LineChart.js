import React, { useEffect, useState } from 'react';

import { bool, func, shape, arrayOf, string } from 'prop-types';
import { get } from 'lodash';
import { Box } from '@material-ui/core';

import {
  chartColorSchema,
  getYearsNonSeqCharts,
  dashNonSeqCharts,
  legendConfigration,
  updateOriginalDataWithFilteredData,
} from '../helper';
import { getFiscalTotal } from '../../UpdateRecord/helper';
import Chart from './commonImports';

import 'chartjs-plugin-dragdata';

const DEFAULT_THEME_NAME = 'dark';

function LineChart({
  data,
  updateState,
  scenarioMeta,
  headers,
  isTableChanges,
  showDataPoints,
  showDataLabels,
  originalData,
  theme,
}) {
  const [isChartDrag, setIsChartDrag] = useState(false);

  useEffect(() => {
    !isChartDrag ? formDataFunction(data) : setIsChartDrag(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, showDataLabels, showDataPoints]);

  /**
   *This Function is used to make datasets of given data and show over the particular chart
   */
  const formDataFunction = (data = []) => {
    const yearWiseArr = data.map((year = []) =>
      year.map(({ value = '' }) => value || 0)
    );

    /**
     *looping data To Form a DataSet for Line Chart
     */
    const dataSet = (yearWiseArr || []).map((innerArr = [], i) => {
      const { 0: zeroIndexValue = '' } = innerArr;
      const selectChartSchema = chartColorSchema(theme, i);

      return {
        label: zeroIndexValue,
        data: innerArr.slice(1, innerArr.length - 1) || [],
        borderColor: selectChartSchema,
        backgroundColor: selectChartSchema,
        yAxisID: `y`,
        ...(!showDataPoints && {
          pointRadius: 0,
        }) /* Condition to show datapoints when its value is true  */,
      };
    });

    /**
     *Register Plugin To Show Legend text color similar to their line
     */
    Chart.register({
      id: 'LineChart',
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

    /**
     * Options used To Draw Chart According to datasets
     */
    const options = {
      type: 'line',
      data: {
        labels: [...getYearsNonSeqCharts(headers)],
        datasets: dataSet || [],
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
        segment: {
          borderDash: ctx =>
            dashNonSeqCharts(data, ctx, [5, 5]) || [
              6,
              0,
            ] /* This function is used to show dashed line over line chart when data is in forecasted state */,
        },

        plugins: {
          ...legendConfigration /* Legend Configrations */,

          /**
           *Configurations To Show Data Lables Over the charts
           */

          datalabels: {
            anchor: 'end',
            align: 'end',
            opacity: showDataLabels ? 1 : 0,
            labels: {
              value: {
                color({ datasetIndex = '' }) {
                  return chartColorSchema(theme, datasetIndex);
                },
              },
            },
          },

          dragData: {
            round: 2,
            showTooltip: true,

            onDragStart(e, datasetIndex, index, value) {
              /**
               *  Only Allow Line To Drag if its data is in forecast state
               */
              if (!data[datasetIndex]) data[datasetIndex] = [];
              if (!data[datasetIndex][index + 1]) {
                data[datasetIndex][index + 1] = { readOnly: true };
              }

              return !data[datasetIndex][index + 1].readOnly;
            },

            onDrag(e, datasetIndex, index, value) {},

            onDragEnd(e, datasetIndex = 0, index = 0, value = 0) {
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

              setIsChartDrag(true);

              /**
               *Function to update Filtered Value with real data
               */
              const updatedDataWithFilteredData = updateOriginalDataWithFilteredData(
                originalData,
                data
              );

              updateState({ data: [...updatedDataWithFilteredData] });
            },
          },
        },
      },
    };

    const { LineChartRef = '' } = window;

    if (LineChartRef) {
      if (isTableChanges) {
        /**
         * This Code Execute When user changes any value from the table and this will refelect the above chart
         */
        updateState({ isTableChanges: false });

        data.forEach((InnerArray = [], InnerArrayIndex) => {
          InnerArray.forEach(({ isUpdated = '', value = '' }, innerIndex) => {
            if (innerIndex == 0 || innerIndex == InnerArray.length - 1) return;
            if (isUpdated) {
              /**
               * Destructure Line Chart Ref to Update Over The Shown Graph
               */
              const { LineChartRef = { data: '' } } = window;

              const { data = { datasets: [] } } = LineChartRef;

              const { datasets = [] } = data;

              if (!datasets[InnerArrayIndex]) {
                datasets[InnerArrayIndex] = { data: [] };
              }

              if (!datasets[InnerArrayIndex].data[innerIndex - 1]) {
                datasets[InnerArrayIndex].data[innerIndex - 1] = '';
              }

              datasets[InnerArrayIndex].data[innerIndex - 1] = value;

              LineChartRef.update();
            }
          });
        });
      } else {
        /**
         * In Case Data is Changed but not updated from table
         */
        document.querySelector('#LineChartReport').innerHTML =
          '<canvas id="LineChartCanvas" style="height:300px; width:100%"></canvas>';
        const ctx = document.getElementById('LineChartCanvas').getContext('2d');

        window.LineChartRef = new Chart(ctx, options);
      }
    } else {
      /**
       * Render Chart when Page Loads with the help of options provided with option object
       */
      const ctx = document.getElementById('LineChartCanvas').getContext('2d');

      window.LineChartRef = new Chart(ctx, options);
    }
  };

  return (
    <Box>
      <Box id="LineChartReport">
        <canvas
          id="LineChartCanvas"
          style={{ height: '300px', width: '100%' }}
        ></canvas>
      </Box>
    </Box>
  );
}

LineChart.propTypes = {
  data: arrayOf(arrayOf(shape({}))),
  headers: arrayOf(shape({})),
  isTableChanges: bool,
  originalData: arrayOf(arrayOf(shape({}))),
  scenarioMeta: shape({}),
  showDataLabels: bool,
  showDataPoints: bool,
  theme: string.isRequired,
  updateState: func,
};

LineChart.defaultProps = {
  updateState: () => {},
  scenarioMeta: {},
  headers: [],
  data: [],
  originalData: [],
  isTableChanges: false,
  showDataPoints: false,
  showDataLabels: false,
  theme: DEFAULT_THEME_NAME,
};

export default LineChart;
