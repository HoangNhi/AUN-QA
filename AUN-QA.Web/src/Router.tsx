import type { FC } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Page from "./components/test";

const Router: FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Page />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
