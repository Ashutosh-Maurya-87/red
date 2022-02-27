import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { arrayOf, shape, func, bool } from 'prop-types';
import moment from 'moment';

import {
  Card,
  Grid,
  CardActions,
  Typography,
  Box,
  withStyles,
  Tooltip,
  IconButton,
  InputAdornment,
} from '@material-ui/core';
import {
  AddCircleOutlineRounded as AddCircleOutlineRoundedIcon,
  Event as CalendarIcon,
} from '@material-ui/icons';
import { MuiPickersUtilsProvider, DatePicker } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';

import { AI_MODULES_DISPLAY_NAME } from '../../../../configs/app';
import { API_URLS } from '../../../../configs/api';
import { DIMENSIONS_MSG } from '../../../../configs/messages';
import { APP_ROUTES } from '../../../../configs/routes';
import { httpPost } from '../../../../utils/http';
import { showSuccessMsg } from '../../../../utils/notifications';
import { TYPES } from '../../EditDimension/configs';

import ImgRenderer from '../../../../components/ImgRenderer';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import DimensionListActions, { DIMENSION_ACTIONS } from '../Actions';

import { styles } from './styles';
import './styles.scss';
import GridViewLoader from '../../../../components/ContentLoaders/GridViewLoader';

function DimensionGridView({
  list,
  classes,
  history,
  updateList,
  isSystem,
  onAddNew,
  onActionCompleted,
  showExternalLoader,
}) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [fiscalYear, setFiscalYear] = useState('');
  const [fiscalMonth, setFiscalMonth] = useState('');
  const [isSubmit, setIsSubmit] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  /**
   * To Open Table
   *
   * @param {String|String|Object} res
   */
  const goToViewDimension = (id, alias, dimension_meta, tab) => () => {
    const type = isSystem ? alias : TYPES[0];

    if (type === TYPES[2] && !dimension_meta) {
      setConfirmAction(TYPES[2]);
      return;
    }

    const route = APP_ROUTES.EDIT_DIMENSION.replace(':id', id);
    history.push({
      pathname: route,
      search: `?tab=${tab ? tab : 0}&type=${type}`,
    });
  };

  /**
   * Handling Select Year & Month
   *
   * @param {String}
   */
  const handleOnChangeYear = year => {
    setFiscalYear(year?.format('MMM YYYY'));
  };

  /**
   * Handling Select Month
   *
   *@param {String}
   */
  const handleOnChangeMonth = month => {
    setFiscalMonth(month?.format('MMM YYYY'));
  };

  /**
   * Saving Fiscal Year and Month
   *
   */
  const timeDimensionSubmit = async () => {
    try {
      setIsSubmit(true);
      // Validating to check Fiscal year and Fiscal month
      if (!fiscalYear || !fiscalMonth) return;

      setShowLoader(true);
      const formData = {
        fiscal_year: moment(fiscalYear, 'MMM YYYY')?.format('MM-YYYY'),
        current_month: moment(fiscalMonth, 'MMM YYYY')?.format('MM-YYYY'),
      };

      const url = API_URLS.TIME_DIMENSION_SAVE;
      const {
        data: { id = '', alias = '', dimension_meta = {} },
        message = '',
      } = await httpPost(url, formData);

      showSuccessMsg(message);
      goToViewDimension(id, alias, dimension_meta)();

      setShowLoader(false);
      setConfirmAction(null);
      setFiscalMonth('');
      setFiscalYear('');
    } catch (error) {
      setShowLoader(false);
    }
  };

  /**
   * Closing Fiscal year/Month Modal box
   *
   * @param {Boolean} res
   */
  const handleCloseConfModal = async action => {
    if (action) {
      timeDimensionSubmit();
      return;
    }

    setConfirmAction(null);
    setFiscalMonth('');
    setFiscalYear('');
  };

  /**
   *   When user click on icon redirect Relationship Tab
   * @param {String|String|String}
   */
  const goToRelationshipTab = (id, alias, tab = '2') => {
    const type = isSystem ? alias : TYPES[0];

    const route = APP_ROUTES.EDIT_DIMENSION.replace(':id', id);
    history.push({
      pathname: route,
      search: `?tab=${tab}&type=${type}`,
    });
  };

  return (
    <>
      {confirmAction && (
        <ConfirmationModal
          maxWidth="sm"
          handleClose={handleCloseConfModal}
          isOpen
          action={confirmAction}
          showLoader={showLoader}
          title={`Time ${AI_MODULES_DISPLAY_NAME.dimension}`}
          yesText="Save"
          noText="Cancel"
          msg=""
        >
          <Box
            px={2}
            py={1}
            my={-4}
            display="flex"
            flexDirection="column"
            border={1}
            borderColor="secondary.stepBorderColor"
            borderRadius={5}
          >
            <Box mt={2}>
              <Box display="flex">
                <Typography variant="body1">
                  When did your fiscal year {moment().format('YYYY')} begin?
                </Typography>
              </Box>
              <Box display="flex">
                <MuiPickersUtilsProvider utils={MomentUtils}>
                  <DatePicker
                    autoOk
                    name="fiscalYear"
                    id="fiscal-year"
                    size="small"
                    style={{ width: '100%' }}
                    value={(fiscalYear && moment(fiscalYear)) || null}
                    onChange={handleOnChangeYear}
                    minDate={new Date(`2020-01-01`)}
                    maxDate={new Date(`2021-12-31`)}
                    error={isSubmit && !fiscalYear}
                    helperText={
                      isSubmit && !fiscalYear
                        ? DIMENSIONS_MSG.select_year
                        : null
                    }
                    views={['year', 'month']}
                    variant="dialog"
                    inputVariant="standard"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" edge="end">
                            <CalendarIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </MuiPickersUtilsProvider>
              </Box>
            </Box>

            <Box mt={4} mb={2}>
              <Box display="flex">
                <Typography variant="body1">
                  Select your Current Month?
                </Typography>
              </Box>
              <Box display="flex">
                <MuiPickersUtilsProvider utils={MomentUtils}>
                  <DatePicker
                    autoOk
                    name="fiscalMonth"
                    id="fiscal-id"
                    size="small"
                    style={{ width: '100%' }}
                    value={(fiscalMonth && moment(fiscalMonth)) || null}
                    onChange={handleOnChangeMonth}
                    minDate={new Date(`2021-01-01`)}
                    maxDate={new Date(`2021-12-31`)}
                    error={isSubmit && !fiscalMonth}
                    helperText={
                      isSubmit && !fiscalMonth
                        ? DIMENSIONS_MSG.select_month
                        : null
                    }
                    views={['year', 'month']}
                    variant="dialog"
                    inputVariant="standard"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" edge="end">
                            <CalendarIcon fontSize="Clickall" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </MuiPickersUtilsProvider>
              </Box>
            </Box>
          </Box>
        </ConfirmationModal>
      )}

      <Grid
        container
        direction="row"
        justify="flex-start"
        alignItems="flex-start"
        className="thumb-view"
      >
        {!isSystem && (
          <Box className="add-dimension-thumb" onClick={onAddNew}>
            <Box textAlign="center">
              <AddCircleOutlineRoundedIcon fontSize="large" />

              <Typography align="center" variant="body2" color="textSecondary">
                {`Add New ${AI_MODULES_DISPLAY_NAME.dimension}`}
              </Typography>
            </Box>
          </Box>
        )}

        {list.map((dimension, index) => {
          const {
            id,
            display_name,
            created_at,
            alias,
            dimension_meta,
            relation,
          } = dimension;

          return (
            <Card className="card-view" key={index}>
              <Grid
                className={`center-icon dimension-center-icon ${classes.sourceGrid}`}
                container
                direction="row"
                justify="center"
                alignItems="center"
                onDoubleClick={goToViewDimension(id, alias, dimension_meta)}
              >
                <ImgRenderer src="dimension.svg" className={classes.thumb} />

                {/* Code to show table is connected */}
                {relation && !isSystem && (
                  <Tooltip
                    title="Lookup table is connected to your scenario"
                    placement="top"
                    arrow
                    interactive
                  >
                    <span className="merge-sheet-icon linked">
                      <ImgRenderer src="link.svg" />
                    </span>
                  </Tooltip>
                )}

                {/* Code to show table is NOT connected */}
                {!relation && !isSystem && (
                  <Tooltip
                    title={
                      <>
                        Lookup table is NOT connected to your scenario. <br />
                      </>
                    }
                    placement="top"
                    arrow
                    interactive
                  >
                    <span
                      className="merge-sheet-icon unlinked"
                      onClick={() => goToRelationshipTab(id, alias)}
                    >
                      <ImgRenderer src="unlink.svg" />
                    </span>
                  </Tooltip>
                )}
              </Grid>
              <Box>
                <CardActions className="source-card">
                  <Grid
                    container
                    direction="row"
                    wrap="nowrap"
                    justify="space-between"
                    alignItems="center"
                  >
                    <DimensionListActions
                      dimension={dimension}
                      onActionCompleted={onActionCompleted}
                      list={list}
                      setList={updateList}
                      isSystem={isSystem}
                      type={!isSystem ? TYPES[0] : alias}
                      goToViewDimension={goToViewDimension}
                    >
                      {handleAction => (
                        <Box>
                          <Grid container direction="column">
                            <Tooltip
                              title={display_name || ''}
                              placement="top"
                              arrow
                              interactive
                            >
                              <Typography
                                display="block"
                                variant="subtitle1"
                                noWrap
                                className="source-table-title"
                                onDoubleClick={handleAction(
                                  isSystem
                                    ? DIMENSION_ACTIONS.view
                                    : DIMENSION_ACTIONS.rename
                                )}
                              >
                                {display_name || '--'}
                              </Typography>
                            </Tooltip>

                            <Typography
                              display="block"
                              variant="caption"
                              color="textSecondary"
                            >
                              {created_at &&
                                moment.utc(created_at).local().calendar()}
                            </Typography>
                          </Grid>
                        </Box>
                      )}
                    </DimensionListActions>
                  </Grid>
                </CardActions>
              </Box>
            </Card>
          );
        })}

        {list.length > 0 && showExternalLoader && !isSystem && (
          <Card className="card-view">
            <Grid
              className={`center-icon ${classes.sourceGrid}`}
              container
              direction="row"
              justify="center"
              alignItems="center"
            >
              {' '}
              <GridViewLoader />
            </Grid>
          </Card>
        )}
      </Grid>
    </>
  );
}

DimensionGridView.propTypes = {
  isSystem: bool,
  list: arrayOf(shape({})),
  onActionCompleted: func.isRequired,
  onAddNew: func,
  showExternalLoader: bool,
  updateList: func.isRequired,
};

DimensionGridView.defaultProps = {
  isSystem: false,
  onActionCompleted: () => {},
  onAddNew: () => {},
};

export default withRouter(withStyles(styles)(DimensionGridView));
