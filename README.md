# SolChain B2B

**Üretici ile tedarikçi arasında kanıta dayalı satın alma ve güven altyapısı.**

Talepten ödemeye kadar satın alma sürecini tek akışta yönetir ve her adımda değiştirilemez bir kanıt bırakır. Mal kabul NFC etiketiyle doğrulanır. Ödeme ancak sipariş, teslim ve fatura birbirini tuttuğunda serbest kalır. Tedarikçinin performansı, şirketten şirkete taşınabilen bir karneye dönüşür. Solana ekosistemi hackathonu için geliştirildi.

> Dijital çağın şımarık yıldızı yeterince alkış aldı; artık sahne üretici ve tedarikçinin.

**Uygulama:** https://ozantasdemir73.github.io/SolChain-B2B/ · **Depo:** https://github.com/ozantasdemir73/SolChain-B2B

---

## Uçtan uca akış

| # | Adım | Ne olur? | Bıraktığı kanıt |
|---|---|---|---|
| 1 | Talep | Kalem, miktar, bütçe ve ihtiyaç tarihi girilir | Talep kaydı |
| 2 | Onay | Tutara göre onay zinciri: birim yöneticisi; 250.000 ₺ üzeri satın alma müdürü; 1.000.000 ₺ üzeri ya da bütçe aşımında finans | Her onay ayrı kayıtlı |
| 3 | Teklif | Satın alma asistanı tedarikçi önerir; teklifler bugünkü değer, kapıda maliyet, karne ve riske göre karşılaştırılır | Gerekçeli öneri |
| 4 | Sipariş | Koşullar iki tarafça mühürlenir, tutar lisanslı ödeme kuruluşunda kilitlenir | Koşul özeti |
| 5 | Sevk | Tedarikçi palete NFC etiketi yazar (sipariş, lot, miktar, özet) | Sevk ve etiket kaydı |
| 6 | Mal kabul | Depo etiketi telefonla okutur, sayılan miktarı girer | Teslim anı ve miktar |
| 7 | Kalite | Giriş kalite kontrolü; itirazda akrediteli hakem laboratuvar | Kalite sonucu |
| 8 | Fatura ve ödeme | Sipariş–mal kabul–fatura üçlü eşleştirmesi; %2'yi aşan fark ödemeyi bloke eder | Eşleşme ve ödeme kaydı |
| 9 | Karne | Teslim, kalite ve saha sonucu karneye işlenir, seviye güncellenir | Karne kaydı |

## Uygulama (`uygulama/`)

Kurulum ve derleme gerektirmeyen, tek dosyalık bir web uygulaması: üretici paneli. On yedi ekran altı bölümde toplanıyor:

| Bölüm | Ekranlar |
|---|---|
| Genel | Genel bakış |
| Satın alma | Talepler ve onay · Satın alma asistanı ve Malzeme Danışmanı · Teklif talebi · Teklifler ve eşleşme · Siparişler · Mal kabul (NFC) |
| Ağ | Tedarikçiler · Karneler · Risk merkezi · Piyasa istihbaratı |
| Finans | Fatura eşleştirme · Ödemeler ve finansman · Sözleşmeler · Harcama analizi |
| Kayıt | Zincir kayıtları ve belge doğrulama |
| Yönetim | Entegrasyonlar ve roller |

### Nasıl denenir?

Üst çubuktaki **Rol** menüsünden rol değiştirerek akışı yürütün:

1. **Talepler ve onay:** Bekleyen talebi önce satın alma müdürü, sonra finans direktörü rolüyle onaylayın. Satın alma müdürü rolüyle talebi teklif talebine dönüştürün.
2. **Teklif talebi ve Teklifler:** Talebi yayınlayın, teklifleri karşılaştırın ve sipariş verin. Alternatif olarak **Satın alma asistanı**na düz cümleyle yazabilirsiniz, örneğin “40 ton DC01 sac, 60 gün vade”.
3. **Siparişler:** Siparişi sevkiyata kadar ilerletin.
4. **Mal kabul · NFC:** Etiketi okutun. Sayılan miktarı siparişten düşük girerseniz, örneğin 30 yerine 28,5 ton, eksik teslimat senaryosunu görürsünüz.
5. **Siparişler:** Kalite kabulünü yapın.
6. **Fatura eşleştirme:** e-Faturayı alın; eşleşmezse ödeme bloke olur. Düzeltilmiş faturayı isteyin ve mutabakatı onaylayın. Yalnızca teslim alınan miktar ödenir, fark iade edilir.
7. **Zincir kayıtları:** Tüm adımlar imzalı kayıt olarak görünür. Belge doğrulamada metinde tek bir harf değiştirince özetin tutmadığını görürsünüz.

