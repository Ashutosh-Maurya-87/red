import React from 'react';
import { string } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import ContentLoader from 'react-content-loader';

import { CONTENT_LOADER_COLORS } from '../../../configs/app';

import { getTheme } from '../../../reducers/Theme/selectors';

/**
 * Grid View Loader
 */
const CreateRBMLoader = props => {
  const { theme } = props;

  const { backgroundColor = '', foregroundColor = '' } =
    CONTENT_LOADER_COLORS[theme] || {};

  return (
    <ContentLoader
      speed={2}
      width="100%"
      height="130"
      viewBox="0 0 100% 130"
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}
      {...props}
    >
      <rect rx="16" ry="16" width="2" height="95%" />
      <rect rx="16" ry="16" width="100%" height="2" />
      <rect x="0" y="94%" rx="16" ry="16" width="100%" height="2" />
      <rect x="99.8%" y="0" rx="16" ry="16" width="2" height="95%" />
      <rect x="25" y="17" rx="65" ry="65" width="90" height="90" />
      <rect x="165" y="30" rx="3" ry="3" width="200" height="15" />
      <rect x="165" y="65" rx="3" ry="3" width="50%" height="10" />
      <rect x="165" y="85" rx="3" ry="3" width="50%" height="10" />
    </ContentLoader>
  );
};

// Prop type Validation
CreateRBMLoader.propTypes = {
  theme: string.isRequired,
};

// Prop type Default values
CreateRBMLoader.defaultProps = {
  theme: '',
};

const mapStateToProps = createStructuredSelector({
  theme: getTheme(),
});

export default connect(mapStateToProps, {})(CreateRBMLoader);
