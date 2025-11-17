

/*import React, { useState, useEffect, useRef } from 'react';
import './OrdinaPage.css';

export default function OrdinaPage() {
  const tavolo = new URLSearchParams(window.location.search).get('tavolo') || 'Sconosciuto';

  const [menu, setMenu] = useState([]);
  const [carrello, setCarrello] = useState([]);
  const [piattiSelezionati, setPiattiSelezionati] = useState([]);
  const [mostraCarrello, setMostraCarrello] = useState(false);
  const [messaggio, setMessaggio] = useState('');
  const [bump, setBump] = useState(false);
  const bumpTimeout = useRef(null);

  const [copertoAttivo, setCopertoAttivo] = useState(false);
  const [prezzoCoperto, setPrezzoCoperto] = useState(0);
  const [mostraCopertoModal, setMostraCopertoModal] = useState(false);
  const [numeroPersone, setNumeroPersone] = useState(1);
  const [datiCaricati, setDatiCaricati] = useState(false);
  const [forceReload, setForceReload] = useState(0);
  const [tavoloOccupato, setTavoloOccupato] = useState(false); // ✅ AGGIUNTA

  const parsePrice = (p) => {
    if (!p && p !== 0) return 0;
    const s = String(p).replace(',', '.').replace(/[^0-9.]/g, '');
    return parseFloat(s) || 0;
  };

  const inputRef = useRef(null);

  useEffect(() => {
    // ✅ Quando il modal si apre, metti il focus sull'input
    if (mostraCopertoModal && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // ✅ Seleziona tutto il testo
    }
  }, [mostraCopertoModal]);


  
  // ✅ PRIMA CARICA TUTTI I DATI INIZIALI - VERSIONE SEMPLIFICATA
  useEffect(() => {
    const caricaDatiIniziali = async () => {
      try {
        const carrelloSalvato = localStorage.getItem(`carrello_${tavolo}`);
        
        if (carrelloSalvato) {
          try {
            const carrelloParsed = JSON.parse(carrelloSalvato);
            setCarrello(carrelloParsed);
            
            const piattiIds = carrelloParsed
              .filter(item => item.id !== 'coperto')
              .map(item => item.id);
            setPiattiSelezionati(piattiIds);
          } catch (e) {
            console.error('Errore nel caricamento del carrello:', e);
          }
        }
        
        setDatiCaricati(true);
        
      } catch (error) {
        console.error('Errore nel caricamento iniziale:', error);
        setDatiCaricati(true);
      }
    };

    caricaDatiIniziali();
  }, [tavolo, forceReload]);

  // ✅ CONTROLLA SE IL TAVOLO È GIÀ OCCUPATO PRIMA DI MOSTRARE IL COPERTO
  useEffect(() => {
    if (!datiCaricati) return;
    
    const checkStatoTavolo = async () => {
      try {
        // 1. Controlla se il tavolo è occupato
        const response = await fetch('https://qrcode-finale.onrender.com/api/tavoli/occupati');
        const tavoliOccupati = await response.json();
        const isOccupato = tavoliOccupati.includes(tavolo.toString());
        
        setTavoloOccupato(isOccupato);
        
        if (isOccupato) {
          // ✅ TAVOLO OCCUPATO - NON OCCUPARE DI NUOVO E NON MOSTRARE COPERTO
          console.log(`✅ Tavolo ${tavolo} già occupato - Salto occupazione`);
        } else {
          // ✅ TAVOLO LIBERO - OCCUPALO
          console.log('🚀 Apertura pagina ordini - Occupo tavolo', tavolo);
          fetch('https://qrcode-finale.onrender.com/api/tavoli/occupa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tavolo })
          }).catch(err => console.error('Errore occupazione tavolo:', err));
        }
      } catch (error) {
        console.error('❌ Errore controllo tavolo occupato:', error);
        // In caso di errore, occupa comunque il tavolo per sicurezza
        fetch('https://qrcode-finale.onrender.com/api/tavoli/occupa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tavolo })
        }).catch(err => console.error('Errore occupazione tavolo:', err));
      }
    };

    checkStatoTavolo();
  }, [datiCaricati, tavolo]);

  // ✅ POI CARICA MENU E COPERT0 - SENZA OCCUPAZIONE DOPPIA
  useEffect(() => {
    if (!datiCaricati) return;

    fetch('https://qrcode-finale.onrender.com/api/menu')
      .then(res => res.json())
      .then(data => {
        const normalized = (data || []).map((it, idx) => ({
          id: it.id ?? `${String(it.nome)}-${idx}`,
          nome: it.nome,
          categoria: it.categoria,
          prezzo: parsePrice(it.prezzo)
        }));
        setMenu(normalized);
      })
      .catch(() => setMenu([]));

    // ✅ SOLO CARICA COPERT0 - NIENTE OCCUPAZIONE TAVOLO QUI
    fetch('https://qrcode-finale.onrender.com/api/coperto')
      .then(res => res.json())
      .then(data => {
        if (data && data.attivo) {
          setCopertoAttivo(true);
          setPrezzoCoperto(parsePrice(data.prezzo));
          
          const copertoConfermato = localStorage.getItem(`copertoConfermato_${tavolo}`);
          const carrelloSalvato = localStorage.getItem(`carrello_${tavolo}`);
          const carrelloVuoto = !carrelloSalvato || carrelloSalvato === '[]' || carrelloSalvato === 'null';
          
          if (copertoConfermato === 'true' && carrelloVuoto) {
            console.log('🚨 INCOERENZA RILEVATA: Coperto=true ma carrello vuoto! FORZO RESET!');
            localStorage.setItem(`copertoConfermato_${tavolo}`, 'false');
            localStorage.removeItem(`numeroPersone_${tavolo}`);
            // ✅ SOLO SE TAVOLO NON OCCUPATO, MOSTRA MODAL
            if (!tavoloOccupato) {
              setMostraCopertoModal(true);
            }
          } 
          else if (copertoConfermato !== 'true') {
            console.log('✅ Controllo se mostrare modal - coperto non confermato');
            // ✅ MOSTRA MODAL SOLO SE TAVOLO NON È OCCUPATO
            if (!tavoloOccupato) {
              console.log('✅ MOSTRO MODAL - tavolo libero e coperto non confermato');
              setMostraCopertoModal(true);
            } else {
              console.log('❌ NON mostro modal - tavolo già occupato');
              setMostraCopertoModal(false);
            }
          } 
          else {
            console.log('❌ NON mostro modal - coperto già confermato e carrello coerente');
            setMostraCopertoModal(false);
          }
        } else {
          setCopertoAttivo(false);
          setMostraCopertoModal(false);
        }
      })
      .catch(() => {
        setCopertoAttivo(false);
        setMostraCopertoModal(false);
      });
  }, [datiCaricati, tavolo, forceReload, tavoloOccupato]); // ✅ AGGIUNTA tavoloOccupato

  // ✅ RILEVA CAMBIAMENTI DEL LOCALSTORAGE
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('🔄 Rilevato cambiamento localStorage - forzo ricaricamento');
      setForceReload(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // ✅ SALVA CARRELLO IN LOCALSTORAGE
  useEffect(() => {
    if (datiCaricati) {
      // ✅ CONTROLLA SE IL COPERTO È STATO RESETTATO PRIMA DI SALVARE
      const copertoConfermatoAttuale = localStorage.getItem(`copertoConfermato_${tavolo}`);
      
      // ✅ SE IL COPERTO È STATO RESETTATO (false), NON SALVARE AUTOMATICAMENTE
      if (copertoConfermatoAttuale === 'false') {
       console.log('⏸️ Salvato - coperto in attesa di conferma');
        return;
      }
      
      localStorage.setItem(`carrello_${tavolo}`, JSON.stringify(carrello));
    }
  }, [carrello, tavolo, datiCaricati]);

  // ✅ AGGIUNGI AL CARRELLO
  const aggiungiProdotto = (prodotto) => {
    setCarrello(prev => {
      const esiste = prev.find(p => String(p.id) === String(prodotto.id));
      if (esiste) {
        return prev.map(p =>
          p.id === prodotto.id ? { ...p, quantita: p.quantita + 1 } : p
        );
      }
      return [...prev, { ...prodotto, quantita: 1 }];
    });

    setPiattiSelezionati(prev => {
      if (!prev.includes(prodotto.id)) return [...prev, prodotto.id];
      return prev;
    });

    if (bumpTimeout.current) clearTimeout(bumpTimeout.current);
    setBump(true);
    bumpTimeout.current = setTimeout(() => setBump(false), 300);
  };

  // ✅ RIMUOVI PRODOTTO
  const rimuoviProdotto = (id) => {
    setCarrello(prev => prev.filter(p => String(p.id) !== String(id)));
    setPiattiSelezionati(prev => prev.filter(pid => pid !== id));
  };

  // ✅ CONFERMA COPERTO
  const confermaCoperto = () => {
    const n = parseInt(numeroPersone, 10);
    if (!n || n <= 0) {
      alert('Inserisci un numero valido di persone (>=1)');
      return;
    }
    const totaleCoperto = parseFloat((prezzoCoperto * n).toFixed(2));
    const itemCoperto = {
      id: 'coperto',
      nome: `Coperto x${n}`,
      quantita: 1,
      prezzo: totaleCoperto
    };

    setCarrello(prev => {
      const senza = prev.filter(p => p.id !== 'coperto');
      return [...senza, itemCoperto];
    });

    // ✅ SALVA ESPLICITAMENTE TUTTI I DATI
    localStorage.setItem(`copertoConfermato_${tavolo}`, 'true');
    localStorage.setItem(`numeroPersone_${tavolo}`, String(n));
    
    console.log('💾 Coperto confermato e salvato per tavolo', tavolo);
    setMostraCopertoModal(false);
  };

  // ✅ CALCOLA TOTALI
  const totale = carrello.reduce(
    (s, p) => s + (Number(p.prezzo) * Number(p.quantita)), 0
  );
  const totaleArticoli = carrello.reduce((s, p) => s + p.quantita, 0);

  // ✅ INVIA ORDINE CON PULIZIA LOCALE MA TAVOLO OCCUPATO
  const inviaOrdine = async () => {
    if (carrello.length === 0) {
      setMessaggio('Il carrello è vuoto');
      return;
    }

    let persone = numeroPersone;
    const copertoItem = carrello.find(i => i.id === 'coperto');
    if (copertoItem) {
      const m = String(copertoItem.nome).match(/x(\d+)/);
      if (m) persone = parseInt(m[1], 10);
    }

    const payload = {
      tavolo,
      ordinazione: carrello.map(p => ({
        prodotto: p.nome,
        quantità: p.quantita,
        prezzo: p.prezzo
      })),
      coperto: copertoItem ? Number(copertoItem.prezzo) : 0,
      numeroPersone: copertoItem ? persone : 0,
      ipStampante: '172.20.10.8'
    };

    try {
      const res = await fetch('https://qrcode-finale.onrender.com/api/ordina', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data && data.printed === false) {
        setMessaggio(data.message || 'Ordine ricevuto, errore stampa');
      } else {
        setMessaggio(data.message || 'Ordine inviato con successo!');
        
        // ✅ PULIZIA LOCALE MA IL TAVOLO RIMANE OCCUPATO SUL SERVER
        setCarrello([]);
        setPiattiSelezionati([]);
        setMostraCarrello(false);
        localStorage.removeItem(`carrello_${tavolo}`);
        localStorage.removeItem(`copertoConfermato_${tavolo}`);
        localStorage.removeItem(`numeroPersone_${tavolo}`);
        
        console.log('🗑️ Ordine inviato - localStorage pulito, ma tavolo OCCUPATO');
      }
    } catch {
      setMessaggio('Ordine inviato, ma impossibile contattare il server/stampante');
      
      // ✅ PULIZIA LOCALE MA IL TAVOLO RIMANE OCCUPATO
      setCarrello([]);
      setPiattiSelezionati([]);
      setMostraCarrello(false);
      localStorage.removeItem(`carrello_${tavolo}`);
      localStorage.removeItem(`copertoConfermato_${tavolo}`);
      localStorage.removeItem(`numeroPersone_${tavolo}`);
    } finally {
      setTimeout(() => setMessaggio(''), 3000);
    }
  };

  const menuPerCategoria = menu.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {});

  const getQuantitaProdotto = (prodottoId) => {
    const prodottoInCarrello = carrello.find(p => String(p.id) === String(prodottoId));
    return prodottoInCarrello ? prodottoInCarrello.quantita : 0;
  };

  return (
    <div className="ordina-wrap">
      <header className="ordina-header">
        <h1>Menù — Tavolo {tavolo}</h1>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className={`cart-btn ${bump ? 'bump' : ''}`}
            onClick={() => setMostraCarrello(v => !v)}
          >
            <svg className="cart-svg" viewBox="0 0 24 24" width="28" height="28">
              <path
                d="M7 4h-2l-1 2h2l2.68 8.39a2 2 0 0 0 1.94 1.36h7.76l1.02-4H9.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="20" r="1" fill="currentColor" />
              <circle cx="18" cy="20" r="1" fill="currentColor" />
            </svg>

            {totaleArticoli > 0 && <span className="cart-badge">{totaleArticoli}</span>}
          </button>
        </div>
      </header>

      <main className="menu-container">
        {Object.entries(menuPerCategoria).length === 0 && <div className="avviso">Menu vuoto</div>}

        {Object.entries(menuPerCategoria).map(([categoria, prodotti]) => (
          <section key={categoria} className="categoria">
            <h2>{categoria}</h2>
            <div className="cards">
              {prodotti.map(p => (
                <article
                  key={p.id}
                  className={`card ${piattiSelezionati.includes(p.id) ? 'selected' : ''} ${mostraCarrello ? 'disabled' : ''}`}
                  onClick={() => aggiungiProdotto(p)}
                  role="button"
                  tabIndex={0}
                  style={{ 
                    cursor: mostraCarrello ? 'not-allowed' : 'pointer',
                    position: 'relative'
                  }}
                >
                  <div className="card-name">{p.nome}</div>
                  <div className="card-price">€ {p.prezzo.toFixed(2)}</div>
                  
                  {/* BADGE CON LA QUANTITÀ *//*}
                  {getQuantitaProdotto(p.id) > 0 && (
                    <div className="quantita-badge">
                      {getQuantitaProdotto(p.id)}
                    </div>
                  )}

                  {/* OVERLAY DI BLOCCO QUANDO IL CARRELLO È APERTO *//*}
                  {mostraCarrello && <div className="block-overlay"></div>}
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>

      {mostraCarrello && (
        <aside className="cart-drawer">
          <div className="cart-top">
            <h3>Il tuo carrello</h3>
            <button className="close" onClick={() => setMostraCarrello(false)}>X</button>
          </div>

          {carrello.length === 0 ? (
            <div className="vuoto">Il carrello è vuoto — aggiungi dei piatti</div>
          ) : (
            <>
              <ul className="cart-list">
                {carrello.map(item => (
                  <li key={item.id} className="cart-item">
                    <div>
                      <div className="item-name">{item.nome}</div>
                      <div className="item-meta">
                        {item.quantita} × € {item.prezzo.toFixed(2)}
                      </div>
                    </div>

                    <div className="item-actions">
                      <div className="item-subtotale">
                        € {(item.prezzo * item.quantita).toFixed(2)}
                      </div>

                      {item.id !== 'coperto' && (
                        <button className="delete" onClick={() => rimuoviProdotto(item.id)}>
                          Elimina
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="cart-footer">
                <div className="totale-line">
                  <span>Totale</span>
                  <strong>€ {totale.toFixed(2)}</strong>
                </div>

                <button className="send-btn" onClick={inviaOrdine}>
                  Invia ordine
                </button>
              </div>
            </>
          )}
          {messaggio && <div className="msg">{messaggio}</div>}
        </aside>
      )}

      {mostraCopertoModal && copertoAttivo && !tavoloOccupato && ( // ✅ MODIFICATA QUESTA RIGA
        <div className="modal-backdrop">
          <div className="modal-coperto">
            <h3>Inserisci numero di persone</h3>
            <input
              ref={inputRef}
              type="number"
              min="1"
              value={numeroPersone}
              onChange={(e) => setNumeroPersone(e.target.value)}
            />
            <div className="modal-buttons">
              <button className="ok" onClick={confermaCoperto}>Conferma</button>
            </div>
            <h3 style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              Prezzo coperto per persona: € {prezzoCoperto.toFixed(2)}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}


*/




