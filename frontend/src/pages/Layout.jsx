import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { dummyUserData } from '../assets/assets'
import Loading from '../components/Loading'
import { Menu, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import {useSelector} from 'react-redux'

const Layout = () => {
    
    const userState = useSelector((state)=> state.user)
    const user = userState.value
    const status = userState.status
    const [sidebarOpen, setSidebarOpen] = useState(false)
    if(status === 'loading') return <Loading />

    return user ? (
    <div className='w-full flex h-screen'>
        <Sidebar SidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className='flex-1 bg-slate-50'>
            <Outlet />
        </div>
       {
        sidebarOpen ?
        <X className='absolute top-3 right-3 p-2 z-100 bg-white rounded-md 
        shadow w-10 h-10 text-gray-600 sm:hidden' onClick={()=> setSidebarOpen(false)} />
        :
        <Menu className='absolute top-3 right-3 p-2 z-100 bg-white rounded-md
         shadow w-10 h-10 text-gray-600 sm:hidden' onClick={()=> setSidebarOpen(true)} />

    }   
    </div>
     ) : (
         <div className='flex items-center justify-center h-screen'>
          <div className='text-center'>
                <p className='text-lg text-slate-700 mb-4'>Unable to load user data.</p>
                {userState.error && <p className='text-sm text-red-600 mb-4'>{userState.error}</p>}
                <button onClick={()=> window.location.reload()} className='px-4 py-2 bg-indigo-600 text-white rounded'>Retry</button>
          </div>
         </div>
     )
}
export default Layout