import React from 'react';
import { string, arrayOf, func, bool } from 'prop-types';

import {
  Button,
  ButtonGroup,
  ClickAwayListener,
  Grow,
  Paper,
  Popper,
  MenuItem,
  MenuList,
  Typography,
  Box,
} from '@material-ui/core';
import { ArrowDropDown as ArrowDropDownIcon } from '@material-ui/icons';

import './styles.scss';

function SplitButton({
  buttonLabel,
  onOptionClick,
  onButtonClick,
  options,
  className,
  disabled,
  isSplitEnabled,
  isMainButtonDisabled,
  name,
  additionOption,
  buttonColor,
}) {
  const btnRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);

  /**
   * Handle Click on Button Label
   */
  const handleBtnClick = () => {
    setOpen(false);
    onButtonClick(buttonLabel);
  };

  /**
   * Handle Click on Option in Menu
   */
  const handleMenuItemClick = option => evt => {
    setOpen(false);
    onOptionClick(option);
  };

  /**
   * Toggle Menu Options
   */
  const handleToggle = () => {
    setOpen(!open);
  };

  /**
   * Close Menu
   */
  const handleClose = evt => {
    if (btnRef.current && btnRef.current.contains(evt.target)) {
      return;
    }

    setOpen(false);
  };

  return (
    <>
      <ButtonGroup
        disabled={disabled}
        className={className}
        variant="contained"
        color={buttonColor}
        ref={btnRef}
        aria-label="split button"
      >
        <Button onClick={handleBtnClick} disabled={isMainButtonDisabled}>
          {buttonLabel}
        </Button>
        {options.length > 0 && isSplitEnabled && (
          <Button
            color={buttonColor}
            size="small"
            aria-controls={open ? 'split-button-menu' : undefined}
            aria-expanded={open ? 'true' : undefined}
            aria-haspopup="menu"
            onClick={handleToggle}
          >
            <ArrowDropDownIcon />
          </Button>
        )}
      </ButtonGroup>

      <Popper
        open={open}
        anchorEl={btnRef.current}
        className="btn-group-popper"
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu">
                  {options.map(option => (
                    <MenuItem
                      key={option}
                      onClick={handleMenuItemClick(option)}
                    >
                      <Box
                        display="flex"
                        flexDirection="column"
                        maxWidth="155px"
                      >
                        {option}
                        {/* To show any name/additionalOption related to option */}
                        {additionOption == option && name && (
                          <Typography
                            variant="caption"
                            noWrap
                            style={{ opacity: '0.6' }}
                          >
                            {name || ''}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}

SplitButton.propTypes = {
  additionOption: string,
  buttonColor: string,
  buttonLabel: string.isRequired,
  className: string,
  disabled: bool,
  isMainButtonDisabled: bool,
  isSplitEnabled: bool,
  name: string,
  onButtonClick: func.isRequired,
  onOptionClick: func.isRequired,
  options: arrayOf(string),
};

SplitButton.defaultProps = {
  className: '',
  disabled: false,
  isSplitEnabled: true,
  options: [],
  isMainButtonDisabled: false,
  name: '',
  additionOption: '',
  buttonColor: 'primary',
};

export default SplitButton;
