import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { bool, func, number, shape, string } from 'prop-types';

import { createStructuredSelector } from 'reselect';
import { connect } from 'react-redux';

import { Typography, Box, Divider, Button } from '@material-ui/core';
import { Add as AddIcon } from '@material-ui/icons';

import { withRouterForwardRef } from '../../../../components/WithRouterForwardRef';
import Spinner from '../../../../components/Spinner';

import { RULE_BASED_MODELS_API } from '../../../../configs/api';
import { APP_ROUTES } from '../../../../configs/routes';
import { httpPut } from '../../../../utils/http';

import { RULE_BASED_MODEL_SETUP_MENU_KEYS } from '../../configs';

import CalculationGroupsListing from './CalculationGroupsListing';
import RuleBasedModelSetUpFooter from '../Footer';
import RulesListing from './RulesListing';
import SelectedGroupRules from './SelectedGroupRules';

import { RULE_BASED_MODELS_MSG } from '../../../../configs/messages';

import { showErrorMsg, showSuccessMsg } from '../../../../utils/notifications';

import {
  getSelectedCalculationIndex,
  getSelectedCalculationRules,
  getSingleRBM,
} from '../../../../reducers/RuleBasedModels/selectors';

import {
  setSelectedCalculationRules,
  setSingleRBM,
} from '../../../../reducers/RuleBasedModels/actions';

import './styles.scss';
import { getPercentageLabels } from './helper';

