export const styles = theme => ({
  drawer: {},
  drawerPaper: {
    padding: '20px',
    width: '750px',
    [theme.breakpoints.down('sm')]: {
      width: '75%',
    },
    backgroundColor: `${theme.drawerBackground}`,
    display: 'flex',
    justifyContent: 'space-between',
  },
  drawerCloseIcon: {
    position: 'absolute',
    left: 5,
    top: 5,
    cursor: 'pointer',
  },
});
