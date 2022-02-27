export const styles = theme => {
  return {
    container: {
      padding: '0 15px',
    },
    fieldsList: {
      paddingRight: '10px',
      paddingLeft: '10px',
      borderRadius: '6px',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: theme.palette.secondary.textHoverBg,
      },
    },
  };
};
