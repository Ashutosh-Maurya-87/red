import React from 'react';
import { bool } from 'prop-types';

import { Typography, Link } from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';

function HelpGuideInfo({ hideIcon }) {
  return (
    <>
      {!hideIcon && (
        <>
          <InfoIcon fontSize="small" />
          &nbsp;
        </>
      )}

      <Typography variant="caption">
        For more details visit our&nbsp;
        <Link className="cursor-pointer">Help Guide.</Link>
      </Typography>
    </>
  );
}

HelpGuideInfo.propTypes = {
  hideIcon: bool,
};

HelpGuideInfo.defaultProps = {
  hideIcon: false,
};

export default HelpGuideInfo;
