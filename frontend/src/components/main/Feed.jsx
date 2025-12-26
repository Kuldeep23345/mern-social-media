import React from "react";
import Posts from "./Posts";

const Feed = () => {
  return (
    <section className="w-full overflow-y-auto">
      <Posts />
    </section>
  );
};

export default Feed;
