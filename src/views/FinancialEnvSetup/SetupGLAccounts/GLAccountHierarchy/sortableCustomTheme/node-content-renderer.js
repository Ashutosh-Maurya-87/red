import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Box } from '@material-ui/core';

import ImgRenderer from '../../../../../components/ImgRenderer';

import './node-content-renderer.scss';

function isDescendant(older, younger) {
  return (
    !!older.children &&
    typeof older.children !== 'function' &&
    older.children.some(
      child => child === younger || isDescendant(child, younger)
    )
  );
}

// eslint-disable-next-line react/prefer-stateless-function
class FileThemeNodeContentRenderer extends Component {
  /**
   * Handle Event > Node Click
   */
  handleNodeClick = (clickFunc, node) => () => {
    const { affa_record_type = '' } = node || {};

    if (affa_record_type != 'folder') return;

    clickFunc();
  };

  render() {
    const {
      scaffoldBlockPxWidth,
      toggleChildrenVisibility,
      connectDragPreview,
      connectDragSource,
      isDragging,
      canDrop,
      canDrag,
      node,
      title,
      draggedNode,
      path,
      treeIndex,
      isSearchMatch,
      isSearchFocus,
      icons,
      buttons,
      className,
      style,
      didDrop,
      lowerSiblingCounts,
      listIndex,
      swapFrom,
      swapLength,
      swapDepth,
      treeId, // Not needed, but preserved for other renderers
      isOver, // Not needed, but preserved for other renderers
      parentNode, // Needed for dndManager
      rowDirection,
      onNodeClick,
      isSelectedNode,
      search,
      ...otherProps
    } = this.props;

    const {
      affa_h_key_name: nodeTitle = '',
      affa_record_type = '',
      children = [],
      expanded,
    } = node || {};

    const isDraggedDescendant = draggedNode && isDescendant(draggedNode, node);
    const isLandingPadActive = !didDrop && isDragging;

    // Construct the scaffold representing the structure of the tree
    const scaffold = [];
    lowerSiblingCounts.forEach((lowerSiblingCount, i) => {
      scaffold.push(
        <div
          key={`pre_${1 + i}`}
          style={{ width: scaffoldBlockPxWidth }}
          className={'lineBlock'}
        />
      );

      if (treeIndex !== listIndex && i === swapDepth) {
        // This row has been shifted, and is at the depth of
        // the line pointing to the new destination
        let highlightLineClass = '';

        if (listIndex === swapFrom + swapLength - 1) {
          // This block is on the bottom (target) line
          // This block points at the target block (where the row will go when released)
          highlightLineClass = 'highlightBottomLeftCorner';
        } else if (treeIndex === swapFrom) {
          // This block is on the top (source) line
          highlightLineClass = 'highlightTopLeftCorner';
        } else {
          // This block is between the bottom and top
          highlightLineClass = 'highlightLineVertical';
        }

        scaffold.push(
          <div
            key={`highlight_${1 + i}`}
            style={{
              width: scaffoldBlockPxWidth,
              left: scaffoldBlockPxWidth * i,
            }}
            className={`${'absoluteLineBlock'} ${highlightLineClass}`}
          />
        );
      }
    });

    const nodeContent = (
      <div style={{ height: '100%' }} {...otherProps}>
        {toggleChildrenVisibility && children && children.length > 0 && (
          <button
            type="button"
            aria-label={expanded ? 'Collapse' : 'Expand'}
            className={expanded ? 'collapseButton' : 'expandButton'}
            style={{
              left: (lowerSiblingCounts.length - 0.6) * scaffoldBlockPxWidth,
            }}
            onClick={() =>
              toggleChildrenVisibility({
                node,
                path,
                treeIndex,
              })
            }
          />
        )}

        <div
          className={`rowWrapper${
            !canDrag ? ` ${'rowWrapperDragDisabled'}` : ''
          } ${isSelectedNode ? 'activeHierarchy' : ''} ${
            search.length > 0 ? 'activeSearch' : ''
          } ${isSearchFocus ? ` ${'rowSearchFocus'}` : ''}`}
        >
          {/* Set the row preview to be used during drag and drop */}
          {connectDragPreview(
            <div style={{ display: 'flex', height: '100%' }}>
              {scaffold}
              <div
                className={`row${
                  isLandingPadActive ? ` ${'rowLandingPad'}` : ''
                }${isLandingPadActive && !canDrop ? ` ${'rowCancelPad'}` : ''}${
                  isSearchMatch ? ` ${'rowSearchMatch'}` : ''
                }${className ? ` ${className}` : ''}`}
                style={{
                  opacity: isDraggedDescendant ? 0.5 : 1,
                  ...style,
                }}
              >
                <div
                  className={`rowContents${
                    !canDrag ? ` ${'rowContentsDragDisabled'}` : ''
                  }`}
                >
                  <span
                    className="overlay"
                    onClick={this.handleNodeClick(onNodeClick, node)}
                  ></span>
                  <Box display="flex">
                    <div className={'rowToolbar'}>
                      {icons.map((icon, index) => (
                        <div
                          key={index} // eslint-disable-line react/no-array-index-key
                          className={'toolbarButton'}
                        >
                          {icon}
                        </div>
                      ))}
                    </div>
                    <Box>
                      {affa_record_type === 'folder' ? (
                        <ImgRenderer
                          className="folder-icon-dimension"
                          src="folder.svg"
                        />
                      ) : (
                        <ImgRenderer
                          className="file-icon-dimension"
                          src="files.svg"
                        />
                      )}
                    </Box>
                    <div className={'rowLabel'}>
                      <span className={'rowTitle'}>
                        {typeof nodeTitle === 'function'
                          ? nodeTitle({
                              node,
                              path,
                              treeIndex,
                            })
                          : nodeTitle}
                      </span>
                    </div>
                  </Box>
                  <div className={'rowToolbar'}>
                    {buttons.map((btn, index) => {
                      const { button, isVisible } = btn || {};
                      return (
                        isVisible && (
                          <div
                            key={index} // eslint-disable-line react/no-array-index-key
                            className={'toolbarButton'}
                          >
                            {button}
                          </div>
                        )
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );

    return canDrag
      ? connectDragSource(nodeContent, { dropEffect: 'copy' })
      : nodeContent;
  }
}

FileThemeNodeContentRenderer.defaultProps = {
  buttons: [],
  canDrag: false,
  canDrop: false,
  className: '',
  draggedNode: null,
  icons: [],
  isSearchFocus: false,
  isSearchMatch: false,
  parentNode: null,
  style: {},
  onNodeClick: () => {},
  swapDepth: null,
  swapFrom: null,
  swapLength: null,
  title: null,
  toggleChildrenVisibility: null,
};

FileThemeNodeContentRenderer.propTypes = {
  buttons: PropTypes.arrayOf(PropTypes.node),
  canDrag: PropTypes.bool,
  canDrop: PropTypes.bool, // Drop target
  className: PropTypes.string,
  connectDragPreview: PropTypes.func.isRequired, // Drag source
  connectDragSource: PropTypes.func.isRequired, // Drag source
  didDrop: PropTypes.bool.isRequired, // Drag source
  draggedNode: PropTypes.shape({}), // Drag source
  icons: PropTypes.arrayOf(PropTypes.node),
  isDragging: PropTypes.bool.isRequired, // Drag source
  isOver: PropTypes.bool.isRequired, // Drop target
  isSearchFocus: PropTypes.bool,
  isSearchMatch: PropTypes.bool,
  isSelectedNode: PropTypes.bool.isRequired,
  listIndex: PropTypes.number.isRequired,
  lowerSiblingCounts: PropTypes.arrayOf(PropTypes.number).isRequired,
  node: PropTypes.shape({}).isRequired,
  onNodeClick: PropTypes.func,
  parentNode: PropTypes.shape({}), // Needed for dndManager // Drag source
  path: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ).isRequired,
  rowDirection: PropTypes.string.isRequired,
  scaffoldBlockPxWidth: PropTypes.number.isRequired,
  search: PropTypes.string,
  style: PropTypes.shape({}),
  swapDepth: PropTypes.number,
  swapFrom: PropTypes.number,
  swapLength: PropTypes.number,
  title: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  toggleChildrenVisibility: PropTypes.func,
  treeId: PropTypes.string.isRequired,
  treeIndex: PropTypes.number.isRequired,
};

export default FileThemeNodeContentRenderer;
