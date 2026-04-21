// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Portal       from './pages/Portal';
import Login        from './pages/Login';
import Manager      from './pages/Manager';
import Cashier      from './pages/Cashier';
import CustomerKiosk from './pages/CustomerKiosk';
import MenuBoard    from './pages/MenuBoard';
import NotFound     from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Portal - links to all views */}
          <Route path="/"              element={<Portal />} />

          {/* Cashier & Manager require login */}
          <Route path="/login"         element={<Login />} />
          <Route path="/manager"       element={<Manager />} />
          <Route path="/cashier"       element={<Cashier />} />

          {/* Customer & Menu Board - no login needed */}
          <Route path="/kiosk"         element={<CustomerKiosk />} />
          <Route path="/menuboard"     element={<MenuBoard />} />

          {/* Fallback for 404 */}
          <Route path="*"              element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
