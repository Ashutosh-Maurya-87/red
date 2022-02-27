import React, { useState } from 'react';
import { func, bool, arrayOf, shape } from 'prop-types';

import ImportModal from '../../../components/ImportModal';

import { API_URLS } from '../../../configs/api';
import { httpPost } from '../../../utils/http';
import { DIMENSIONS_MSG } from '../../../configs/messages';
import { showSuccessMsg } from '../../../utils/notifications';

const ImportDimensionModal = ({
  handleData,
  isOpen,
  onClose,
  dimensionHeaders,
  table,
}) => {
  const [showLoader, setLoader] = useState(false);

  /**
   * Handle Imported Data
   *
   * @param {Object}
   */
  const handleImportData = async ({ data = [], fileUrl }) => {
    try {
      setLoader(true);

      const formData = new FormData();
      formData.append('id', table.id);
      formData.append('file_url', fileUrl);

      const { message = '' } = await httpPost(
        API_URLS.IMPORT_DIMENSION,
        formData
      );

      if (message) {
        showSuccessMsg(message);
      }

      setLoader(false);
      handleData();
    } catch (e) {
      setLoader(false);
    }
  };

  /**
   * Validate File
   *
   * @param {Object} { data: [] }
   */
  const validateFile = ({ data }) => {
    const [headers = []] = data;
    // headers = headers.map(h => h.toLowerCase());

    const isInvalid = dimensionHeaders.find(({ display_name }) => {
      if (!headers.includes(display_name)) return true;

      return false;
    });

    if (isInvalid) {
      return { isValid: false, error: DIMENSIONS_MSG.import_valid_data };
    }

    return { isValid: true };
  };

  return (
    <ImportModal
      handleData={handleImportData}
      isOpen={isOpen}
      onClose={onClose}
      showLoader={showLoader}
      validateFile={validateFile}
    />
  );
};

ImportDimensionModal.propTypes = {
  dimensionHeaders: arrayOf(shape({})).isRequired,
  handleData: func.isRequired,
  isOpen: bool.isRequired,
  onClose: func.isRequired,
  table: shape({}),
};

ImportDimensionModal.defaultProps = {
  table: {},
};

export default ImportDimensionModal;
