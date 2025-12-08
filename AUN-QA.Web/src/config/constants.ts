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
        Auth: {
            LOGIN: `${IDENTITY_BASE}/Auth/login`,
        }
    }
}