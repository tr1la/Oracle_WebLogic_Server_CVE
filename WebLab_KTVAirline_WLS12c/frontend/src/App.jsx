import { Route, Routes, Outlet } from "react-router-dom";
import "./App.css";
import { Footer, Navbar } from "./components";
import {
    Confirm,
    FlightExplore,
    Flights,
    PassengerInfo,
    Payment,
    SeatSelect,
} from "./pages";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Profile from "./pages/Profile.jsx";
import BookingHistory from "./pages/BookingHistory.jsx";
import BookingDetail from "./pages/BookingDetail.jsx";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import News from "./pages/admin/News";
import NewsDetail from "./pages/NewsDetail";
import AdminPromotions from "./pages/admin/Promotions";
import Planes from "./pages/admin/Planes";
import AdminFlights from "./pages/admin/Flights";
import Bookings from "./pages/admin/Bookings";
import AllFlightDeals from './pages/AllFlightDeals';
import AllPlaces from './pages/AllPlaces';
import AllNews from './pages/AllNews';
import AllPromotions from './pages/AllPromotions';
import PlaceDetail from './pages/PlaceDetail';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import FlightConfirm from './pages/FlightConfirm';

const ClientLayout = () => {
    return (
        <>
            <Navbar />
            <Outlet />
            <Footer />
        </>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <div className="font-Nunito overflow-hidden max-w-[1440px] mx-auto">
                <Routes>
                    {/* Admin routes */}
                    <Route path="/admin" element={
                        <ProtectedRoute>
                            <AdminLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Dashboard />} />
                        <Route path="news" element={<News />} />
                        <Route path="promotions" element={<AdminPromotions />} />
                        <Route path="planes" element={<Planes />} />
                        <Route path="flights" element={<AdminFlights />} />
                        <Route path="bookings" element={<Bookings />} />
                    </Route>

                    {/* Client routes */}
                    <Route path="/" element={<ClientLayout />}>
                        <Route index element={<Flights />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="booking-history" element={<BookingHistory />} />
                        <Route path="booking/:id" element={<BookingDetail />} />
                        <Route path="explore" element={<FlightExplore />} />
                        <Route path="passenger-info" element={<PassengerInfo />} />
                        <Route path="seat-selection" element={<SeatSelect />} />
                        <Route path="payment" element={<Payment />} />
                        <Route path="confirm" element={<Confirm />} />
                        <Route path="news/:id" element={<NewsDetail />} />
                        <Route path="all-flight-deals" element={<AllFlightDeals />} />
                        <Route path="all-places" element={<AllPlaces />} />
                        <Route path="promotions" element={<AllPromotions />} />
                        <Route path="all-news" element={<AllNews />} />
                        <Route path="news-detail" element={<NewsDetail />} />
                        <Route path="place-detail" element={<PlaceDetail />} />
                        <Route path="flight/:id/confirm" element={<FlightConfirm />} />
                        <Route path="flight/:id/seat-selection" element={<SeatSelect />} />
                    </Route>
                </Routes>
                <ToastContainer
                    position="bottom-center"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="dark"
                />
            </div>
        </AuthProvider>
    );
};

export default App;
