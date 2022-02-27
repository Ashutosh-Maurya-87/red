export const styles = theme => ({
  root: {
    width: '93%',
    marginLeft: theme.spacing(3),
    marginTop: theme.spacing(2),
  },
  container: {
    overflowY: 'hidden',
  },
  flexContainer: {
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
  },
  headerCell: {
    border: 'none',
  },
  table: {
    // temporary right-to-left patch, waiting for
    // https://github.com/bvaughn/react-virtualized/issues/454
    '& .ReactVirtualized__Table__headerRow': {
      flip: false,
      paddingRight: theme.direction === 'rtl' ? '0 !important' : undefined,
    },
  },
  tableRow: {
    cursor: 'pointer',
  },
  tableRowHover: {
    '&:hover': {
      backgroundColor: theme.palette.secondary.dark,
    },
  },
  tableRowChecked: {
    backgroundColor: theme.palette.primary.light,
  },
  tableCell: {
    flex: 1,
    border: 'none',
    paddingLeft: '10px',
  },
  noClick: {
    cursor: 'initial',
  },
});
