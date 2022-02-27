import React from 'react';
import { shape, string, arrayOf } from 'prop-types';
import moment from 'moment';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { Typography, Grid, Box, Tooltip } from '@material-ui/core';
import {
  RULE_INFO_MODES,
  ADD_CALCULATION_START_FORECAST,
  DATA_SOURCES,
  ADD_CALCULATION_SCHEDULE,
  ADD_CALCULATION_END_FORECAST,
  RULES_TYPES,
  ADD_CALCULATION_CAP,
} from '../../../configs';

import { getFormattedNumberWithNegative } from '../../../../../utils/helper/getFormattedNumber';

import {
  DEFAULT_DECIMAL_PLACE,
  FISCAL_YEAR_DATE_FORMAT,
} from '../../../../../configs/app';

import {
  getSelectedCalculationRules,
  getSingleRBM,
} from '../../../../../reducers/RuleBasedModels/selectors';

const RuleInfo = ({
  rule = {},
  mode = '',
  singleRBM = {},
  selectedCalculationRules = [],
}) => {
  /**
   * Filter rule as per percentage
   * @param {Array} percent_of
   * @returns
   */
  const getPercentageLabels = (percent_of = []) => {
    const { configuration = {} } = singleRBM || {};
    const { rules = [] } = configuration || {};

    const percentRules = rules.filter(({ rule_uid = '' }) =>
      percent_of.includes(rule_uid)
    );

    return percentRules.map(rule => {
      const { rule_uid = '' } = rule || {};
      const ruleIndex = selectedCalculationRules.findIndex(
        ({ rule_uid: scRuleUid = '' }) => scRuleUid == rule_uid
      );

      rule.isDisable = true;

      if (ruleIndex > -1) {
        rule.isDisable = false;
      }

      return rule;
    });
  };

  const {
    gl_id = '',
    gl_id_lookup = '',
    terms_in_month = '',
    calc_method = '',
    cap_term = null,
    end_forecast = '',
    end_forecast_delay = '',
    schedule = '',
    start_forecast = '',
    start_forecast_delay = '',
    fixed_value = '',
    percent_of = [],
    cap = '',
  } = rule || {};

  // Cap amount yearly value
  const capAmountYearly =
    cap_term &&
    ADD_CALCULATION_CAP.YEARLY.value == ADD_CALCULATION_CAP[cap_term].value
      ? `Capped $${
          getFormattedNumberWithNegative({
            value: Number(cap),
            decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
          }) || ''
        } by Fiscal Year.`
      : ADD_CALCULATION_CAP.null.label;
  // Cap amount monthly value
  const capAmountMonthly =
    cap_term &&
    ADD_CALCULATION_CAP.MONTHLY.value == ADD_CALCULATION_CAP[cap_term].value
      ? `Capped $${
          getFormattedNumberWithNegative({
            value: Number(cap),
            decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
          }) || ''
        } by Monthly.`
      : ADD_CALCULATION_CAP.null.label;

  // months to display
  const startMonth = start_forecast_delay == 1 ? 'Month' : 'Months';
  const endMonth = end_forecast_delay == 1 ? 'Month' : 'Months';

  // constants to shorten condition
  const startForecastConst = ADD_CALCULATION_START_FORECAST[start_forecast];
  const endForecastConst = ADD_CALCULATION_END_FORECAST[end_forecast];

  // Start forecast delay value constants
  const startForecastValue =
    start_forecast &&
    startForecastConst.value == ADD_CALCULATION_START_FORECAST.DELAY.value
      ? `Delay by ${start_forecast_delay} ${startMonth}`
      : startForecastConst.label;

  // End forecast value
  let endForecastValue = '';

  switch (end_forecast) {
    case ADD_CALCULATION_END_FORECAST.DELAY.value:
      endForecastValue = `Delay by ${end_forecast_delay} ${endMonth}`;
      break;

    case ADD_CALCULATION_END_FORECAST.BEFORE.value:
      endForecastValue = `${end_forecast_delay} ${endMonth} Before Ending Month`;
      break;

    case ADD_CALCULATION_END_FORECAST.MONTHS_AFTER_START_MONTH.value:
      endForecastValue = `${end_forecast_delay} ${endMonth} After Starting Month`;
      break;

    case ADD_CALCULATION_END_FORECAST.SPECIFIC_DATE.value:
      endForecastValue = `Ending by "${moment(end_forecast_delay).format(
        FISCAL_YEAR_DATE_FORMAT
      )}" `;
      break;

    default:
      endForecastValue = endForecastConst.label;
      break;
  }

  const color = mode == RULE_INFO_MODES.primary ? 'primary' : 'textSecondary';
  const isTypePercentage = RULES_TYPES.PERCENT.value == calc_method;
  const isTypeInput = RULES_TYPES.DIRECT_INPUT.value == calc_method;
  const isTypeCount = RULES_TYPES.COUNT.value == calc_method;

  // Display % rules
  const percentRules = getPercentageLabels(percent_of);

  // Specify value with % and $
  const specifyValue =
    fixed_value && calc_method == RULES_TYPES.PERCENT.value
      ? DATA_SOURCES.fixedValue.label.replace('Specify ', '').replace(
          'Here',
          `(${
            getFormattedNumberWithNegative({
              value: Number(fixed_value),
              decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
            }) || ''
          }%)`
        )
      : DATA_SOURCES.fixedValue.label.replace('Specify ', '').replace(
          'Here',
          `($${
            getFormattedNumberWithNegative({
              value: Number(fixed_value),
              decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
            }) || ''
          })`
        );

  return (
    <Grid container>
      <Grid item md={6} xs={12}>
        {mode == RULE_INFO_MODES.primary && (
          <>
            <Grid container>
              <Grid item md={3} xs={12}>
                <Typography variant="caption" color={color}>
                  Type
                </Typography>
              </Grid>
              <Grid item md={9} xs={12}>
                <Typography variant="body2" gutterBottom>
                  {(calc_method && RULES_TYPES[calc_method].label) || '--'}
                </Typography>
              </Grid>
            </Grid>
          </>
        )}
        {isTypeCount && (
          <Grid container className="calculation-field-value">
            <Grid item md={3} xs={12}>
              <Typography variant="caption" color={color}>
                Quantity
              </Typography>
            </Grid>
            <Grid item md={9} xs={12}>
              <Typography variant="body2" gutterBottom>
                {getFormattedNumberWithNegative({
                  value: Number(fixed_value),
                  decimalPlaceValue: DEFAULT_DECIMAL_PLACE,
                }) || '--'}
              </Typography>
            </Grid>
          </Grid>
        )}
        {isTypePercentage && (
          <Grid container className="calculation-field-value">
            <Grid item md={3} xs={12}>
              <Typography variant="caption" color={color}>
                Percentage Of
              </Typography>
            </Grid>
            <Grid item md={9} xs={12}>
              <Box display="flex">
                <Typography variant="body2" gutterBottom>
                  <span>(</span>
                  {percentRules.map(
                    ({ forecast_label = '', isDisable = false }, index) =>
                      isDisable ? (
                        <Tooltip
                          key={index}
                          placement="top"
                          title={`${forecast_label} is not applicable.`}
                        >
                          <span className="disabled">
                            {forecast_label}
                            {percentRules.length - 1 != index ? ' +' : ')'}
                            &nbsp;
                          </span>
                        </Tooltip>
                      ) : (
                        <span key={index}>
                          {`${forecast_label}`}
                          {percentRules.length - 1 != index ? ' +' : ')'}
                          &nbsp;
                        </span>
                      )
                  )}
                  {percentRules.length == 0 && '--'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}

        {(isTypePercentage || isTypeInput) && (
          <>
            <Grid container className="calculation-field-value">
              <Grid item md={3} xs={12}>
                <Typography variant="caption" color={color}>
                  Data Source
                </Typography>
              </Grid>
              <Grid item md={9} xs={12}>
                <Typography variant="body2" gutterBottom>
                  {fixed_value ? specifyValue : DATA_SOURCES.columnInData.label}
                </Typography>
              </Grid>
            </Grid>

            <Grid container className="calculation-field-value">
              <Grid item md={3} xs={12}>
                <Typography variant="caption" color={color}>
                  Term
                </Typography>
              </Grid>
              <Grid item md={9} xs={12}>
                <Typography variant="body2" gutterBottom>
                  {`${terms_in_month} Months` || '--'}
                </Typography>
              </Grid>
            </Grid>
            <Grid container className="calculation-field-value">
              <Grid item md={3} xs={12}>
                <Typography variant="caption" color={color}>
                  Schedule
                </Typography>
              </Grid>
              <Grid item md={9} xs={12}>
                <Typography variant="body2" gutterBottom>
                  {(schedule && ADD_CALCULATION_SCHEDULE[schedule].label) ||
                    '--'}
                </Typography>
              </Grid>
            </Grid>
          </>
        )}
      </Grid>

      <Grid item md={6} xs={12}>
        {mode == RULE_INFO_MODES.primary && (
          <>
            {(gl_id_lookup || gl_id) && (
              <Grid item md={6} xs={12}>
                <Grid container>
                  <Grid item md={3} xs={12}>
                    <Typography variant="caption" color={color}>
                      GL
                    </Typography>
                  </Grid>
                  <Grid item md={9} xs={12}>
                    <Box display="inline-flex">
                      <Typography variant="body2" gutterBottom>
                        {gl_id_lookup || gl_id || '--'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            )}
          </>
        )}
        {isTypePercentage && (
          <Grid container className="calculation-field-value">
            <Grid item md={3} xs={12}>
              <Typography variant="caption" color={color}>
                Cap
              </Typography>
            </Grid>
            <Grid item md={9} xs={12}>
              <Typography variant="body2" gutterBottom>
                {ADD_CALCULATION_CAP.YEARLY.value ==
                ADD_CALCULATION_CAP[cap_term].value
                  ? capAmountYearly
                  : capAmountMonthly}
              </Typography>
            </Grid>
          </Grid>
        )}
        <Grid container className="calculation-field-value">
          <Grid item md={3} xs={12}>
            <Typography variant="caption" color={color}>
              Start Forecast
            </Typography>
          </Grid>
          <Grid item md={9} xs={12}>
            <Typography variant="body2" gutterBottom>
              {startForecastValue || '--'}
            </Typography>
          </Grid>
        </Grid>
        <Grid container className="calculation-field-value">
          <Grid item md={3} xs={12}>
            <Typography variant="caption" color={color}>
              End Forecast
            </Typography>
          </Grid>
          <Grid item md={9} xs={12}>
            <Typography variant="body2" gutterBottom>
              {endForecastValue || '--'}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

RuleInfo.propTypes = {
  mode: string,
  rule: shape({}),
  selectedCalculationRules: arrayOf(shape({})),
  singleRBM: shape({}),
};

/**
 * defaultProps of component
 */
RuleInfo.defaultProps = {
  mode: '',
  rule: {},
  singleRBM: {},
  selectedCalculationRules: [],
};

const mapStateToProps = createStructuredSelector({
  singleRBM: getSingleRBM(),
  selectedCalculationRules: getSelectedCalculationRules(),
});

export default connect(mapStateToProps, {})(RuleInfo);
