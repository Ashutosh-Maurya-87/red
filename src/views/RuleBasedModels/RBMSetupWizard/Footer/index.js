import React from 'react';
import { func, string, oneOfType, shape, bool } from 'prop-types';

import { Box, Typography, Button } from '@material-ui/core';
import { Info as InfoIcon } from '@material-ui/icons';

const RuleBasedModelSetUpFooter = ({
  activeTab,
  prevTab,
  onPrev,
  onNext,
  onExit,
  helperText,
  isFinishEnable,
  isDisabled,
  name,
}) => {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      className="hide-footer-btn"
    >
      <Box display="flex" alignItems="center" color="textSecondary">
        {helperText && typeof helperText == 'string' && (
          <>
            <InfoIcon fontSize="small" />
            &nbsp;
            <Typography variant="caption">{helperText}</Typography>
          </>
        )}

        {helperText && typeof helperText == 'object' && { ...helperText }}
      </Box>

      {activeTab && (
        <Box ml={1} display="flex" alignItems="center">
          {prevTab && (
            <Box mr={1} display="inline" onClick={onPrev}>
              <Button color="primary" variant="outlined">
                Back
              </Button>
            </Box>
          )}

          {!isFinishEnable && (
            <>
              <Box mr={1} display="inline">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={onExit}
                  disabled={isDisabled}
                >
                  Save & Exit
                </Button>
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={onNext}
                disabled={isDisabled}
              >
                Save & Next
              </Button>
            </>
          )}

          {isFinishEnable && (
            <Button
              variant="contained"
              color="primary"
              onClick={onNext}
              disabled={!onNext}
            >
              {name ? name : 'Exit'}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

RuleBasedModelSetUpFooter.propTypes = {
  activeTab: string,
  helperText: oneOfType([string, shape({})]),
  isDisabled: bool,
  isFinishEnable: bool,
  name: string,
  onExit: func,
  onNext: func,
  onPrev: func,
  prevTab: string,
};

RuleBasedModelSetUpFooter.defaultProps = {
  activeTab: '',
  isDisabled: false,
  nextTab: '',
  onExit: () => {},
  onNext: () => {},
  onPrev: () => {},
  prevTab: '',
  helperText: '',
  isFinishEnable: false,
};

export default RuleBasedModelSetUpFooter;
