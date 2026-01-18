import Sidebar from "@/components/main/Sidebar";
import BottomBar from "@/components/main/BottomBar";
import React from "react";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="flex flex-col md:flex-row w-full min-h-screen">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 w-full pb-16 md:pb-0 md:ml-[240px]">
        <Outlet />
      </main>
      <BottomBar />
    </div>
  );
};

export default Layout;
