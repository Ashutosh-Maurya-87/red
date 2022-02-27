/* eslint-disable react/prop-types */
// eslint-disable-next-line max-classes-per-file
import React from 'react';
import {
  DefaultPortModel,
  DefaultLinkFactory,
  DefaultLinkModel,
} from '@projectstorm/react-diagrams';

import { PROCESS_MANAGER_MSG } from '../../../../../configs/messages';
import { showErrorMsg } from '../../../../../utils/notifications';

export class AdvancedLinkModel extends DefaultLinkModel {
  constructor(props) {
    super({
      type: 'advanced',
      width: 1,
      color: props.linkColor,
      selectedColor: props.linkColor,
    });
  }
}

export class AdvancedPortModel extends DefaultPortModel {
  createLinkModel = () => {
    return new AdvancedLinkModel({ ...this.options });
  };

  canLinkToPort = port => {
    if (port instanceof AdvancedPortModel && port.options) {
      const { tableIndex, colIndex, dataType } = this.options;

      const {
        tableIndex: targetTableIndex,
        colIndex: targetColIndex,
        dataType: targetDataType,
      } = port.options;

      if (tableIndex == targetTableIndex && colIndex == targetColIndex) {
        return false;
      }

      if (dataType != targetDataType) {
        showErrorMsg(PROCESS_MANAGER_MSG.link_invalid_data_type);
        return false;
      }

      return true;
    }

    return false;
  };
}

export class AdvancedLinkSegment extends React.Component {
  render() {
    const { model, path } = this.props;
    const increase = 164;

    const options = model.getOptions();
    const { sourcePort, targetPort } = model;

    const { position: positionSource } = sourcePort || {};
    const { position: positionTarget } = targetPort || {};

    let newPath = path;

    let increaseSource;
    let increaseTarget;

    if (positionSource && positionTarget) {
      increaseSource = positionSource.x < positionTarget.x;
      increaseTarget = positionSource.x > positionTarget.x;

      const isSameTable = positionSource.x == positionTarget.x;
      const pathArray = path.split(' ');
      const pathM = positionSource.x + (increaseSource ? increase : 0);

      pathArray[0] = `M${pathM}`;
      pathArray[2] = `C${pathM - isSameTable ? pathM - 20 : 0}`;

      pathArray[6] = positionTarget.x + (increaseTarget ? increase : 0);
      pathArray[7] = positionTarget.y + 8;

      pathArray[4] = pathArray[6];
      pathArray[5] = `${pathArray[7]},`;

      newPath = pathArray.join(' ');
    }

    return (
      <>
        <path
          fill="none"
          ref={ref => {
            this.path = ref;
          }}
          strokeWidth={options.width}
          stroke={options.color}
          d={newPath}
        />

        {positionSource && positionTarget && (
          <circle
            className="rl-link-circle"
            r={7}
            cx={positionSource.x + (increaseSource ? increase : 0)}
            cy={positionSource.y + 8}
            fill={options.color}
          />
        )}

        {positionTarget && (
          <circle
            className="rl-link-circle"
            r={7}
            cx={positionTarget.x + (increaseTarget ? increase : 0)}
            cy={positionTarget.y + 8}
            fill={options.color}
          />
        )}
      </>
    );
  }
}

export class AdvancedLinkFactory extends DefaultLinkFactory {
  constructor() {
    super('advanced');
  }

  generateModel = () => {
    return new AdvancedLinkModel();
  };

  generateLinkSegment = (model, selected, path) => {
    return (
      <g>
        <AdvancedLinkSegment model={model} path={path} />
      </g>
    );
  };
}
