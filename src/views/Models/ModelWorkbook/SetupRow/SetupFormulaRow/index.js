import React, { Component } from 'react';
import { arrayOf, shape, func, bool, string } from 'prop-types';

import FormulaBuilder from '../../FormulaBuilder';

class SetupFormulaRow extends Component {
  render() {
    const { formula, onFormulaUpdate, isSubmit, rowId } = this.props;

    return (
      <FormulaBuilder
        isSubmit={isSubmit}
        rowId={rowId}
        formulaGroup={formula}
        setFormulaGroup={onFormulaUpdate}
      />
    );
  }
}

SetupFormulaRow.propTypes = {
  formula: arrayOf(shape({})).isRequired,
  isSubmit: bool.isRequired,
  onFormulaUpdate: func.isRequired,
  rowId: string.isRequired,
};

SetupFormulaRow.defaultProps = {
  formula: [],
  isSubmit: false,
  onFormulaUpdate: () => {},
  rowId: '',
};

export default SetupFormulaRow;
