import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import BlockchainExplorer from './pages/BlockchainExplorer';
import NetworkGraph from './pages/NetworkGraph';
import ReputationDashboard from './pages/ReputationDashboard';
import MaliciousNodeDashboard from './pages/MaliciousNodeDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import DrugRecall from './pages/DrugRecall';
import Inventory from './pages/Inventory';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<ExecutiveDashboard />} />
            <Route path="blockchain" element={<BlockchainExplorer />} />
            <Route path="network" element={<NetworkGraph />} />
            <Route path="reputation" element={<ReputationDashboard />} />
            <Route path="malicious" element={<MaliciousNodeDashboard />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="recall" element={<DrugRecall />} />
            <Route path="inventory" element={<Inventory />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

