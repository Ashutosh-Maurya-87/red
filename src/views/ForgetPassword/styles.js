export const styles = theme => ({
  paper: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  form: {
    padding: theme.spacing(5),
    backgroundColor: '#ebebeb',
    borderTopRightRadius: '10px',
    borderBottomRightRadius: '10px',
  },
  submit: {
    margin: theme.spacing(1, 0, 2),
  },
  buttonProgress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
});
