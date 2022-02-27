import React, { useState } from 'react';
import { arrayOf, bool, func, shape, number } from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { Box, IconButton, MenuItem, Popover } from '@material-ui/core';
import {
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  MoreVert as MoreVertIcon,
} from '@material-ui/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import ConfirmationModal from '../../../../components/ConfirmationModal';
import InlineRenaming from '../../../../components/InlineRenaming';
import Spinner from '../../../../components/Spinner';

import { API_URLS } from '../../../../configs/api';
import { MODELS_MSG } from '../../../../configs/messages';

import { validateName } from '../../../../utils/helper/validateName';
import { httpDelete, httpPost } from '../../../../utils/http';

import {
  TAB_ACTIONS,
  TABS_ACTIONS_ARRAY,
  MAX_TABS_LENGTH_TO_ADD,
  genrateTab,
} from './helper';

import {
  setActiveWorksheet,
  setWorksheets,
} from '../../../../reducers/Models/actions';
import {
  getActiveWorksheet,
  getIsViewMode,
  getWorkbook,
  getWorksheets,
} from '../../../../reducers/Models/selectors';

import './styles.scss';

function ModelWorkbookTabs({
  isLoaded,
  isViewMode,
  activeWorksheet,
  setActiveWorksheet,
  setWorksheets,
  workbook,
  worksheets,
  tableWidth,
  handleTabsUpdated,
  onChangeActiveWorksheet,
  onChangeEditingState,
}) {
  const [menuEle, setMenuEle] = useState(null);
  const [showLoader, setShowLoader] = useState(false);
  const [isErrorName, setIsErrorName] = useState(false);
  const [confirmAction, setConfirmAction] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState(false);

  const [newSheetCount, setNewSheetCount] = useState(worksheets.length);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(null);

  const { id: workbookId } = workbook || {};

  /**
   * Is show SLider Icons
   *
   * @return {Boolean}
   */
  const isSliderVisible = () => {
    const ele = document.getElementById('workbook-tabs');
    if (!ele) return false;

    if (ele.offsetWidth > tableWidth - 100) return true;

    return false;
  };

  /**
   * Scroll Tabs
   *
   * @param {String} direction
   */
  const scrollTabs = direction => () => {
    const ele = document.getElementById('workbook-tabs');

    if (!ele) return;

    const left =
      direction == 'LEFT'
        ? ele.scrollLeft - tableWidth
        : ele.scrollLeft + tableWidth;

    ele.scrollTo({ left, behavior: 'smooth' });
  };

  /**
   * Add New Worksheet in Workbook
   */
  const addNewWorksheet = async () => {
    if (isErrorName) return;

    const { id, name } = genrateTab(worksheets, newSheetCount);

    try {
      setShowLoader(true);

      let url = API_URLS.MODELS_API.CREATE_WORKSHEET;
      url = url.replace('#ID#', workbookId);

      const formData = new FormData();
      formData.append('name', name);

      const { data = {} } = await httpPost(url, formData);

      setShowLoader(false);
      setNewSheetCount(id);

      worksheets.push(data);
      setWorksheets(worksheets);

      const callback = () => {
        changeActiveWorksheet(worksheets.length - 1)();
      };

      handleTabsUpdated({}, { isNewTab: true, callback });
    } catch (e) {
      console.error(e);
      setShowLoader(false);
    }
  };

  /**
   * Handle Click > Delete Worksheet
   *
   * @param {Number} sheetIndex
   */
  const handleClickDeleteWorksheet = sheetIndex => evt => {
    if (evt) evt.stopPropagation();

    const copyWorksheets = [...worksheets];
    const { name: worksheetName = '' } = copyWorksheets[sheetIndex] || {};

    setSelectedSheetIndex(sheetIndex);

    setConfirmAction('DELETE');
    setConfirmMsg(
      MODELS_MSG.worksheet_delete_confirmation.replace(
        '#WORKSHEET_NAME#',
        worksheetName
      )
    );
  };

  /**
   * Delete Worksheet via API
   */
  const deleteWorksheet = async () => {
    try {
      const copyWorksheets = [...worksheets];
      const { id: worksheetId } = copyWorksheets[selectedSheetIndex] || {};

      setShowLoader(true);

      let url = API_URLS.MODELS_API.DELETE_WORKSHEET;
      url = url.replace('#ID#', workbookId);
      url = url.replace('#WORKSHEET_ID#', worksheetId);

      await httpDelete(url);

      setShowLoader(false);

      worksheets.splice(selectedSheetIndex, 1);

      setWorksheets(worksheets);
      changeActiveWorksheet(0)();

      handleTabsUpdated({
        action: TAB_ACTIONS.remove,
        id: worksheetId,
      });
    } catch (e) {
      console.error(e);
      setShowLoader(false);
    }
  };

  /**
   * Enable renaming of Worksheet
   *
   * @param {Number} sheetIndex
   */
  const toggleRenamingWorksheet = sheetIndex => evt => {
    if (evt) evt.stopPropagation();

    setIsErrorName(true);
    onChangeEditingState(true);
    worksheets[sheetIndex].isRenaming = !worksheets[sheetIndex].isRenaming;

    setWorksheets(worksheets);
  };

  /**
   * Rename Worksheet
   *
   * @param {Number} sheetIndex
   * @param {String} name
   */
  const handleRenameWorksheet = sheetIndex => async name => {
    try {
      const copyWorksheets = [...worksheets];
      const worksheet = copyWorksheets[sheetIndex] || {};
      const { id: worksheetId, name: worksheetName } = worksheet || {};

      if (showLoader) return;

      const isValidName = validateName(name);
      setShowLoader(true);

      if (!isValidName) {
        // worksheet.isRenaming = !worksheet.isRenaming;
        setIsErrorName(true);
        onChangeEditingState(true);
        setShowLoader(false);

        return;
      }

      if (worksheetName == name) {
        worksheet.isRenaming = !worksheet.isRenaming;

        copyWorksheets[sheetIndex] = worksheet;
        setWorksheets(copyWorksheets);
        setIsErrorName(false);
        onChangeEditingState(false);
        setShowLoader(false);

        return;
      }

      let url = API_URLS.MODELS_API.UPDATE_WORKSHEET;
      url = url.replace('#ID#', workbookId);
      url = url.replace('#WORKSHEET_ID#', worksheetId);

      const formData = new FormData();
      formData.append('name', name);

      await httpPost(url, formData);

      setShowLoader(false);
      setIsErrorName(false);
      onChangeEditingState(false);

      copyWorksheets[sheetIndex] = {
        ...worksheet,
        name,
        isRenaming: !worksheet.isRenaming,
      };

      setWorksheets(copyWorksheets);
      handleTabsUpdated({});
    } catch (e) {
      console.error(e);
      setShowLoader(false);
    }
  };

  /**
   * Change Active Worksheet
   *
   * @param {Number} sheet
   */
  const changeActiveWorksheet = sheet => () => {
    const worksheet = worksheets[sheet] || {};

    onChangeActiveWorksheet({
      worksheet,
      prevWoeksheet: { ...activeWorksheet },
    });
    setActiveWorksheet(worksheet);
  };

  /**
   * Handle Response of Confirmation Modal
   *
   * @param {String|Boolean} res
   */
  const handleCloseConfModal = res => {
    switch (res) {
      case 'DELETE':
        deleteWorksheet();
        break;

      default:
        break;
    }

    setConfirmAction('');
    setConfirmMsg('');
  };

  /**
   * Re-order Worksheet
   */
  const onDragEndReOrderWorksheet = async ({ source, destination }) => {
    if (!source || !destination) return;

    try {
      const { index: sourceIndex } = source || {};
      const { index: destinationIndex } = destination || {};

      const result = [...worksheets];
      const [removed] = result.splice(sourceIndex, 1);

      const { id } = removed || {};

      const formData = new FormData();
      formData.append('sheet_id', id);

      if (destinationIndex != 0) {
        const index =
          worksheets.length - 1 == destinationIndex
            ? destinationIndex
            : destinationIndex - 1;

        const { id: otherSheetId } = worksheets[index] || {};
        formData.append('other_sheet_id', otherSheetId);
      }

      result.splice(destinationIndex, 0, removed);
      setWorksheets([...result]);

      let url = API_URLS.MODELS_API.REORDER_WORKSHEET;
      url = url.replace('#ID#', workbookId);

      await httpPost(url, formData);
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Show Tabs Context Menu
   *
   * @param {Number} sheetIndex
   * @param {Bool} isViewMode
   * @param {Event} evt
   */
  const showContextMenu = (sheetIndex, isViewMode = false) => evt => {
    if (isErrorName) return;
    if (isViewMode) return;

    try {
      setSelectedSheetIndex(sheetIndex);

      evt.preventDefault();

      setMenuEle(evt.currentTarget);
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Verify > Is Action Disabled
   *
   * @param {String} action
   *
   * @param {Boolean}
   */
  const isActionDisabled = action => {
    switch (action) {
      case TAB_ACTIONS.rename:
        return false;

      case TAB_ACTIONS.remove:
        return worksheets.length <= 1;

      default:
        return true;
    }
  };

  /**
   * Handle Selected conext menu action
   *
   * @param {String} action
   */
  const handleAction = action => () => {
    setMenuEle(null);

    switch (action) {
      case TAB_ACTIONS.rename:
        setTimeout(toggleRenamingWorksheet(selectedSheetIndex), 200);
        break;

      case TAB_ACTIONS.remove:
        handleClickDeleteWorksheet(selectedSheetIndex)();
        break;

      default:
        break;
    }
  };

  return (
    <Box display="flex" alignItems="center" px={1}>
      {isSliderVisible() && (
        <Box pr={1} display="flex">
          <>
            <ChevronLeftIcon
              className="cursor-pointer"
              fontSize="small"
              onClick={scrollTabs('LEFT')}
            />

            <ChevronRightIcon
              className="cursor-pointer"
              fontSize="small"
              onClick={scrollTabs('RIGHT')}
            />
          </>
        </Box>
      )}

      <Box
        display="flex"
        alignItems="center"
        pl={1}
        style={{ overflow: 'hidden' }}
        id="workbook-tabs"
      >
        <DragDropContext onDragEnd={onDragEndReOrderWorksheet}>
          <Droppable droppableId="droppable" direction="horizontal">
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                display="flex"
              >
                {isLoaded &&
                  worksheets.map((sheet, sIndex) => (
                    <Draggable
                      isDragDisabled={
                        worksheets.length === 1 || isViewMode || isErrorName
                      }
                      key={sheet.id}
                      draggableId={`tab-${sheet.id}`}
                      index={sIndex}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{ ...provided.draggableProps.style }}
                        >
                          <Box
                            pl={3}
                            pr={3}
                            mr={1}
                            borderRadius={6}
                            className={`model-tab ${
                              activeWorksheet.id === sheet.id ? 'active' : ''
                            }`}
                            key={sheet.id}
                            onClick={changeActiveWorksheet(sIndex)}
                            onContextMenu={showContextMenu(sIndex, isViewMode)}
                          >
                            <InlineRenaming
                              name={sheet.name}
                              disabled={isViewMode}
                              isLoading={false}
                              isEditingEnable={sheet.isRenaming}
                              onRename={handleRenameWorksheet(sIndex)}
                              onTitleDoubleClick={toggleRenamingWorksheet(
                                sIndex
                              )}
                              max={30}
                              required
                              isErrorName={isErrorName}
                            />
                            <IconButton
                              size="small"
                              onClick={showContextMenu(sIndex, isViewMode)}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </div>
                      )}
                    </Draggable>
                  ))}
              </Box>
            )}
          </Droppable>
        </DragDropContext>

        {showLoader && <Spinner />}

        {confirmAction && (
          <ConfirmationModal
            handleClose={handleCloseConfModal}
            isOpen
            action={confirmAction}
            msg={confirmMsg}
          />
        )}
        <Popover
          className="tab-menu-popover"
          id="tab-menu"
          anchorEl={menuEle}
          open={Boolean(menuEle)}
          onClose={() => setMenuEle(null)}
          getContentAnchorEl={null}
          PaperProps={{
            style: { width: '150px' },
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          {TABS_ACTIONS_ARRAY.map(action => (
            <MenuItem
              key={action}
              onClick={handleAction(action)}
              disabled={isActionDisabled(action)}
            >
              {action}
            </MenuItem>
          ))}
        </Popover>
      </Box>

      {isLoaded && worksheets.length < MAX_TABS_LENGTH_TO_ADD && (
        <Box
          className="cursor-pointer model-tab add-tab"
          height="36px"
          minWidth="36px"
          disabled={isViewMode}
          borderRadius={6}
          pl={1}
          pt={1}
          onClick={addNewWorksheet}
        >
          <AddIcon fontSize="small" />
        </Box>
      )}
    </Box>
  );
}

ModelWorkbookTabs.propTypes = {
  activeWorksheet: shape({}).isRequired,
  handleTabsUpdated: func,
  isLoaded: bool,
  isViewMode: bool.isRequired,
  onChangeActiveWorksheet: func.isRequired,
  onChangeEditingState: func,
  setActiveWorksheet: func.isRequired,
  setWorksheets: func.isRequired,
  tableWidth: number.isRequired,
  workbook: shape({}).isRequired,
  worksheets: arrayOf(shape({})).isRequired,
};

ModelWorkbookTabs.defaultProps = {
  isLoaded: true,
  handleTabsUpdated: () => {},
  onChangeEditingState: () => {},
};

const mapStateToProps = createStructuredSelector({
  activeWorksheet: getActiveWorksheet(),
  workbook: getWorkbook(),
  worksheets: getWorksheets(),
  isViewMode: getIsViewMode(),
});

export default connect(mapStateToProps, {
  setActiveWorksheet,
  setWorksheets,
})(ModelWorkbookTabs);
