import api, { type ApiResponse } from "@/lib/api";
import { API_ENDPOINTS } from "@/config/constants";
import type { LoginRequest, LoginResponse } from "@/types/system/auth.types";

export const authService = {
    login: async (request: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
        return api.post<LoginResponse>(API_ENDPOINTS.System.Auth.LOGIN, request);
    },
};
