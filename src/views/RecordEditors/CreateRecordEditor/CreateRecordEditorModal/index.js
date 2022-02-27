import React, { useState } from 'react';
import { func, bool } from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import Spinner from '../../../../components/Spinner';
import SelectTableModal from '../../../../components/SelectTableModal';
import { RE_TABS_ACTIONS_KEYS } from '../../../../components/SelectTableModal/helper';

import { setSelectedTable } from '../../../../reducers/RecordEditor/actions';

import { APP_ROUTES } from '../../../../configs/routes';
import { logAmplitudeEvent } from '../../../../utils/amplitude';
import { SELECT_TABLE_TABS_RE } from '../../../SourceTables/SourceTablesList/ThumbnailView/configs';

function CreateRecordEditorModal({
  history,
  isOpen,
  onClose,
  setSelectedTable,
}) {
  const [showLoader, setLoader] = useState(false);

  if (!isOpen) return null;

  /**
   * Create Create Editor
   */
  const createRecordEditor = async table => {
    logAmplitudeEvent('Created record editor');

    try {
      if (!table || !table.id) return;

      table.selectionType = table.source_type ? 'scenario' : 'source-table';

      setSelectedTable(table);
      history.push(APP_ROUTES.CREATE_RECORD_EDITOR);
    } catch (err) {
      setLoader(false);
    }
  };

  return (
    <>
      {showLoader && <Spinner />}

      <SelectTableModal
        handleData={createRecordEditor}
        isOpen={isOpen}
        onClose={onClose}
        activeTabName={RE_TABS_ACTIONS_KEYS.scenarioTab}
        tabs={Object.values(SELECT_TABLE_TABS_RE).label}
      />
    </>
  );
}

CreateRecordEditorModal.propTypes = {
  isOpen: bool,
  onClose: func,
  setSelectedTable: func.isRequired,
};

CreateRecordEditorModal.defaultProps = {
  isOpen: false,
  onClose: () => {},
};

const mapStateToProps = createStructuredSelector({});

export default connect(mapStateToProps, { setSelectedTable })(
  withRouter(CreateRecordEditorModal)
);
