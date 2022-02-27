import React from 'react';
import {
  Backup as UploadIcon,
  TableChartRounded as TableIcon,
  FileCopy as FileCopyIcon,
} from '@material-ui/icons';

export const VIEW_TABS = [
  'View Data',
  'Configurations',
  'Relationship',
  // 'Scenario Source',
  'Validation',
];

export const CREATE_STEPS = [
  {
    label: 'Select Data Source',
  },
  {
    label: 'Create New Scenario',
  },
  {
    label: 'Finish',
  },
];

export const SELECT_DATA_SOURCES = [
  {
    label: 'Upload a Source Table',
    key: 'uploadTable',
    icon: <UploadIcon fontSize="large" />,
  },
  {
    label: 'Connect to an Existing Table',
    key: 'selectTable',
    icon: <TableIcon fontSize="large" />,
  },
  {
    label: 'Choose from Existing Scenario(s)',
    key: 'selectScenario',
    icon: <FileCopyIcon fontSize="large" />,
  },
];

export const SCENARIO_SRC_TYPES = ['source_table', 'scenario_to_scenario'];
