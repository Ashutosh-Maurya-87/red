export const styles = theme => ({
  drawer: {},
  drawerPaper: {
    padding: '20px',
    width: '768px',
    [theme.breakpoints.up('md')]: {
      width: '75%',
    },
    backgroundColor: `${theme.drawerBackground}`,
  },
  drawerCloseIcon: {
    position: 'absolute',
    left: 5,
    top: 5,
    cursor: 'pointer',
  },
  bigIndicator: {
    backgroundColor: 'transparent',
  },
  tab: {
    minWidth: '280px',
    minHeight: '60px',
    marginRight: '7px',
    borderTopLeftRadius: '5px',
    borderTopRightRadius: '5px',
    textTransform: 'capitalize',
    backgroundColor: `${theme.palette.secondary.modelTab}`,
    fontSize: '16',
    fontWeight: 'normal',
  },
  tabWrapper: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
  },
  tabWrapperLeftAlign: {
    justifyContent: 'flex-end',
  },
  switcher: {
    marginLeft: '60px',
  },
  flexDirectionRow: {
    flexDirection: 'row',
  },
});
