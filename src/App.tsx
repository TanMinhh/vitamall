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
          <Route path="products/:id" element={<ProductPage />}></Route>
          <Route path="search" element={<SearchResults />}></Route>
          <Route path="deals" element={<FlashDeals />}></Route>
          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<Checkout />}></Route>
            <Route path="orders" element={<MyOrders />}></Route>
            <Route path="orders/:id" element={<OrderTracking />}></Route>
            <Route path="addresses" element={<Addresses />}></Route>
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
