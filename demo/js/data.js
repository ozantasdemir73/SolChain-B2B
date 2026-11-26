/* SolChain B2B · Demo verisi
 * Tüm firmalar, tutarlar ve kayıtlar örnek veridir; gerçek kişi ya da kurumları temsil etmez.
 */
(function (g) {
  'use strict';

  g.SC_CONFIG = {
    currency: 'TRY',
    locale: 'tr-TR',
    toleransYuzde: 2,          /* üçlü eşleştirmede kabul edilen fark */
    sermayeMaliyetiAylik: 0.02, /* teklif karşılaştırmada bugünkü değer için örnek oran */
    onayEsikleri: [            /* tutara göre onay zinciri */
      { rol: 'birim', alt: 0 },
      { rol: 'satinalma', alt: 250000 },
      { rol: 'finans', alt: 1000000 }
    ]
  };

  g.SC_ROLES = [
    { id: 'talep', ad: 'Talep sahibi', aciklama: 'Üretim planlama' },
    { id: 'birim', ad: 'Birim yöneticisi', aciklama: 'İlk onay' },
    { id: 'satinalma', ad: 'Satın alma müdürü', aciklama: 'Teklif ve sipariş' },
    { id: 'finans', ad: 'Finans direktörü', aciklama: 'Bütçe ve ödeme' },
    { id: 'depo', ad: 'Depo sorumlusu', aciklama: 'NFC ile mal kabul' },
    { id: 'tedarikci', ad: 'Tedarikçi portalı', aciklama: 'Teklif, sevk ve fatura' }
  ];

  g.SC_SEED = function () {
    return {
      v: 1,
      firma: 'Örnek Makine San. A.Ş.',
      butceler: [
        { id: 'MM-URT', ad: 'Üretim ham madde', limit: 6000000, harcanan: 3120000 },
        { id: 'MM-AMB', ad: 'Ambalaj', limit: 900000, harcanan: 410000 },
        { id: 'MM-BKM', ad: 'Bakım ve yedek parça', limit: 750000, harcanan: 512000 }
      ],
      tedarikciler: [
        { id: 'S1', ad: 'Anadolu Çelik A.Ş.', kat: 'Metal', bolge: 'Kocaeli', endeks: 88, teslimat: 34, alici: 7, faaliyetGun: 34, sgk: false, ilan: false, kapasite: 82, beyan: 91, seviye: 'Gold' },
        { id: 'S2', ad: 'Marmara Metal San.', kat: 'Metal', bolge: 'Bursa', endeks: 76, teslimat: 14, alici: 4, faaliyetGun: 126, sgk: false, ilan: false, kapasite: 74, beyan: 83, seviye: 'Silver' },
        { id: 'S3', ad: 'Ege Sac Ltd.', kat: 'Metal', bolge: 'İzmir', endeks: 93, teslimat: 46, alici: 12, faaliyetGun: 18, sgk: false, ilan: false, kapasite: 88, beyan: 95, seviye: 'Platinum' },
        { id: 'S4', ad: 'Polimer Kimya A.Ş.', kat: 'Plastik', bolge: 'Gebze', endeks: 86, teslimat: 22, alici: 6, faaliyetGun: 51, sgk: false, ilan: false, kapasite: 79, beyan: 90, seviye: 'Gold' },
        { id: 'S5', ad: 'Delta Ambalaj San.', kat: 'Ambalaj', bolge: 'Manisa', endeks: 72, teslimat: 11, alici: 4, faaliyetGun: 64, sgk: true, ilan: false, kapasite: 66, beyan: 81, seviye: 'Silver' },
        { id: 'S6', ad: 'Granül Plast Ltd.', kat: 'Plastik', bolge: 'Adana', endeks: 0, teslimat: 3, alici: 2, faaliyetGun: 22, sgk: false, ilan: false, kapasite: 90, beyan: 0, seviye: 'Verified' }
      ],
      sozlesmeler: [
        { id: 'CS-01', tedarikci: 'S1', konu: 'DC01 soğuk haddelenmiş sac', birimFiyat: 36500, birim: 'ton', bitis: '2027-01-15', endeksBaz: 100, endeksSon: 104.6, esik: 4 },
        { id: 'CS-02', tedarikci: 'S4', konu: 'PP homopolimer granül', birimFiyat: 44800, birim: 'ton', bitis: '2027-06-30', endeksBaz: 100, endeksSon: 101.2, esik: 4 },
        { id: 'CS-03', tedarikci: 'S5', konu: 'Oluklu koli (5 katlı)', birimFiyat: 13, birim: 'adet', bitis: '2026-12-31', endeksBaz: 100, endeksSon: 102.1, esik: 4 }
      ],
      talepler: [
        { id: 'PR-0231', kalem: 'DC01 sac, 1,5 mm', kat: 'Metal', miktar: 40, birim: 'ton', mm: 'MM-URT', tahmini: 1480000, ihtiyac: '2026-12-18', sahibi: 'Üretim planlama', durum: 'onay',
          onaylar: [{ rol: 'birim', ok: true, at: '2026-11-25 10:12' }] },
        { id: 'PR-0230', kalem: 'PP homopolimer granül', kat: 'Plastik', miktar: 12, birim: 'ton', mm: 'MM-URT', tahmini: 540000, ihtiyac: '2026-12-10', sahibi: 'Üretim planlama', durum: 'teklif',
          onaylar: [{ rol: 'birim', ok: true, at: '2026-11-21 09:40' }, { rol: 'satinalma', ok: true, at: '2026-11-21 14:05' }] },
        { id: 'PR-0228', kalem: 'Oluklu koli (5 katlı)', kat: 'Ambalaj', miktar: 20000, birim: 'adet', mm: 'MM-AMB', tahmini: 260000, ihtiyac: '2026-11-28', sahibi: 'Sevkiyat', durum: 'siparis',
          onaylar: [{ rol: 'birim', ok: true, at: '2026-11-12 11:00' }, { rol: 'satinalma', ok: true, at: '2026-11-12 16:20' }] }
      ],
      teklifler: {
        'PR-0230': [
          { tedarikci: 'S4', fiyat: 44800, navlun: 9000, vade: 60, termin: 6 },
          { tedarikci: 'S6', fiyat: 42900, navlun: 18000, vade: 30, termin: 9 },
          { tedarikci: 'S2', fiyat: 0, navlun: 0, vade: 0, termin: 0, red: 'Kategori dışı' }
        ]
      },
      siparisler: [
        { id: 'PO-0142', pr: 'PR-0219', tedarikci: 'S1', kalem: 'DC01 sac, 1,5 mm', miktar: 40, birim: 'ton', fiyat: 36500, vade: 60, asama: 1, kilitli: 1460000, odenen: 0, lot: 'L-88120', etiketYazildi: true, olusturma: '2026-11-18' },
        { id: 'PO-0139', pr: 'PR-0228', tedarikci: 'S5', kalem: 'Oluklu koli (5 katlı)', miktar: 20000, birim: 'adet', fiyat: 13, vade: 45, asama: 2, kilitli: 260000, odenen: 0, lot: 'L-40215', etiketYazildi: true, olusturma: '2026-11-13',
          kabul: { miktar: 20000, kalite: 'Uygun', at: '2026-11-24 15:40', etiket: true } },
        { id: 'PO-0137', pr: 'PR-0214', tedarikci: 'S3', kalem: 'DC01 sac, 2 mm', miktar: 25, birim: 'ton', fiyat: 37200, vade: 60, asama: 2, kilitli: 930000, odenen: 0, lot: 'L-77031', etiketYazildi: true, olusturma: '2026-11-06',
          kabul: { miktar: 24.2, kalite: 'Uygun', at: '2026-11-20 10:05', etiket: true } },
        { id: 'PO-0135', pr: 'PR-0209', tedarikci: 'S4', kalem: 'PP homopolimer granül', miktar: 10, birim: 'ton', fiyat: 44200, vade: 60, asama: 4, kilitli: 0, odenen: 442000, lot: 'L-51902', etiketYazildi: true, olusturma: '2026-10-28',
          kabul: { miktar: 10, kalite: 'Uygun', at: '2026-11-04 09:15', etiket: true } }
      ],
      faturalar: [
        { id: 'FT-7781', po: 'PO-0139', miktar: 20000, fiyat: 13.2, tarih: '2026-11-25' },
        { id: 'FT-7774', po: 'PO-0137', miktar: 25, fiyat: 37200, tarih: '2026-11-21' },
        { id: 'FT-7702', po: 'PO-0135', miktar: 10, fiyat: 44200, tarih: '2026-11-05', odendi: true }
      ],
      harcamaAylik: [
        { ay: 'Haz', tutar: 1820000 }, { ay: 'Tem', tutar: 2140000 }, { ay: 'Ağu', tutar: 1610000 },
        { ay: 'Eyl', tutar: 2380000 }, { ay: 'Eki', tutar: 2050000 }, { ay: 'Kas', tutar: 2690000 }
      ],
      kayitlar: []
    };
  };
})(window);
