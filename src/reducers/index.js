/**
 * Import Dependencies
 */
import { combineReducers } from 'redux-immutable';

/**
 * Import Reducers
 * All Reducers used in the App must be declared here!
 */
import ThemeReducer from './Theme/reducer';
import SourceTablesReducer from './SourceTables/reducer';
import ProcessBuilderRecducer from './ProcessBuilder/reducer';
import UserProfileRecducer from './UserProfile/reducer';
import FinancialEnvSetupReducer from './FinancialEnvSetup/reducer';
import GLAccountHierarchyReducer from './GLAccountHierarchy/reducer';
import DimensionsReducer from './Dimensions/reducer';
import RecordEditorReducer from './RecordEditor/reducer';
import ModelsReducer from './Models/reducer';
import AssumptionsReducer from './Assumptions/reducer';
import RuleBasedModelsReducer from './RuleBasedModels/reducer';
import LevelsConfigsReducer from './LevelsConfigs/reducer';

/**
 * Combine the Reducers
 */
const reducers = combineReducers({
  theme: ThemeReducer,
  sourceTables: SourceTablesReducer,
  processBuilder: ProcessBuilderRecducer,
  userProfile: UserProfileRecducer,
  financialEnvSetup: FinancialEnvSetupReducer,
  GLAccountHierarchy: GLAccountHierarchyReducer,
  dimensions: DimensionsReducer,
  recordEditor: RecordEditorReducer,
  models: ModelsReducer,
  levels: LevelsConfigsReducer,
  assumptions: AssumptionsReducer,
  RuleBasedModels: RuleBasedModelsReducer,
});

/**
 * Export the combined Reducers
 */
export default reducers;
