import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios.js'
import toast from 'react-hot-toast'

const initialState = {
    value: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
}

export const fetchUser = createAsyncThunk(
    'user/fetchUser',
    async (token) => {

        if (!token) {
            throw new Error('No token found')
        }

        console.log("Token in userSlice.js", token)

        const { data } = await api.get('/api/user/data', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        console.log("Data in userSlice.js", data)

        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch user')
        }

        return data.user
    }
)


export const updateUser = createAsyncThunk(
    'user/update',
    async ({ userData, token }) => {

        if (!userData || !token) {
            return null
        }

        const { data } = await api.put(
            '/api/user/update',
            userData,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        )

        if (data.success) {
            toast.success(data.message)
            return data.user
        } else {
            toast.error(data.message)
            return null
        }
    }
)


const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUser.pending, (state) => {
                state.status = 'loading'
                state.error = null
            })
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.value = action.payload
                state.status = 'succeeded'
            })
            .addCase(fetchUser.rejected, (state, action) => {
                state.status = 'failed'
                state.error = action.error?.message || 'Failed to fetch user'
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.value = action.payload
            })
    }
})

export default userSlice.reducer