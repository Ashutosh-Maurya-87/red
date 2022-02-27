import React from 'react';
import { func } from 'prop-types';

import { Box, Typography } from '@material-ui/core';
import { SELECT_DATA_SOURCES } from '../configs';

import CreateScenarioFooter from '../Footer';

function SourceSelection({ handleSourceSelection }) {
  return (
    <>
      <Box display="flex" flexDirection="row" px={4} my={4}>
        {SELECT_DATA_SOURCES.map((source, index) => (
          <Box
            key={source.key}
            className="cursor-pointer"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            maxWidth="180px"
            border={1}
            borderRadius="borderRadius"
            borderColor="grey.800"
            px={2}
            pt={3}
            pb={2}
            mb={2}
            ml={index > 0 ? 3 : 0}
            onClick={handleSourceSelection(source.key)}
          >
            <Typography color="textSecondary" variant="body1" align="center">
              {source.icon}
              <Box component="span" display="block">
                {source.label}
              </Box>
            </Typography>
          </Box>
        ))}
      </Box>

      <Box pl={1}>
        <CreateScenarioFooter backText="cancel" />
      </Box>
    </>
  );
}

SourceSelection.propTypes = {
  handleSourceSelection: func.isRequired,
};

export default SourceSelection;
