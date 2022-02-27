import { MODELS_API } from '../../configs/api';
import { httpGet } from '../../utils/http';

/**
 * Store cancel tokens
 */
const cancelToken = [];

/*
 **
 * Get option as per type > API CALL
 */
export const getSugeestionOptions = async (id, type, pagination, search) => {
  try {
    const { limit, page } = pagination;

    let url = MODELS_API.GET_FORMULA_BUILDER_OPTS;
    url = url.replace('#TYPE#', type);
    url += `?workbook_id=${id}`;

    url += `&limit=${limit}`;
    url += `&page=${page}`;

    if (search) {
      url += `&name=${search}`;
    }

    return await httpGet(url, {
      hideError: true,
      callback: pushCancelToken,
    });
  } catch (error) {
    return error;
  }
};

/**
 * Push cancel tokens of API calls
 *
 * @param {Object} token
 */
export const pushCancelToken = token => {
  cancelToken.push(token);
};

/**
 * Cancel existing API Requests
 */
export const cancelExistingHttpRequests = () => {
  cancelToken.forEach(cancelFunc => cancelFunc());
};

/**
 * Remove current row from suggestion list
 */
export const removeExistingRow = (rowId, List) => {
  if (!rowId || (List && List.length == 0)) return List;

  const filteredList = List.filter(({ value }) => value != rowId);

  return filteredList;
};
