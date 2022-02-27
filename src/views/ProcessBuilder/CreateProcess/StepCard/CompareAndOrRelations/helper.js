export const getValidFilledCompareToDataForEdit = ({
  step,
  tableData,
  forLookup,
  forFormula,
}) => {
  const { colsToCompare, lookupTables = [], relatedTables = [] } = step;
  let tables = [];

  if (forLookup) tables = lookupTables;
  if (forFormula) tables = relatedTables;

  const getValidData = compareCol => {
    if (compareCol.data && Array.isArray(compareCol.data)) {
      const data = compareCol.data.map(getValidData);

      return { data, relation: compareCol.relation };
    }

    const { compareField = {} } = compareCol;

    if (compareCol.tableName == tableData.name) {
      compareCol.tableDisplayName = tableData.display_name;
    }

    if (compareField.tableName == tableData.name) {
      compareField.tableDisplayName = tableData.display_name;
    }

    tables.forEach(lt => {
      if (compareCol.tableName == lt.name) {
        compareCol.tableDisplayName = lt.display_name;
      }

      if (compareField.tableName == lt.name) {
        compareField.tableDisplayName = lt.display_name;
      }
    });

    compareCol.compareField = compareField;

    return compareCol;
  };

  colsToCompare.data = colsToCompare.data.map(getValidData);

  return step.colsToCompare;
};
