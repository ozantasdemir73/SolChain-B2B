/* SolChain B2B · NFC katmanı
 * Web NFC (NDEFReader) yalnızca Android'de Chrome'da ve HTTPS altında çalışır
 * (GitHub Pages bu koşulu sağlar). Desteklenmeyen cihazlarda arayüz simülasyona geçer.
 * Etiket içeriği kısa bir JSON metin kaydıdır; NTAG213 (144 bayt) ve üstü etiketlere sığar:
 * {"t":"SCB2B","v":1,"po":"PO-0142","lot":"L-88120","q":40,"u":"ton","h":"<16 hane özet>"}
 */
(function (g) {
  'use strict';
  function parse(text) {
    try {
      var o = JSON.parse(text);
      return o && o.t === 'SCB2B' ? o : null;
    } catch (e) { return null; }
  }
  function decode(rec) {
    try {
      if (rec.recordType === 'text') return new TextDecoder(rec.encoding || 'utf-8').decode(rec.data);
      if (rec.recordType === 'mime') return new TextDecoder().decode(rec.data);
    } catch (e) { /* okunamayan kayıt */ }
    return '';
  }
  var NFC = {
    supported: function () { return 'NDEFReader' in g; },
    /* Bir SolChain etiketi okunana kadar bekler. */
    read: function (timeoutMs) {
      timeoutMs = timeoutMs || 20000;
      var reader = new g.NDEFReader();
      var ctrl = new AbortController();
      return reader.scan({ signal: ctrl.signal }).then(function () {
        return new Promise(function (resolve, reject) {
          var timer = setTimeout(function () { ctrl.abort(); reject(new Error('Zaman aşımı: etiket okunmadı.')); }, timeoutMs);
          reader.onreadingerror = function () { /* kullanıcı etiketi tekrar yaklaştırabilir */ };
          reader.onreading = function (ev) {
            var records = (ev.message && ev.message.records) || [];
            for (var i = 0; i < records.length; i++) {
              var p = parse(decode(records[i]));
              if (p) {
                clearTimeout(timer); ctrl.abort();
                resolve({ payload: p, serial: ev.serialNumber || '' });
                return;
              }
            }
            clearTimeout(timer); ctrl.abort();
            reject(new Error('Bu etikette SolChain verisi yok.'));
          };
        });
      });
    },
    /* Sevkiyat etiketini yazar (tedarikçi tarafı). */
    write: function (payload) {
      var reader = new g.NDEFReader();
      return reader.write({ records: [{ recordType: 'text', lang: 'tr', data: JSON.stringify(payload) }] });
    },
    parse: parse
  };
  g.SCNFC = NFC;
})(window);
