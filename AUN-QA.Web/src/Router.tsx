import type { FC } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home/HomePage";
import UserPage from "./pages/identity/User/UserPage";
import MainLayout from "./components/layout/MainLayout/MainLayout";
import FacultyPage from "./pages/assessment/faculty/FacultyPage";
import LoginPage from "./pages/identity/Auth/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SystemGroupPage from "./pages/identity/SystemGroup/SystemGroupPage";
import MenuPage from "./pages/identity/Menu/MenuPage";
import RolePage from "./pages/identity/Role";

const Router: FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Unauthenticated Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/faculty" element={<FacultyPage />} />
          <Route path="/system-group" element={<SystemGroupPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/role" element={<RolePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
