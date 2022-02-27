import React from 'react';
import { CHART_TYPE, CHART_NAME } from '../helper';
import {
  BarChartSvg,
  BarSequentialChartSvg,
  LineChartSvg,
  LineSequentialChartSvg,
} from './svg';

export const data = [
  {
    id: CHART_TYPE.LINE,
    name: CHART_NAME.LINE,
    image: <LineChartSvg />,
  },
  {
    id: CHART_TYPE.LINE_SEQUENTIAL,
    name: CHART_NAME.LINE_SEQUENTIAL,
    image: <LineSequentialChartSvg />,
  },
  {
    id: CHART_TYPE.BAR,
    name: CHART_NAME.BAR,
    image: <BarChartSvg />,
  },
  {
    id: CHART_TYPE.BAR_SEQUENTIAL,
    name: CHART_NAME.BAR_SEQUENTIAL,
    image: <BarSequentialChartSvg />,
  },
];
