const SYSTEM_BASE = '/System';

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
        },
        SystemGroup: {
            GET_LIST: `${SYSTEM_BASE}/SystemGroup/get-list`,
            GET_BY_ID: `${SYSTEM_BASE}/SystemGroup/get-by-id`,
            INSERT: `${SYSTEM_BASE}/SystemGroup/insert`,
            UPDATE: `${SYSTEM_BASE}/SystemGroup/update`,
            DELETE_LIST: `${SYSTEM_BASE}/SystemGroup/delete-list`,
            GET_ALL_COMBOBOX: `${SYSTEM_BASE}/SystemGroup/get-all-combobox`,
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
        },
    },
    Catalog: {
        Faculty: {
            GET_LIST: `/Catalog/Faculty/get-list`,
            GET_BY_ID: `/Catalog/Faculty/get-by-id`,
            INSERT: `/Catalog/Faculty/insert`,
            UPDATE: `/Catalog/Faculty/update`,
            DELETE_LIST: `/Catalog/Faculty/delete-list`,
            GET_ALL_COMBOBOX: `/Catalog/Faculty/get-all-combobox`,
        },
        Cycle: {
            GET_LIST: `/Catalog/Cycle/get-list`,
            GET_BY_ID: `/Catalog/Cycle/get-by-id`,
            INSERT: `/Catalog/Cycle/insert`,
            UPDATE: `/Catalog/Cycle/update`,
            DELETE_LIST: `/Catalog/Cycle/delete-list`,
        },
        Council: {
            GET_LIST: `/Catalog/Council/get-list`,
            GET_BY_ID: `/Catalog/Council/get-by-id`,
            INSERT: `/Catalog/Council/insert`,
            UPDATE: `/Catalog/Council/update`,
            DELETE_LIST: `/Catalog/Council/delete-list`,
        },
        EvaluationSchedule: {
            GET_LIST: `/Catalog/EvaluationSchedule/get-list`,
            GET_BY_ID: `/Catalog/EvaluationSchedule/get-by-id`,
            INSERT: `/Catalog/EvaluationSchedule/insert`,
            UPDATE: `/Catalog/EvaluationSchedule/update`,
            DELETE_LIST: `/Catalog/EvaluationSchedule/delete-list`,
        }
    },
    Business: {
        Evidence: {
            GET_LIST: `/Business/Evidence/get-list`,
            GET_BY_ID: `/Business/Evidence/get-by-id`,
            INSERT: `/Business/Evidence/insert`,
            UPDATE: `/Business/Evidence/update`,
            DELETE_LIST: `/Business/Evidence/delete-list`,
            GET_ALL_COMBOBOX: `/Business/Evidence/get-all-combobox`,
        }
    },
    File: {
        UploadFile: {
            POST: `/File/api/UploadFile`,
            GET: `/File/`
        },   
    }
}