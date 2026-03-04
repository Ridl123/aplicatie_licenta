import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuditProvider } from "./audit/AuditStore";
import AppLayout from "./layout/AppLayout";
import OperatorDashboard from "./pages/OperatorDashboard";
import InterventionsPage from "./pages/InterventionsPage";
import AuditPage from "./pages/AuditPage";

export default function App() {
  return (
    <AuditProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<OperatorDashboard />} />
            <Route path="interventii" element={<InterventionsPage />} />
            <Route path="audit" element={<AuditPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuditProvider>
  );
}