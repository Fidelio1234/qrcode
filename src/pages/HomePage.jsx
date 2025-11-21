import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './HomePage.css';

const numeroTavoli = 10;
const tavoli = Array.from({ length: numeroTavoli }, (_, i) => i + 1);

export default function HomePage() {
  const [occupati, setOccupati] = useState([]);

  const caricaOccupati = () => {
    fetch('https://qrcode-finale.onrender.com/api/tavoli/occupati')
      .then(res => res.json())
      .then(setOccupati)
      .catch(() => setOccupati([]));
  };

  useEffect(() => {
    caricaOccupati();
    const interval = setInterval(caricaOccupati, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">Benvenuto - QR Code Menù</h1>
        <p className="home-subtitle">Scansiona il QR code per ordinare dal tuo tavolo</p>
      </div>

      <div className="tavoli-grid">
        {tavoli.map(tavolo => {
          const isOccupato = occupati.includes(tavolo.toString());
          
          return (
            <div 
              key={tavolo} 
              className={`tavolo-card ${isOccupato ? 'tavolo-occupato' : ''}`}
              onClick={() => window.location.href = `/operatore?tavolo=${tavolo}`}
            >
              {/* AREA WiFi - MODIFICA QUI LA PASSWORD */}
              <div className="wifi-info">
                <div className="wifi-label">WiFi Password</div>
                <div className="wifi-password">Ristorante123</div>
              </div>

              {/* QR CODE */}
              <div className="qr-container">
                <QRCodeCanvas
                  value={`https://frontend-qrcode-psi.vercel.app/ordina?tavolo=${tavolo}`}
                  size={150}
                  fgColor={isOccupato ? '#e74c3c' : '#2c3e50'}
                  className="qr-code"
                />
              </div>

              {/* NUMERO TAVOLO */}
              <div className="tavolo-number">
                Tavolo {tavolo}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}