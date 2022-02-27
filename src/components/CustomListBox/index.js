import React from 'react';
import ListSubheader from '@material-ui/core/ListSubheader';
import { VariableSizeList } from 'react-window';
import PerfectScrollbar from 'react-perfect-scrollbar';

const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef((props, ref) => {
  // eslint-disable-next-line react/prop-types
  const { loadMoreTables, ...outerProps } = React.useContext(
    OuterElementContext
  );

  return (
    <PerfectScrollbar
      ref={ref}
      {...props}
      {...outerProps}
      onYReachEnd={loadMoreTables || undefined}
    />
  );
});

const ListboxComponent = React.forwardRef(function ListboxComponent(
  props,
  ref
) {
  // eslint-disable-next-line react/prop-types
  const { children, state, ...other } = props;
  const itemData = React.Children.toArray(children);
  const itemSize = 48;

  const getChildSize = index => {
    const child = itemData[index];

    if (React.isValidElement(child) && child.type === ListSubheader) {
      return 48;
    }

    return 48;
  };

  const getDropdownHeight = () => {
    if (itemData && itemData.length > 8) {
      return 8 * itemSize;
    }

    return 250;
  };

  const Item = ({ data }) => data;

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <VariableSizeList
          itemData={itemData}
          height={getDropdownHeight()}
          width="100%"
          outerElementType={OuterElementType}
          itemSize={getChildSize}
          overscanCount={5}
          itemCount={1}
          {...props}
        >
          {Item}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

export default ListboxComponent;
