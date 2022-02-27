import React from 'react';
import { any, bool, string } from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';

import './styles.scss';

/**
 * Render Scroll Thumb
 *
 * @return {HTML}
 */
const renderScrollThumb = thumbColor => ({ style, ...props }) => {
  const thumbStyle = {
    backgroundColor: thumbColor,
    cursor: 'pointer',
  };

  return <div {...props} style={{ ...style, ...thumbStyle }} />;
};

/**
 * Render Track Horizontal
 */
const renderTrackHorizontal = props => {
  return <div {...props} className="scrollbar-track scrollbar-track-x" />;
};

/**
 * Render Track Vertical
 */
const renderTrackVertical = props => {
  return <div {...props} className="scrollbar-track scrollbar-track-y" />;
};

/**
 * Render View of Scrollbar Wrapper
 */
const renderView = (backgroundColor, className) => ({ style, ...props }) => {
  const viewStyle = {};

  if (backgroundColor) viewStyle.backgroundColor = backgroundColor;

  return (
    <div
      {...props}
      style={{ ...style, ...viewStyle }}
      className={`scrollbar-custom-view ${className}`}
    />
  );
};

/**
 * Custom Scrollbars
 *
 * @param {Object} props
 */
const CustomScrollbars = ({
  children,
  backgroundColor,
  className,
  thumbColor,
  forwardRef,
  ...props
}) => {
  return (
    <Scrollbars
      {...props}
      ref={forwardRef}
      renderView={renderView(backgroundColor, className)}
      renderThumbHorizontal={renderScrollThumb(thumbColor)}
      renderThumbVertical={renderScrollThumb(thumbColor)}
      renderTrackHorizontal={renderTrackHorizontal}
      renderTrackVertical={renderTrackVertical}
    >
      {children}
    </Scrollbars>
  );
};

const CustomScrollbarsWithRef = React.forwardRef((props, ref) => {
  return <CustomScrollbars {...props} forwardRef={ref} />;
});

/**
 * Props Types
 */
const propTypes = {
  backgroundColor: string,
  children: any,
  className: string,
  forwardRef: any,
  hideTracksWhenNotNeeded: bool,
  thumbColor: string,
};

/**
 * Default Props
 */
const defaultProps = {
  backgroundColor: '',
  hideTracksWhenNotNeeded: true,
  className: '',
  thumbColor: '#353535',
};

CustomScrollbarsWithRef.propTypes = propTypes;
CustomScrollbars.propTypes = propTypes;

CustomScrollbarsWithRef.defaultProps = defaultProps;
CustomScrollbars.defaultProps = defaultProps;

export { CustomScrollbarsWithRef };
export default CustomScrollbars;
