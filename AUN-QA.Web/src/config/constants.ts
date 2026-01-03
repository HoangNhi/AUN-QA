const SYSTEM_BASE = "/System";
const CATALOG_BASE = "/Catalog";
const BUSINESS_BASE = "/Business";
const FILE_BASE = "/File";

export const API_ENDPOINTS = {
  System: {
    User: {
      GET_LIST: `${SYSTEM_BASE}/User/get-list`,
      GET_BY_ID: `${SYSTEM_BASE}/User/get-by-id`,
      INSERT: `${SYSTEM_BASE}/User/insert`,
      UPDATE: `${SYSTEM_BASE}/User/update`,
      DELETE_LIST: `${SYSTEM_BASE}/User/delete-list`,
      GET_CURRENT_USER: `${SYSTEM_BASE}/User/get-current-user`,
      GET_ALL_COMBOBOX: `${SYSTEM_BASE}/User/get-all-combobox`,
      EDIT_PROFILE: `${SYSTEM_BASE}/User/edit-profile`,
      CHANGE_PASSWORD: `${SYSTEM_BASE}/User/change-password`,
    },
    SystemGroup: {
      GET_LIST: `${SYSTEM_BASE}/SystemGroup/get-list`,
      GET_BY_ID: `${SYSTEM_BASE}/SystemGroup/get-by-id`,
      INSERT: `${SYSTEM_BASE}/SystemGroup/insert`,
      UPDATE: `${SYSTEM_BASE}/SystemGroup/update`,
      DELETE_LIST: `${SYSTEM_BASE}/SystemGroup/delete-list`,
      GET_ALL_COMBOBOX: `${SYSTEM_BASE}/SystemGroup/get-all-combobox`,
      GET_ALL_NOT_PARENT_COMBOBOX: `${SYSTEM_BASE}/SystemGroup/get-all-not-parent-combobox`,
      GET_ALL: `${SYSTEM_BASE}/SystemGroup/get-all`,
    },
    Menu: {
      GET_LIST: `${SYSTEM_BASE}/Menu/get-list`,
      GET_BY_ID: `${SYSTEM_BASE}/Menu/get-by-id`,
      INSERT: `${SYSTEM_BASE}/Menu/insert`,
      UPDATE: `${SYSTEM_BASE}/Menu/update`,
      DELETE_LIST: `${SYSTEM_BASE}/Menu/delete-list`,
      GET_LIST_BY_USER: `${SYSTEM_BASE}/Menu/get-list-by-user`,
    },
    Role: {
      GET_LIST: `${SYSTEM_BASE}/Role/get-list`,
      GET_BY_ID: `${SYSTEM_BASE}/Role/get-by-id`,
      INSERT: `${SYSTEM_BASE}/Role/insert`,
      UPDATE: `${SYSTEM_BASE}/Role/update`,
      DELETE_LIST: `${SYSTEM_BASE}/Role/delete-list`,
      GET_ALL_COMBOBOX: `${SYSTEM_BASE}/Role/get-all-combobox`,
      GET_PERMISSIONS_BY_ROLE: `${SYSTEM_BASE}/Role/get-permissions-by-role`,
      UPDATE_PERMISSIONS: `${SYSTEM_BASE}/Role/update-permissions`,
      GET_PERMISSIONS_BY_USER: `${SYSTEM_BASE}/Role/get-permissions-by-user`,
    },
    Auth: {
      LOGIN: `${SYSTEM_BASE}/Auth/login`,
      REFRESH_TOKEN: `${SYSTEM_BASE}/Auth/refresh-token`,
    },
  },
  Catalog: {
    Faculty: {
      GET_LIST: `${CATALOG_BASE}/Faculty/get-list`,
      GET_BY_ID: `${CATALOG_BASE}/Faculty/get-by-id`,
      INSERT: `${CATALOG_BASE}/Faculty/insert`,
      UPDATE: `${CATALOG_BASE}/Faculty/update`,
      DELETE_LIST: `${CATALOG_BASE}/Faculty/delete-list`,
      GET_ALL_COMBOBOX: `${CATALOG_BASE}/Faculty/get-all-combobox`,
    },
    Cycle: {
      GET_LIST: `${CATALOG_BASE}/Cycle/get-list`,
      GET_BY_ID: `${CATALOG_BASE}/Cycle/get-by-id`,
      INSERT: `${CATALOG_BASE}/Cycle/insert`,
      UPDATE: `${CATALOG_BASE}/Cycle/update`,
      DELETE_LIST: `${CATALOG_BASE}/Cycle/delete-list`,
    },
    Stakeholder: {
      GET_LIST: `${CATALOG_BASE}/Stakeholder/get-list`,
      GET_BY_ID: `${CATALOG_BASE}/Stakeholder/get-by-id`,
      INSERT: `${CATALOG_BASE}/Stakeholder/insert`,
      UPDATE: `${CATALOG_BASE}/Stakeholder/update`,
      DELETE_LIST: `${CATALOG_BASE}/Stakeholder/delete-list`,
      GET_ALL_COMBOBOX: `${CATALOG_BASE}/Stakeholder/get-all-combobox`,
    },
  },
  Business: {
    Evidence: {
      GET_LIST: `${BUSINESS_BASE}/Evidence/get-list`,
      GET_BY_ID: `${BUSINESS_BASE}/Evidence/get-by-id`,
      INSERT: `${BUSINESS_BASE}/Evidence/insert`,
      UPDATE: `${BUSINESS_BASE}/Evidence/update`,
      DELETE_LIST: `${BUSINESS_BASE}/Evidence/delete-list`,
      GET_ALL_COMBOBOX: `${BUSINESS_BASE}/Evidence/get-all-combobox`,
    },
  },
  File: {
    UploadFile: {
      POST: `${FILE_BASE}/api/UploadFile`,
      GET: `${FILE_BASE}/`,
    },
  },
};
