/* SolChain B2B · Satın alma ve güven altyapısı demo uygulaması
 * Durum tarayıcıda (localStorage) tutulur. Zincir kayıtları SHA-256 ile birbirine bağlanır;
 * gerçek Solana programı yerine, aynı kanıt mantığını tarayıcıda gösterir.
 */
(function () {
  'use strict';
  var CFG = window.SC_CONFIG, ROLES = window.SC_ROLES;
  var KEY = 'solchain-b2b-demo-v1';
  var st;

  /* ---------- yardımcılar ---------- */
  var fmtTL = new Intl.NumberFormat(CFG.locale, { style: 'currency', currency: CFG.currency, maximumFractionDigits: 0 });
  function para(n) { return fmtTL.format(Math.round(n || 0)); }
  function sayi(n, d) { return new Intl.NumberFormat(CFG.locale, { maximumFractionDigits: d || 0 }).format(n || 0); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function now() { var d = new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function gunFarki(tarih) { return Math.round((new Date(tarih + 'T00:00:00') - new Date(new Date().toDateString())) / 86400000); }
  function kisa(h) { return h ? h.slice(0, 10) + '…' : ''; }
  function rolAd(id) { var r = ROLES.filter(function (x) { return x.id === id; })[0]; return r ? r.ad : id; }
  function ted(id) { return st.tedarikciler.filter(function (s) { return s.id === id; })[0]; }
  function siparis(id) { return st.siparisler.filter(function (o) { return o.id === id; })[0]; }
  function talep(id) { return st.talepler.filter(function (p) { return p.id === id; })[0]; }
  function butce(id) { return st.butceler.filter(function (b) { return b.id === id; })[0]; }
  function faturaOf(po) { return st.faturalar.filter(function (f) { return f.po === po; })[0]; }

  /* ---------- kalıcılık ve zincir ---------- */
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) { /* bozuk kayıt */ }
    return null;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* kota */ } }
  function kayitHash(k) { return sha256([k.i, k.ts, k.tur, k.ref, k.aktor, k.veri, k.onceki].join('|')); }
  function zincireYaz(tur, ref, veri, aktor) {
    var son = st.kayitlar[st.kayitlar.length - 1];
    var k = { i: st.kayitlar.length, ts: now(), tur: tur, ref: ref, aktor: aktor || rolAd(st.rol), veri: veri, onceki: son ? son.hash : '0'.repeat(64) };
    k.hash = kayitHash(k);
    st.kayitlar.push(k);
    return k;
  }
  function zinciriDogrula() {
    for (var i = 0; i < st.kayitlar.length; i++) {
      var k = st.kayitlar[i];
      var onceki = i ? st.kayitlar[i - 1].hash : '0'.repeat(64);
      if (k.onceki !== onceki || kayitHash(k) !== k.hash) return { ok: false, i: i };
    }
    return { ok: true, n: st.kayitlar.length };
  }
  function etiketOzeti(o) { return sha256([o.id, o.lot, o.miktar, o.birim, o.tedarikci].join('|')).slice(0, 16); }
  function etiketYuku(o) { return { t: 'SCB2B', v: 1, po: o.id, lot: o.lot, q: o.miktar, u: o.birim, h: etiketOzeti(o) }; }

  function init(reset) {
    st = reset ? null : load();
    if (!st) {
      st = window.SC_SEED();
      st.rol = 'satinalma';
      var seed = [
        ['TALEP', 'PR-0228', 'Oluklu koli 20.000 adet · onay zinciri tamamlandı', 'Satın alma müdürü'],
        ['SIPARIS', 'PO-0135', 'Polimer Kimya · 10 ton · tutar kilitlendi', 'Satın alma müdürü'],
        ['MAL_KABUL', 'PO-0135', 'NFC etiketi doğrulandı · 10 ton · kalite uygun', 'Depo sorumlusu'],
        ['ODEME', 'PO-0135', 'Üçlü eşleştirme tamam · ödeme serbest bırakıldı', 'Finans direktörü'],
        ['SIPARIS', 'PO-0137', 'Ege Sac · 25 ton · tutar kilitlendi', 'Satın alma müdürü'],
        ['SIPARIS', 'PO-0139', 'Delta Ambalaj · 20.000 adet · tutar kilitlendi', 'Satın alma müdürü'],
        ['SIPARIS', 'PO-0142', 'Anadolu Çelik · 40 ton · tutar kilitlendi', 'Satın alma müdürü'],
        ['SEVK', 'PO-0142', 'Lot L-88120 · NFC etiketi yazıldı', 'Tedarikçi portalı'],
        ['MAL_KABUL', 'PO-0137', 'NFC etiketi doğrulandı · 24,2 ton teslim alındı', 'Depo sorumlusu'],
        ['MAL_KABUL', 'PO-0139', 'NFC etiketi doğrulandı · 20.000 adet · kalite uygun', 'Depo sorumlusu']
      ];
      seed.forEach(function (s) { zincireYaz(s[0], s[1], s[2], s[3]); });
      save();
    }
  }

  /* ---------- iş kuralları ---------- */
  function onayZinciri(tutar, mm) {
    var adimlar = CFG.onayEsikleri.filter(function (e) { return tutar >= e.alt; }).map(function (e) { return e.rol; });
    var b = butce(mm);
    if (b && b.limit - b.harcanan - taahhut(mm) < tutar && adimlar.indexOf('finans') < 0) adimlar.push('finans');
    return adimlar;
  }
  function taahhut(mm) {
    return st.siparisler.filter(function (o) { var p = talep(o.pr); return p && p.mm === mm && o.asama < 4; })
      .reduce(function (a, o) { return a + o.kilitli; }, 0);
  }
  function siradakiOnay(p) {
    var gerek = onayZinciri(p.tahmini, p.mm);
    for (var i = 0; i < gerek.length; i++) {
      if (!p.onaylar.some(function (o) { return o.rol === gerek[i] && o.ok; })) return gerek[i];
    }
    return null;
  }
  function riskler(s) {
    var r = [];
    if (s.faaliyetGun > 90) r.push('Faaliyet belgesi ' + s.faaliyetGun + ' günlük');
    if (s.sgk) r.push('SGK borcu yapılandırılmış');
    if (s.ilan) r.push('Olumsuz ilan kaydı');
    if (s.kapasite < 70) r.push('Kapasite kullanımı %' + s.kapasite);
    if (s.beyan && s.beyan < 80) r.push('Beyan–ölçüm uyumu ' + s.beyan);
    return r;
  }
  function avans(s) {
    if (s.teslimat < 5 || !s.endeks) return 0;
    var a = s.endeks >= 85 ? 40 : s.endeks >= 70 ? 25 : 10;
    if (s.sgk) a = Math.min(a, 10);
    return a;
  }
  function bugunkuDeger(t, miktar) {
    var toplam = t.fiyat * miktar + t.navlun;
    return { toplam: toplam, bd: toplam / Math.pow(1 + CFG.sermayeMaliyetiAylik, t.vade / 30) };
  }
  function eslestir(o) {
    var f = faturaOf(o.id);
    if (!f || !o.kabul) return null;
    var tol = CFG.toleransYuzde / 100;
    var mFark = Math.abs(f.miktar - o.kabul.miktar) / o.kabul.miktar;
    var fFark = Math.abs(f.fiyat - o.fiyat) / o.fiyat;
    return { f: f, mFark: mFark, fFark: fFark, ok: mFark <= tol && fFark <= tol, tutar: f.miktar * f.fiyat };
  }
  var ASAMALAR = ['Sipariş', 'Sevk', 'Mal kabul', 'Fatura eşleşti', 'Ödendi'];

  /* ---------- arayüz parçaları ---------- */
  function pill(text, tur) { return '<span class="pill ' + (tur || '') + '">' + esc(text) + '</span>'; }
  function seviyePill(s) { return pill(s.seviye, 'lv-' + s.seviye.toLowerCase()); }
  function toast(msg, tur) {
    var t = document.createElement('div');
    t.className = 'toast ' + (tur || '');
    t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 2600);
    setTimeout(function () { t.remove(); }, 3100);
  }
  function modal(html) {
    var m = $('#modal');
    m.innerHTML = '<div class="modal-card" role="dialog" aria-modal="true">' + html + '</div>';
    m.hidden = false;
    var first = m.querySelector('button, input, select');
    if (first) first.focus();
  }
  function kapatModal() { $('#modal').hidden = true; $('#modal').innerHTML = ''; }
  function yetki(rol) { return st.rol === rol; }
  function rolUyari(rol) { return '<p class="hint">Bu adım için rol: <b>' + esc(rolAd(rol)) + '</b>. Üst menüden rolü değiştirerek deneyebilirsiniz.</p>'; }

  /* ---------- görünümler ---------- */
  var VIEWS = {};

  VIEWS.panel = function () {
    var bekleyen = st.talepler.filter(function (p) { return p.durum === 'onay'; });
    var benim = bekleyen.filter(function (p) { return siradakiOnay(p) === st.rol; });
    var acik = st.siparisler.filter(function (o) { return o.asama < 4; });
    var kilitli = acik.reduce(function (a, o) { return a + o.kilitli; }, 0);
    var farkli = st.siparisler.filter(function (o) { var e = eslestir(o); return e && !e.ok && o.asama < 4; });
    var kabulBekleyen = st.siparisler.filter(function (o) { return o.asama === 1; });
    var riskli = st.tedarikciler.filter(function (s) { return riskler(s).length; });
    var isler = [];
    benim.forEach(function (p) { isler.push(['Onayınızı bekliyor', p.id + ' · ' + p.kalem, '#/talepler']); });
    if (st.rol === 'depo') kabulBekleyen.forEach(function (o) { isler.push(['NFC ile mal kabul', o.id + ' · ' + o.kalem, '#/kabul']); });
    if (st.rol === 'finans') st.siparisler.filter(function (o) { var e = eslestir(o); return e && e.ok && o.asama === 2; })
      .forEach(function (o) { isler.push(['Ödeme serbest bırakılabilir', o.id + ' · ' + ted(o.tedarikci).ad, '#/eslestirme']); });
    if (st.rol === 'satinalma') st.talepler.filter(function (p) { return p.durum === 'onaylandi' || p.durum === 'teklif'; })
      .forEach(function (p) { isler.push([p.durum === 'teklif' ? 'Teklifleri değerlendir' : 'Teklif iste', p.id + ' · ' + p.kalem, '#/teklifler']); });
    if (st.rol === 'tedarikci') st.siparisler.filter(function (o) { return o.asama === 0; })
      .forEach(function (o) { isler.push(['Sevk et ve etiket yaz', o.id + ' · ' + o.kalem, '#/siparisler']); });

    return '<header class="vh"><div><p class="eyebrow">GENEL BAKIŞ</p><h1>Satın alma ve güven paneli</h1></div></header>' +
      '<section class="kpis">' +
      kpi('Onay bekleyen talep', bekleyen.length, benim.length ? benim.length + ' tanesi sizde' : 'Sizde bekleyen yok') +
      kpi('Açık sipariş', acik.length, sayi(kabulBekleyen.length) + ' tanesi mal kabul bekliyor') +
      kpi('Güvencede kilitli tutar', para(kilitli), 'Lisanslı ödeme kuruluşunda') +
      kpi('Eşleşmeyen fatura', farkli.length, farkli.length ? 'Ödeme bloke' : 'Tümü tolerans içinde', farkli.length ? 'warn' : '') +
      '</section>' +
      '<section class="grid2">' +
      '<div class="card"><h2>Sıradaki işleriniz</h2><p class="sub">Rol: ' + esc(rolAd(st.rol)) + '</p>' +
      (isler.length ? '<ul class="todo">' + isler.map(function (x) { return '<li><a href="' + x[2] + '"><b>' + esc(x[0]) + '</b><span>' + esc(x[1]) + '</span></a></li>'; }).join('') + '</ul>'
        : '<p class="empty">Bu rol için bekleyen iş yok. Üst menüden başka bir rol seçebilirsiniz.</p>') + '</div>' +
      '<div class="card"><h2>Bütçe kullanımı</h2><p class="sub">Harcanan ve taahhüt edilen tutar</p>' +
      st.butceler.map(function (b) {
        var t = taahhut(b.id), h = b.harcanan, pH = h / b.limit * 100, pT = t / b.limit * 100;
        return '<div class="budget"><div class="bl"><b>' + esc(b.ad) + '</b><span>' + para(h + t) + ' / ' + para(b.limit) + '</span></div>' +
          '<div class="bar"><i style="width:' + Math.min(pH, 100) + '%"></i><i class="t" style="width:' + Math.min(pT, 100 - Math.min(pH, 100)) + '%"></i></div></div>';
      }).join('') + '<p class="legend"><span class="sw"></span>Harcanan <span class="sw t"></span>Açık siparişler</p></div>' +
      '</section>' +
      '<section class="card"><h2>Erken uyarılar</h2>' +
      (riskli.length ? '<table class="tbl"><thead><tr><th>Tedarikçi</th><th>Sinyal</th><th>Önerilen aksiyon</th></tr></thead><tbody>' +
        riskli.map(function (s) {
          return riskler(s).map(function (r) { return '<tr><td>' + esc(s.ad) + '</td><td>' + esc(r) + '</td><td>' + esc(aksiyon(r)) + '</td></tr>'; }).join('');
        }).join('') + '</tbody></table>' : '<p class="empty">Aktif risk sinyali yok.</p>') +
      '</section>';
  };
  function kpi(l, v, s, cls) { return '<div class="kpi ' + (cls || '') + '"><p class="kl">' + esc(l) + '</p><p class="kv">' + esc(v) + '</p><p class="ks">' + esc(s) + '</p></div>'; }
  function aksiyon(r) {
    if (r.indexOf('Faaliyet') === 0) return 'Siparişten önce güncel belge iste';
    if (r.indexOf('SGK') === 0) return 'Avansı %10 ile sınırla';
    if (r.indexOf('Kapasite') === 0) return 'Kapasite teyidi iste';
    if (r.indexOf('Beyan') === 0) return 'Giriş kontrolünü sıklaştır';
    return 'Yedek tedarikçi hazırla';
  }

  /* Talepler ve onay akışı */
  VIEWS.talepler = function () {
    return '<header class="vh"><div><p class="eyebrow">SATIN ALMA TALEPLERİ</p><h1>Talep ve onay akışı</h1></div>' +
      '<button class="btn" data-act="yeniTalep">Yeni talep</button></header>' +
      '<p class="lead">Tutar arttıkça onay zinciri uzar: 250.000 üzeri satın alma müdürü, 1.000.000 üzeri finans direktörü onayı gerekir. Bütçeyi aşan talepler finansa otomatik gider.</p>' +
      st.talepler.slice().reverse().map(function (p) {
        var gerek = onayZinciri(p.tahmini, p.mm), sira = siradakiOnay(p), b = butce(p.mm);
        var kalan = b.limit - b.harcanan - taahhut(p.mm);
        var durumTxt = { onay: 'Onay bekliyor', onaylandi: 'Onaylandı', teklif: 'Teklif aşamasında', siparis: 'Siparişe döndü', red: 'Reddedildi' }[p.durum];
        return '<article class="card pr"><div class="pr-h"><div><p class="mono">' + esc(p.id) + ' · ' + esc(p.sahibi) + '</p><h3>' + esc(p.kalem) + '</h3>' +
          '<p class="sub">' + sayi(p.miktar, 1) + ' ' + esc(p.birim) + ' · ' + esc(b.ad) + ' · ihtiyaç ' + esc(p.ihtiyac) + '</p></div>' +
          '<div class="pr-r"><p class="big">' + para(p.tahmini) + '</p>' + pill(durumTxt, p.durum === 'red' ? 'bad' : p.durum === 'onay' ? 'warn' : 'ok') + '</div></div>' +
          '<ol class="chain">' + gerek.map(function (r) {
            var o = p.onaylar.filter(function (x) { return x.rol === r; })[0];
            var cls = o ? (o.ok ? 'done' : 'rej') : (r === sira && p.durum === 'onay' ? 'now' : '');
            return '<li class="' + cls + '"><b>' + esc(rolAd(r)) + '</b><span>' + (o ? (o.ok ? 'Onayladı · ' : 'Reddetti · ') + esc(o.at) : r === sira && p.durum === 'onay' ? 'Sırada' : 'Bekliyor') + '</span></li>';
          }).join('') + '</ol>' +
          (kalan < p.tahmini && p.durum === 'onay' ? '<p class="alert">Bütçe uyarısı: ' + esc(b.ad) + ' bütçesinde kalan ' + para(kalan) + '. Finans onayı zorunlu.</p>' : '') +
          (p.durum === 'onay' && sira ? (yetki(sira) ? '<div class="acts"><button class="btn" data-act="onayla" data-id="' + p.id + '">Onayla</button><button class="btn ghost" data-act="reddet" data-id="' + p.id + '">Reddet</button></div>' : rolUyari(sira)) : '') +
          (p.durum === 'onaylandi' ? (yetki('satinalma') ? '<div class="acts"><button class="btn" data-act="teklifIste" data-id="' + p.id + '">Tedarikçilerden teklif iste</button></div>' : rolUyari('satinalma')) : '') +
          '</article>';
      }).join('');
  };

  /* Teklifler */
  VIEWS.teklifler = function () {
    var acik = st.talepler.filter(function (p) { return p.durum === 'teklif'; });
    if (!acik.length) return '<header class="vh"><div><p class="eyebrow">TEKLİFLER</p><h1>Teklif karşılaştırma</h1></div></header><p class="empty">Teklif aşamasında talep yok. Onaylanmış bir talepten teklif isteyin.</p>';
    return '<header class="vh"><div><p class="eyebrow">TEKLİFLER</p><h1>Teklif karşılaştırma</h1></div></header>' +
      '<p class="lead">Teklifler yalnızca fiyata göre değil; navlun, vade (bugünkü değer), karne ve risk sinyaline göre sıralanır. Örnek sermaye maliyeti aylık %' + sayi(CFG.sermayeMaliyetiAylik * 100, 1) + '.</p>' +
      acik.map(function (p) {
        var list = (st.teklifler[p.id] || []).filter(function (t) { return !t.red; }).map(function (t) {
          var s = ted(t.tedarikci), d = bugunkuDeger(t, p.miktar), r = riskler(s);
          return { t: t, s: s, d: d, r: r };
        });
        var uygun = list.filter(function (x) { return !x.r.length && x.s.seviye !== 'Verified'; });
        var oneri = (uygun.length ? uygun : list).slice().sort(function (a, b) { return a.d.bd - b.d.bd; })[0];
        var enUcuz = list.slice().sort(function (a, b) { return a.t.fiyat - b.t.fiyat; })[0];
        return '<article class="card"><p class="mono">' + esc(p.id) + '</p><h3>' + esc(p.kalem) + ' · ' + sayi(p.miktar) + ' ' + esc(p.birim) + '</h3>' +
          '<table class="tbl"><thead><tr><th>Tedarikçi</th><th>Seviye</th><th>Birim fiyat</th><th>Navlun</th><th>Vade</th><th>Termin</th><th>Toplam</th><th>Bugünkü değer</th><th></th></tr></thead><tbody>' +
          list.map(function (x) {
            return '<tr class="' + (x === oneri ? 'best' : '') + '"><td><b>' + esc(x.s.ad) + '</b>' + (x.r.length ? '<br><small class="warn-t">' + esc(x.r.join(' · ')) + '</small>' : '') + (x.s.seviye === 'Verified' ? '<br><small class="muted">Puan için yeterli teslimat yok</small>' : '') + '</td>' +
              '<td>' + seviyePill(x.s) + '</td><td>' + para(x.t.fiyat) + '</td><td>' + para(x.t.navlun) + '</td><td>' + x.t.vade + ' gün</td><td>' + x.t.termin + ' gün</td><td>' + para(x.d.toplam) + '</td><td><b>' + para(x.d.bd) + '</b></td>' +
              '<td>' + (x === oneri ? pill('Önerilen', 'ok') : '') + '</td></tr>';
          }).join('') + '</tbody></table>' +
          (oneri && enUcuz && oneri !== enUcuz ? '<p class="note">En düşük birim fiyat ' + esc(enUcuz.s.ad) + ' teklifinde; ancak navlun, vade ve karne hesaba katılınca öneri ' + esc(oneri.s.ad) + '.</p>' : '') +
          (yetki('satinalma') ? '<div class="acts"><button class="btn" data-act="siparisVer" data-id="' + p.id + '" data-s="' + oneri.s.id + '">' + esc(oneri.s.ad) + ' ile sipariş ver</button></div>' : rolUyari('satinalma')) +
          '</article>';
      }).join('');
  };

  /* Siparişler */
  VIEWS.siparisler = function () {
    return '<header class="vh"><div><p class="eyebrow">SİPARİŞLER</p><h1>Sipariş takibi</h1></div></header>' +
      '<p class="lead">Sipariş verildiği anda tutar lisanslı ödeme kuruluşunda kilitlenir; mal kabul ve fatura eşleşmesinden sonra serbest bırakılır.</p>' +
      st.siparisler.slice().reverse().map(function (o) {
        var s = ted(o.tedarikci);
        return '<article class="card po"><div class="pr-h"><div><p class="mono">' + esc(o.id) + ' · ' + esc(o.olusturma) + '</p><h3>' + esc(o.kalem) + '</h3>' +
          '<p class="sub">' + esc(s.ad) + ' · ' + sayi(o.miktar, 1) + ' ' + esc(o.birim) + ' × ' + para(o.fiyat) + ' · vade ' + o.vade + ' gün</p></div>' +
          '<div class="pr-r"><p class="big">' + para(o.miktar * o.fiyat) + '</p>' + (o.kilitli ? pill('Kilitli ' + para(o.kilitli), 'lock') : pill('Ödendi ' + para(o.odenen), 'ok')) + '</div></div>' +
          '<ol class="steps">' + ASAMALAR.map(function (a, i) { return '<li class="' + (i < o.asama ? 'done' : i === o.asama ? 'now' : '') + '">' + esc(a) + '</li>'; }).join('') + '</ol>' +
          (o.asama === 0 ? (yetki('tedarikci') ? '<div class="acts"><button class="btn" data-act="sevkEt" data-id="' + o.id + '">Sevk et ve NFC etiketi yaz</button></div>' : rolUyari('tedarikci')) : '') +
          (o.asama >= 1 ? '<p class="mono small">Lot ' + esc(o.lot) + ' · etiket özeti ' + esc(etiketOzeti(o)) + '</p>' : '') +
          '</article>';
      }).join('');
  };

  /* NFC ile mal kabul */
  VIEWS.kabul = function () {
    var bekleyen = st.siparisler.filter(function (o) { return o.asama === 1; });
    var destek = window.SCNFC.supported();
    return '<header class="vh"><div><p class="eyebrow">MAL KABUL · NFC</p><h1>Etiketi okut, teslimi kanıtla</h1></div></header>' +
      '<div class="nfc-state ' + (destek ? 'on' : 'off') + '">' +
      (destek ? '<b>Bu cihaz NFC okuyabiliyor.</b> Paletteki etiketi telefonun arkasına yaklaştırın.' :
        '<b>Bu cihazda Web NFC yok.</b> Gerçek okuma Android’de Chrome ile ve HTTPS adreste çalışır. Burada etiket okumasını simüle edebilirsiniz.') + '</div>' +
      (bekleyen.length ? bekleyen.map(function (o) {
        var s = ted(o.tedarikci);
        return '<article class="card kabul"><div class="pr-h"><div><p class="mono">' + esc(o.id) + ' · lot ' + esc(o.lot) + '</p><h3>' + esc(o.kalem) + '</h3>' +
          '<p class="sub">' + esc(s.ad) + ' · beklenen ' + sayi(o.miktar, 1) + ' ' + esc(o.birim) + '</p></div>' + pill('Sevk edildi', 'warn') + '</div>' +
          (yetki('depo') ? '<div class="acts"><button class="btn big-btn" data-act="nfcOku" data-id="' + o.id + '">' + (destek ? 'NFC etiketini okut' : 'Etiket okumayı simüle et') + '</button></div>' : rolUyari('depo')) +
          '</article>';
      }).join('') : '<p class="empty">Mal kabul bekleyen sevkiyat yok. Tedarikçi portalından bir siparişi sevk edebilirsiniz.</p>') +
      '<section class="card"><h2>Neden NFC?</h2><ul class="list">' +
      '<li>Tedarikçi sevk anında palete etiket yazar: sipariş, lot, miktar ve özet.</li>' +
      '<li>Depo etiketi okuttuğunda özet siparişle karşılaştırılır; yanlış palet ya da değiştirilmiş etiket anında yakalanır.</li>' +
      '<li>Teslim anı ve miktar zincire yazılır; karnedeki zamanında teslim puanı tartışmasız hale gelir.</li></ul></section>';
  };

  /* Üçlü eşleştirme */
  VIEWS.eslestirme = function () {
    var list = st.siparisler.filter(function (o) { return o.asama >= 2; });
    return '<header class="vh"><div><p class="eyebrow">FATURA · ÜÇLÜ EŞLEŞTİRME</p><h1>Sipariş, mal kabul ve fatura</h1></div></header>' +
      '<p class="lead">Fatura; sipariş fiyatı ve mal kabuldeki miktarla karşılaştırılır. Fark %' + CFG.toleransYuzde + ' toleransı aşarsa ödeme otomatik bloke edilir.</p>' +
      list.slice().reverse().map(function (o) {
        var e = eslestir(o), s = ted(o.tedarikci);
        var bas = '<article class="card"><div class="pr-h"><div><p class="mono">' + esc(o.id) + '</p><h3>' + esc(s.ad) + ' · ' + esc(o.kalem) + '</h3></div>';
        if (!e) {
          return bas + pill('Fatura bekleniyor', 'warn') + '</div>' +
            (yetki('tedarikci') ? '<div class="acts"><button class="btn" data-act="faturaKes" data-id="' + o.id + '">Faturayı gönder</button></div>' : rolUyari('tedarikci')) + '</article>';
        }
        var durum = o.asama === 4 ? pill('Ödendi', 'ok') : e.ok ? pill('Eşleşti', 'ok') : pill('Fark var · ödeme bloke', 'bad');
        return bas + durum + '</div>' +
          '<table class="tbl match"><thead><tr><th></th><th>Sipariş</th><th>Mal kabul</th><th>Fatura (' + esc(e.f.id) + ')</th><th>Fark</th></tr></thead><tbody>' +
          '<tr><td>Miktar</td><td>' + sayi(o.miktar, 1) + ' ' + esc(o.birim) + '</td><td>' + sayi(o.kabul.miktar, 1) + '</td><td>' + sayi(e.f.miktar, 1) + '</td><td class="' + (e.mFark > CFG.toleransYuzde / 100 ? 'bad-t' : 'ok-t') + '">%' + sayi(e.mFark * 100, 1) + '</td></tr>' +
          '<tr><td>Birim fiyat</td><td>' + para(o.fiyat) + '</td><td>–</td><td>' + para(e.f.fiyat) + '</td><td class="' + (e.fFark > CFG.toleransYuzde / 100 ? 'bad-t' : 'ok-t') + '">%' + sayi(e.fFark * 100, 1) + '</td></tr>' +
          '<tr><td>Tutar</td><td>' + para(o.miktar * o.fiyat) + '</td><td>' + para(o.kabul.miktar * o.fiyat) + '</td><td>' + para(e.tutar) + '</td><td></td></tr></tbody></table>' +
          (o.asama === 4 ? '' : e.ok ?
            (yetki('finans') ? '<div class="acts"><button class="btn" data-act="ode" data-id="' + o.id + '">Ödemeyi serbest bırak (' + para(Math.min(e.tutar, o.kilitli)) + ')</button></div>' : rolUyari('finans')) :
            '<p class="alert">Miktar farkı mal kabulde ölçülen değerle tutmuyor. Tedarikçiden düzeltilmiş fatura istenmeli.</p>' +
            (yetki('satinalma') || yetki('finans') ? '<div class="acts"><button class="btn ghost" data-act="duzeltmeIste" data-id="' + o.id + '">Düzeltilmiş fatura iste</button></div>' : rolUyari('satinalma'))) +
          '</article>';
      }).join('');
  };

  /* Tedarikçiler ve karne */
  VIEWS.tedarikciler = function () {
    return '<header class="vh"><div><p class="eyebrow">TEDARİKÇİLER</p><h1>Karne, seviye ve risk</h1></div></header>' +
      '<p class="lead">Endeks formülle hesaplanır: zamanında ve eksiksiz teslim %30, kalite %30, beyan–ölçüm uyumu %15, yeterlilik %15, uyuşmazlık geçmişi %10. Beş teslimattan azsa puan gösterilmez.</p>' +
      '<div class="card"><table class="tbl"><thead><tr><th>Tedarikçi</th><th>Kategori</th><th>Seviye</th><th>Endeks</th><th>Teslimat</th><th>Farklı alıcı</th><th>Teslimde avans</th><th>Risk sinyali</th></tr></thead><tbody>' +
      st.tedarikciler.map(function (s) {
        var r = riskler(s);
        return '<tr><td><b>' + esc(s.ad) + '</b><br><small class="muted">' + esc(s.bolge) + '</small></td><td>' + esc(s.kat) + '</td><td>' + seviyePill(s) + '</td>' +
          '<td>' + (s.teslimat >= 5 && s.endeks ? '<b>' + s.endeks + '</b>' : '<span class="muted">Yetersiz veri</span>') + '</td><td>' + s.teslimat + '</td><td>' + s.alici + '</td>' +
          '<td>%' + avans(s) + '</td><td>' + (r.length ? r.map(function (x) { return pill(x, 'warn'); }).join(' ') : pill('Yok', 'ok')) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<section class="grid2"><div class="card"><h2>Seviye kuralları</h2><table class="tbl"><tbody>' +
      '<tr><td>' + pill('Verified', 'lv-verified') + '</td><td>Kimlik ve temel belgeler doğrulandı</td></tr>' +
      '<tr><td>' + pill('Silver', 'lv-silver') + '</td><td>10+ teslimat, endeks 70+</td></tr>' +
      '<tr><td>' + pill('Gold', 'lv-gold') + '</td><td>20+ teslimat, endeks 85+, 5+ farklı alıcı</td></tr>' +
      '<tr><td>' + pill('Platinum', 'lv-platinum') + '</td><td>40+ teslimat, endeks 90+, 10+ farklı alıcı</td></tr></tbody></table></div>' +
      '<div class="card"><h2>Alıcı da puanlanır</h2><p>Üreticinin alıcı endeksi: zamanında ödeme %60, gecikme günü %25, haklı itiraz oranı %15.</p><p class="muted">Bu firma için örnek alıcı endeksi: <b>91</b></p></div></section>';
  };

  /* Sözleşmeler */
  VIEWS.sozlesmeler = function () {
    return '<header class="vh"><div><p class="eyebrow">SÖZLEŞMELER</p><h1>Çerçeve anlaşmalar ve fiyat revizyonu</h1></div></header>' +
      '<p class="lead">Bitişine 60 günden az kalan sözleşme için yenileme uyarısı verilir. Piyasa endeksi eşiği aşarsa fiyat, sözleşmedeki revizyon maddesine göre güncellenir.</p>' +
      '<div class="card"><table class="tbl"><thead><tr><th>Sözleşme</th><th>Tedarikçi</th><th>Birim fiyat</th><th>Bitiş</th><th>Endeks değişimi</th><th>Durum</th></tr></thead><tbody>' +
      st.sozlesmeler.map(function (c) {
        var kalan = gunFarki(c.bitis), deg = (c.endeksSon / c.endeksBaz - 1) * 100;
        var durum = [];
        if (kalan < 0) durum.push(pill('Süresi doldu', 'bad'));
        else if (kalan <= 60) durum.push(pill(kalan + ' gün kaldı · yenile', 'warn'));
        if (deg >= c.esik) durum.push(pill('Revizyon maddesi devrede', 'warn'));
        if (!durum.length) durum.push(pill('Normal', 'ok'));
        return '<tr><td><b>' + esc(c.id) + '</b><br><small class="muted">' + esc(c.konu) + '</small></td><td>' + esc(ted(c.tedarikci).ad) + '</td><td>' + para(c.birimFiyat) + ' / ' + esc(c.birim) + '</td>' +
          '<td>' + esc(c.bitis) + '</td><td>%' + sayi(deg, 1) + ' <small class="muted">(eşik %' + c.esik + ')</small></td><td>' + durum.join(' ') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  };

  /* Harcama analizi */
  VIEWS.analiz = function () {
    var katlar = {}, tedler = {};
    st.siparisler.forEach(function (o) {
      var t = o.miktar * o.fiyat, s = ted(o.tedarikci);
      katlar[s.kat] = (katlar[s.kat] || 0) + t;
      tedler[s.ad] = (tedler[s.ad] || 0) + t;
    });
    var toplam = Object.keys(katlar).reduce(function (a, k) { return a + katlar[k]; }, 0);
    var sozlesmeli = st.siparisler.filter(function (o) { return st.sozlesmeler.some(function (c) { return c.tedarikci === o.tedarikci; }); })
      .reduce(function (a, o) { return a + o.miktar * o.fiyat; }, 0);
    var maxAy = Math.max.apply(null, st.harcamaAylik.map(function (m) { return m.tutar; }));
    function bars(obj) {
      var keys = Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a]; });
      var max = obj[keys[0]] || 1;
      return keys.map(function (k) {
        var pay = obj[k] / toplam * 100;
        return '<div class="hbar"><span>' + esc(k) + '</span><div class="bar"><i style="width:' + (obj[k] / max * 100) + '%"></i></div><b>' + para(obj[k]) + '</b><small>%' + sayi(pay, 0) + (pay >= 45 ? ' · tek kaynak riski' : '') + '</small></div>';
      }).join('');
    }
    return '<header class="vh"><div><p class="eyebrow">HARCAMA ANALİZİ</p><h1>Nereye, kime, ne kadar?</h1></div></header>' +
      '<section class="kpis">' + kpi('Sipariş hacmi', para(toplam), 'Açık ve kapanmış siparişler') + kpi('Sözleşmeli harcama', '%' + sayi(sozlesmeli / toplam * 100), 'Çerçeve anlaşma kapsamında') +
      kpi('Aktif tedarikçi', st.tedarikciler.length, st.tedarikciler.filter(function (s) { return s.seviye !== 'Verified'; }).length + ' tanesi puanlı') + kpi('Son 6 ay', para(st.harcamaAylik.reduce(function (a, m) { return a + m.tutar; }, 0)), 'Toplam satın alma') + '</section>' +
      '<section class="grid2"><div class="card"><h2>Kategoriye göre</h2>' + bars(katlar) + '</div><div class="card"><h2>Tedarikçiye göre</h2>' + bars(tedler) + '</div></section>' +
      '<section class="card"><h2>Aylık satın alma</h2><div class="vbars">' + st.harcamaAylik.map(function (m) {
        return '<div class="vb"><b>' + sayi(m.tutar / 1e6, 1) + ' mn</b><i style="height:' + (m.tutar / maxAy * 160) + 'px"></i><span>' + esc(m.ay) + '</span></div>';
      }).join('') + '</div><p class="muted">Örnek veri.</p></section>';
  };

  /* Zincir kayıtları */
  VIEWS.zincir = function () {
    var d = zinciriDogrula();
    return '<header class="vh"><div><p class="eyebrow">ZİNCİR KAYITLARI · DENETİM İZİ</p><h1>Kim, neyi, ne zaman yaptı?</h1></div>' +
      '<div class="acts"><button class="btn" data-act="dogrula">Zinciri doğrula</button>' + (st.kurcalandi ? '<button class="btn ghost" data-act="onar">Kaydı geri al</button>' : '<button class="btn ghost" data-act="kurcala">Kurcalama testi</button>') + '</div></header>' +
      '<p class="lead">Her kayıt bir öncekinin özetini (SHA-256) içerir. Geçmişteki tek bir harf değişirse zincir o noktadan itibaren kırılır. Gerçek sistemde bu kayıtlar Solana’ya yazılır; ticari veri ve para zincire yazılmaz.</p>' +
      '<div class="verify ' + (d.ok ? 'ok' : 'bad') + '">' + (d.ok ? 'Zincir sağlam · ' + d.n + ' kayıt doğrulandı' : 'Zincir kırık · #' + d.i + ' numaralı kayıt sonradan değiştirilmiş') + '</div>' +
      '<div class="card"><table class="tbl ledger"><thead><tr><th>#</th><th>Zaman</th><th>Tür</th><th>Referans</th><th>Kayıt</th><th>Yapan</th><th>Özet</th></tr></thead><tbody>' +
      st.kayitlar.slice().reverse().map(function (k) {
        var bozuk = !d.ok && k.i >= d.i;
        return '<tr class="' + (bozuk ? 'broken' : '') + '"><td>' + k.i + '</td><td>' + esc(k.ts) + '</td><td>' + pill(k.tur.replace('_', ' '), '') + '</td><td>' + esc(k.ref) + '</td><td>' + esc(k.veri) + '</td><td>' + esc(k.aktor) + '</td><td class="mono">' + esc(kisa(k.hash)) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  };

  /* Hakkında */
  VIEWS.hakkinda = function () {
    return '<header class="vh"><div><p class="eyebrow">HAKKINDA</p><h1>SolChain B2B demo uygulaması</h1></div></header>' +
      '<div class="card prose"><p>Bu uygulama, SolChain B2B’nin satın alma ve güven akışını uçtan uca gösteren bir demodur: talep ve onay, teklif karşılaştırma, kilitli ödeme, NFC ile mal kabul, üçlü eşleştirme, karne ve değiştirilemez kayıt.</p>' +
      '<p><b>Nasıl denenir?</b> Üst menüden rol değiştirerek akışı yürütün: talep sahibi talep açar, birim yöneticisi ve satın alma müdürü onaylar, satın alma teklif ister ve sipariş verir, tedarikçi sevk eder ve etiket yazar, depo etiketi okutup malı kabul eder, tedarikçi faturayı gönderir, finans eşleşen faturanın ödemesini serbest bırakır.</p>' +
      '<p><b>NFC:</b> Android’de Chrome ile, HTTPS adreste (örneğin GitHub Pages) gerçek NTAG etiketleri okunur ve yazılır. Diğer cihazlarda okuma simüle edilir.</p>' +
      '<p><b>Sınırlar:</b> Tüm firmalar ve tutarlar örnek veridir. Ödeme kuruluşu, ERP, e-Fatura ve Solana programı bu demoda canlandırılır; veri yalnızca bu tarayıcıda saklanır.</p></div>';
  };

  /* ---------- eylemler ---------- */
  var ACT = {};
  ACT.yeniTalep = function () {
    modal('<h2>Yeni satın alma talebi</h2><form id="fTalep" class="form">' +
      '<label>Kalem<input name="kalem" required value="DC01 sac, 1,2 mm"></label>' +
      '<div class="row"><label>Kategori<select name="kat"><option>Metal</option><option>Plastik</option><option>Ambalaj</option></select></label>' +
      '<label>Miktar<input name="miktar" type="number" min="0.1" step="0.1" required value="15"></label>' +
      '<label>Birim<select name="birim"><option>ton</option><option>adet</option><option>kg</option></select></label></div>' +
      '<div class="row"><label>Maliyet merkezi<select name="mm">' + st.butceler.map(function (b) { return '<option value="' + b.id + '">' + esc(b.ad) + '</option>'; }).join('') + '</select></label>' +
      '<label>Tahmini tutar<input name="tahmini" type="number" min="1" step="1" required value="560000"></label>' +
      '<label>İhtiyaç tarihi<input name="ihtiyac" type="date" required value="2026-12-20"></label></div>' +
      '<p class="hint" id="onayOnizleme"></p>' +
      '<div class="acts"><button class="btn" type="submit">Talebi oluştur</button><button class="btn ghost" type="button" data-act="kapat">Vazgeç</button></div></form>');
    var f = $('#fTalep');
    function onizle() {
      var z = onayZinciri(Number(f.tahmini.value) || 0, f.mm.value);
      $('#onayOnizleme').textContent = 'Onay zinciri: ' + z.map(rolAd).join(' → ');
    }
    f.addEventListener('input', onizle); onizle();
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = st.talepler.length ? Math.max.apply(null, st.talepler.map(function (p) { return Number(p.id.slice(3)); })) + 1 : 1;
      var p = { id: 'PR-0' + n, kalem: f.kalem.value.trim(), kat: f.kat.value, miktar: Number(f.miktar.value), birim: f.birim.value, mm: f.mm.value, tahmini: Number(f.tahmini.value), ihtiyac: f.ihtiyac.value, sahibi: rolAd(st.rol), durum: 'onay', onaylar: [] };
      st.talepler.push(p);
      zincireYaz('TALEP', p.id, p.kalem + ' · ' + para(p.tahmini) + ' · onaya gönderildi');
      save(); kapatModal(); render(); toast(p.id + ' oluşturuldu ve onaya gönderildi.', 'ok');
    });
  };
  ACT.kapat = kapatModal;
  ACT.onayla = function (id) { karar(id, true); };
  ACT.reddet = function (id) { karar(id, false); };
  function karar(id, ok) {
    var p = talep(id), r = siradakiOnay(p);
    if (!r || !yetki(r)) return;
    p.onaylar.push({ rol: r, ok: ok, at: now() });
    if (!ok) p.durum = 'red';
    else if (!siradakiOnay(p)) p.durum = 'onaylandi';
    zincireYaz('ONAY', p.id, rolAd(r) + (ok ? ' onayladı' : ' reddetti'));
    save(); render();
    toast(ok ? (p.durum === 'onaylandi' ? p.id + ' tüm onayları aldı.' : 'Onay kaydedildi; sıradaki: ' + rolAd(siradakiOnay(p))) : p.id + ' reddedildi.', ok ? 'ok' : 'bad');
  }
  ACT.teklifIste = function (id) {
    var p = talep(id);
    var adaylar = st.tedarikciler.filter(function (s) { return s.kat === p.kat; });
    var baz = p.tahmini / p.miktar;
    st.teklifler[p.id] = adaylar.map(function (s, i) {
      var carpan = [0.97, 0.93, 1.01, 0.99][i % 4];
      return { tedarikci: s.id, fiyat: Math.round(baz * carpan), navlun: [8000, 21000, 6000, 12000][i % 4], vade: [60, 30, 45, 60][i % 4], termin: [7, 10, 5, 8][i % 4] };
    });
    p.durum = 'teklif';
    zincireYaz('TEKLIF', p.id, adaylar.length + ' tedarikçiden teklif istendi');
    save(); location.hash = '#/teklifler'; toast(adaylar.length + ' tedarikçiden teklif alındı (demo).', 'ok');
  };
  ACT.siparisVer = function (id, el) {
    var p = talep(id), s = ted(el.getAttribute('data-s'));
    var t = st.teklifler[p.id].filter(function (x) { return x.tedarikci === s.id; })[0];
    var n = Math.max.apply(null, st.siparisler.map(function (o) { return Number(o.id.slice(3)); })) + 1;
    var tutar = t.fiyat * p.miktar;
    var o = { id: 'PO-0' + n, pr: p.id, tedarikci: s.id, kalem: p.kalem, miktar: p.miktar, birim: p.birim, fiyat: t.fiyat, vade: t.vade, asama: 0, kilitli: tutar, odenen: 0, lot: 'L-' + (10000 + Math.floor(Math.random() * 89999)), etiketYazildi: false, olusturma: now().slice(0, 10) };
    st.siparisler.push(o);
    p.durum = 'siparis';
    zincireYaz('SIPARIS', o.id, s.ad + ' · ' + sayi(o.miktar, 1) + ' ' + o.birim + ' · ' + para(tutar) + ' kilitlendi');
    save(); location.hash = '#/siparisler'; toast(o.id + ' verildi; ' + para(tutar) + ' güvencede kilitlendi.', 'ok');
  };
  ACT.sevkEt = function (id) {
    var o = siparis(id), y = etiketYuku(o), destek = window.SCNFC.supported();
    modal('<h2>Sevkiyat etiketi</h2><p>Palete yapıştırılacak NFC etiketine şu veri yazılır:</p><pre class="code">' + esc(JSON.stringify(y, null, 1)) + '</pre>' +
      '<p class="hint">' + (destek ? 'Yaz düğmesine basın ve boş bir NTAG etiketini telefonun arkasına yaklaştırın.' : 'Bu cihazda Web NFC yok; etiket yazımı simüle edilecek.') + '</p>' +
      '<div class="acts"><button class="btn" id="yazBtn">' + (destek ? 'Etikete yaz ve sevk et' : 'Simüle et ve sevk et') + '</button><button class="btn ghost" data-act="kapat">Vazgeç</button></div>');
    $('#yazBtn').addEventListener('click', function () {
      var b = this; b.disabled = true; b.textContent = destek ? 'Etiketi yaklaştırın…' : 'Yazılıyor…';
      var is = destek ? window.SCNFC.write(y) : new Promise(function (r) { setTimeout(r, 600); });
      is.then(function () {
        o.asama = 1; o.etiketYazildi = true;
        zincireYaz('SEVK', o.id, 'Lot ' + o.lot + ' · NFC etiketi ' + (destek ? 'yazıldı' : 'yazıldı (simülasyon)') + ' · özet ' + y.h);
        save(); kapatModal(); render(); toast(o.id + ' sevk edildi.', 'ok');
      }).catch(function (err) { b.disabled = false; b.textContent = 'Tekrar dene'; toast('NFC yazılamadı: ' + err.message, 'bad'); });
    });
  };
  ACT.nfcOku = function (id) {
    var o = siparis(id), destek = window.SCNFC.supported();
    modal('<h2>Etiket okunuyor</h2><div class="scan"><div class="ring"></div><p>' + (destek ? 'Paletteki etiketi telefonun arkasına yaklaştırın…' : 'Simülasyon: ' + esc(o.id) + ' paletinin etiketi okunuyor…') + '</p></div>' +
      '<div class="acts"><button class="btn ghost" data-act="kapat">İptal</button></div>');
    var is = destek ? window.SCNFC.read(20000) : new Promise(function (r) { setTimeout(function () { r({ payload: etiketYuku(o), serial: 'SIM-04:A2:19:7C' }); }, 1100); });
    is.then(function (res) { kabulFormu(o, res.payload, res.serial); })
      .catch(function (err) {
        modal('<h2>Etiket okunamadı</h2><p class="alert">' + esc(err.message) + '</p><div class="acts"><button class="btn" data-act="nfcOku" data-id="' + o.id + '">Tekrar dene</button><button class="btn ghost" data-act="kapat">Kapat</button></div>');
      });
  };
  function kabulFormu(o, y, seri) {
    var dogruPo = y.po === o.id, dogruOzet = y.h === etiketOzeti(o);
    var ok = dogruPo && dogruOzet;
    modal('<h2>' + (ok ? 'Etiket doğrulandı' : 'Etiket eşleşmedi') + '</h2>' +
      '<div class="verify ' + (ok ? 'ok' : 'bad') + '">' + (ok ? 'Sipariş, lot ve özet tutuyor.' : !dogruPo ? 'Bu etiket ' + esc(y.po) + ' siparişine ait; yanlış palet.' : 'Özet tutmuyor: etiket değiştirilmiş olabilir.') + '</div>' +
      '<table class="tbl"><tbody><tr><td>Sipariş</td><td>' + esc(y.po) + '</td></tr><tr><td>Lot</td><td>' + esc(y.lot) + '</td></tr><tr><td>Etiketteki miktar</td><td>' + sayi(y.q, 1) + ' ' + esc(y.u) + '</td></tr><tr><td>Etiket seri no</td><td class="mono">' + esc(seri) + '</td></tr></tbody></table>' +
      (ok ? '<form id="fKabul" class="form"><div class="row"><label>Sayılan miktar<input name="miktar" type="number" step="0.1" min="0" value="' + o.miktar + '" required></label>' +
        '<label>Kalite kontrol<select name="kalite"><option>Uygun</option><option>Şartlı kabul</option><option>Red</option></select></label></div>' +
        '<div class="acts"><button class="btn" type="submit">Mal kabulünü kaydet</button><button class="btn ghost" type="button" data-act="kapat">Vazgeç</button></div></form>'
        : '<div class="acts"><button class="btn ghost" data-act="kapat">Kapat</button></div>'));
    if (!ok) { zincireYaz('UYARI', o.id, 'NFC etiketi eşleşmedi · mal kabul durduruldu'); save(); return; }
    $('#fKabul').addEventListener('submit', function (e) {
      e.preventDefault();
      var m = Number(this.miktar.value), k = this.kalite.value;
      o.kabul = { miktar: m, kalite: k, at: now(), etiket: true };
      o.asama = 2;
      var s = ted(o.tedarikci); s.teslimat += 1;
      zincireYaz('MAL_KABUL', o.id, 'NFC etiketi doğrulandı · ' + sayi(m, 1) + ' ' + o.birim + ' · kalite ' + k.toLowerCase());
      save(); kapatModal(); location.hash = '#/eslestirme'; toast(o.id + ' teslim alındı; fatura bekleniyor.', 'ok');
    });
  }
  ACT.faturaKes = function (id) {
    var o = siparis(id);
    var n = 7800 + st.faturalar.length;
    st.faturalar.push({ id: 'FT-' + n, po: o.id, miktar: o.miktar, fiyat: o.fiyat, tarih: now().slice(0, 10) });
    zincireYaz('FATURA', o.id, 'FT-' + n + ' · e-Fatura alındı · ' + para(o.miktar * o.fiyat));
    save(); render(); toast('Fatura alındı ve eşleştirildi.', 'ok');
  };
  ACT.duzeltmeIste = function (id) {
    var o = siparis(id), f = faturaOf(o.id);
    f.miktar = o.kabul.miktar; f.id = f.id + '-D';
    zincireYaz('FATURA', o.id, 'Düzeltilmiş fatura ' + f.id + ' · miktar ' + sayi(f.miktar, 1) + ' ' + o.birim);
    save(); render(); toast('Tedarikçi düzeltilmiş faturayı gönderdi (demo).', 'ok');
  };
  ACT.ode = function (id) {
    var o = siparis(id), e = eslestir(o);
    if (!e || !e.ok || !yetki('finans')) return;
    var tutar = Math.min(e.tutar, o.kilitli);
    o.odenen = tutar; o.kilitli = 0; o.asama = 4; e.f.odendi = true;
    var b = butce((talep(o.pr) || {}).mm); if (b) b.harcanan += tutar;
    var s = ted(o.tedarikci);
    if (s.endeks) s.endeks = Math.min(99, s.endeks + (o.kabul.kalite === 'Uygun' ? 1 : -2));
    zincireYaz('ODEME', o.id, 'Üçlü eşleştirme tamam · ' + para(tutar) + ' serbest bırakıldı · karne güncellendi');
    save(); render(); toast('Ödeme serbest bırakıldı; ' + s.ad + ' karnesi güncellendi.', 'ok');
  };
  ACT.dogrula = function () { var d = zinciriDogrula(); render(); toast(d.ok ? 'Zincir sağlam.' : 'Zincir #' + d.i + ' numaralı kayıtta kırık.', d.ok ? 'ok' : 'bad'); };
  ACT.kurcala = function () {
    var k = st.kayitlar[2]; if (!k) return;
    st.kurcalandi = { i: 2, veri: k.veri };
    k.veri = k.veri.replace(/\d+(,\d+)?\s?ton/, '9 ton');
    save(); render(); toast('Kayıt #2 değiştirildi. Zincir artık kırık.', 'bad');
  };
  ACT.onar = function () {
    if (!st.kurcalandi) return;
    st.kayitlar[st.kurcalandi.i].veri = st.kurcalandi.veri; delete st.kurcalandi;
    save(); render(); toast('Kayıt eski haline getirildi.', 'ok');
  };
  ACT.sifirla = function () {
    if (!confirm('Demo verisi başlangıç haline dönsün mü? Bu tarayıcıdaki değişiklikler silinir.')) return;
    init(true); render(); toast('Demo verisi sıfırlandı.', 'ok');
  };

  /* ---------- yönlendirme ve kabuk ---------- */
  var NAV = [
    ['panel', 'Genel bakış'], ['talepler', 'Talepler ve onay'], ['teklifler', 'Teklifler'], ['siparisler', 'Siparişler'],
    ['kabul', 'Mal kabul · NFC'], ['eslestirme', 'Fatura eşleştirme'], ['tedarikciler', 'Tedarikçiler ve karne'],
    ['sozlesmeler', 'Sözleşmeler'], ['analiz', 'Harcama analizi'], ['zincir', 'Zincir kayıtları'], ['hakkinda', 'Hakkında']
  ];
  function route() { var h = (location.hash || '').replace('#/', ''); return VIEWS[h] ? h : 'panel'; }
  function render() {
    var r = route();
    $('#nav').innerHTML = NAV.map(function (n) {
      var badge = '';
      if (n[0] === 'talepler') { var c = st.talepler.filter(function (p) { return p.durum === 'onay' && siradakiOnay(p) === st.rol; }).length; if (c) badge = '<em>' + c + '</em>'; }
      if (n[0] === 'kabul') { var k = st.siparisler.filter(function (o) { return o.asama === 1; }).length; if (k) badge = '<em>' + k + '</em>'; }
      return '<a href="#/' + n[0] + '" class="' + (r === n[0] ? 'on' : '') + '">' + esc(n[1]) + badge + '</a>';
    }).join('');
    $('#rol').innerHTML = ROLES.map(function (x) { return '<option value="' + x.id + '"' + (x.id === st.rol ? ' selected' : '') + '>' + esc(x.ad) + '</option>'; }).join('');
    $('#firma').textContent = st.firma;
    $('#view').innerHTML = VIEWS[r]();
    document.title = NAV.filter(function (n) { return n[0] === r; })[0][1] + ' · SolChain B2B';
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) { if (e.target.id === 'modal') kapatModal(); return; }
    var fn = ACT[el.getAttribute('data-act')];
    if (fn) { e.preventDefault(); fn(el.getAttribute('data-id'), el); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#modal').hidden) kapatModal(); });
  window.addEventListener('hashchange', function () { render(); window.scrollTo(0, 0); $('#side').classList.remove('open'); });
  document.addEventListener('DOMContentLoaded', function () {
    init(false);
    $('#rol').addEventListener('change', function () { st.rol = this.value; save(); render(); toast('Rol: ' + rolAd(st.rol), ''); });
    $('#menuBtn').addEventListener('click', function () { $('#side').classList.toggle('open'); });
    render();
  });

  window.SCDemo = { state: function () { return st; }, verify: zinciriDogrula };
})();
