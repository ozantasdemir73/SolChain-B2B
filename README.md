# SolChain B2B

**Üretici ile tedarikçi arasında kanıta dayalı satın alma ve güven altyapısı.**

Talepten ödemeye kadar satın alma sürecini tek akışta yönetir ve her adımda değiştirilemez bir kanıt bırakır. Mal kabul NFC etiketiyle doğrulanır. Ödeme ancak sipariş, teslim ve fatura birbirini tuttuğunda serbest kalır. Tedarikçinin performansı, şirketten şirkete taşınabilen bir karneye dönüşür. Solana ekosistemi hackathonu için geliştirildi.

> Dijital çağın şımarık yıldızı yeterince alkış aldı; artık sahne üretici ve tedarikçinin.

**Demo:** `https://<kullanıcı-adı>.github.io/solchain-b2b/` *(GitHub Pages açıldıktan sonra)*

---

## Uçtan uca akış

| # | Adım | Ne olur? | Bıraktığı kanıt |
|---|---|---|---|
| 1 | Talep | Kalem, miktar, maliyet merkezi ve ihtiyaç tarihi girilir | Talep kaydı |
| 2 | Onay | Tutara göre onay zinciri: birim yöneticisi; 250.000 üzeri satın alma müdürü; 1.000.000 üzeri ya da bütçe aşımında finans | Her onay ayrı kayıtlı |
| 3 | Teklif | Fiyat, navlun, vade (bugünkü değer), termin, seviye ve risk birlikte değerlendirilir | Gerekçeli öneri |
| 4 | Sipariş | Koşullar imzalanır, tutar lisanslı ödeme kuruluşunda kilitlenir | Koşul özeti |
| 5 | Sevk | Tedarikçi palete NFC etiketi yazar (sipariş, lot, miktar, özet) | Etiket özeti |
| 6 | Mal kabul | Depo etiketi telefonla okutur; yanlış palet ya da değiştirilmiş etiket yakalanır | Teslim anı ve miktar |
| 7 | Fatura | Sipariş–mal kabul–fatura üçlü eşleştirmesi; %2 toleransı aşan fark ödemeyi bloke eder | Eşleşme sonucu |
| 8 | Ödeme ve karne | Finans onayıyla ödeme serbest kalır, karne güncellenir | Ödeme ve karne kaydı |

## Demo uygulama (`demo/`)

Kurulum ve derleme gerektirmeyen, saf HTML/CSS/JavaScript bir web uygulaması. On bir ekran içerir: genel bakış, talep ve onay, teklif karşılaştırma, siparişler, mal kabul (NFC), fatura eşleştirme, tedarikçiler ve karne, sözleşmeler, harcama analizi, zincir kayıtları ve hakkında.

**Nasıl denenir?**
Üst menüden rol değiştirerek akışı baştan sona yürütün:
1. Satın alma müdürü ve finans direktörü bekleyen talebi onaylar.
2. Satın alma müdürü teklif ister ve sipariş verir.
3. Tedarikçi portalı sevk eder ve etiketi yazar.
4. Depo sorumlusu etiketi okutup malı kabul eder.
5. Tedarikçi faturayı gönderir.
6. Finans direktörü eşleşen faturanın ödemesini serbest bırakır.

"Zincir kayıtları" ekranındaki **Kurcalama testi**, geçmişteki tek bir kaydın değişmesinin zinciri nasıl kırdığını gösterir.

**Yerelde çalıştırma**

- Basit kullanım: `demo/index.html` dosyasını tarayıcıda açın.
- Tavsiye edilen: bir yerel sunucuyla açın, örneğin depo klasöründe `python -m http.server` komutunu çalıştırıp `http://localhost:8000/demo/` adresine gidin.

Veri yalnızca tarayıcıda (localStorage) tutulur. "Demoyu sıfırla" düğmesi başlangıç verisine döner.

### NFC

