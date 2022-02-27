import React, { useEffect, useState } from 'react';

import { Box } from '@material-ui/core';
import { bool, func, shape, arrayOf, string } from 'prop-types';
import { get } from 'lodash';
import 'chartjs-plugin-dragdata';

import {
  chartColorSchema,
  skipPoints,
  getYearsSeqCharts,
  legendConfigration,
  updateOriginalDataWithFilteredData,
} from '../helper';
import Chart from './commonImports';
import { getFiscalTotal } from '../../UpdateRecord/helper';

function BarSequential({
  data,
  showDataLabels,
  updateState,
  scenarioMeta,
  headers,
  isTableChanges,
  originalData,
  theme,
}) {
  const [isChartDrag, setisChartDrag] = useState(false);

  useEffect(() => {
    !isChartDrag ? formData() : setisChartDrag(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, showDataLabels]);

  /**
   *This Function is used to make datasets of given data and show over the particular chart
   */
  const formData = () => {
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
        data: [
          ...skipPoints(currentIndex),
          ...innerArr.slice(1, innerArr.length - 1),
        ],
        borderColor: chartColorSchema(theme, currentIndex),
        backgroundColor: addBackGroundColorToBars,
        yAxisID: `y`,
        borderWidth: 2,
      };
    });

    const options = {
      type: 'bar',
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

        plugins: {
          ...legendConfigration, // legend Configration

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

              // Update fiscal year
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

              setisChartDrag(true);

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

    const { BarChartRef } = window;

    if (BarChartRef) {
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
              const { BarChartRef = { data: '' } } = window;

              const { data = { datasets: [] } } = BarChartRef;

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

              BarChartRef.update();
            }
          });
        });
      } else {
        /**
         * In Case Data is Changed but not updated from table
         */
        document.querySelector('#BarSeqchartReport').innerHTML =
          '<canvas id="BarSeqCanvas" style="height:300px; width:100%"></canvas>';
        const ctx = document.getElementById('BarSeqCanvas').getContext('2d');

        window.BarChartRef = new Chart(ctx, options);
      }
    } else {
      /**
       * Render Chart when Page Loads with the help of options provided with option object
       */
      const ctx = document.getElementById('BarSeqCanvas').getContext('2d');

      window.BarChartRef = new Chart(ctx, options);
    }
  };

  return (
    <Box>
      <Box id="BarSeqchartReport">
        <canvas
          id="BarSeqCanvas"
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

BarSequential.propTypes = {
  data: arrayOf(arrayOf(shape({}))),
  headers: arrayOf(shape({})),
  isTableChanges: bool,
  originalData: arrayOf(arrayOf(shape({}))),
  scenarioMeta: shape({}),
  showDataLabels: bool,
  theme: string.isRequired,
  updateState: func,
};

BarSequential.defaultProps = {
  updateState: () => {},
  scenarioMeta: {},
  headers: [],
  data: [],
  originalData: [],
  isTableChanges: false,
  showDataLabels: false,
  theme: '',
};

export default BarSequential;
