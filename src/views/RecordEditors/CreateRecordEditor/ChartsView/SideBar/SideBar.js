import React, { useState } from 'react';
import {
  Box,
  Button,
  List,
  ListItem,
  Divider,
  Radio,
  Checkbox,
  withStyles,
} from '@material-ui/core';
import { string, func, bool } from 'prop-types';
import { connect } from 'react-redux';
import { Add, Close } from '@material-ui/icons';

import { createStructuredSelector } from 'reselect';
import { getTheme } from '../../../../../reducers/Theme/selectors';
import { data } from './data';
import { styles } from './style';

const DEFAULT_SELECTED_CHART = '1';

function SideBar({
  selectedChart,
  showDataPoints,
  updateState,
  showDataLabels,
  classes,
}) {
  const [showHide, setShowHide] = useState(false);

  return (
    <>
      <Button
        className={classes.btnStyle}
        size="small"
        variant="outlined"
        onClick={() => setShowHide(pre => !pre)}
      >
        {showHide ? <Close /> : <Add />}
      </Button>

      {showHide && (
        <List
          className={classes.ListStyle}
          component="nav"
          aria-label="mailbox folders"
        >
          <ListItem>SCREEN CONFIGURATION</ListItem>

          <ListItem
            button
            onClick={() => updateState({ showDataPoints: !showDataPoints })}
          >
            <Box className={classes.BoxStyle}>
              <Box>
                <>Data Points</>
              </Box>
              <Box>
                <Checkbox
                  value={showDataPoints}
                  checked={showDataPoints}
                  color="primary"
                />
              </Box>
            </Box>
          </ListItem>

          <ListItem
            button
            onClick={() => updateState({ showDataLabels: !showDataLabels })}
          >
            <Box className={classes.BoxStyle}>
              <Box>
                <>Data Labels</>
              </Box>
              <Box>
                <Checkbox
                  value={showDataLabels}
                  checked={showDataLabels}
                  color="primary"
                />
              </Box>
            </Box>
          </ListItem>

          <ListItem>Chart Type</ListItem>
          <Divider />

          {(data || []).map(({ image, name, id }, i) => {
            return (
              <ListItem
                key={i}
                button
                onClick={() => updateState({ selectedChart: id })}
              >
                <Box className={classes.BoxStyle}>
                  <Box
                    className={
                      id == selectedChart
                        ? classes.ActiveClass
                        : classes.DefaultClass
                    }
                  >
                    {image}
                  </Box>
                  <Box>
                    <ListItem>{name}</ListItem>
                  </Box>
                  <Box>
                    <Radio
                      checked={selectedChart === id}
                      value={id}
                      color="primary"
                      name="radio-buttons"
                      inputProps={{ 'aria-label': id }}
                    />
                  </Box>
                </Box>
              </ListItem>
            );
          })}
        </List>
      )}
    </>
  );
}

/**
 * These are PropTypes Used for Sidebar props
 */
SideBar.propTypes = {
  selectedChart: string,
  showDataLabels: bool,
  showDataPoints: bool,
  updateState: func,
};

/**
 * These are defaultProps in case value is null or not given
 */
SideBar.defaultProps = {
  updateState: () => {},
  selectedChart: DEFAULT_SELECTED_CHART,
  showDataPoints: false,
  showDataLabels: false,
};

const mapStateToProps = createStructuredSelector({
  theme: getTheme(),
});

export default connect(mapStateToProps, {})(withStyles(styles)(SideBar));
