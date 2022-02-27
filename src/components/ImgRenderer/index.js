import React from 'react';
import { string } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { getTheme } from '../../reducers/Theme/selectors';

function ImgRenderer({ theme, src, alt, defaultTheme, ...props }) {
  const srcWithTheme = `/images/icons/${defaultTheme || theme}/${src}`;

  return <img src={srcWithTheme} alt={alt} {...props} />;
}

ImgRenderer.propTypes = {
  alt: string,
  defaultTheme: string,
  src: string.isRequired,
  theme: string.isRequired,
};

ImgRenderer.defaultProps = {
  alt: '',
  defaultTheme: '',
};

const mapStateToProps = createStructuredSelector({
  theme: getTheme(),
});

export default connect(mapStateToProps, {})(ImgRenderer);
