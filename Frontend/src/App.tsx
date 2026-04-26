import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuditProvider } from "./audit/AuditStore";
import AppLayout from "./layout/AppLayout";
import OperatorDashboard from "./pages/OperatorDashboard";
import InterventionsPage from "./pages/InterventionsPage";
import AuditPage from "./pages/AuditPage";
import Login from "./auth/Login";
import ProtectedRoute from "./auth/ProtectedRoute"; // <-- Importăm noua componentă

export default function App() {
  return (
    <AuditProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta publica - oricine poate accesa Login-ul */}
          <Route path="/login" element={<Login />} />

          {/* RUTE PROTEJATE */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<OperatorDashboard />} />
              <Route path="interventii" element={<InterventionsPage />} />
              <Route path="audit" element={<AuditPage />} />
            </Route>
          </Route>

          {/* Redirecționare fallback: daca scrie o ruta prost, il trimitem la baza aplicatiei (care va fi protejata) */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuditProvider>
  );
}