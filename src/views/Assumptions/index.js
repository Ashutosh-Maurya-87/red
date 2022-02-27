import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import {
  func,
  string,
  oneOfType,
  bool,
  number,
  arrayOf,
  shape,
} from 'prop-types';

import { withStyles, Drawer, Box, Typography, Button } from '@material-ui/core';

import Spinner from '../../components/Spinner';
import AssumptionsSideBar from './SideBar';
import AssumptionsSheet from './AssumptionsSheet';

import {
  clearData,
  setAssumption,
  setGridData,
  setGridHeaders,
} from '../../reducers/Assumptions/actions';

import {
  getAssumption,
  getGridData,
  getGridHeaders,
} from '../../reducers/Assumptions/selectors';

import { ASSUMPTIONS_API, MODELS_API } from '../../configs/api';
import { ASSUMPTION_SCOPES_KEYS } from './configs';
import { ASSUMPTIONS_MSG } from '../../configs/messages';

import { httpGet, httpPost } from '../../utils/http';
import { showErrorMsg, showSuccessMsg } from '../../utils/notifications';
import {
  getFormattedParamsToSaveAssumption,
  getFormattedAssumptionToFill,
} from './helper';
import { getFormattedModelsList } from '../Models/ModelsList/helper';

import { styles } from './styles';

const PAGINATION = {
  total: 0,
  limit: 20,
  page: 1,
};

class Assumptions extends React.Component {
  /**
   * Cancel http request callback Array
   */
  httpCancelTokens = [];

  /**
   * Component's State
   */
  state = {
    showLoader: false,
    isFetchingGlobal: false,
    isFetchingLocal: false,

    isVisibleUnsavedChanges: false,
    unsavedChanges: false,
    discardAction: null,

    isCreateNew: false,
    modelId: '',

    globalAssumptions: [],
    localAssumptions: [],

    model: {},
    modelsList: [],
    isFetchingModels: false,
    modelsPagination: { ...PAGINATION },
    searchMiodel: '',
  };

  /**
   * When Component Did Mount
   */
  componentDidMount() {
    const { modelId, modelName } = this.props;

    const loadLocalAssumptions = firstModel => {
      if (modelId || !firstModel) return;

      this.setState({ model: { ...firstModel } }, () => {
        this.fetchLocalAssumptions();
      });
    };

    this.fetchModelsList({ callback: loadLocalAssumptions });

    this.setState({ model: { id: modelId, name: modelName } }, () => {
      this.fetchGlobalAssumptions(this.fetchLocalAssumptions);
    });
  }

  /**
   * Cancel http request callback
   */
  pushCancelCallback = func => {
    this.httpCancelTokens.push(func);
  };

  /**
   * Cancel existing API Requests
   */
  cancelExistingHttpRequests = () => {
    this.httpCancelTokens.forEach(cancelFunc => cancelFunc());
    this.httpCancelTokens = [];
  };

  /**
   * Update State
   *
   * @param {Object} newState
   */
  updateState = newState => {
    this.setState(newState);
  };

  /**
   * Fetch List of Models from API
   */
  fetchModelsList = async ({ callback } = {}) => {
    try {
      const {
        searchModel,
        isFetchingModels,
        modelsPagination,
        modelsList,
      } = this.state;

      if (isFetchingModels) return;

      const { limit, page } = modelsPagination;

      this.setState({ isFetchingModels: true });

      let url = MODELS_API.GET_WORKBOOKS;
      url += `?limit=${limit}`;
      url += `&start=${page == 1 ? 1 : (page - 1) * limit + 1}`;

      if (searchModel) url += `&search=${searchModel}`;

      const {
        data: { data, count },
      } = await httpGet(url);

      const sanitizedData = getFormattedModelsList(data);

      const list =
        page == 1 ? sanitizedData : [...modelsList, ...sanitizedData];

      this.setState({
        isFetchingModels: false,
        modelsList: list,
        modelsPagination: {
          ...modelsPagination,
          total: count,
        },
      });

      if (callback) callback(sanitizedData[0]);
    } catch (e) {
      console.error(e);
      const { modelsPagination } = this.state;

      this.setState({
        isFetchingModels: false,
        modelsPagination: {
          ...modelsPagination,
          page: modelsPagination.page == 1 ? 1 : modelsPagination.page - 1,
        },
      });
    }
  };

