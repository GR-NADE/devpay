import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import PublicInvoice from './pages/PublicInvoice';
import PaymentSuccess from './pages/PaymentSuccess';
import VerifyEmail from './pages/VerifyEmail';
import Settings from './pages/Settings';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

function App()
{
	return (
		<QueryClientProvider client = {queryClient}>
			<AuthProvider>
				<BrowserRouter>
					<Routes>
						<Route path = "/login" element = {<Login/>} />
						<Route path = "/register" element = {<Register/>} />
						<Route path = "/forgot-password" element = {<ForgotPassword/>} />
						<Route path = "/reset-password/:token" element = {<ResetPassword/>} />
						<Route path = "/verify-email/:token" element = {<VerifyEmail/>} />

						<Route path = "/pay/:token" element = {<PublicInvoice/>} />
						<Route path = "/pay/:token/success" element = {<PaymentSuccess/>} />

						<Route
							element={
								<ProtectedRoute>
									<Layout/>
								</ProtectedRoute>
							}>
								<Route path = "/dashboard" element = {<Dashboard/>} />
								<Route path = "/clients" element = {<Clients/>} />
								<Route path = "/invoices" element = {<Invoices/>} />
								<Route path = "/invoices/:id" element = {<InvoiceDetail/>} />
								<Route path = "/settings" element = {<Settings/>} />
						</Route>

						<Route path = "/" element = {<Navigate to = "/dashboard" replace />} />
						<Route path = "*" element = {<Navigate to = "/dashboard" replace />} />
					</Routes>
				</BrowserRouter>
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default App;