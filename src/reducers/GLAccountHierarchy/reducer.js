import { fromJS } from 'immutable';
import {
  CLEAR_DATA,
  SET_GL_ACCOUNT_LISTING,
  SET_GL_HIERARCHY_LISTING,
  SET_SELECTED_FOLDER,
  ADD_GL_ACCOUNT,
  SET_HEADERS,
} from './constants';

const initialState = fromJS({
  hierarchyList: [],
  GLAccountListing: [],
  hierarchyHeaders: [],
  selectedFolder: null,
});

/**
 * Define the reducer with actions
 *
 * @param {Object} state
 * @param {Object} action
 */
function GLAccountHierarchyReducer(state = initialState, action) {
  switch (action.type) {
    case SET_GL_ACCOUNT_LISTING:
      return state.set('GLAccountListing', fromJS(action.data));

    case SET_GL_HIERARCHY_LISTING:
      return state.set('hierarchyList', fromJS(action.data));

    case SET_HEADERS:
      return state.set('hierarchyHeaders', fromJS(action.data));

    case SET_SELECTED_FOLDER:
      return state.set('selectedFolder', fromJS(action.id));

    case ADD_GL_ACCOUNT:
      const tempGLAccount = [...state.get('GLAccountListing').toJS()];
      const tempHierarchy = [...state.get('hierarchyList').toJS()];
      const selectedFolder = state.get('selectedFolder') || '';
      const { affa_parent_folder_id } = action.data;

      if (selectedFolder === affa_parent_folder_id) {
        tempGLAccount.push(action.data);
      }

      if (!affa_parent_folder_id) {
        if (!tempHierarchy[0].children) {
          tempHierarchy[0].children = [...[action.data]];
        } else {
          tempHierarchy[0].children.push(action.data);
        }

        tempGLAccount.push(action.data);

        return fromJS({
          ...state.toJS(),
          GLAccountListing: tempGLAccount,
          hierarchyList: tempHierarchy,
        });
      }

      if (
        affa_parent_folder_id &&
        tempHierarchy[0].affa_record_id === affa_parent_folder_id
      ) {
        if (!tempHierarchy[0].children) {
          tempHierarchy[0].children = [...[action.data]];
        } else {
          tempHierarchy[0].children.push(action.data);
        }

        return fromJS({
          ...state.toJS(),
          GLAccountListing: tempGLAccount,
          hierarchyList: tempHierarchy,
        });
      }

      const updatedArr = addChild(
        affa_parent_folder_id,
        tempHierarchy[0].children,
        action.data
      );

      tempHierarchy[0].children = updatedArr;

      return fromJS({
        ...state.toJS(),
        GLAccountListing: tempGLAccount,
        hierarchyList: tempHierarchy,
      });

    case CLEAR_DATA:
      return state
        .set('GLAccountListing', fromJS([]))
        .set('hierarchyList', fromJS([]))
        .set('selectedFolder', fromJS(null));

    default:
      return state;
  }
}

export const addChild = (id, hierarchy, childToPush) => {
  hierarchy.forEach(item => {
    if (item.children) {
      addChild(id, item.children, childToPush);
    }

    if (item.affa_record_id === id) {
      if (!item.children) {
        item.children = [...[childToPush]];
      } else {
        item.children.push(childToPush);
      }
    }
  });

  return hierarchy;
};

export default GLAccountHierarchyReducer;
