import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import instance from '@/lib/axios.instance'
import { toast } from 'sonner'
import { setAuthUser, setSuggestedUser } from '@/redux/authSlice'

const SuggestedUsers = () => {
    const { suggestedUser, user } = useSelector(store => store.auth)
    const dispatch = useDispatch()
    const [followingStates, setFollowingStates] = useState({})
    const [loadingStates, setLoadingStates] = useState({})

    // Initialize following states
    React.useEffect(() => {
        if (user && suggestedUser) {
            const states = {}
            suggestedUser.forEach(suggested => {
                const isFollowing = user.following?.some(
                    (id) => id?.toString() === suggested._id?.toString()
                ) || false
                states[suggested._id] = isFollowing
            })
            setFollowingStates(states)
        }
    }, [user, suggestedUser])

    const handleFollow = async (targetUserId) => {
        if (!user || loadingStates[targetUserId]) return

        setLoadingStates(prev => ({ ...prev, [targetUserId]: true }))
        
        try {
            const res = await instance.post(`/user/followorunfollow/${targetUserId}`)
            if (res.data.success) {
                toast.success(res.data.message)
                
                // Update following state
                const wasFollowing = followingStates[targetUserId]
                setFollowingStates(prev => ({ ...prev, [targetUserId]: !wasFollowing }))
                
                // Update user's following list in Redux
                if (user.following) {
                    const updatedFollowing = wasFollowing
                        ? user.following.filter(id => id?.toString() !== targetUserId?.toString())
                        : [...user.following, targetUserId]
                    
                    dispatch(setAuthUser({ ...user, following: updatedFollowing }))
                }
                
                // Update suggested users list
                const updatedSuggested = suggestedUser.map(suggested => {
                    if (suggested._id?.toString() === targetUserId?.toString()) {
                        const updatedFollowers = wasFollowing
                            ? (suggested.followers || []).filter(id => id?.toString() !== user._id?.toString())
                            : [...(suggested.followers || []), user._id]
                        return { ...suggested, followers: updatedFollowers }
                    }
                    return suggested
                })
                dispatch(setSuggestedUser(updatedSuggested))
            }
        } catch (error) {
            console.error('Error in follow/unfollow:', error)
            toast.error(error?.response?.data?.message || 'Failed to follow/unfollow')
        } finally {
            setLoadingStates(prev => ({ ...prev, [targetUserId]: false }))
        }
    }

    return (
        <section className='my-10 pr-20'>
            <div className="flex items-center justify-between text-sm">
                <h1 className="font-semibold text-gray-600">Suggested for you</h1>
                <span className='font-medium cursor-pointer'>See All</span>
            </div>
            {
                suggestedUser?.map((suggested) => {
                    const isFollowing = followingStates[suggested._id] || false
                    const isLoading = loadingStates[suggested._id] || false
                    
                    return (
                        <div key={suggested._id} className='flex justify-between items-center px-0.5 my-3'>
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <Link to={`/profile/${suggested._id}`}>
                                    <Avatar>
                                        <AvatarImage className={'object-cover'} src={suggested?.profilePicture} />
                                        <AvatarFallback>
                                            {suggested?.username?.charAt(0)?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <h1 className="font-semibold text-sm truncate">
                                        <Link to={`/profile/${suggested._id}`}>{suggested?.username}</Link>
                                    </h1>
                                    <span className="text-gray-600 text-xs truncate">{suggested?.bio || 'bio here....'}</span>
                                </div>
                            </div>
                            <span 
                                className={`text-xs font-bold cursor-pointer hover:text-[#007dd1] transition-colors ${
                                    isFollowing ? 'text-gray-600' : 'text-[#3BADF8]'
                                }`}
                                onClick={() => handleFollow(suggested._id)}
                            >
                                {isLoading ? '...' : (isFollowing ? 'Following' : 'Follow')}
                            </span>
                        </div>
                    )
                })
            }
        </section>
    )
}

export default SuggestedUsers