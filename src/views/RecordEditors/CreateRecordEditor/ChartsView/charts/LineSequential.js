import React, { useEffect, useState } from 'react';

import { Box } from '@material-ui/core';
import { bool, func, shape, arrayOf, string } from 'prop-types';
import { get } from 'lodash';

import {
  chartColorSchema,
  skipPoints,
  dashSeqCharts,
  getYearsSeqCharts,
  legendConfigration,
  updateOriginalDataWithFilteredData,
} from '../helper';
import Chart from './commonImports';
import { getFiscalTotal } from '../../UpdateRecord/helper';
import 'chartjs-plugin-dragdata';

function LineSequential({
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
    !isChartDrag ? formData() : setIsChartDrag(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, showDataLabels, showDataPoints]);

  /**
   *This Function is used to make datasets of given data and show over the particular chart
   */
  const formData = () => {
    const yearWiseArr = data.map((year = []) =>
      year.map(({ value = '' }) => value || 0)
    );

    const dataSet = yearWiseArr.map((innerArr = [], i) => {
      const skipPointArr = skipPoints(i) || [];
      const selectChartSchema = chartColorSchema(theme, i);

      /* Merge the Line With Previous year  */

      if (skipPointArr.length > 0) {
        if (!yearWiseArr[i - 1]) yearWiseArr[i - 1] = [];
        if (!yearWiseArr[i - 1][innerArr.length - 2]) {
          yearWiseArr[i - 1][innerArr.length - 2] = 0;
        }

        skipPointArr[skipPointArr.length - 1] =
          yearWiseArr[i - 1][innerArr.length - 2];
      }

      const { 0: zeroIndexValue = '' } = innerArr;

      return {
        label: zeroIndexValue,
        data: [...skipPointArr, ...innerArr.slice(1, innerArr.length - 1)],
        borderColor: selectChartSchema,
        backgroundColor: selectChartSchema,
        yAxisID: `y`,
        ...(!showDataPoints && {
          pointRadius: 0,
        }) /* condition to show data points or not over the chart */,
      };
    });

    /**
     *Register Plugin To Show Legend text color similar to their line
     */
    Chart.register({
      id: 'LineSeqChart',
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
      type: 'line',
      data: {
        labels: getYearsSeqCharts(headers, yearWiseArr.length),
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

        segment: {
          borderDash: ctx =>
            dashSeqCharts(data, ctx, [6, 6]) || [
              6,
              0,
            ] /* This Function is used to show Dashed line When Data is In Forecasted State */,
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
                color({ datasetIndex }) {
                  return chartColorSchema(theme, datasetIndex);
                },
              },
            },
          },

          dragData: {
            round: 2,
            showTooltip: true,

            onDragStart(e, datasetIndex, index, value) {
              const originalIndex = parseInt(index / 12, 10);
              const originalDatasetIndex = index - originalIndex * 12;

              /**
               *  Only Allow Line To Drag if its data is in forecast state
               */

              if (!data[originalIndex]) data[originalIndex] = [];
              if (!data[originalIndex][originalDatasetIndex + 1]) {
                data[originalIndex][originalDatasetIndex + 1] = {
                  readOnly: true,
                };
              }

              return !data[originalIndex][originalDatasetIndex + 1].readOnly;
            },

            onDrag(e, datasetIndex, index, value) {},

            onDragEnd(e, datasetIndex, index, value) {
              const originalIndex = parseInt(index / 12, 10);
              const originalDatasetIndex = index - originalIndex * 12;

              if (!data[originalIndex]) data[originalIndex] = [];
              if (!data[originalIndex][originalDatasetIndex + 1]) {
                data[originalIndex][originalDatasetIndex + 1] = {
                  value: '',
                  realValue: '',
                  isUpdated: '',
                };
              }

              data[originalIndex][originalDatasetIndex + 1] = {
                ...data[originalIndex][originalDatasetIndex + 1],
                value,
                realValue: value,
                isUpdated: true,
              };

              const operator = get(scenarioMeta, 'operator');

              const cells = (data[originalIndex] || [])
                .filter(
                  (value, index) =>
                    index > 0 &&
                    index != data[originalIndex].length - 1 &&
                    value
                )
                .map(value => value.value || '');

              data[originalIndex][data[originalIndex].length - 1] = {
                ...data[originalIndex][data[originalIndex].length - 1],
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
      /* This Code Execute When user changes any value from the table and this will refelect the above chart */

      if (isTableChanges) {
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

              if (
                !datasets[InnerArrayIndex].data[
                  innerIndex + InnerArrayIndex * 12 - 1
                ]
              ) {
                datasets[InnerArrayIndex].data[
                  innerIndex + InnerArrayIndex * 12 - 1
                ] = '';
              }

              datasets[InnerArrayIndex].data[
                innerIndex + InnerArrayIndex * 12 - 1
              ] = value;

              LineChartRef.update();
            }
          });
        });
      } else {
        /**
         * In Case Data is Changed but not updated from table
         */
        document.querySelector('#lineSequentialchartReport').innerHTML =
          '<canvas id="LineSeqCanvas" style="height:300px; width:100%"></canvas>';
        const ctx = document.getElementById('LineSeqCanvas').getContext('2d');

        window.LineChartRef = new Chart(ctx, options);
      }
    } else {
      /**
       * Render Chart when Page Loads with the help of options provided with option object
       */
      const ctx = document.getElementById('LineSeqCanvas').getContext('2d');

      window.LineChartRef = new Chart(ctx, options);
    }
  };

  return (
    <Box>
      <Box id="lineSequentialchartReport">
        <canvas
          id="LineSeqCanvas"
          style={{ height: '300px', width: '100%' }}
        ></canvas>
      </Box>
      <Box style={{ display: 'flex', justifyContent: 'space-around' }}>
        {data.map((item = [], i) => {
          const [firstChildItem = {}] = item;
          const { value = '' } = firstChildItem;
          return (
            <Box
              key={i}
              style={{
                color: chartColorSchema(theme, i),
                fontWeight: 700,
                margin: '5px 0',
              }}
            >
              {value}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

LineSequential.propTypes = {
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

LineSequential.defaultProps = {
  updateState: () => {},
  scenarioMeta: {},
  headers: [],
  data: [],
  originalData: [],
  isTableChanges: false,
  showDataPoints: false,
  showDataLabels: false,
  theme: '',
};

export default LineSequential;