  /**
   * Load more Models List
   */
  loadMoreModelsList = () => {
    const { modelsPagination } = this.state;
    const { limit, page, total } = modelsPagination;

    if (page * limit >= total) return;

    this.setState(
      {
        modelsPagination: {
          ...modelsPagination,
          page: modelsPagination.page + 1,
        },
      },
      this.fetchModelsList
    );
  };

  /**
   * Fetch Global Assumptions
   */
  fetchGlobalAssumptions = async callback => {
    try {
      this.setState({ isFetchingGlobal: true });

      let url = ASSUMPTIONS_API.GET_ASSUMPTIONS;
      url += `?scope=${ASSUMPTION_SCOPES_KEYS.global}`;

      const { data: globalAssumptions } = await httpGet(url);
      const [assumption] = globalAssumptions;

      this.setState(
        {
          globalAssumptions,
          isFetchingGlobal: false,
        },
        () => {
          if (assumption) {
            this.loadAssumptionData(assumption, callback);

            return;
          }

          if (callback) callback();
        }
      );
    } catch (err) {
      this.setState({
        isFetchingGlobal: false,
        globalAssumptions: [],
      });
      console.error(err);
    }
  };

  /**
   * Fetch Assumptions
   */
  fetchLocalAssumptions = async () => {
    try {
      this.setState({ isFetchingLocal: true });

      const { model: { id = '' } = {} } = this.state || {};

      if (!id) return;

      let url = ASSUMPTIONS_API.GET_ASSUMPTIONS;
      url += `?scope=${ASSUMPTION_SCOPES_KEYS.local}`;
      url += `&model_id=${id}`;

      const { data: localAssumptions } = await httpGet(url);

      const { modelId } = this.props;

      if (modelId && localAssumptions.length > 0) {
        const [assumption] = localAssumptions;
        this.setState(
          {
            isFetchingLocal: false,
            localAssumptions,
            assumption,
          },
          () => {
            if (assumption) {
              this.loadAssumptionData(assumption);
            }
          }
        );

        return;
      }

      this.setState({
        isFetchingLocal: false,
        localAssumptions,
      });
    } catch (err) {
      console.error(err);
      this.setState({
        isFetchingLocal: false,
        localAssumptions: [],
      });
    }
  };

  /**
   * Load Selected Assumption Data
   *
   * @param {Object} assumption
   * @param {Function} callback
   */
  loadAssumptionData = async (assumption, callback) => {
    const { setAssumption, setGridHeaders, setGridData } = this.props;

    setGridData([]);
    setGridHeaders([]);

    if (!assumption.id) return;

    try {
      this.setState({ showLoader: true });

      const url = ASSUMPTIONS_API.GET_ASSUMPTION.replace('#ID#', assumption.id);

      const {
        data: { grid_data },
      } = await httpGet(url);

      const { headers, data } = getFormattedAssumptionToFill(grid_data);
      setAssumption(assumption);
      setGridData(data);
      setGridHeaders(headers);

      if (callback) {
        callback();
      }

      this.setState({ showLoader: false });
    } catch (err) {
      this.setState({ showLoader: false });

      setAssumption(assumption);
      setGridData([]);
      setGridHeaders([]);
    }
  };

  /**
   * On Cancel Assumption Drawer
   * (Cancel + Close)
   */
  onCancel = () => {
    this.cancelExistingHttpRequests();

    this.props.clearData();
    this.props.onCancel();
  };

  /**
   * On Done Assumption Drawer
   * (Save + Close)
   */
  onSave = async () => {
    try {
      const { params, errMsg } = getFormattedParamsToSaveAssumption(this);

      if (errMsg) {
        showErrorMsg(errMsg);

        return;
      }

      const { assumption } = this.props;
      const { isCreateNew } = this.state;

      const url = isCreateNew
        ? ASSUMPTIONS_API.CREATE_ASSUMPTION
        : ASSUMPTIONS_API.UPDATE_ASSUMPTION.replace('#ID#', assumption.id);

      this.setState({ showLoader: true });

      const { data } = await httpPost(url, params, {
        callback: this.pushCancelCallback,
      });

      showSuccessMsg(ASSUMPTIONS_MSG.assumption_saved);
      this.setState({ showLoader: false });

      if (isCreateNew) {
        const { globalAssumptions, localAssumptions } = this.state;

        if (data.scope == ASSUMPTION_SCOPES_KEYS.global) {
          globalAssumptions.push(data);
        } else if (data.scope == ASSUMPTION_SCOPES_KEYS.local) {
          localAssumptions.push(data);
        }

        this.props.setAssumption(data);

        this.setState({
          localAssumptions,
          globalAssumptions,
          isCreateNew: false,
        });
      }

      this.props.onSave();
    } catch (err) {
      console.error(err);
      this.setState({ showLoader: false });
    }
  };

