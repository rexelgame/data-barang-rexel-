const LS = 'stok_rexel_transaksi';
let extra = JSON.parse(localStorage.getItem(LS) || '[]');
let sortKey = 'nama', sortDir = 1;
const $ = s => document.querySelector(s);
const status = a => a <= 0 ? ['Habis', 'hbs'] : a <= 3 ? ['Menipis', 'tps'] : ['Aman', 'aman'];

function rows(tgl) {
  const h = DATA.hari.find(x => x.tanggal === tgl);
  return h.items.map(i => {
    let m = i.masuk, k = i.keluar;
    extra.filter(e => e.tgl === tgl && e.nama === i.nama).forEach(e => e.jenis === 'masuk' ? m += e.jml : k += e.jml);
    return { ...i, masuk: m, keluar: k, akhir: i.awal + m - k };
  });
}
const sum = (r, k) => r.reduce((t, x) => t + x[k], 0);

function render() {
  const tgl = $('#tanggal').value, all = rows(tgl);
  const q = $('#cari').value.toLowerCase(), f = $('#filter').value;
  const list = all.filter(r => r.nama.toLowerCase().includes(q) && (!f || status(r.akhir)[0] === f))
    .sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1) * sortDir);

  $('#cards').innerHTML = [
    ['Jenis barang', all.length], ['Total stok akhir', sum(all, 'akhir')],
    ['Barang masuk', sum(all, 'masuk')], ['Barang keluar', sum(all, 'keluar')],
    ['Stok menipis', all.filter(r => status(r.akhir)[0] === 'Menipis').length],
    ['Stok habis', all.filter(r => r.akhir <= 0).length]
  ].map(c => `<div class="card"><span>${c[0]}</span><b>${c[1]}</b></div>`).join('');

  $('#tbody').innerHTML = list.map(r => {
    const [s, c] = status(r.akhir);
    return `<tr><td>${r.nama}</td><td>${r.awal}</td><td>${r.masuk}</td><td>${r.keluar}</td><td><b>${r.akhir}</b></td><td><span class="badge ${c}">${s}</span></td></tr>`;
  }).join('') || '<tr><td colspan="6">Tidak ada data.</td></tr>';

  const max = Math.max(1, ...all.map(r => r.akhir));
  $('#bars').innerHTML = [...all].sort((a, b) => b.akhir - a.akhir).map(r =>
    `<div class="bar"><span>${r.nama}</span><div class="t"><i style="width:${r.akhir / max * 100}%"></i></div><b>${r.akhir}</b></div>`).join('');

  const tot = DATA.hari.map(h => { const r = rows(h.tanggal); return [h.label.replace(' 26', ''), sum(r, 'masuk'), sum(r, 'keluar')]; });
  const tm = Math.max(1, ...tot.flat().filter(Number.isFinite));
  $('#tren').innerHTML = tot.map(t => `<div class="tr"><span>${t[0]}</span><div>
    <i class="m" style="width:${t[1] / tm * 100}%"></i><i class="k" style="width:${t[2] / tm * 100}%"></i></div></div>`).join('')
    + '<small><span class="aman">■</span> Masuk &nbsp; <span class="hbs">■</span> Keluar</small>';

  const cat = [];
  DATA.hari.forEach((h, n) => {
    if (!n) return;
    const p = rows(DATA.hari[n - 1].tanggal);
    h.items.forEach((it, j) => { if (p[j].akhir !== it.awal) cat.push(`${h.label}: ${it.nama} stok awal ${it.awal}, stok akhir hari sebelumnya ${p[j].akhir}`); });
  });
  $('#catatan').innerHTML = cat.map(c => `<li>${c}</li>`).join('') || '<li>Semua data konsisten.</li>';
}

function init() {
  $('#toko').textContent = 'Data Stok ' + DATA.toko.nama;
  $('#kontak').textContent = `Instagram ${DATA.toko.instagram} · WA ${DATA.toko.wa}`;
  $('#tanggal').innerHTML = DATA.hari.map(h => `<option value="${h.tanggal}">${h.label}</option>`).join('');
  $('#tanggal').value = DATA.hari[DATA.hari.length - 1].tanggal;
  $('#fBarang').innerHTML = DATA.hari[0].items.map(i => `<option>${i.nama}</option>`).join('');
  ['#tanggal', '#filter'].forEach(s => $(s).onchange = render);
  $('#cari').oninput = render;
  document.querySelectorAll('th[data-k]').forEach(th => th.onclick = () => {
    sortDir = sortKey === th.dataset.k ? -sortDir : 1; sortKey = th.dataset.k; render();
  });
  $('#tambah').onclick = () => {
    const jml = parseInt($('#fJml').value, 10);
    if (!(jml > 0)) return alert('Jumlah harus lebih dari 0');
    extra.push({ tgl: $('#tanggal').value, nama: $('#fBarang').value, jenis: $('#fJenis').value, jml });
    localStorage.setItem(LS, JSON.stringify(extra)); render();
  };
  $('#reset').onclick = () => { if (confirm('Hapus semua transaksi tambahan?')) { extra = []; localStorage.removeItem(LS); render(); } };
  $('#csv').onclick = () => {
    const r = rows($('#tanggal').value);
    const csv = 'Nama Barang,Stok Awal,Masuk,Keluar,Stok Akhir\n' + r.map(x => `"${x.nama}",${x.awal},${x.masuk},${x.keluar},${x.akhir}`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `stok-${$('#tanggal').value}.csv`; a.click();
  };
  render();
}
init();
