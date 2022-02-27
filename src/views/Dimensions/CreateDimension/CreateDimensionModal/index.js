import React from 'react';
import { withRouter } from 'react-router-dom';
import { func, bool } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { APP_ROUTES } from '../../../../configs/routes';
import { setSelectedTable } from '../../../../reducers/Dimensions/actions';

import SelectTableModal from '../../../../components/SelectTableModal';
import {
  TABS_ACTIONS,
  DIMENSION_TABS_ACTIONS_KEYS,
} from '../../../../components/SelectTableModal/helper';

function CreateDimensionModal({ history, isOpen, onClose, setSelectedTable }) {
  if (!isOpen) return null;

  /**
   * Handle Selected Table
   *
   * @param {Object} table
   */
  const handleSelectedTable = table => {
    if (!table || !table.id) return;

    setSelectedTable(table);
    history.push(APP_ROUTES.CREATE_DIMENSION);
  };

  return (
    <SelectTableModal
      handleData={handleSelectedTable}
      isOpen={isOpen}
      onClose={onClose}
      activeTabName={DIMENSION_TABS_ACTIONS_KEYS.sourceTableTab}
      tabs={TABS_ACTIONS(DIMENSION_TABS_ACTIONS_KEYS)}
    />
  );
}

CreateDimensionModal.propTypes = {
  isOpen: bool,
  onClose: func,
  setSelectedTable: func.isRequired,
};

CreateDimensionModal.defaultProps = {
  isOpen: false,
  onClose: () => {},
};

const mapStateToProps = createStructuredSelector({});

export default connect(mapStateToProps, { setSelectedTable })(
  withRouter(CreateDimensionModal)
);