**Yerelde çalıştırma:** `uygulama/index.html` dosyasını tarayıcıda açın ya da depo klasöründe `python -m http.server` komutunu çalıştırıp `http://localhost:8000/` adresine gidin. Veriler örnektir ve sayfa yenilenince başlangıç haline döner.

### NFC

- Gerçek etiket okuma ve yazma, **Android'de Chrome** ile **HTTPS** adreste çalışır (Web NFC); GitHub Pages bu koşulu sağlar.
- NTAG213 ve üzeri boş etiketler yeterlidir. **Mal kabul · NFC** ekranında “Etiket verisi” ile etikete yazabilir, “Etiketi okut” ile okutabilirsiniz.
- NFC desteği olmayan cihazlarda (masaüstü, iPhone) okuma simüle edilir; akışın geri kalanı aynı çalışır.
- Etiket içeriği kısa bir JSON metnidir:
  `{"t":"SCB2B","v":1,"po":"SC-2026-0151","lot":"L-48213","q":30,"u":"ton","h":"<16 hane özet>"}`
- Uygulama telefonda **Ana ekrana ekle** ile uygulama gibi açılabilir.

### GitHub Pages ile yayınlama

**Settings › Pages** bölümünde kaynak olarak `Deploy from a branch`, dal olarak `main` ve klasör olarak `/ (root)` seçin. Kök sayfa uygulamaya yönlendirir.

## Solana'nın rolü

Zincire yalnızca **kanıt** yazılır: belge ve koşul özetleri, imzalar, kilit kuralı, sevk ve teslim kaydı, kalite sonucu, laboratuvar kararı ve karneyi oluşturan kayıtlar. Ticari veri ve para zincire yazılmaz. Türkiye'de para TL olarak lisanslı ödeme kuruluşunda tutulur.

Uygulama bu işlemleri Solana talimatları gibi canlandırır: `create_order`, `attest_funding`, `record_shipment`, `verify_nfc_tag`, `confirm_receipt`, `record_invoice`, `settle_order` gibi. Belge özetleri (SHA-256) tarayıcıda gerçekten hesaplanır.

## Depo içeriği

```
solchain-b2b/
├── index.html               GitHub Pages kök sayfası (uygulamaya yönlendirir)
├── uygulama/                SolChain B2B üretici paneli (17 ekran, NFC)
│   ├── index.html
│   ├── manifest.webmanifest Telefona "ana ekrana ekle" desteği
│   └── icon.svg
├── prototip/
│   └── ag-konsolu.html      Solana ağ konsolu prototipi
├── sunum/                   Sunum slayt kaynakları
└── dokumanlar/
    ├── urun-tanitim-dosyasi.pdf   Güncel ürün tanıtım dosyası (sürüm 2.0)
    ├── proje-tanitim-dosyasi.pdf  İlk tanıtım dosyası
    ├── proje-detay-dosyasi.pdf
    ├── sunum-konusma-rehberi.pdf
    ├── mesaj-sablonlari.md
    └── kaynak/                    PDF'lerin HTML kaynakları
```

## Durum ve yol haritası

| Bileşen | Durum |
|---|---|
| Üretici paneli (17 ekran, NFC ile mal kabul, üçlü eşleştirme) | Çalışıyor |
| Belge özeti doğrulama (SHA-256) | Çalışıyor (tarayıcıda) |
| Solana programı (sipariş, kilit, karne, uyuşmazlık) | Tasarlandı, sıradaki adım |
| ERP, e-Fatura ve ödeme kuruluşu entegrasyonu | Planlanan |
| Belge ve risk okuyucu (yapay zekâ) | Planlanan |

Tüm firmalar, tutarlar ve kayıtlar örnek veridir.

## Ekip ve iletişim

- [Ad Soyad] · [rol]
- [Ad Soyad] · [rol]
- İletişim: [e-posta]
