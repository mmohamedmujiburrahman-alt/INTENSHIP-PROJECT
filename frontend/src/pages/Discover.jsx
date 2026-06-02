import React, { useState } from 'react'
import { Search } from 'lucide-react'
import UserCard from '../components/UserCard'
import Loading from '../components/Loading'
import { useAuth } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import api from '../api/axios'

const Discover = () => {

    const [input, setInput] = useState('')
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)

    const { getToken } = useAuth()

    const handleSearch = async (e) => {
        if (e.key !== 'Enter') return
        if (!input.trim()) return

        try {
            setLoading(true)
            setUsers([])

            const token = await getToken()

            const { data } = await api.post(
                '/api/user/discover',
                { input },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            if (data.success) {
                setUsers(data.users)
            } else {
                toast.error(data.message)
            }

            setInput('') // ✅ FIXED

        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    // User data is fetched in App.jsx, no need to fetch again here

    return (
        <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white'>
            <div className='max-w-6xl mx-auto p-6'>

                {/* Title */}
                <div className='mb-8'>
                    <h1 className='text-3xl font-bold text-slate-900 mb-2'>
                        Discover people
                    </h1>
                    <p className='text-slate-600'>
                        Connect with amazing people and grow your network
                    </p>
                </div>

                {/* Search */}
                <div className='mb-8 shadow-md rounded-md border border-slate-200/60 bg-white/80'>
                    <div className='p-6'>
                        <div className='relative'>

                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5' />

                            <input
                                type="text"
                                placeholder='Search people by name, username, bio, or location...'
                                className='pl-10 sm:pl-12 w-full border border-gray-300 rounded-md max-sm:text-sm'
                                onChange={(e) => setInput(e.target.value)}
                                value={input}
                                onKeyDown={handleSearch}   // ✅ FIXED
                            />

                        </div>
                    </div>
                </div>

                {/* Users */}
                <div className='flex flex-wrap gap-6'>
                    {users.map((user) => (
                        <UserCard user={user} key={user._id} />
                    ))}
                </div>

                {/* Loading */}
                {loading && <Loading height='60vh' />}

            </div>
        </div>
    )
}

export default Discover