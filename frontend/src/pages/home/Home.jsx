import Feed from "@/components/main/Feed";
import RightSidebar from "@/components/main/RightSidebar";
import StoryTray from "@/components/main/StoryTray";
import useGetAllPosts from "@/hooks/useGetAllPosts";
import useGetSuggestedUsers from "@/hooks/useGetSugeestedUsers";
import React from "react";
import { Outlet } from "react-router-dom";

const Home = () => {
  useGetAllPosts();
  useGetSuggestedUsers();
  return (
    <main className="w-full flex flex-col md:flex-row gap-4 p-4 md:p-6">
      <div className="flex-1 w-full max-w-2xl mx-auto">
        <StoryTray />
        <Feed />
        <Outlet />
      </div>
      <div className="hidden lg:block lg:w-80">
        <RightSidebar />
      </div>
    </main>
  );
};

export default Home;
