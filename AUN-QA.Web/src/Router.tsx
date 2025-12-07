import type { FC } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home/HomePage";
import UserPage from "./pages/identity/User/UserPage";
import MainLayout from "./components/layout/MainLayout/MainLayout";
import FacultyPage from "./pages/assessment/faculty/FacultyPage";

const Router: FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/faculty" element={<FacultyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
