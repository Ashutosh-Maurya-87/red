export const CURRENCY_STEPS = {
  selectLocation: 'selectLocation',
};

export const CURRENCY_LOCATION_TYPES = {
  singleCurrency: 'singleCurrency',
  columninActual: 'columninActual',
  subsidiary: 'subsidiary',
};

export const CURRENCY_LOCATIONS = [
  {
    value: CURRENCY_LOCATION_TYPES.singleCurrency,
    label: 'My data is all in a single currency',
    info: 'All transactions in my Actuals data are in a common currency.',
  },
  {
    value: CURRENCY_LOCATION_TYPES.columninActual,
    label: 'There ia a columns in my Actual Data with the Currency Code',
    info:
      'Transactions in my Actuas data are in different currencies and currency is stored in a column in Actual data.',
  },
  {
    value: CURRENCY_LOCATION_TYPES.subsidiary,
    label: 'Currencies are related to the subsidiary',
    info:
      'Transactions in my Actuas data are in different currencies and currency is stored in a separate dimension in subsidiary.',
  },
];
