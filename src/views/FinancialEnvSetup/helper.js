export function fillFinancialEnvData(res) {
  const { actual_data, gl_account } = res;

  let actualTableInputs = {};
  let actualTable = {};
  let hasGLAccount = false;

  if (actual_data) {
    actualTable = { id: actual_data.source_id || '' };

    const inputs = actual_data.scenario_meta || {};

    actualTableInputs = {
      id: actual_data.id || '',
      actualName: inputs.dataset_name || '',
      dateColumn: inputs.date_col_name || '',
      dateFormat: inputs.date_col_format || '',
      fiscalYear: inputs.fiscal_year_beginning || '',
      forecastStartDate: inputs.forecast_start_date || '',

      glAccountID: '1',
      // glAccountID: inputs.gl_account_id_col_name ? '1' : '0',
      glAccountIDColumn: inputs.gl_account_id_col_name || '',

      glAccountName: inputs.gl_acc_nm_col_name ? '1' : '0',
      glAccountNameColumn: inputs.gl_acc_nm_col_name || '',

      amountColumn: inputs.amt_col_name || '',
    };
  }

  if (gl_account && gl_account.account_table && gl_account.id) {
    hasGLAccount = true;
  }

  return { actualTableInputs, actualTable, hasGLAccount };
}
