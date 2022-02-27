export const styles = theme => ({
  btnStyle: {
    float: 'right',
    color: theme.palette.primary.main,
    border: `2px solid ${theme.palette.primary.main}`,
    padding: 0,
    minWidth: '40px',
    marginTop: '20px',
  },

  ListStyle: {
    background: theme.palette.secondary.stepColor,
    width: '280px',
    position: 'absolute',
    zIndex: '1',
    right: '40px',
    padding: '20px',
    top: '112px',
    // borderRadius: '10px',
    height: '450px',
    overflowY: 'scroll',
    '&::-webkit-scrollbar': {
      width: '0.4em',
    },
    '&::-webkit-scrollbar-track': {
      '-webkit-box-shadow': 'inset 0 0 6px rgba(0,0,0,0.00)',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.palette.secondary.stepColor,
      outline: '1px solid slategrey',
    },
  },
  BoxStyle: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  DefaultClass: {
    filter: theme.palette.secondary.defaultFilterColor,
  },
  ActiveClass: {
    filter: theme.palette.secondary.filterColor,
  },
});
