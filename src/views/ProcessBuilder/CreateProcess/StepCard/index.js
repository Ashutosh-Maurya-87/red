import React from 'react';
import { shape, number, func, string, bool } from 'prop-types';
import { withStyles, Paper, Collapse } from '@material-ui/core';

import { MENUS_ACTIONS } from '../configs';
import { isTranslateHaveError } from '../helper';

import StepCardHeader from './StepCardHeader';
import DeleteClearData from './DeleteClearData';
import CopyAppendData from './CopyAppendData';
import LookupTable from './LookupTable';
import TableFormulaBuilder from './TableFormulaBuilder';
import CreateSourceTable from './CreateTable';
import TranslateSourceTable from './TranslateTable';

import { styles } from './styles';
import './styles.scss';

function ProcessBuilderStepCard({
  step,
  stepNumber,
  onRemoveStep,
  updateStepData,
  dragProvider,
  processStatus,
  isDragging,
  isDraggingOver,
  runNextStep,
  isProcessRunning,
}) {
  return (
    <Paper
      className={`paper-content ${isTranslateHaveError(step)} ${
        isDraggingOver ? 'drag-over' : ''
      }`}
      style={{ minHeight: isDragging ? '58px' : '' }}
    >
      {/* <span className={isDraggingOver ? 'drag-over' : ''}></span> */}
      <span
        className="re-rder-drag-ref"
        ref={dragProvider.innerRef}
        {...dragProvider.draggableProps}
        {...dragProvider.dragHandleProps}
      >
        <StepCardHeader
          step={step}
          stepNumber={stepNumber}
          onRemoveStep={onRemoveStep}
          updateStepData={updateStepData}
          isDragging={isDragging}
          status={processStatus}
          runNextStep={runNextStep}
          isProcessRunning={isProcessRunning}
        />
      </span>

      <Collapse in={step.isExpand}>
        {step.label == MENUS_ACTIONS.createTable && (
          <CreateSourceTable
            step={step}
            stepNumber={stepNumber}
            updateStepData={updateStepData}
          />
        )}

        {step.label == MENUS_ACTIONS.translate && (
          <TranslateSourceTable
            step={step}
            stepNumber={stepNumber}
            updateStepData={updateStepData}
          />
        )}

        {step.label == MENUS_ACTIONS.deleteClear && (
          <DeleteClearData
            step={step}
            stepNumber={stepNumber}
            updateStepData={updateStepData}
          />
        )}

        {step.label == MENUS_ACTIONS.copyPaste && (
          <CopyAppendData
            step={step}
            stepNumber={stepNumber}
            updateStepData={updateStepData}
          />
        )}

        {(step.label == MENUS_ACTIONS.lookup ||
          step.label == MENUS_ACTIONS.multiLookup) && (
          <LookupTable
            step={step}
            stepNumber={stepNumber}
            updateStepData={updateStepData}
          />
        )}

        {(step.label == MENUS_ACTIONS.singleFormulaBuider ||
          step.label == MENUS_ACTIONS.multiFormulaBuider) && (
          <TableFormulaBuilder
            step={step}
            stepNumber={stepNumber}
            updateStepData={updateStepData}
          />
        )}
      </Collapse>
    </Paper>
  );
}

ProcessBuilderStepCard.propTypes = {
  dragProvider: shape({}).isRequired,
  isDragging: bool.isRequired,
  isDraggingOver: bool.isRequired,
  isProcessRunning: bool.isRequired,
  onRemoveStep: func.isRequired,
  processStatus: string,
  runNextStep: func.isRequired,
  step: shape({}).isRequired,
  stepNumber: number.isRequired,
  updateStepData: func.isRequired,
};

export default withStyles(styles)(ProcessBuilderStepCard);
