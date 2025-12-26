import React from 'react'
import Post from './Post'
import { useSelector } from 'react-redux'

const Posts = () => {
  const { posts } = useSelector(store => store.posts)
  // Filter out posts with missing authors (deleted users)
  const validPosts = posts?.filter(post => post && post.author) || []
  
  return (
    <div >
      {validPosts.map((post) => (
        <Post key={post._id} post={post} />
      ))}
    </div>
  )
}

export default Posts