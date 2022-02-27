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
const GridViewLoader = props => {
  const { theme } = props;

  const { backgroundColor = '', foregroundColor = '' } =
    CONTENT_LOADER_COLORS[theme] || {};

  return (
    <ContentLoader
      speed={2}
      width={250}
      height={180}
      viewBox="0 0 250 180"
      backgroundColor={backgroundColor}
      foregroundColor={foregroundColor}
      {...props}
    >
      <circle cx="128" cy="60" r="45" />
      <rect x="0" y="125" rx="0" ry="0" width="250" height="1" />
      <rect x="10" y="140" rx="3" ry="3" width="150" height="15" />
      <rect x="10" y="170" rx="3" ry="3" width="100" height="10" />
    </ContentLoader>
  );
};

// Prop type Validation
GridViewLoader.propTypes = {
  theme: string.isRequired,
};

// Prop type Default values
GridViewLoader.defaultProps = {
  theme: '',
};

const mapStateToProps = createStructuredSelector({
  theme: getTheme(),
});

export default connect(mapStateToProps, {})(GridViewLoader);
