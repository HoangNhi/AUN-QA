import http from "@/lib/http";
import type { Payment } from "@/pages/identity/User/columns";

export const userService = {
  getUsers: async (): Promise<Payment[]> => {
    // Replace '/users' with your actual endpoint
    const response = await http.get<Payment[]>("/users");
    return response.data;
  },
  
  // Example of other methods
  // getUserById: (id: string) => http.get(`/users/${id}`),
  // createUser: (data: any) => http.post('/users', data),
  // updateUser: (id: string, data: any) => http.put(`/users/${id}`, data),
  // deleteUser: (id: string) => http.delete(`/users/${id}`),
};
