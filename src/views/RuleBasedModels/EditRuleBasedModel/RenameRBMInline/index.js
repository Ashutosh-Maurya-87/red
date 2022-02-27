import React from 'react';
import { func, shape } from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import InlineRenaming from '../../../../components/InlineRenaming';

import { RULE_BASED_MODELS_API } from '../../../../configs/api';
import { RULE_BASED_MODELS_MSG } from '../../../../configs/messages';

import { httpPut } from '../../../../utils/http';
import { showSuccessMsg } from '../../../../utils/notifications';
import { validateName } from '../../../../utils/helper/validateName';

import { setSingleRBM } from '../../../../reducers/RuleBasedModels/actions';

const RenameRBMInline = ({
  singleRBM = {},
  setSingleRBM,
  onChangeEditingState,
}) => {
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [showLoader, setLoader] = React.useState(false);

  const { name = '', id = '' } = singleRBM || {};

  /**
   * Start Renaming
   */
  const startRenaming = () => {
    setIsRenaming(true);
    onChangeEditingState(true);
  };

  /**
   * Handle > Update Name
   *
   * @param {String} newName
   */
  const handleUpdateName = async newName => {
    try {
      if (name == newName) {
        setIsRenaming(false);
        onChangeEditingState(false);

        return;
      }
      if (showLoader) return;
      setLoader(true);

      const isValidName = validateName(newName);

      // Prevent request to API when name is invalid
      if (!isValidName) {
        setIsRenaming(true);
        onChangeEditingState(true);

        setLoader(false);
        return;
      }

      const url = RULE_BASED_MODELS_API.RENAME_RBM.replace('#ID#', id);

      const params = {
        name: newName,
      };
      await httpPut(url, params);

      setSingleRBM({ ...singleRBM, name: newName });
      showSuccessMsg(RULE_BASED_MODELS_MSG.rule_based_model_renamed);

      setLoader(false);
      setIsRenaming(false);
      onChangeEditingState(false);
    } catch (e) {
      setLoader(false);
    }
  };

  return (
    <InlineRenaming
      disabled={false}
      name={name}
      isLoading={showLoader}
      isEditingEnable={isRenaming}
      onRename={handleUpdateName}
      onTitleClick={startRenaming}
      max={50}
      isFixedWidth
      width={600}
      fontSize={24}
      required
    />
  );
};

RenameRBMInline.propTypes = {
  onChangeEditingState: func,
  setSingleRBM: func,
  singleRBM: shape({}),
};

RenameRBMInline.defaultProps = {
  setSingleRBM: () => {},
  singleRBM: {},
  onChangeEditingState: () => {},
};

const mapStateToProps = createStructuredSelector({});

export default connect(mapStateToProps, { setSingleRBM })(
  withRouter(RenameRBMInline)
);
