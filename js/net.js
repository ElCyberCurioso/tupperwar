/* Tupperwar — red para partidas online.
   GitHub Pages solo sirve archivos estáticos, así que la conexión es directa entre
   navegadores (WebRTC) usando PeerJS y su servidor público de emparejamiento.
   Con ?transporte=local se usa BroadcastChannel para probar con dos pestañas. */
(function () {
  const TW = (globalThis.TW = globalThis.TW || {});
  const PREFIX = 'tupperwar-v1-';
  const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
  // Copia incluida en el proyecto; los CDN solo son el plan B
  const PEER_URLS = [
    'js/vendor/peerjs.min.js',
    'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js',
    'https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js',
  ];

  function loadPeerJS() {
    if (window.Peer) return Promise.resolve();
    return new Promise((resolve, reject) => {
      let i = 0;
      const next = () => {
        if (i >= PEER_URLS.length) return reject(new Error('No se pudo cargar la librería de conexión (PeerJS). ¿Tienes internet?'));
        const s = document.createElement('script');
        s.src = PEER_URLS[i++];
        s.async = true;
        s.onload = () => (window.Peer ? resolve() : next());
        s.onerror = () => { s.remove(); next(); };
        document.head.appendChild(s);
      };
      next();
    });
  }

  // Servidor de emparejamiento propio opcional: ?peerhost=mi.servidor&peerport=443&peerpath=/myapp
  function peerOptions() {
    const q = new URLSearchParams(location.search);
    const o = { debug: 1 };
    if (q.get('peerhost')) {
      o.host = q.get('peerhost');
      o.port = +(q.get('peerport') || 443);
      o.path = q.get('peerpath') || '/';
      o.secure = q.get('peersecure') ? q.get('peersecure') === '1' : o.port === 443;
    }
    return o;
  }

  function openPeer(id) {
    return new Promise((resolve, reject) => {
      const peer = id ? new window.Peer(id, peerOptions()) : new window.Peer(peerOptions());
      const to = setTimeout(() => { reject(new Error('El servidor de emparejamiento no responde.')); try { peer.destroy(); } catch (e) { /* nada */ } }, 15000);
      peer.once('open', () => { clearTimeout(to); resolve(peer); });
      peer.once('error', (e) => { clearTimeout(to); reject(e); });
    });
  }

  /* Conexión normalizada: send / onMessage / onClose / close */
  function wrapPeer(conn, peer) {
    const msgCbs = [], closeCbs = [];
    let closed = false;
    const fireClose = () => { if (closed) return; closed = true; closeCbs.forEach((f) => f()); };
    conn.on('data', (d) => msgCbs.forEach((f) => f(d)));
    conn.on('close', fireClose);
    conn.on('error', fireClose);
    if (peer) peer.on('error', (e) => { if (e && e.type !== 'peer-unavailable') fireClose(); });
    return {
      send(m) { if (conn.open) conn.send(m); },
      onMessage(f) { msgCbs.push(f); },
      onClose(f) { closeCbs.push(f); },
      close() { closed = true; try { conn.close(); } catch (e) { /* nada */ } if (peer) try { peer.destroy(); } catch (e) { /* nada */ } },
    };
  }

  /* ---------- transporte local (pruebas) ---------- */
  function localRoom(code, onConnection) {
    const ch = new BroadcastChannel('tw-local-' + code);
    const me = 'host';
    const conns = {};
    ch.onmessage = (ev) => {
      const m = ev.data;
      if (m.to !== me) return;
      if (m.type === 'connect') {
        const c = localConn(ch, me, m.from);
        conns[m.from] = c;
        ch.postMessage({ to: m.from, from: me, type: 'accept' });
        onConnection(c);
      } else if (conns[m.from]) conns[m.from]._recv(m);
    };
    return { code, close() { ch.close(); } };
  }
  function localConn(ch, me, other) {
    const msgCbs = [], closeCbs = [];
    return {
      _recv(m) { if (m.type === 'msg') msgCbs.forEach((f) => f(m.data)); if (m.type === 'close') closeCbs.forEach((f) => f()); },
      send(d) { ch.postMessage({ to: other, from: me, type: 'msg', data: d }); },
      onMessage(f) { msgCbs.push(f); },
      onClose(f) { closeCbs.push(f); },
      close() { ch.postMessage({ to: other, from: me, type: 'close' }); },
    };
  }
  function localJoin(code) {
    return new Promise((resolve, reject) => {
      const ch = new BroadcastChannel('tw-local-' + code);
      const me = 'g' + Math.random().toString(36).slice(2, 8);
      let conn = null;
      const to = setTimeout(() => reject(Object.assign(new Error('Sala no encontrada'), { type: 'peer-unavailable' })), 3000);
      ch.onmessage = (ev) => {
        const m = ev.data;
        if (m.to !== me) return;
        if (m.type === 'accept') { clearTimeout(to); conn = localConn(ch, me, 'host'); resolve(conn); }
        else if (conn) conn._recv(m);
      };
      ch.postMessage({ to: 'host', from: me, type: 'connect' });
    });
  }

  const local = () => new URLSearchParams(location.search).get('transporte') === 'local';

  TW.Net = {
    PREFIX,
    VERSION: '1.3.0',
    isLocal: local,
    makeCode() {
      let s = '';
      const r = crypto.getRandomValues(new Uint32Array(6));
      for (let i = 0; i < 6; i++) s += ALPHABET[r[i] % ALPHABET.length];
      return s;
    },
    cleanCode(c) { return String(c || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12); },

    /* Crea una sala. handlers: { onConnection(conn), onError(err) } → { code, close } */
    async createRoom(handlers) {
      if (local()) return localRoom(this.makeCode(), handlers.onConnection);
      await loadPeerJS();
      let peer = null, code = null;
      for (let i = 0; i < 4 && !peer; i++) {
        code = this.makeCode();
        try { peer = await openPeer(PREFIX + code); } catch (e) { if (!e || e.type !== 'unavailable-id') throw e; }
      }
      if (!peer) throw new Error('No se pudo crear la sala. Inténtalo de nuevo.');
      peer.on('connection', (c) => c.on('open', () => handlers.onConnection(wrapPeer(c, null))));
      peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) { /* nada */ } });
      peer.on('error', (e) => handlers.onError && handlers.onError(e));
      return { code, close() { try { peer.destroy(); } catch (e) { /* nada */ } } };
    },

    /* Se une a una sala existente → conn */
    async joinRoom(code) {
      if (local()) return localJoin(code);
      await loadPeerJS();
      const peer = await openPeer(null);
      return new Promise((resolve, reject) => {
        const c = peer.connect(PREFIX + code, { reliable: true, serialization: 'json' });
        const to = setTimeout(() => { reject(new Error('No se pudo conectar con la sala.')); try { peer.destroy(); } catch (e) { /* nada */ } }, 20000);
        c.on('open', () => { clearTimeout(to); resolve(wrapPeer(c, peer)); });
        peer.on('error', (e) => { clearTimeout(to); reject(e); try { peer.destroy(); } catch (x) { /* nada */ } });
      });
    },

    errorText(e) {
      if (!e) return 'Error desconocido.';
      if (e.type === 'peer-unavailable') return 'Esa sala no existe o ya se ha cerrado. Pide a tu rival un enlace nuevo.';
      if (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error') return 'No se puede contactar con el servidor de emparejamiento. Revisa tu conexión.';
      if (e.type === 'browser-incompatible') return 'Tu navegador no permite conexiones directas (WebRTC).';
      return e.message || String(e);
    },
  };
})();
