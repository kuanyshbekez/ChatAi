// src/components/pwa/ServiceWorkerRegistration.tsx
"use client";

import type { FC } from 'react';
import { useEffect } from 'react';

const ServiceWorkerRegistration: FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Wait for the window to load before registering the service worker
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  return null; // This component does not render any UI
};

export default ServiceWorkerRegistration;
