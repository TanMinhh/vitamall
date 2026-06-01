import { Outlet } from "react-router-dom"
import Banner from "../components/Banner"
import Navbar from "../components/Navbar"

const AppLayout = () => {
    return (
        <>
            <Banner></Banner>
            <Navbar></Navbar>
            <main className="min-h-screen">
                <Outlet></Outlet>
            </main>
            <p>Footer</p>
            <p>CartSidebar</p>
        </>
    )
}

export default AppLayout
