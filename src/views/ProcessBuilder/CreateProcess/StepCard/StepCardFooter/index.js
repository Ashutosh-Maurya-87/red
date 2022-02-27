import React from 'react';
import { func, shape, number } from 'prop-types';
import { Box, Grid, Button, Divider } from '@material-ui/core';

import { MENUS_ACTIONS } from '../../configs';
import { showErrorMsg } from '../../../../../utils/notifications';

import { getDataForCreateTable } from '../CreateTable/helper';
import { getDataForDeleteStep } from '../DeleteClearData/helper';
import { getDataForCopyPasteStep } from '../CopyAppendData/helper';
import { getDataForLookupStep } from '../LookupTable/helper';
import { getDataForFormulaBuilder } from '../TableFormulaBuilder/helper';
import { getDataForTranslateTable } from '../TranslateTable/helper';

function StepCardFooter({ onCancel, step, stepNumber, updateStepData }) {
  const showError = err => {
    showErrorMsg(err);
  };

  // Collapse step on hitting done
  const collapseStep = () => {
    const data = {
      ...step,
      isExpand: false,
      isSubmit: true,
    };

    updateStepData(stepNumber, data);
  };

  const onClickSave = () => {
    let isSuccess = null;

    switch (step.label) {
      case MENUS_ACTIONS.createTable:
        isSuccess = getDataForCreateTable({
          step,
          i: stepNumber,
          setError: showError,
        });
        break;

      case MENUS_ACTIONS.translate:
        delete step.headersToCompareNotFound;
        delete step.headersToUpdateNotFound;
        isSuccess = getDataForTranslateTable(step, stepNumber, showError);
        break;

      case MENUS_ACTIONS.deleteClear:
        isSuccess = getDataForDeleteStep(step, stepNumber, showError);
        break;

      case MENUS_ACTIONS.copyPaste:
        isSuccess = getDataForCopyPasteStep(step, stepNumber, showError);
        break;

      case MENUS_ACTIONS.lookup:
      case MENUS_ACTIONS.multiLookup:
        isSuccess = getDataForLookupStep(step, stepNumber, showError);
        break;

      case MENUS_ACTIONS.singleFormulaBuider:
      case MENUS_ACTIONS.multiFormulaBuider:
        isSuccess = getDataForFormulaBuilder(step, stepNumber, showError);
        break;

      default:
        break;
    }

    if (!isSuccess) {
      updateStepData(stepNumber, { ...step, isSubmit: true });
      return;
    }

    collapseStep();
  };
  return (
    <>
      <Box my={3}>
        <Divider />
      </Box>
      <Grid container direction="row" alignItems="center">
        <Box m={1}>
          <Button variant="contained" color="primary" onClick={onClickSave}>
            Done
          </Button>
        </Box>
      </Grid>
    </>
  );
}

StepCardFooter.propTypes = {
  onCancel: func,
  step: shape({}).isRequired,
  stepNumber: number.isRequired,
  updateStepData: func.isRequired,
};

StepCardFooter.defaultProps = {
  onCancel: () => {},
};

export default StepCardFooter;
