import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import './OperatorePage.css';

function useQuery() {
  const location = useLocation();
  return new URLSearchParams(location.search);
}

export default function OperatorePage() {
  const [ordini, setOrdini] = useState([]);
  const [mostraModalChiusura, setMostraModalChiusura] = useState(false);
  const [mostraModalConfermaChiusura, setMostraModalConfermaChiusura] = useState(false);
  const [messaggioSuccesso, setMessaggioSuccesso] = useState('');
  const [filtroStato, setFiltroStato] = useState('tutti');
  const query = useQuery();
  const tavoloFiltro = query.get('tavolo');

  const tavoloCorrente = tavoloFiltro && tavoloFiltro !== 'null' ? tavoloFiltro : null;
  const isAreaOperatore = !tavoloCorrente;
  const isChiusuraTavolo = !!tavoloCorrente;










  // ✅ USE CALLBACK PER LE FUNZIONI
  /*const caricaOrdini = useCallback(() => {
    fetch('https://qrcode-finale.onrender.com/api/ordini')
      .then(res => {
        if (!res.ok) throw new Error('Error loading orders');
        return res.json();
      })
      .then(data => {
        console.log('📋 Active orders loaded:', data.length);
        setOrdini(data);
      })
      .catch(err => {
        console.error('❌ Error loading orders:', err);
        setOrdini([]);
      });
  }, []);

  const caricaOrdiniCompleti = useCallback(() => {
    fetch('https://qrcode-finale.onrender.com/api/ordini/completo')
      .then(res => {
        if (!res.ok) throw new Error('Error loading complete orders');
        return res.json();
      })
      .then(data => {
        console.log('📋 Complete orders loaded:', data.length);
        
        // ✅ ORDINA GLI ORDINI: I PIÙ RECENTI PRIMA
        const ordiniOrdinati = data.sort((a, b) => {
          const dataA = new Date(a.timestamp || a.chiusoIl || a.dataOra);
          const dataB = new Date(b.timestamp || b.chiusoIl || b.dataOra);
          return dataB - dataA; // Dal più recente al più vecchio
        });
        
        setOrdini(ordiniOrdinati);
      })
      .catch(err => {
        console.error('❌ Error loading complete orders:', err);
        setOrdini([]);
      });
  }, []);

*/








const caricaOrdini = useCallback(() => {
  console.log('🔍 DEBUG: Chiamando /api/ordini per tavolo:', tavoloCorrente);
  
  fetch('https://qrcode-finale.onrender.com/api/ordini')
    .then(res => {
      if (!res.ok) throw new Error('Error loading orders');
      return res.json();
    })
    .then(data => {
      console.log('📋 Ordini ATTIVI ricevuti:', data.map(o => ({ id: o.id, stato: o.stato, tavolo: o.tavolo })));
      setOrdini(data);
    })
    .catch(err => {
      console.error('❌ Error loading orders:', err);
      setOrdini([]);
    });
}, [tavoloCorrente]); // ⬅️ AGGIUNGI tavoloCorrente QUI

const caricaOrdiniCompleti = useCallback(() => {
  console.log('🔍 DEBUG: Chiamando /api/ordini/completo');
  
  fetch('https://qrcode-finale.onrender.com/api/ordini/completo')
    .then(res => {
      if (!res.ok) throw new Error('Error loading complete orders');
      return res.json();
    })
    .then(data => {
      console.log('📋 Ordini COMPLETI ricevuti:', data.length);
      
      const ordiniOrdinati = data.sort((a, b) => {
        const dataA = new Date(a.timestamp || a.chiusoIl || a.dataOra);
        const dataB = new Date(b.timestamp || b.chiusoIl || b.dataOra);
        return dataB - dataA;
      });
      
      setOrdini(ordiniOrdinati);
    })
    .catch(err => {
      console.error('❌ Error loading complete orders:', err);
      setOrdini([]);
    });
}, []); // ⬅️ Qui non serve tavoloCorrente











  const evadiOrdine = useCallback((id) => {
    fetch(`https://qrcode-finale.onrender.com/api/ordini/${id}/evaso`, { 
      method: 'POST' 
    })
      .then(res => {
        if (!res.ok) throw new Error('Error marking order as completed');
        caricaOrdini();
      })
      .catch(err => {
        console.error('❌ Error completing order:', err);
        alert('Error marking order as completed');
      });
  }, [caricaOrdini]);

  const verificaChiusuraTavolo = useCallback(() => {
    if (!tavoloCorrente) {
      alert('Select a table to close orders.');
      return;
    }

    const ordiniDelTavolo = ordini.filter(o => o.tavolo.toString() === tavoloCorrente);
    if (ordiniDelTavolo.length === 0) {
      alert(`No orders for table ${tavoloCorrente}.`);
      return;
    }

    const ordiniNonEvasi = ordiniDelTavolo.filter(o => o.stato !== 'evaso' && o.stato !== 'chiuso');
    
    if (ordiniNonEvasi.length > 0) {
      setMostraModalChiusura(true);
    } else {
      setMostraModalConfermaChiusura(true);
    }
  }, [tavoloCorrente, ordini]);

  const confermaChiusuraTavolo = useCallback(() => {
    console.log('🔄 Attempting to close table:', tavoloCorrente);
    
    fetch(`https://qrcode-finale.onrender.com/api/ordini/tavolo/${tavoloCorrente}`, {
      method: 'DELETE'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Error in server response');
        }
        return response.json();
      })
      .then(data => {
        console.log('✅ Table closure response:', data);
        caricaOrdini();
        setMostraModalConfermaChiusura(false);
        
        localStorage.removeItem(`carrello_${tavoloCorrente}`);
        localStorage.removeItem(`copertoConfermato_${tavoloCorrente}`);
        localStorage.removeItem(`numeroPersone_${tavoloCorrente}`);
        
        localStorage.setItem(`carrello_${tavoloCorrente}`, '[]');
        localStorage.setItem(`copertoConfermato_${tavoloCorrente}`, 'false');
        
        console.log('💾 Table closed - localStorage cleaned');
        window.dispatchEvent(new Event('storage'));
        
        setMessaggioSuccesso(`Table ${tavoloCorrente} closed! Orders have been archived.`);
      })
      .catch(error => {
        console.error('❌ Error closing table:', error);
        setMostraModalConfermaChiusura(false);
        alert('Error closing table: ' + error.message);
      });
  }, [tavoloCorrente, caricaOrdini]);

  const chiudiTavolo = useCallback(() => {
    verificaChiusuraTavolo();
  }, [verificaChiusuraTavolo]);





