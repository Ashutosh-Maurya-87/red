const bgColor = theme => {
  switch (theme.palette.type) {
    case 'dark':
      return theme.drawerBackground;

    default:
      return 'default';
  }
};

export const styles = theme => ({
  drawerPaper: {
    padding: '16px',
    width: '95%',
    backgroundColor: `${bgColor(theme)} !important`,
  },
  drawerCloseIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    cursor: 'pointer',
    zIndex: '1',
  },
});
