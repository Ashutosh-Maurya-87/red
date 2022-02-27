import React from 'react';
import { func, bool } from 'prop-types';
import { Grid, Box, Typography, Tooltip } from '@material-ui/core';

import ImgRenderer from '../../../../components/ImgRenderer';
import { MENUS_ACTIONS, MENUS } from '../configs';

import './styles.scss';
import { logAmplitudeEvent } from '../../../../utils/amplitude';

function CreateProcessMenus({ onAddNew, isProcessRunning }) {
  /**
   * Handle Click on Menu
   *
   * @param {Object} step
   */
  const handleClick = step => () => {
    logAmplitudeEvent(`Add process builder ${step.label}`);

    if (isProcessRunning) return;

    switch (step.label) {
      case MENUS_ACTIONS.createTable:
      case MENUS_ACTIONS.deleteClear:
        const newTableConfig = {
          ...step,
          isNewTable: false,
        };
        onAddNew(newTableConfig);
        break;

      case MENUS_ACTIONS.copyPaste:
        const newCopyStep = {
          ...step,
          isNewTable: false,
          newRows: [],
          sourceTable: {
            columns: [],
          },
          targetTable: {
            columns: [],
          },
        };
        onAddNew(newCopyStep);
        break;

      case MENUS_ACTIONS.translate:
        const newStep = {
          ...step,
          targetTable: {},
          headersToCompare: [],
          headersToUpdate: [],
          dataToCompare: [],
          dataToUpdate: [],
        };

        onAddNew(newStep);
        break;

      case MENUS_ACTIONS.lookup:
        step.lookupType = 'single';
        onAddNew(step);
        break;

      case MENUS_ACTIONS.multiLookup:
        step.lookupType = 'multi';
        onAddNew(step);
        break;

      case MENUS_ACTIONS.singleFormulaBuider:
        step.formulaType = 'single';
        onAddNew(step);
        break;

      case MENUS_ACTIONS.multiFormulaBuider:
        step.formulaType = 'multi';
        onAddNew(step);
        break;

      default:
        break;
    }
  };

  return (
    <Grid container alignItems="center">
      <Box
        my={2}
        mx={3}
        borderColor="secondary.stepBorderColor"
        border={1}
        width={1}
        align="center"
        bgcolor="secondary.stepColor"
        borderRadius="borderRadius"
        display="flex"
      >
        {MENUS.map(step => {
          const { label, icon } = step;

          return (
            <Box
              key={label}
              px={2}
              className={`step-box ${
                isProcessRunning ? 'cursor-not-allowed' : ''
              }`}
              onClick={handleClick(step)}
            >
              <Tooltip title={label} placement="top" arrow interactive>
                <Box>
                  <ImgRenderer src={icon} />
                </Box>
              </Tooltip>
              <Typography variant="caption" align="left" display="block">
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Grid>
  );
}

CreateProcessMenus.propTypes = {
  isProcessRunning: bool,
  onAddNew: func.isRequired,
};

export default CreateProcessMenus;
