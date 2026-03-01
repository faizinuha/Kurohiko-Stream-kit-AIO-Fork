# 🚀 Kurohiko Streamkit AIO
**All-in-One Overlay Solution: Meme, Gambar, Video, & Audio via Browser Source.**

Kurohiko Streamkit AIO adalah aplikasi berbasis Electron & Node.js yang dirancang khusus untuk memudahkan streamer mengelola aset interaktif secara *real-time* melalui satu jalur Browser Source di OBS/Polycam/XSplit.

---

## 💡 Latar Belakangn

Awalnya gw punya keresahan, dimana Scene + Source OBS gw ada banyak banget, dan kadang walau Source Meme udah gw nyalain. Ttp gak muncul di layar (ngebug). 
Jadinya gw kepikiran buat bikin Aplikasi yang ngeluarin meme ke website local, jadi di OBS gw cuma perlu nambahin 1 Browser Source aja.
Pas gw upload video nya ke sosmed, banyak yg tertarik, jadi gw publish aja.

### 🏗️ Kondisi Project:
Aplikasi ini jauh dari kata sempurna, karena ini aplikasi kyk lagi ngebangun rumah 2meterx2meter.
Ditengah jalan keinget mau nambah WC, Kamar, Pintu, Jendela,etc. Jadinya kyk ya gitulah

> **Note:** Secara fungsi, aplikasi ini **Works!** , ya nanti gw update lah.

---

## 🛠️ Fitur Utama
* **Multi-Format Support:** Playback Video, Audio, Image, dan Meme secara instan.
* **Low Resource:** Mengurangi beban OBS karena lo cuma butuh satu Browser Source.
* **Local Server Based:** Semua aset ada di PC.
* **Chroma Key:** Bisa hapus Greenscreen brooh
* **Shortcut Keyboard** Bisa Control pake Shortcut Keyboard (kalau berat, matiin ya)

---

## 🚀 Cara Install & Menjalankan

Karena folder `node_modules` tidak disertakan di repository ini, ikuti langkah berikut:

1.  **Download / Clone** repository ini.
2.  Pastikan lo sudah menginstal [Node.js](https://nodejs.org/).
3.  Buka Terminal/CMD di folder project ini, lalu ketik:
    ```bash
    npm install
    ```
4.  Setelah selesai, jalankan aplikasi dengan perintah:
    ```bash
    npm start
    ```

---

## 🖥️ Cara Pakai di OBS
1.  Jalankan aplikasi Kurohiko Streamkit / KSK Streamkit.
2.  Bikin Source Baru di OBS > Browser Source > Kasih nama Bebas (misal: `Meme Overlay`). 
3.  Masukkan URL Localhost yang tertera di aplikasi (misal: `http://192.168.1.XX:3000/obs.html`). 
4.  Pastiin Link nya ada `/obs.html` nya
4.  Atur Width `1920` dan Height `1080` 
5.  Done.
6.  Buat jaga-jaga, kalau meme gak muncul pas pencet di aplikasi, coba klik kanan Browser source di obs > properties > Refresh cache.

---

---

## ☕ Support the Project
Kalau mau support project ini bisa dengan bantu gw perbaiki kodingnya 🤣
atau TopUp di Toko gw. ini gw yang urus yak.
👉 **[KurohikoTopUp.com](https://KurohikoTopUp.com)**

---

## 🤝 Kontribusi & Masukan
Kalau lu nemu bug atau ide buat fitur baru, bisa chat gw aja, atau buka *Issue*. Ingaet, ini project santai, jadi responnya mungkin nggak secepet itu, tapi pasti gue baca!

**Dibuat dengan ❤️ oleh Kurohiko. dengan Vibe Coding**