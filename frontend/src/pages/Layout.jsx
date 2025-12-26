import Sidebar from "@/components/main/Sidebar";
import React from "react";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <main className="relative flex flex-row w-full">
      <Sidebar />
      <div className="flex-1 md:ml-[240px] w-full">
        <Outlet />
      </div>
    </main>
  );
};

export default Layout;
