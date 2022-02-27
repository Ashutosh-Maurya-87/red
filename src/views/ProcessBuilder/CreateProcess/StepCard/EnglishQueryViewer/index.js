import React, { useState } from 'react';
import { shape } from 'prop-types';

import { Box, Link, Collapse } from '@material-ui/core';
import {
  ArrowDropUp as ArrowDropUpIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from '@material-ui/icons';

import CreateTableEnglishQuery from './CreateTable';
import DeleteTableEnglishQuery from './DeleteTable';
import LookupTableEnglishQuery from './LookupTable';
import FormulaBuilderEnglishQuery from './FormulaBuilder';
import TranslateTableEnglishQuery from './TranslateTable';
import CopyPasteEnglishQuery from './CopyPaste';

import { MENUS_ACTIONS } from '../../configs';

import './styles.scss';

function EnglishQueryViewer({ step }) {
  const [isCollapse, setCollapse] = useState(true);

  const toggleCollapse = () => {
    setCollapse(!isCollapse);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="flex-end">
        <Link className="cursor-pointer" onClick={toggleCollapse}>
          <Box display="flex" alignItems="center">
            Query
            {isCollapse ? <ArrowDropDownIcon /> : <ArrowDropUpIcon />}
          </Box>
        </Link>
      </Box>

      <Collapse in={!isCollapse}>
        <Box
          bgcolor="secondary.processTable"
          borderRadius={4}
          height="100%"
          mt={1}
          color="primary.main"
          className="query-viewer"
          p={2}
        >
          <Box>{getQuery(step)}</Box>
        </Box>
      </Collapse>
    </Box>
  );
}

function getQuery(step) {
  switch (step.label) {
    case MENUS_ACTIONS.createTable:
      return <CreateTableEnglishQuery step={step} />;

    case MENUS_ACTIONS.deleteClear:
      return <DeleteTableEnglishQuery step={step} />;

    case MENUS_ACTIONS.lookup:
    case MENUS_ACTIONS.multiLookup:
      return <LookupTableEnglishQuery step={step} />;

    case MENUS_ACTIONS.singleFormulaBuider:
      return <FormulaBuilderEnglishQuery step={step} />;

    case MENUS_ACTIONS.multiFormulaBuider:
      return <FormulaBuilderEnglishQuery step={step} isMulti />;

    case MENUS_ACTIONS.translate:
      return <TranslateTableEnglishQuery step={step} />;

    case MENUS_ACTIONS.copyPaste:
      return <CopyPasteEnglishQuery step={step} />;

    default:
      return null;
  }
}

EnglishQueryViewer.propTypes = {
  step: shape({}).isRequired,
};

export default EnglishQueryViewer;
