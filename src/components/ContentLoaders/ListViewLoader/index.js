import React from 'react';
import { string } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import ContentLoader from 'react-content-loader';

import { CONTENT_LOADER_COLORS } from '../../../configs/app';

import { getTheme } from '../../../reducers/Theme/selectors';

/**
 * List View Loader
 */
const ListViewLoader = props => {
  const { theme } = props;

  const { backgroundColor = '', foregroundColor = '' } =
    CONTENT_LOADER_COLORS[theme] || {};

  return (
    <ContentLoader
      speed={2}
      width="100%"
      height={45}
      viewBox="0 0 100% 45"
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}
      {...props}
    >
      <rect x="0" y="16" rx="0" ry="10" width="150" height="19" />
      <rect x="200" y="16" rx="0" ry="10" width="85%" height="19" />
    </ContentLoader>
  );
};

// Prop type Validation
ListViewLoader.propTypes = {
  theme: string.isRequired,
};

// Prop type Default values
ListViewLoader.defaultProps = {
  theme: '',
};

const mapStateToProps = createStructuredSelector({
  theme: getTheme(),
});

export default connect(mapStateToProps, {})(ListViewLoader);
