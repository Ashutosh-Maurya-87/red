import React from 'react';
import { withRouter } from 'react-router-dom';
import { any, shape } from 'prop-types';

import GLAccountHierarchy from '../../../FinancialEnvSetup/SetupGLAccounts/GLAccountHierarchy';

function HierarchyListing({ table = {}, type, tableHeight }) {
  const { id = '' } = table;

  return (
    <GLAccountHierarchy
      isHeaderEnable={false}
      hierarchyType={type == 'gl_account' ? 'GLAccounts' : 'dimensions'}
      dimensionId={id}
      rootName={table.display_name}
      isEnableEditRecord={Boolean(type == 'gl_account' && id)}
      tableHeight={tableHeight}
    />
  );
}

HierarchyListing.propTypes = {
  table: shape({}),
  tableHeight: any,
  type: any,
};

HierarchyListing.defaultProps = {};

export default withRouter(HierarchyListing);
