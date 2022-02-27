import React from 'react';
import {
  FormGroup,
  Button,
  Menu,
  FormControlLabel,
  Checkbox,
  Box,
  Divider,
  Grid,
  Typography,
  Link,
} from '@material-ui/core';
import { FilterList as FilterListIcon } from '@material-ui/icons';
import { func, shape, arrayOf, string } from 'prop-types';

const DEFAULT_WIDTH = '90';

function FilterCell({ column: { width }, data, yearsShown, updateState }) {
  const [allYears, setAllYears] = React.useState([]);
  const [selectedState, setSelectedState] = React.useState([]);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  React.useEffect(() => {
    formYearData(data);

    setSelectedState(yearsShown);
  }, [data, yearsShown]);

  /**
   * Function to Get ALl Years And Setting up in the state
   */
  const formYearData = (data = []) => {
    const allYearsArr = data.map((item = []) => {
      const [firstChildItem = {}] = item;
      const { value = '' } = firstChildItem;

      return String(value);
    });

    setAllYears(allYearsArr);
  };

  /**
   * Function to open a Menu for filters
   */
  const handleClick = ({ currentTarget }) => {
    setAnchorEl(currentTarget);
  };

  /**
   * Function to add or remove year in current state
   */
  const addYearInState = ({ target: { value } }) => {
    const StateModifiedData = (selectedState || []).includes(value)
      ? (selectedState || []).filter(e => e != value)
      : [...selectedState, value];

    setSelectedState(StateModifiedData);
  };

  /**
   * Function to Apply filter globally
   */
  const applyFilters = () => {
    updateState({ yearsShown: selectedState });

    setAnchorEl(null);
  };

  /**
   * Function to select all years
   */
  const selectAllYears = () => {
    setSelectedState(allYears);
  };

  /**
   * Function to unselect  all years
   */
  const cancelAll = () => {
    setSelectedState([]);
  };

  /**
   * Function to close the filters
   */
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      className="cell header-cell text-center"
      style={{
        width,
        minWidth: width,
        maxWidth: width,
      }}
    >
      <Box onClick={handleClick}>
        <FilterListIcon />
      </Box>

      <Menu
        id="demo-positioned-menu"
        aria-labelledby="demo-positioned-button"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box pl={3} pt={1} className="select-option" position="absolute">
          <Link>
            <Typography
              className="cursor-pointer"
              variant="caption"
              onClick={selectAllYears}
            >
              Select All
            </Typography>
          </Link>
          <Typography variant="caption">&nbsp;/&nbsp;</Typography>
          <Link>
            <Typography
              className="cursor-pointer"
              variant="caption"
              onClick={cancelAll}
            >
              Clear All
            </Typography>
          </Link>
        </Box>
        <br />
        <Box mt={2} mb={1}>
          <Divider />
        </Box>
        <FormGroup style={{ paddingLeft: '13px' }}>
          {(allYears || []).map((e, i) => {
            return (
              <FormControlLabel
                key={i}
                pl={3}
                value={e}
                control={
                  <Checkbox
                    value={e}
                    color="primary"
                    onChange={addYearInState}
                    checked={(selectedState || []).includes(e)}
                  />
                }
                label={e}
              />
            );
          })}
        </FormGroup>

        <Box mt={2} mb={1}>
          <Divider />
        </Box>
        <Grid container justify="space-between" alignItems="center">
          <Button onClick={selectAllYears}>Reset</Button>
          <Box>
            <Button color="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button color="primary" onClick={applyFilters}>
              Done
            </Button>
          </Box>
        </Grid>
      </Menu>
    </Box>
  );
}

FilterCell.propTypes = {
  column: shape({}),
  data: arrayOf(arrayOf(shape({}))),
  updateState: func,
  yearsShown: arrayOf(string),
};

FilterCell.defaultProps = {
  column: { value: '', label: '', width: DEFAULT_WIDTH },
  data: [],
  updateState: () => {},
  yearsShown: [],
};

export default FilterCell;
