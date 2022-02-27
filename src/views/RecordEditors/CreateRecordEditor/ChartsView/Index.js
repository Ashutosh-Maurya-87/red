import React, { useEffect, useState } from 'react';

import { Box } from '@material-ui/core';
import { bool, func, shape, arrayOf, string } from 'prop-types';
import { createStructuredSelector } from 'reselect';
import { connect } from 'react-redux';

import LineChart from './charts/LineChart';
import BarChart from './charts/BarChart';
import BarSequential from './charts/BarSequential';
import LineSequential from './charts/LineSequential';
import { CHART_TYPE } from './helper';
import { getTheme } from '../../../../reducers/Theme/selectors';

const DEFAULT_SELECTED_CHART = '1';
const DEFAULT_THEME_NAME = 'dark';

function ChartsView({
  updateState,
  data,
  scenarioMeta,
  headers,
  isTableChanges,
  showDataPoints,
  showDataLabels,
  yearsShown,
  selectedChart,
  theme,
}) {
  const [filterdData, setFilteredData] = useState([]);

  useEffect(() => {
    filterDataBasedOnSelectedYears(data);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearsShown, data]);

  /**
   * Function to filter Charts Data According To Selected Years
   */
  const filterDataBasedOnSelectedYears = data => {
    const modifiedData = data.filter((item = []) => {
      const [firstChildItem = {}] = item;
      const { value = '' } = firstChildItem;

      return yearsShown.includes(String(value)) ? item : null;
    });

    setFilteredData(modifiedData);
  };

  const customProps = {
    updateState,
    data: filterdData,
    originalData: data,
    scenarioMeta,
    headers,
    isTableChanges,
    showDataPoints,
    showDataLabels,
    theme,
  };

  return (
    <Box>
      {selectedChart == CHART_TYPE.LINE && <LineChart {...customProps} />}

      {selectedChart == CHART_TYPE.LINE_SEQUENTIAL && (
        <LineSequential {...customProps} />
      )}

      {selectedChart == CHART_TYPE.BAR && <BarChart {...customProps} />}

      {selectedChart == CHART_TYPE.BAR_SEQUENTIAL && (
        <BarSequential {...customProps} />
      )}
    </Box>
  );
}

/**
 * Seting Up Props types For ChartsView
 */

ChartsView.propTypes = {
  data: arrayOf(arrayOf(shape({}))),
  headers: arrayOf(shape({})),
  isTableChanges: bool,
  originalData: arrayOf(arrayOf(shape({}))),
  scenarioMeta: shape({}),
  selectedChart: string,
  showDataLabels: bool,
  showDataPoints: bool,
  theme: string,
  updateState: func,
  yearsShown: arrayOf(string),
};

/**
 * Seting Up Default Props For ChartsView
 */

ChartsView.defaultProps = {
  updateState: () => {},
  scenarioMeta: {},
  headers: [],
  data: [],
  originalData: [],
  isTableChanges: false,
  selectedChart: DEFAULT_SELECTED_CHART,
  showDataPoints: false,
  showDataLabels: false,
  theme: DEFAULT_THEME_NAME,
  yearsShown: [],
};

const mapStateToProps = createStructuredSelector({
  theme: getTheme(),
});

export default connect(mapStateToProps, {})(ChartsView);
