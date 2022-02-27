import React from 'react';
import { string } from 'prop-types';
import { Typography, ListItem, Box } from '@material-ui/core';
import { CheckCircle as CheckCircleIcon } from '@material-ui/icons';

import { FINANCIAL_ENV_SETUP_MENUS } from '../configs';
import './styles.scss';

const FinancialEnvSideBar = ({ activeTab }) => {
  let activePassed = true;

  return (
    <Box className="inner-sidebar" bgcolor="secondary.sidebar">
      <Box pl={2} pt={2} pb={1}>
        <Typography variant="h5">Environment Setup</Typography>
      </Box>

      <Box>
        {FINANCIAL_ENV_SETUP_MENUS.map(({ label }) => {
          if (activePassed && activeTab == label) activePassed = false;

          return (
            <ListItem
              key={label}
              className={`sidebar-menu ${label == activeTab ? 'selected' : ''}`}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                width="100%"
              >
                <a className="menu-link">{label}</a>
                {activePassed && (
                  <CheckCircleIcon color="primary" fontSize="small" />
                )}
              </Box>
            </ListItem>
          );
        })}
      </Box>
    </Box>
  );
};

FinancialEnvSideBar.propTypes = {
  activeTab: string,
};

export default FinancialEnvSideBar;