// Aggiungi questa funzione al componente OperatorePage
const stampaTotaleTavolo = useCallback(async () => {
  if (!tavoloCorrente) {
    alert('Seleziona un tavolo per stampare il totale');
    return;
  }

  try {
    const response = await fetch(`https://qrcode-finale.onrender.com/api/tavoli/${tavoloCorrente}/stampa-totale`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Totale stampato:', data.message);
      setMessaggioSuccesso(`Totale tavolo ${tavoloCorrente} stampato! Importo: € ${data.totale.toFixed(2)}`);
    } else {
      alert('Errore stampa totale: ' + data.error);
    }
  } catch (error) {
    console.error('❌ Errore stampa totale:', error);
    alert('Errore di connessione durante la stampa');
  }
}, [tavoloCorrente]);


// ✅ USE EFFECT CORRETTO
  /*useEffect(() => {
    if (isAreaOperatore) {
      caricaOrdiniCompleti();
    } else {
      caricaOrdini();
    }
    
    const interval = setInterval(() => {
      if (isAreaOperatore) {
        caricaOrdiniCompleti();
      } else {
        caricaOrdini();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isAreaOperatore, caricaOrdini, caricaOrdiniCompleti]);

*/




// ✅ USE EFFECT CORRETTO - FIX AUTO-EVASIONE
useEffect(() => {
  console.log('🔄 Caricamento ordini - Modalità:', isAreaOperatore ? 'Operatore' : 'Tavolo ' + tavoloCorrente);
  
  if (isAreaOperatore) {
    caricaOrdiniCompleti();
    
    // ✅ SOLO AREA OPERATORE: refresh ogni 10 secondi
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh area operatore');
      caricaOrdiniCompleti();
    }, 10000);
    
    return () => clearInterval(interval);
  } else {
    // ✅ TAVOLO SPECIFICO: carica SOLO UNA VOLTA
    console.log('📋 Caricamento una tantum per tavolo:', tavoloCorrente);
    caricaOrdini();
    
    // ❌ NESSUN INTERVAL PER TAVOLI SPECIFICI
    return () => {}; // Cleanup vuoto
  }
}, [isAreaOperatore, tavoloCorrente, caricaOrdini, caricaOrdiniCompleti]);




  useEffect(() => {
    if (messaggioSuccesso) {
      const timer = setTimeout(() => setMessaggioSuccesso(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [messaggioSuccesso]);

  // ✅ FILTER ORDERS
  const ordiniFiltrati = useMemo(() => {
    return tavoloCorrente
      ? ordini.filter(o => o.tavolo.toString() === tavoloCorrente)
      : ordini.filter(o => {
          if (filtroStato === 'tutti') return true;
          return o.stato === filtroStato;
        });
  }, [tavoloCorrente, ordini, filtroStato]);

  // ✅ USE MEMO PER ORDINI PER TAVOLO
  const ordiniPerTavolo = useMemo(() => {
    const result = {};
    if (isAreaOperatore && filtroStato === 'chiuso') {
      ordiniFiltrati.forEach(ordine => {
        if (!result[ordine.tavolo]) {
          result[ordine.tavolo] = [];
        }
        result[ordine.tavolo].push(ordine);
      });
    }
    return result;
  }, [isAreaOperatore, filtroStato, ordiniFiltrati]);

  const ordiniNonEvasi = useMemo(() => 
    ordiniFiltrati.filter(o => o.stato !== 'evaso' && o.stato !== 'chiuso'),
    [ordiniFiltrati]
  );

  const totaleTavolo = useMemo(() => 
    ordiniFiltrati.reduce((totale, ordine) => {
      const totaleOrdine = ordine.ordinazione.reduce((acc, item) => acc + (item.prezzo * item.quantità), 0);
      return totale + totaleOrdine;
    }, 0),
    [ordiniFiltrati]
  );

  // ✅ FUNCTION TO GET TABLE TOTAL (for closed tables) - CALCOLO DIRETTO
  const getTotaleTavoloChiuso = useCallback((tavolo) => {
    const ordiniTavolo = ordiniPerTavolo[tavolo] || [];
    const totale = ordiniTavolo.reduce((totale, ordine) => {
      const totaleOrdine = ordine.ordinazione.reduce((sum, item) => {
        const quantita = item.quantità || 1;
        const prezzo = parseFloat(item.prezzo) || 0;
        return sum + (prezzo * quantita);
      }, 0);
      return totale + totaleOrdine;
    }, 0);
    
    console.log(`💰 Tavolo ${tavolo}: €${totale.toFixed(2)}`);
    return parseFloat(totale.toFixed(2));
  }, [ordiniPerTavolo]);

  // DEBUG: Verifica che i totali vengano calcolati
  console.log('🔍 DEBUG TAVOLI CHIUSI:', {
    numeroTavoli: Object.keys(ordiniPerTavolo).length,
    primoTavolo: Object.keys(ordiniPerTavolo)[0],
    ordiniPrimoTavolo: ordiniPerTavolo[Object.keys(ordiniPerTavolo)[0]]?.length,
    totalePrimoTavolo: Object.keys(ordiniPerTavolo)[0] ? getTotaleTavoloChiuso(Object.keys(ordiniPerTavolo)[0]) : 0
  });

  const formattaElementoOrdine = useCallback((item, index) => {
    if (isAreaOperatore) {
      return (
        <li key={index} className="ordine-riga">
          <span className="quantita">{item.quantità} x</span>
          <span className="prodotto">{item.prodotto}</span>
          <span className="prezzo">€ {(item.prezzo * item.quantità).toFixed(2)}</span>
        </li>
      );
    } else {
      return (
        <li key={index} className="ordine-riga">
          <span className="quantita">{item.quantità} x</span>
          <span className="prodotto">{item.prodotto}</span>
          <span className="prezzo">€ {(item.prezzo * item.quantità).toFixed(2)}</span>
        </li>
      );
    }
  }, [isAreaOperatore]);

  const getStatoColore = useCallback((stato) => {
    switch(stato) {
      case 'in_attesa': return '#3498db';
      case 'evaso': return '#27ae60';
      case 'chiuso': return '#95a5a6';
      default: return '#3498db';
    }
  }, []);

  const getStatoTesto = useCallback((stato) => {
    switch(stato) {
      case 'in_attesa': return 'IN ATTESA';
      case 'evaso': return 'COMPLETATO';
      case 'chiuso': return 'CHIUSO';
      default: return stato;
    }
  }, []);

  return (
    <div className={`operatore-container ${isAreaOperatore ? 'area-operatore' : 'chiusura-tavolo'}`}>
      <h2>
        {tavoloCorrente ? `Ordini - Tavolo ${tavoloCorrente}` : 'Area Operatore - Tutti gli Ordini'}
      </h2>

      {messaggioSuccesso && (
        <div className="messaggio-successo">
          {messaggioSuccesso}
        </div>
      )}

      {isAreaOperatore && (
        <div className="filtri-stato">
       
          <button 
            className={`filtro-btn ${filtroStato === 'in_attesa' ? 'attivo' : ''}`}
            onClick={() => setFiltroStato('in_attesa')}
          >
            In Attesa
          </button>
          <button 
            className={`filtro-btn ${filtroStato === 'evaso' ? 'attivo' : ''}`}
            onClick={() => setFiltroStato('evaso')}
          >
            Completati
          </button>
          <button 
            className={`filtro-btn ${filtroStato === 'chiuso' ? 'attivo' : ''}`}
            onClick={() => setFiltroStato('chiuso')}
          >
            Chiusi
          </button>
        </div>
      )}








   {tavoloCorrente && (
  <div className="tavolo-header">
    <button className="button-chiudi" onClick={chiudiTavolo}>
      Chiudi Tavolo {tavoloCorrente}
    </button>

    {/* ✅ NUOVO PULSANTE STAMPA TOTALE */}
    <button 
      className="button-stampa-totale" 
      onClick={stampaTotaleTavolo}
      disabled={ordiniFiltrati.length === 0}
    >
      🖨️ Stampa Totale Tavolo
    </button>

    {ordiniNonEvasi.length > 0 && (
      <div className="avviso-non-evasi">
        ⚠️ {ordiniNonEvasi.length} ordine/i non completato/i
      </div>
    )}
  </div>
)}
      {ordiniFiltrati.length === 0 && (
        <p className="nessun-ordine">
          {isAreaOperatore ? 'Nessun ordine trovato' : 'Nessun ordine attivo per questo tavolo'}
        </p>
      )}

      <div className="ordini-scroll">
        <ul className="ordini-list">
          {/* ✅ SPECIAL VIEW FOR CLOSED TABLES - GROUPED BY TABLE */}
          {isAreaOperatore && filtroStato === 'chiuso' ? (
            Object.keys(ordiniPerTavolo).map(tavolo => {
              const ordiniTavolo = ordiniPerTavolo[tavolo];
              const totaleTavolo = getTotaleTavoloChiuso(tavolo);
              
              return (
                <li key={tavolo} className="tavolo-chiuso-group">
                  <div className="tavolo-chiuso-header">
                    <h3>Tavolo {tavolo} - Chiuso</h3>
                    <div className="totale-tavolo-chiuso">
                      💰 Totale: € {totaleTavolo.toFixed(2)}
                      <small style={{display: 'block', fontSize: '0.8rem', opacity: 0.8}}>
                        ({ordiniTavolo.length} ordini)
                      </small>
                    </div>
                  </div>
                  
                  {ordiniTavolo.map(o => (
                    <div key={o.id} className="ordine-item chiuso" style={{ borderLeftColor: getStatoColore(o.stato) }}>
                      <div className="ordine-header">
                        <div className="ordine-info">
                          <span className="ordine-stato" style={{ color: getStatoColore(o.stato) }}>
                            {getStatoTesto(o.stato)}
                          </span>
                          {o.dataOra && <span className="ordine-data">• Aperto {o.dataOra}</span>}
                          {o.chiusoIl && <span className="ordine-data">• Chiuso: {o.chiusoIl}</span>}
                        </div>
                      </div>
                      
                      <ul className="ordine-dettagli">
                        {o.ordinazione.map((item, i) => formattaElementoOrdine(item, i))}
                      </ul>
                      
                      <div className="ordine-totale">
                        Totale Ordine: € {o.totale ? o.totale.toFixed(2) : 
                          o.ordinazione.reduce((sum, item) => sum + (item.prezzo * item.quantità), 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </li>
              );
            })
          ) : (
            // ✅ NORMAL VIEW FOR OTHER FILTERS
            ordiniFiltrati.map(o => (
              <li key={o.id} className="ordine-item" style={{ borderLeftColor: getStatoColore(o.stato) }}>
                <div className="ordine-header">
                  <div className="ordine-info">
                    <span className="tavolo-numero">Tavolo {o.tavolo}</span>
                    <span className="ordine-stato" style={{ color: getStatoColore(o.stato) }}>
                      {getStatoTesto(o.stato)}
                    </span>
                    {o.dataOra && <span className="ordine-data">• {o.dataOra}</span>}
                  </div>
                  {(o.stato === 'in_attesa' || o.stato === 'stampato') && (
                    <span className="badge-non-evaso">DA COMPLETARE</span>
                  )}
                </div>
                
                <ul className="ordine-dettagli">
                  {o.ordinazione.map((item, i) => formattaElementoOrdine(item, i))}
                </ul>
                
                {o.chiusoIl && (
                  <div className="info-chiusura">
                    Tavolo chiuso il: {o.chiusoIl}
                  </div>
                )}
                
                {(o.stato === 'in_attesa' || o.stato === 'stampato') && (
                  <button className="button-evaso" onClick={() => evadiOrdine(o.id)}>
                    Segna come completato
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
      </div>

      {isChiusuraTavolo && ordiniFiltrati.length > 0 && (
        <div className="totale-tavolo">
          Totale Tavolo {tavoloCorrente}: € {totaleTavolo.toFixed(2)}
        </div>
      )}

      {/* Modals remain the same */}
      {mostraModalChiusura && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Impossibile Chiudere il Tavolo</h3>
            <p>Ci sono ancora <strong>{ordiniNonEvasi.length} ordine/i non completato/i</strong> per il tavolo {tavoloCorrente}.</p>
            <p>Prima di chiudere il tavolo, assicurati di aver completato tutti gli ordini.</p>
            
            <div className="ordini-non-evasi-lista">
              <h4>Ordini da completare:</h4>
              <ul>
                {ordiniNonEvasi.map(ordine => (
                  <li key={ordine.id}>
                    Ordine - {ordine.ordinazione.length} articoli
                  </li>
                ))}
              </ul>
            </div>

            <div className="modal-buttons">
              <button 
                className="button-ok"
                onClick={() => setMostraModalChiusura(false)}
              >
                Ho Capito
              </button>
            </div>
          </div>
        </div>
      )}

      {mostraModalConfermaChiusura && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Conferma Chiusura Tavolo</h3>
            <p>Sei sicuro di voler chiudere tutte le comande del tavolo <strong>{tavoloCorrente}</strong>?</p>
            <p>✅ Gli ordini verranno archiviati e non saranno più visibili qui.</p>
            <p>📋 Potrai comunque vederli nell'area operatore con filtro "Chiusi".</p>
            
            {ordiniFiltrati.length > 0 && (
              <div className="dettagli-chiusura">
                <h4>Dettagli ordini che verranno archiviati:</h4>
                <ul>
                  <li>Totale ordini: {ordiniFiltrati.length}</li>
                  <li>Importo totale: € {totaleTavolo.toFixed(2)}</li>
                  <li>Ordini completati: {ordiniFiltrati.filter(o => o.stato === 'evaso').length}</li>
                  <li>Ordini in attesa: {ordiniFiltrati.filter(o => o.stato === 'in_attesa').length}</li>
                </ul>
              </div>
            )}

            <div className="modal-buttons">
              <button 
                className="button-annulla"
                onClick={() => setMostraModalConfermaChiusura(false)}
              >
                Annulla
              </button>
              <button 
                className="button-conferma"
                onClick={confermaChiusuraTavolo}
              >
                Conferma Chiusura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}