const Calculations = forwardRef(
  (
    {
      history,
      isFinishEnable,
      singleRBM,
      activeTab,
      setSelectedCalculationRules,
      onSetUnsavedChanges,
      setSingleRBM,
      onLoadComponent,
      type,
    },
    ref
  ) => {
    const [isShowAddCalDraw, setIsShowAddCalDraw] = useState(false);
    const [isShowLoader, setIsShowLoader] = useState(false);

    const { configuration = {} } = singleRBM || {};
    const { entity_type = {}, rules = [] } = configuration || {};
    let { rule_group_mapping = [] } = configuration || {};
    const { groups = [] } = entity_type || {};

    /**
     * Component will mount
     */
    useEffect(() => {
      onLoadComponent(singleRBM);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Use Imperative Handle
     */
    useImperativeHandle(ref, () => ({
      onSave,
      setIsShowAddCalDraw,
    }));

    /**
     * Common constants for Next or Exit button
     */
    const {
      location: { search = '' },
    } = history || {};

    const query = new URLSearchParams(search);
    const id = query.get('id');

    /**
     * Handle Next button
     */
    const handleNext = () => {
      let url = APP_ROUTES.CREATE_RULE_BASED_MODEL;
      url += `?id=${id}&activeTab=1`;

      history.push(url);
    };

    /**
     * Handle Save & Exit button
     */
    const handleDone = rulesListing => {
      setSelectedCalculationRules(rulesListing);

      const copyRuleGroup = rule_group_mapping.filter(
        ({ group }) => String(group) !== String(groups[activeTab])
      );

      const newRules = [];

      rulesListing.forEach((rule, index) => {
        newRules.push({
          group: groups[activeTab],
          rule_uid: rule.rule_uid,
          logical_order: index + 1,
        });
      });

      rule_group_mapping = [...copyRuleGroup, ...newRules];

      const newSingleRBM = {
        ...singleRBM,
        configuration: {
          ...configuration,
          rule_group_mapping: [...rule_group_mapping],
        },
      };

      onSetUnsavedChanges(true);
      setSingleRBM(newSingleRBM);
    };

    /**
     * Validate all group of calculation
     *
     * @returns {Bool}
     */
    const isValidCalculations = () => {
      let isHaveError = false;
      const groupsHavingError = [];

      groups.forEach(group => {
        const selectedCalculationRules = rule_group_mapping.filter(
          ({ group: selGroup = '' }) => String(group) == String(selGroup)
        );

        const groupRules = rules.filter(
          ({ rule_uid = '' }) =>
            selectedCalculationRules.findIndex(
              ({ rule_uid: selRuleUID }) => rule_uid == selRuleUID
            ) > -1
        );

        groupRules.forEach(rule => {
          const { percent_of } = rule || {};
          const {
            isHaveError: isHaveErrorInGroup = false,
          } = getPercentageLabels(
            percent_of,
            singleRBM,
            selectedCalculationRules
          );

          if (isHaveErrorInGroup) {
            isHaveError = true;
            groupsHavingError.push(group);
          }
        });
      });

      if (isHaveError) {
        const uniq = [...new Set(groupsHavingError)];

        showErrorMsg(
          RULE_BASED_MODELS_MSG.depended_rule_group_validation.replace(
            '#GROUPS#',
            uniq.join(', ')
          )
        );
        return false;
      }

      return true;
    };

    /**
     * ON Click => To save configuration with callback or without callback
     */
    const onSave = async callback => {
      try {
        if (!isValidCalculations()) return;

        setIsShowLoader(true);

        const url = RULE_BASED_MODELS_API.UPDATE_RBM_CONFIG.replace('#ID#', id);

        const params = {
          ...singleRBM.configuration,
        };

        const { data = {}, message = '' } = await httpPut(url, params);

        onSetUnsavedChanges(false);
        setIsShowLoader(false);

        if (callback) {
          callback();
        }

        showSuccessMsg(message);
        setSingleRBM(data);
      } catch (error) {
        setIsShowLoader(false);
        console.error(error);
      }
    };

    /**
     * ON Click => To save FC
     */
    const onSaveNext = async () => {
      onSave(handleNext);
    };

    return (
      <>
        {isShowLoader && <Spinner />}

        <Typography variant="caption" color="textSecondary">
          Create Calculations
        </Typography>
        <Box mt={1} mb={3}>
          <Typography variant="h2">Select or Create</Typography>
        </Box>
        <Box display="flex" className="calc-group-box">
          <Box
            ref={ref}
            display="flex"
            flexDirection="column"
            maxWidth="250px"
            minWidth="250px"
            height="calc(100vh - 236px)"
            className="remove-calc-height"
          >
            <CalculationGroupsListing
              onSetUnsavedChanges={onSetUnsavedChanges}
            />
          </Box>
          <Box pr={2}>
            <Divider orientation="vertical" />
          </Box>
          <Box
            className="calculations-group remove-calc-height"
            display="flex"
            height="calc(100vh - 135px)"
            width="100%"
            flexDirection="column"
          >
            <SelectedGroupRules onSetUnsavedChanges={onSetUnsavedChanges} />
            <Box
              className="hide-footer-btn"
              display="flex"
              justifyContent="space-between"
              position="sticky"
              bottom="0"
              alignItems="flex-start"
              height="100px"
              bgcolor="secondary.footer"
              zIndex="1"
              pt={2}
            >
              <Box>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<AddIcon />}
                  onClick={() => setIsShowAddCalDraw(true)}
                >
                  Select/Create Calculations
                </Button>
              </Box>
              <RuleBasedModelSetUpFooter
                activeTab={RULE_BASED_MODEL_SETUP_MENU_KEYS.calculations}
                nextTab={RULE_BASED_MODEL_SETUP_MENU_KEYS.fieldConfigs}
                isFinishEnable={isFinishEnable}
                name={'Save & Next'}
                onNext={onSaveNext}
                // onExit={handleExit}
              />
            </Box>
          </Box>
        </Box>
        {isShowAddCalDraw && (
          <RulesListing
            isOpen={isShowAddCalDraw}
            onClose={() => setIsShowAddCalDraw(false)}
            onDone={handleDone}
            onSetUnsavedChanges={onSetUnsavedChanges}
          />
        )}
      </>
    );
  }
);

/**
 * propTypes of component
 */
Calculations.propTypes = {
  activeTab: number,
  isFinishEnable: bool.isRequired,
  onLoadComponent: func.isRequired,
  onSetUnsavedChanges: func.isRequired,
  setSelectedCalculationRules: func.isRequired,
  setSingleRBM: func.isRequired,
  singleRBM: shape({}),
  type: string,
};

/**
 * defaultProps of component
 */
Calculations.defaultProps = {
  singleRBM: {},
  selectedCalculationRules: [],
  setSingleRBM: () => {},
  isFinishEnable: true,
  onLoadComponent: () => {},
  onSetUnsavedChanges: () => {},
  setSelectedCalculationRules: () => {},
  activeTab: null,
};

const mapStateToProps = createStructuredSelector({
  activeTab: getSelectedCalculationIndex(),
  singleRBM: getSingleRBM(),
  selectedCalculationRules: getSelectedCalculationRules(),
});

export default connect(
  mapStateToProps,
  {
    setSelectedCalculationRules,
    setSingleRBM,
  },
  null,
  { forwardRef: true }
)(withRouterForwardRef(Calculations));
