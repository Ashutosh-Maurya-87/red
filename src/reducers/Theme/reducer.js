import { fromJS } from 'immutable';
import { SET_THEME, DEFAULT_THEME } from './constants';
import { setLocalStorage } from '../../utils/localStorage';

const getDefaultTheme = () => {
  const x = localStorage.getItem('app_theme') || DEFAULT_THEME;

  if (x) {
    return `${x.replace(/['"]+/g, '')}`;
  }

  return DEFAULT_THEME;
};

const initialState = fromJS({
  theme: getDefaultTheme(),
});

/**
 * Define the reducer with actions
 *
 * @param {Object} state
 * @param {Object} action
 */
function ThemeReducer(state = initialState, action) {
  switch (action.type) {
    case SET_THEME:
      setLocalStorage('app_theme', action.data);
      return state.set('theme', action.data);

    default:
      return state;
  }
}

export default ThemeReducer;
