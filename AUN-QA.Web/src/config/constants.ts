const IDENTITY_BASE = '/Identity';

export const API_ENDPOINTS = {
    Identity: {
        User: {
            GET_LIST: `${IDENTITY_BASE}/User/get-list`,
            GET_BY_ID: `${IDENTITY_BASE}/User/get-by-id`,
            INSERT: `${IDENTITY_BASE}/User/insert`,
            UPDATE: `${IDENTITY_BASE}/User/update`,
            DELETE_LIST: `${IDENTITY_BASE}/User/delete-list`,
        },
        SystemGroup: {
            GET_LIST: `${IDENTITY_BASE}/SystemGroup/get-list`,
            GET_BY_ID: `${IDENTITY_BASE}/SystemGroup/get-by-id`,
            INSERT: `${IDENTITY_BASE}/SystemGroup/insert`,
            UPDATE: `${IDENTITY_BASE}/SystemGroup/update`,
            DELETE_LIST: `${IDENTITY_BASE}/SystemGroup/delete-list`,
            GET_ALL_COMBOBOX: `${IDENTITY_BASE}/SystemGroup/get-all-combobox`,
        },
        Menu: {
            GET_LIST: `${IDENTITY_BASE}/Menu/get-list`,
            GET_BY_ID: `${IDENTITY_BASE}/Menu/get-by-id`,
            INSERT: `${IDENTITY_BASE}/Menu/insert`,
            UPDATE: `${IDENTITY_BASE}/Menu/update`,
            DELETE_LIST: `${IDENTITY_BASE}/Menu/delete-list`,
        },
        Role: {
            GET_LIST: `${IDENTITY_BASE}/Role/get-list`,
            GET_BY_ID: `${IDENTITY_BASE}/Role/get-by-id`,
            INSERT: `${IDENTITY_BASE}/Role/insert`,
            UPDATE: `${IDENTITY_BASE}/Role/update`,
            DELETE_LIST: `${IDENTITY_BASE}/Role/delete-list`,
            GET_PERMISIONS_BY_ROLE: `${IDENTITY_BASE}/Role/get-permisions-by-role`,
        },
        Auth: {
            LOGIN: `${IDENTITY_BASE}/Auth/login`,
        }
    }
}