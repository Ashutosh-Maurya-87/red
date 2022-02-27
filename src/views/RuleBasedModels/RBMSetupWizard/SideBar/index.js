import React from 'react';
import { shape, string } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { withRouter } from 'react-router-dom';

import { Typography, ListItem, Box } from '@material-ui/core';
// import { CheckCircle as CheckCircleIcon } from '@material-ui/icons';

import { RULE_BASED_MODEL_SETUP_MENUS } from '../../configs';
import { APP_ROUTES } from '../../../../configs/routes';

import { getSingleRBM } from '../../../../reducers/RuleBasedModels/selectors';

import './styles.scss';

const RuleBasedModelSideBar = ({ activeTab, singleRBM, history, type }) => {
  let activePassed = true;

  const { name = '', scenario = '' } = singleRBM || {};
  const { name: scenarioName = '' } = scenario || {};

  /**
   * Goto setup wizard
   */
  const changeTab = index => {
    const {
      location: { search = '' },
    } = history || {};

    const query = new URLSearchParams(search);
    const id = query.get('id');

    let url = APP_ROUTES.CREATE_RULE_BASED_MODEL;
    url += `?id=${id}&activeTab=${index}`;

    if (type) {
      url = type.replace(':id', id);
      url += `?activeTab=${index}&id=${id}`;
    }

    history.push(url);
  };

  return (
    <Box className="inner-sidebar rbm-sidebar" bgcolor="secondary.sidebar">
      <Box pl={2} pt={2} pb={1} className="sidebar-title">
        <Typography variant="h6" noWrap title={name}>
          {name}
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          noWrap
          title={scenarioName}
        >
          {scenarioName}
        </Typography>
      </Box>

      <Box>
        {RULE_BASED_MODEL_SETUP_MENUS.map(({ label }, index) => {
          if (activePassed && activeTab == label) activePassed = false;

          return (
            <ListItem
              key={label}
              className={`sidebar-menu cursor-pointer ${
                label == activeTab ? 'selected' : ''
              }`}
              onClick={() => changeTab(index)}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                width="100%"
              >
                <a className="menu-link ">{label}</a>
                {/* {activePassed && (
                  <CheckCircleIcon color="primary" fontSize="small" />
                )} */}
              </Box>
            </ListItem>
          );
        })}
      </Box>
    </Box>
  );
};

RuleBasedModelSideBar.propTypes = {
  activeTab: string,
  singleRBM: shape({}),
  type: string,
};

const mapStateToProps = createStructuredSelector({
  singleRBM: getSingleRBM(),
});

export default connect(mapStateToProps, {})(withRouter(RuleBasedModelSideBar));
