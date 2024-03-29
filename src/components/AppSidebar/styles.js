const drawerWidth = 240;

export const styles = theme => ({
  root: {
    display: 'flex',
  },
  appBar: {
    marginLeft: theme.spacing(7) + 1,
    width: `calc(100% - ${theme.spacing(7) + 1}px)`,
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(9) + 1,
      width: `calc(100% - ${theme.spacing(9) + 1}px)`,
    },
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: 36,
  },
  hide: {
    display: 'none',
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  paper: {
    backgroundColor: '#202225',
  },
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: theme.spacing(7) + 1,
    borderRight: 'none',
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9) + 1,
    },
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
  },
  Grid: {
    padding: '0 15px',
    height: '64px',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  profileMenu: {
    minWidth: '120px',
  },
  popperMenu: {
    zIndex: '9999',
  },
});
