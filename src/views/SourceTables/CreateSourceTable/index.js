import React from 'react';
import { withRouter } from 'react-router-dom';
import { Box } from '@material-ui/core';

import AppHeader from '../../../components/AppHeader';
import Spinner from '../../../components/Spinner';
import EditTableNameHeader from '../EditTableNameHeader';
import CreateSourceTableStep from '../../ProcessBuilder/CreateProcess/StepCard/CreateTable';

import { APP_ROUTES } from '../../../configs/routes';
import { API_URLS } from '../../../configs/api';
import { getDataForCreateTable } from '../../ProcessBuilder/CreateProcess/StepCard/CreateTable/helper';
import { showErrorMsg, showSuccessMsg } from '../../../utils/notifications';
import { httpPost } from '../../../utils/http';

import './styles.scss';
import { logAmplitudeEvent } from '../../../utils/amplitude';

class CreateSourceTable extends React.Component {
  /**
   * State
   */
  state = {
    showLoader: false,
    tableHeight: 300,
    step: {
      tableName: 'New Table',
      headers: [],
      data: [],
    },

    isBlockDone: false,
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    window.addEventListener('resize', this.handleWindowResize);
  }

  /**
   * When Component Will Unmount
   */
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
  }

  /**
   * Handle Window Resize
   */
  handleWindowResize = () => {
    const tableHeight = this.getTableHeight();

    this.setState({ tableHeight });
  };

  /**
   * Get Calculated Table Height
   *
   * @param {Object} step
   *
   * @param {Number}
   */
  getTableHeight = step => {
    if (!step) ({ step } = this.state);

    let tableHeight = 32 * step.data.length;

    if (tableHeight > window.innerHeight - 210) {
      tableHeight = window.innerHeight - 210;
    }

    return tableHeight;
  };

  /**
   * Update Table Name
   */
  updateTableName = tableName => {
    const { step } = this.state;
    step.tableName = tableName;

    this.setState({ step });
  };

  /**
   * Update Step
  ]
   * @param {*} _ 
   * @param {*} step 
   */
  updateStep = (_, step) => {
    const tableHeight = this.getTableHeight(step);

    this.setState({ tableHeight, step: { ...step } });
  };

  /**
   * Handle Click > Cancel
   */
  onCancel = () => {
    logAmplitudeEvent('Cancel create source table');

    this.props.history.push(APP_ROUTES.SOURCE_TABLES);
  };

  /**
   * Handle Click > Save|Create Table
   */
  onSaveTable = async () => {
    logAmplitudeEvent('Save created source Table');

    try {
      const { step, showLoader } = this.state;
      if (showLoader) return;

      this.setState({ showLoader: true });

      const data = getDataForCreateTable({
        step,
        i: 1,
        setError: showErrorMsg,
        isStep: false,
      });

      if (!data) {
        this.setState({ showLoader: false });
        return;
      }

      const params = {
        new_display_name: step.tableName,
        new_table_name: step.tableName,
        new_columns: data.new_columns,
        table_data: data.table_data,
      };

      const { data: resData } = await httpPost(
        API_URLS.CREATE_SOURCE_TABLE,
        params
      );

      const { message } = resData || {};

      showSuccessMsg(message);
      this.setState({ showLoader: false });

      this.props.history.push(APP_ROUTES.SOURCE_TABLES);
    } catch (e) {
      this.setState({ showLoader: false });
    }
  };

  /**
   * Render View
   */
  render() {
    const { tableHeight, showLoader, step, isBlockDone } = this.state;

    return (
      <>
        {showLoader && <Spinner />}

        <AppHeader
          saveText="Create"
          onSave={this.onSaveTable}
          cancelText="Cancel"
          onCancel={this.onCancel}
          isBlockDone={isBlockDone}
          header={
            <EditTableNameHeader
              name={step.tableName}
              handleNewName={this.updateTableName}
              onChangeEditingState={value => {
                this.setState({ isBlockDone: value });
              }}
            />
          }
        />

        <Box className="create-new-src-table">
          <CreateSourceTableStep
            step={step}
            updateStepData={this.updateStep}
            stepNumber={0}
            fromProcessBuilder={false}
            tableHeight={tableHeight}
            maxRows={10000}
          />
        </Box>
      </>
    );
  }
}

export default withRouter(CreateSourceTable);
