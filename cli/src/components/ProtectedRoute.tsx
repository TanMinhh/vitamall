import { Navigate, Outlet } from "react-router-dom"
import { useAppSelector } from "../store/hooks"
import Loading from "./Loading"

const ProtectedRoute = () => {

    const { user, loading } = useAppSelector((state) => state.auth)
    if (loading)
        return <Loading />
    if (!user)
        return <Navigate to="/login" replace />

    return (
        <Outlet />
    )
}

export default ProtectedRoute
