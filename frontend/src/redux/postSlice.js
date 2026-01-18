import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  posts: [],
  selectedPost: null,
  stories: [],
};

export const postSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload;
    },
    setSlectedPost: (state, action) => {
      state.selectedPost = action.payload;
    },
    setStories: (state, action) => {
      state.stories = action.payload;
    },
  },
});

export const { setPosts, setSlectedPost, setStories } = postSlice.actions;

export default postSlice.reducer;