  /**
   * Handle Selected Model
   *
   * @param {Object} evt
   * @param {Object} option
   */
  handleSelectedModel = (evt, option) => {
    const { model = {} } = option || {};

    this.setState({ model }, () => {
      model.id
        ? this.fetchLocalAssumptions()
        : this.setState({ localAssumptions: [] });

      this.props.clearData();
    });
  };

  /**
   * When Component Did Update
   */
  shouldComponentUpdate(nextProps) {
    if (
      nextProps.assumption &&
      nextProps.assumption !== this.props.assumption
    ) {
      const { localAssumptions = [], globalAssumptions = [] } = this.state;

      let assumptionsToFilter = [];

      assumptionsToFilter =
        nextProps.assumption.scope == ASSUMPTION_SCOPES_KEYS.local
          ? [...localAssumptions]
          : [...globalAssumptions];

      const index = assumptionsToFilter.findIndex(
        ({ id }) => id == nextProps.assumption.id
      );

      if (
        index != -1 &&
        assumptionsToFilter[index].name != nextProps.assumption.name
      ) {
        assumptionsToFilter[index].name = nextProps.assumption.name;

        const keyToUpdate =
          nextProps.assumption.scope == ASSUMPTION_SCOPES_KEYS.local
            ? 'localAssumptions'
            : 'globalAssumptions';

        this.setState({ [keyToUpdate]: assumptionsToFilter });
      }
    }

    return true;
  }

  /**
   * Render View
   */
  render() {
    const { classes, isVisible, gridHeaders, modelId } = this.props;
    const {
      isCreateNew,
      showLoader,
      isFetchingModels,
      isFetchingGlobal,
      isFetchingLocal,

      modelsList,
      model,
      globalAssumptions,
      localAssumptions,
    } = this.state;

    const isLoading =
      showLoader || isFetchingModels || isFetchingGlobal || isFetchingLocal;

    return (
      <Drawer
        anchor="right"
        classes={{
          paper: classes.drawerPaper,
        }}
        open={isVisible}
      >
        <Box display="flex" id="assumptions-drawer">
          {isLoading && <Spinner />}

          <AssumptionsSideBar
            isCreating={isCreateNew}
            model={model}
            modelsList={modelsList}
            modelId={modelId}
            globalAssumptions={globalAssumptions}
            localAssumptions={localAssumptions}
            updateState={this.updateState}
            loadAssumptionData={this.loadAssumptionData}
            handleSelectedModel={this.handleSelectedModel}
            isFetchingGlobal={isFetchingGlobal}
            isFetchingLocal={isFetchingLocal}
            isFetchingModels={isFetchingModels}
            loadMoreModels={this.loadMoreModelsList}
          />

          {gridHeaders.length > 0 && (
            <Box mt={2.5} ml={34}>
              <AssumptionsSheet onSave={this.onSave} onCancel={this.onCancel} />
            </Box>
          )}

          {!isLoading && gridHeaders.length == 0 && (
            <>
              <Box position="absolute" right="30px" top="35px">
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={this.onCancel}
                >
                  Close
                </Button>
              </Box>
              <Box
                pl={34}
                className="env-msg full-height-container"
                flexDirection="column"
              >
                <Box
                  display="flex"
                  flexDirection="column"
                  justify="center"
                  alignItems="center"
                >
                  <Typography variant="h5" gutterBottom color="textSecondary">
                    No Assumptions Yet!
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    gutterBottom
                  >
                    You haven't created any assumptions yet.
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Drawer>
    );
  }
}

Assumptions.propTypes = {
  assumption: shape({}).isRequired,
  clearData: func.isRequired,
  gridHeaders: arrayOf(shape({})),
  isVisible: bool,
  modelId: oneOfType([string, number]),
  modelName: string,
  onCancel: func,
  onSave: func,
  setAssumption: func.isRequired,
  setGridData: func.isRequired,
  setGridHeaders: func.isRequired,
};

Assumptions.defaultProps = {
  isVisible: false,
  modelId: '',
  modelName: '',
  onCancel: () => {},
  onSave: () => {},
};

const mapStateToProps = createStructuredSelector({
  assumption: getAssumption(),
  gridHeaders: getGridHeaders(),
  gridData: getGridData(),
});

export default connect(mapStateToProps, {
  clearData,
  setAssumption,
  setGridData,
  setGridHeaders,
})(withStyles(styles)(Assumptions));
