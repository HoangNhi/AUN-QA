import type { FC } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import UserPage from "./pages/system/User/UserPage";
import MainLayout from "./components/layout/MainLayout/MainLayout";
import FacultyPage from "./pages/catalog/faculty/FacultyPage";
import LoginPage from "./pages/system/Auth/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SystemGroupPage from "./pages/system/SystemGroup/SystemGroupPage";
import MenuPage from "./pages/system/Menu/MenuPage";
import RolePage from "./pages/system/Role";
import UnauthorizedPage from "./pages/common/UnauthorizedPage";

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
          <Route path="/systemgroup" element={<SystemGroupPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/role" element={<RolePage />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
