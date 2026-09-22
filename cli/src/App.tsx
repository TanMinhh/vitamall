import { Toaster } from "react-hot-toast"
import { Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import AppLayout from "./pages/AppLayout"
import Products from "./pages/Products"
import ProductPage from "./pages/ProductPage"
import Home from "./pages/Home"
import SearchResults from "./pages/SearchResults"
import FlashDeals from "./pages/FlashDeals"
import Checkout from "./pages/Checkout"
import MyOrders from "./pages/MyOrders"
import OrderTracking from "./pages/OrderTracking"
import Addresses from "./pages/Addresses"
import ProtectedRoute from "./components/ProtectedRoute"
import ErrorBoundary from "./ErrorBoundary"
import AdminLayout from "./pages/admin/AdminLayout"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminProducts from "./pages/admin/AdminProducts"
import AdminProductForm from "./pages/admin/AdminProductForm"
import AdminOrders from "./pages/admin/AdminOrders"
import AdminDeliveryPartners from "./pages/admin/AdminDeliveryPartners"
import DeliveryLogin from "./pages/delivery/DeliveryLogin"
import DeliveryLayout from "./pages/delivery/DeliveryLayout"
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard"

const App = () => {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: "#1B3022", color: "#fff", borderRadius: "12px", fontSize: "14px" } }}></Toaster>
      <Routes>
        {/* Auth Page - Login Page */}
        <Route path="/login" element={<Login />}></Route>
        {/* Main Page */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />}></Route>
          <Route path="products" element={<Products />}></Route>
          <Route path="products/:id" element={<ErrorBoundary><ProductPage /></ErrorBoundary>}></Route>
          <Route path="search" element={<SearchResults />}></Route>
          <Route path="deals" element={<FlashDeals />}></Route>
          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<Checkout />}></Route>
            <Route path="orders" element={<MyOrders />}></Route>
            <Route path="orders/:id" element={<OrderTracking />}></Route>
            <Route path="addresses" element={<Addresses />}></Route>
          </Route>
        </Route>
        {/*Admin pages*/}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />}></Route>
          <Route path="products/new" element={<AdminProductForm />}></Route>
          <Route path="products/:id/edit" element={<AdminProductForm />}></Route>
          <Route path="orders" element={<AdminOrders />}></Route>
          <Route path="delivery-partners" element={<AdminDeliveryPartners />}></Route>
        </Route>
        {/*Delivery Partner pages*/}
        <Route path="/delivery/login" element={<DeliveryLogin />}></Route>
        <Route path="/delivery" element={<DeliveryLayout />}>
          <Route index element={<DeliveryDashboard />}></Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