- Gerçek etiket okuma ve yazma, **Android'de Chrome** ile **HTTPS** adreste çalışır (Web NFC). GitHub Pages bu koşulu sağlar.
- NTAG213 ve üzeri boş etiketler yeterlidir. Tedarikçi rolünde "Sevk et ve NFC etiketi yaz", depo rolünde "NFC etiketini okut" kullanılır.
- NFC desteği olmayan cihazlarda (masaüstü, iPhone) okuma ve yazma simüle edilir; akışın geri kalanı aynı çalışır.
- Etiket içeriği kısa bir JSON metnidir:
  `{"t":"SCB2B","v":1,"po":"PO-0142","lot":"L-88120","q":40,"u":"ton","h":"<16 hane özet>"}`

### GitHub Pages ile yayınlama

1. Depoyu GitHub'a gönderin.
2. **Settings › Pages › Build and deployment** bölümünde kaynak olarak `Deploy from a branch`, dal olarak `main` ve klasör olarak `/ (root)` seçin.
3. Birkaç dakika sonra `https://<kullanıcı-adı>.github.io/solchain-b2b/` açılır; kök sayfa demoya yönlendirir.

## Solana'nın rolü

Zincire yalnızca **kanıt** yazılır: belge ve koşul özetleri, imzalar, kilit kuralı, sevk ve teslim kaydı, kalite sonucu, laboratuvar kararı ve karneyi oluşturan kayıtlar. Ticari veri ve para zincire yazılmaz. Türkiye'de para TL olarak lisanslı ödeme kuruluşunda tutulur.

Demo, bu kanıt mantığını tarayıcıda SHA-256 özet zinciriyle gösterir. Her kayıt bir öncekinin özetini içerir.

## Depo içeriği

```
solchain-b2b/
├── index.html                  GitHub Pages kök sayfası (demoya yönlendirir)
├── demo/                       NFC destekli satın alma demo uygulaması
│   ├── index.html
│   ├── manifest.webmanifest    Telefona "ana ekrana ekle" desteği
│   ├── assets/                 Stil ve simge
│   └── js/
│       ├── app.js              Ekranlar, iş kuralları, onay ve eşleştirme mantığı
│       ├── data.js             Örnek veri ve ayarlar (onay eşikleri, tolerans)
│       ├── nfc.js              Web NFC okuma ve yazma
│       └── sha256.js           Özet fonksiyonu
├── prototip/                   İlk üretici paneli ve ağ konsolu prototipleri
├── sunum/                      Sunum slayt kaynakları
└── dokumanlar/
    ├── urun-tanitim-dosyasi.pdf   Güncel ürün tanıtım dosyası (sürüm 2.0)
    ├── proje-tanitim-dosyasi.pdf  İlk tanıtım dosyası
    ├── proje-detay-dosyasi.pdf
    ├── sunum-konusma-rehberi.pdf
    ├── mesaj-sablonlari.md
    └── kaynak/                    PDF'lerin HTML kaynakları
```

## Ayarlar

Onay eşikleri, eşleştirme toleransı ve teklif karşılaştırmadaki örnek sermaye maliyeti `demo/js/data.js` içindeki `SC_CONFIG` nesnesinden değiştirilebilir.

## Durum ve yol haritası

| Bileşen | Durum |
|---|---|
| Satın alma demo uygulaması (11 ekran, NFC) | Çalışıyor |
| Kurcalamaya karşı kayıt zinciri (SHA-256) | Çalışıyor (tarayıcıda) |
| Solana programı (sipariş, kilit, karne, uyuşmazlık) | Tasarlandı, sıradaki adım |
| ERP, e-Fatura ve ödeme kuruluşu entegrasyonu | Planlanan |
| Belge ve risk okuyucu (yapay zekâ) | Planlanan |

Tüm firmalar, tutarlar ve kayıtlar örnek veridir.

## Ekip ve iletişim

- [Ad Soyad] · [rol]
- [Ad Soyad] · [rol]
- İletişim: [e-posta]
