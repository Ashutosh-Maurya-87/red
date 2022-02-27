import React from 'react';
import { func, string, oneOfType, shape } from 'prop-types';

import { Box, Typography, Button } from '@material-ui/core';
import { Info as InfoIcon } from '@material-ui/icons';

const FinancialEnvSetupFooter = ({
  activeTab,
  prevTab,
  onPrev,
  onNext,
  helperText,
}) => {
  return (
    <Box pt={3} display="flex" justifyContent="space-between">
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

          <Button
            variant="contained"
            color="primary"
            onClick={onNext}
            disabled={!onNext}
          >
            Next
          </Button>
        </Box>
      )}
    </Box>
  );
};

FinancialEnvSetupFooter.propTypes = {
  activeTab: string,
  helperText: oneOfType([string, shape({})]),
  onNext: func,
  onPrev: func,
  prevTab: string,
};

FinancialEnvSetupFooter.defaultProps = {
  activeTab: '',
  nextTab: '',
  onPrev: () => {},
  prevTab: '',
  helperText: '',
};

export default FinancialEnvSetupFooter;