import React, { useState, useEffect, useRef } from 'react';
import './OrdinaPage.css';

export default function OrdinaPage() {
  const tavolo = new URLSearchParams(window.location.search).get('tavolo') || 'Sconosciuto';

  const [menu, setMenu] = useState([]);
  const [carrello, setCarrello] = useState([]);
  const [piattiSelezionati, setPiattiSelezionati] = useState([]);
  const [mostraCarrello, setMostraCarrello] = useState(false);
  const [messaggio, setMessaggio] = useState('');
  const [bump, setBump] = useState(false);
  const bumpTimeout = useRef(null);

  const [copertoAttivo, setCopertoAttivo] = useState(false);
  const [prezzoCoperto, setPrezzoCoperto] = useState(0);
  const [mostraCopertoModal, setMostraCopertoModal] = useState(false);
  const [numeroPersone, setNumeroPersone] = useState(1);
  const [datiCaricati, setDatiCaricati] = useState(false);
  const [forceReload, setForceReload] = useState(0);
  const [tavoloOccupato, setTavoloOccupato] = useState(false);
  
  // ✅ NUOVO STATE PER STAMPANTE LOCALE
  const [stampanteOnline, setStampanteOnline] = useState(false);

  const parsePrice = (p) => {
    if (!p && p !== 0) return 0;
    const s = String(p).replace(',', '.').replace(/[^0-9.]/g, '');
    return parseFloat(s) || 0;
  };

  const inputRef = useRef(null);

  useEffect(() => {
    if (mostraCopertoModal && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [mostraCopertoModal]);

  // ✅ CONTROLLO STAMPANTE LOCALE
  useEffect(() => {
    const checkStampante = async () => {
      try {
        const response = await fetch('http://127.20.10.8:3002/api/health');  // CAMBIARE IP WIFI
        setStampanteOnline(response.ok);
      } catch {
        setStampanteOnline(false);
      }
    };

    checkStampante();
    const interval = setInterval(checkStampante, 10000);
    return () => clearInterval(interval);
  }, []);

  // ✅ FUNZIONE STAMPA LOCALE
  const stampaLocale = async (ordineData) => {
    try {
      const response = await fetch('http://127.20.10.8:3002/api/stampa-ordine', { // CAMBIARE IP WIFI
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordine: ordineData })
      });
      
      if (!response.ok) {
        throw new Error('Errore stampa locale');
      }
      
      return await response.json();
    } catch (error) {
      throw new Error('Servizio stampa non disponibile');
    }
  };

  // ✅ PRIMA CARICA TUTTI I DATI INIZIALI
  useEffect(() => {
    const caricaDatiIniziali = async () => {
      try {
        const carrelloSalvato = localStorage.getItem(`carrello_${tavolo}`);
        
        if (carrelloSalvato) {
          try {
            const carrelloParsed = JSON.parse(carrelloSalvato);
            setCarrello(carrelloParsed);
            
            const piattiIds = carrelloParsed
              .filter(item => item.id !== 'coperto')
              .map(item => item.id);
            setPiattiSelezionati(piattiIds);
          } catch (e) {
            console.error('Errore nel caricamento del carrello:', e);
          }
        }
        
        setDatiCaricati(true);
        
      } catch (error) {
        console.error('Errore nel caricamento iniziale:', error);
        setDatiCaricati(true);
      }
    };

    caricaDatiIniziali();
  }, [tavolo, forceReload]);

  // ✅ CONTROLLA SE IL TAVOLO È GIÀ OCCUPATO
  useEffect(() => {
    if (!datiCaricati) return;
    
    const checkStatoTavolo = async () => {
      try {
        const response = await fetch('https://qrcode-finale.onrender.com/api/tavoli/occupati');
        const tavoliOccupati = await response.json();
        const isOccupato = tavoliOccupati.includes(tavolo.toString());
        
        setTavoloOccupato(isOccupato);
        
        if (isOccupato) {
          console.log(`✅ Tavolo ${tavolo} già occupato - Salto occupazione`);
        } else {
          console.log('🚀 Apertura pagina ordini - Occupo tavolo', tavolo);
          fetch('https://qrcode-finale.onrender.com/api/tavoli/occupa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tavolo })
          }).catch(err => console.error('Errore occupazione tavolo:', err));
        }
      } catch (error) {
        console.error('❌ Errore controllo tavolo occupato:', error);
        fetch('https://qrcode-finale.onrender.com/api/tavoli/occupa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tavolo })
        }).catch(err => console.error('Errore occupazione tavolo:', err));
      }
    };

    checkStatoTavolo();
  }, [datiCaricati, tavolo]);

  // ✅ CARICA MENU E COPERT0
  useEffect(() => {
    if (!datiCaricati) return;

    fetch('https://qrcode-finale.onrender.com/api/menu')
      .then(res => res.json())
      .then(data => {
        const normalized = (data || []).map((it, idx) => ({
          id: it.id ?? `${String(it.nome)}-${idx}`,
          nome: it.nome,
          categoria: it.categoria,
          prezzo: parsePrice(it.prezzo)
        }));
        setMenu(normalized);
      })
      .catch(() => setMenu([]));

    fetch('https://qrcode-finale.onrender.com/api/coperto')
      .then(res => res.json())
      .then(data => {
        if (data && data.attivo) {
          setCopertoAttivo(true);
          setPrezzoCoperto(parsePrice(data.prezzo));
          
          const copertoConfermato = localStorage.getItem(`copertoConfermato_${tavolo}`);
          const carrelloSalvato = localStorage.getItem(`carrello_${tavolo}`);
          const carrelloVuoto = !carrelloSalvato || carrelloSalvato === '[]' || carrelloSalvato === 'null';
          
          if (copertoConfermato === 'true' && carrelloVuoto) {
            console.log('🚨 INCOERENZA RILEVATA: Coperto=true ma carrello vuoto! FORZO RESET!');
            localStorage.setItem(`copertoConfermato_${tavolo}`, 'false');
            localStorage.removeItem(`numeroPersone_${tavolo}`);
            if (!tavoloOccupato) {
              setMostraCopertoModal(true);
            }
          } 
          else if (copertoConfermato !== 'true') {
            console.log('✅ Controllo se mostrare modal - coperto non confermato');
            if (!tavoloOccupato) {
              console.log('✅ MOSTRO MODAL - tavolo libero e coperto non confermato');
              setMostraCopertoModal(true);
            } else {
              console.log('❌ NON mostro modal - tavolo già occupato');
              setMostraCopertoModal(false);
            }
          } 
          else {
            console.log('❌ NON mostro modal - coperto già confermato e carrello coerente');
            setMostraCopertoModal(false);
          }
        } else {
          setCopertoAttivo(false);
          setMostraCopertoModal(false);
        }
      })
      .catch(() => {
        setCopertoAttivo(false);
        setMostraCopertoModal(false);
      });
  }, [datiCaricati, tavolo, forceReload, tavoloOccupato]);

  // ✅ RILEVA CAMBIAMENTI LOCALSTORAGE
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('🔄 Rilevato cambiamento localStorage - forzo ricaricamento');
      setForceReload(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // ✅ SALVA CARRELLO IN LOCALSTORAGE
  useEffect(() => {
    if (datiCaricati) {
      const copertoConfermatoAttuale = localStorage.getItem(`copertoConfermato_${tavolo}`);
      
      if (copertoConfermatoAttuale === 'false') {
        console.log('⏸️ Salvato - coperto in attesa di conferma');
        return;
      }
      
      localStorage.setItem(`carrello_${tavolo}`, JSON.stringify(carrello));
    }
  }, [carrello, tavolo, datiCaricati]);

  // ✅ AGGIUNGI AL CARRELLO
  const aggiungiProdotto = (prodotto) => {
    setCarrello(prev => {
      const esiste = prev.find(p => String(p.id) === String(prodotto.id));
      if (esiste) {
        return prev.map(p =>
          p.id === prodotto.id ? { ...p, quantita: p.quantita + 1 } : p
        );
      }
      return [...prev, { ...prodotto, quantita: 1 }];
    });

    setPiattiSelezionati(prev => {
      if (!prev.includes(prodotto.id)) return [...prev, prodotto.id];
      return prev;
    });

    if (bumpTimeout.current) clearTimeout(bumpTimeout.current);
    setBump(true);
    bumpTimeout.current = setTimeout(() => setBump(false), 300);
  };

  // ✅ RIMUOVI PRODOTTO
  const rimuoviProdotto = (id) => {
    setCarrello(prev => prev.filter(p => String(p.id) !== String(id)));
    setPiattiSelezionati(prev => prev.filter(pid => pid !== id));
  };

  // ✅ CONFERMA COPERTO
  const confermaCoperto = () => {
    const n = parseInt(numeroPersone, 10);
    if (!n || n <= 0) {
      alert('Inserisci un numero valido di persone (>=1)');
      return;
    }
    const totaleCoperto = parseFloat((prezzoCoperto * n).toFixed(2));
    const itemCoperto = {
      id: 'coperto',
      nome: `Coperto x${n}`,
      quantita: 1,
      prezzo: totaleCoperto
    };

    setCarrello(prev => {
      const senza = prev.filter(p => p.id !== 'coperto');
      return [...senza, itemCoperto];
    });

    localStorage.setItem(`copertoConfermato_${tavolo}`, 'true');
    localStorage.setItem(`numeroPersone_${tavolo}`, String(n));
    
    console.log('💾 Coperto confermato e salvato per tavolo', tavolo);
    setMostraCopertoModal(false);
  };

  // ✅ CALCOLA TOTALI
  const totale = carrello.reduce(
    (s, p) => s + (Number(p.prezzo) * Number(p.quantita)), 0
  );
  const totaleArticoli = carrello.reduce((s, p) => s + p.quantita, 0);





















// ✅ INVIA ORDINE - VERSIONE CORRETTA CON STAMPA LOCALE
const inviaOrdine = async () => {
  if (carrello.length === 0) {
    setMessaggio('Il carrello è vuoto');
    return;
  }

  let persone = numeroPersone;
  const copertoItem = carrello.find(i => i.id === 'coperto');
  if (copertoItem) {
    const m = String(copertoItem.nome).match(/x(\d+)/);
    if (m) persone = parseInt(m[1], 10);
  }

  const payload = {
    tavolo,
    ordinazione: carrello.map(p => ({
      prodotto: p.nome,
      quantità: p.quantita,
      prezzo: p.prezzo
    })),
    coperto: copertoItem ? Number(copertoItem.prezzo) : 0,
    numeroPersone: copertoItem ? persone : 0,
    ipStampante: '172.20.10.8'
  };

  try {
    // ✅ 1. PRIMA SALVA SEMPRE SU RENDER (CLOUD)
    const res = await fetch('https://qrcode-finale.onrender.com/api/ordina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // ✅ CONTROLLO RISPOSTA SERVER
    if (!res.ok) {
      throw new Error('Errore salvataggio ordine su cloud');
    }

    await res.json(); // Verifica che la risposta sia JSON valido

    // ✅ 2. POI PROVA A STAMPARE LOCALMENTE
    let stampaRiuscita = false;
    if (stampanteOnline) {
      try {
        await stampaLocale(payload);
        stampaRiuscita = true;
        console.log('✅ Stampato localmente');
      } catch (printError) {
        console.log('❌ Stampa locale fallita:', printError);
        stampaRiuscita = false;
      }
    }

    // ✅ 3. MESSAGGIO INTELLIGENTE
    if (stampaRiuscita) {
      setMessaggio('✅ Ordine stampato e salvato!');
    } else if (stampanteOnline) {
      setMessaggio('✅ Ordine salvato (stampa fallita)');
    } else {
      setMessaggio('✅ Ordine salvato (modalità cloud)');
    }

    // ✅ 4. PULIZIA LOCALE (solo dopo che tutto è andato bene)
    setCarrello([]);
    setPiattiSelezionati([]);
    setMostraCarrello(false);
    localStorage.removeItem(`carrello_${tavolo}`);
    localStorage.removeItem(`copertoConfermato_${tavolo}`);
    localStorage.removeItem(`numeroPersone_${tavolo}`);
    
    console.log('🗑️ Ordine inviato - localStorage pulito');

  } catch (error) {
    console.error('❌ Errore completo:', error);
    setMessaggio('❌ Errore invio ordine');
    // ❌ NON pulire il carrello se c'è un errore
  } finally {
    setTimeout(() => setMessaggio(''), 4000);
  }
};















  const menuPerCategoria = menu.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {});

  const getQuantitaProdotto = (prodottoId) => {
    const prodottoInCarrello = carrello.find(p => String(p.id) === String(prodottoId));
    return prodottoInCarrello ? prodottoInCarrello.quantita : 0;
  };

  return (
    <div className="ordina-wrap">
      <header className="ordina-header">
        <h1>Menù — Tavolo {tavolo}</h1>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* ✅ INDICATORE STATO STAMPANTE */}
          <div 
            className={`stampante-indicator ${stampanteOnline ? 'online' : 'offline'}`}
            title={stampanteOnline ? 'Stampante connessa' : 'Stampante non disponibile'}
          >
            🖨️
          </div>

          <button
            className={`cart-btn ${bump ? 'bump' : ''}`}
            onClick={() => setMostraCarrello(v => !v)}
          >
            <svg className="cart-svg" viewBox="0 0 24 24" width="28" height="28">
              <path
                d="M7 4h-2l-1 2h2l2.68 8.39a2 2 0 0 0 1.94 1.36h7.76l1.02-4H9.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="20" r="1" fill="currentColor" />
              <circle cx="18" cy="20" r="1" fill="currentColor" />
            </svg>

            {totaleArticoli > 0 && <span className="cart-badge">{totaleArticoli}</span>}
          </button>
        </div>
      </header>

      <main className="menu-container">
        {Object.entries(menuPerCategoria).length === 0 && <div className="avviso">Menu vuoto</div>}

        {Object.entries(menuPerCategoria).map(([categoria, prodotti]) => (
          <section key={categoria} className="categoria">
            <h2>{categoria}</h2>
            <div className="cards">
              {prodotti.map(p => (
                <article
                  key={p.id}
                  className={`card ${piattiSelezionati.includes(p.id) ? 'selected' : ''} ${mostraCarrello ? 'disabled' : ''}`}
                  onClick={() => aggiungiProdotto(p)}
                  role="button"
                  tabIndex={0}
                  style={{ 
                    cursor: mostraCarrello ? 'not-allowed' : 'pointer',
                    position: 'relative'
                  }}
                >
                  <div className="card-name">{p.nome}</div>
                  <div className="card-price">€ {p.prezzo.toFixed(2)}</div>
                  
                  {getQuantitaProdotto(p.id) > 0 && (
                    <div className="quantita-badge">
                      {getQuantitaProdotto(p.id)}
                    </div>
                  )}

                  {mostraCarrello && <div className="block-overlay"></div>}
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>

      {mostraCarrello && (
        <aside className="cart-drawer">
          <div className="cart-top">
            <h3>Il tuo carrello</h3>
            <button className="close" onClick={() => setMostraCarrello(false)}>X</button>
          </div>

          {carrello.length === 0 ? (
            <div className="vuoto">Il carrello è vuoto — aggiungi dei piatti</div>
          ) : (
            <>
              <ul className="cart-list">
                {carrello.map(item => (
                  <li key={item.id} className="cart-item">
                    <div>
                      <div className="item-name">{item.nome}</div>
                      <div className="item-meta">
                        {item.quantita} × € {item.prezzo.toFixed(2)}
                      </div>
                    </div>

                    <div className="item-actions">
                      <div className="item-subtotale">
                        € {(item.prezzo * item.quantita).toFixed(2)}
                      </div>

                      {item.id !== 'coperto' && (
                        <button className="delete" onClick={() => rimuoviProdotto(item.id)}>
                          Elimina
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="cart-footer">
                <div className="totale-line">
                  <span>Totale</span>
                  <strong>€ {totale.toFixed(2)}</strong>
                </div>

                <button className="send-btn" onClick={inviaOrdine}>
                  Invia ordine
                </button>
              </div>
            </>
          )}
          {messaggio && (
            <div className={`msg ${
              messaggio.includes('✅') ? 'success' : 
              messaggio.includes('❌') ? 'error' : 'warning'
            }`}>
              {messaggio}
            </div>
          )}
        </aside>
      )}

      {mostraCopertoModal && copertoAttivo && !tavoloOccupato && (
        <div className="modal-backdrop">
          <div className="modal-coperto">
            <h3>Inserisci numero di persone</h3>
            <input
              ref={inputRef}
              type="number"
              min="1"
              value={numeroPersone}
              onChange={(e) => setNumeroPersone(e.target.value)}
            />
            <div className="modal-buttons">
              <button className="ok" onClick={confermaCoperto}>Conferma</button>
            </div>
            <h3 style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              Prezzo coperto per persona: € {prezzoCoperto.toFixed(2)}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}