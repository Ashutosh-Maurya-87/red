import React, { useState } from 'react';
import { func, bool } from 'prop-types';

import ImportModal from '../../../../components/ImportModal';

import { API_URLS } from '../../../../configs/api';
import { DIMENSIONS_MSG } from '../../../../configs/messages';
import { GL_ACCOUNT_HEADER_NAMES } from '../configs';

import { httpPost } from '../../../../utils/http';
import { showSuccessMsg } from '../../../../utils/notifications';

const ImportDimensionModal = ({ handleData, isOpen, onClose }) => {
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
      formData.append('file_url', fileUrl);

      const { message = '' } = await httpPost(
        API_URLS.IMPORT_GL_ACCOUNT,
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

    const isInvalid = GL_ACCOUNT_HEADER_NAMES.find(header => {
      if (!headers.includes(header)) return true;

      return false;
    });

    if (isInvalid) {
      return { isValid: false, error: DIMENSIONS_MSG.import_valid_gl_data };
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
  handleData: func.isRequired,
  isOpen: bool.isRequired,
  onClose: func.isRequired,
};

export default ImportDimensionModal;
