/* eslint-disable react/prop-types */
// eslint-disable-next-line max-classes-per-file
import React from 'react';
import _ from 'lodash';

import {
  DefaultNodeWidget,
  DefaultNodeFactory,
  DefaultPortLabel,
  DefaultNodeModel,
} from '@projectstorm/react-diagrams';

import styled from '@emotion/styled';

// eslint-disable-next-line import/no-extraneous-dependencies
import { PortWidget } from '@projectstorm/react-diagrams-core';

import {
  MenuItem,
  Popper,
  Paper,
  Grow,
  MenuList,
  ClickAwayListener,
  Box,
  Tooltip,
} from '@material-ui/core';

import { DeleteOutline as DeleteOutlineIcon } from '@material-ui/icons';

export const PortLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px;
  padding-right: 0;
  padding-left: 0;
  border-bottom: 1px solid ${p => p.border};
  &:last-child {
    border-bottom: none;
  }
`;

export const Label = styled.div`
  padding: 0 5px;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const DeleteIcon = styled.div`
  display: inline-flex;
  z-index: 1;
  cursor: pointer;
  font-size: 13px;
`;

export const Port = styled.div`
  width: 18px;
  height: 18px;
  opacity: 0.2;
  cursor: grab;
  &:hover {
    background: ${p => p.portInColor};
  }
`;

export const Node = styled.div`
  color: ${p => p.color};
  font-size: 13px;
  font-family: Roboto;
`;

export const Title = styled.div`
  font-size: 14px;
  color: ${p => p.color};
  text-transform: uppercase;
`;

export const TitleName = styled.div`
  flex-grow: 1;
  padding: 10px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Ports = styled.div`
  border-radius: 5px;
  display: flex;
  background-color: ${p => p.background};
  border: solid 1px ${p => p.border};
`;

export const PortsContainer = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  &:first-of-type {
    // max-width: 0 !important;
  }

  &:only-child {
    margin-right: 0px;
  }
`;

export class AdvancedPortWidget extends PortWidget {
  getExtraProps = () => {
    return {};
  };
}

export class AdvancedPortLabel extends DefaultPortLabel {
  state = {
    menuEl: null,
  };

  onClickLabel = evt => {
    try {
      evt.preventDefault();

      if (this.state.menuEl) {
        this.setState({ menuEl: null });
      } else {
        this.setState({ menuEl: evt.currentTarget });
      }
    } catch (e) {
      console.error(e);
    }
  };

  closeMenu = () => {
    this.setState({ menuEl: null });
  };

  removeRelation = () => {
    try {
      const { port } = this.props;
      const options = port.getOptions();

      if (options.onRemoveRelation) {
        const links = port.getLinks();

        Object.keys(links).forEach(key => {
          links[key].remove();
        });

        options.onRemoveRelation({ options });
      }
    } catch (err) {
      console.error(err);
    }
  };

  canLinkToPort = () => true;

  render() {
    const { menuEl } = this.state;
    const { port, engine } = this.props;
    const options = port.getOptions();

    const isConnected = Object.keys(port.links || {}).length > 0;

    const label = (
      <Label>
        {options.label}
        {options.out && options.showDelete && isConnected && (
          <Tooltip title="Remove Relation" placement="top" arrow>
            <DeleteIcon onClick={this.removeRelation}>
              <DeleteOutlineIcon fontSize="inherit" />
            </DeleteIcon>
          </Tooltip>
        )}
      </Label>
    );

    const customPort = (
      <AdvancedPortWidget
        engine={engine}
        port={port}
        className={options.out ? 'custom-port' : ''}
      >
        <Port portInColor={options.portInColor} />
      </AdvancedPortWidget>
    );

    return (
      <PortLabel border={options.border}>
        <span>
          {options.in && customPort}
          {options.out && (
            <span className={`map-label ${isConnected ? 'port-conneted' : ''}`}>
              {label}
            </span>
          )}
        </span>
        {options.out && customPort}

        {false && (
          <Popper
            open={Boolean(menuEl)}
            anchorEl={menuEl}
            role={undefined}
            transition
            placement="top-end"
            onClose={this.closeMenu}
          >
            {({ TransitionProps }) => (
              <Grow
                {...TransitionProps}
                style={{ transformOrigin: 'left bottom' }}
              >
                <Paper>
                  <ClickAwayListener onClickAway={this.closeMenu}>
                    <MenuList>
                      <MenuItem onClick={this.removeRelation}>
                        <Box fontSize="12px">Remove Relation</Box>
                      </MenuItem>
                    </MenuList>
                  </ClickAwayListener>
                </Paper>
              </Grow>
            )}
          </Popper>
        )}
      </PortLabel>
    );
  }
}

export class AdvancedNodeWidget extends DefaultNodeWidget {
  generatePort = port => {
    return (
      <AdvancedPortLabel
        engine={this.props.engine}
        port={port}
        key={port.getID()}
      />
    );
  };

  render() {
    const { node } = this.props;
    const options = node.getOptions();

    return (
      <Node
        data-default-node-name={options.name}
        selected={node.isSelected()}
        background={options.background}
      >
        <Title className="node-title" color={options.titleColor}>
          <TitleName>{options.name}</TitleName>
        </Title>
        <Ports background={options.background} border={options.border}>
          <PortsContainer>
            {_.map(node.getInPorts(), this.generatePort)}
          </PortsContainer>
          <PortsContainer>
            {_.map(node.getOutPorts(), this.generatePort)}
          </PortsContainer>
        </Ports>
      </Node>
    );
  }
}

export class AdvancedNodeFactory extends DefaultNodeFactory {
  constructor() {
    super('advanced');
  }

  generateReactWidget = event => {
    return <AdvancedNodeWidget engine={this.engine} node={event.model} />;
  };

  generateModel = event => {
    return new AdvancedNodeModel();
  };
}

export class AdvancedNodeModel extends DefaultNodeModel {}
