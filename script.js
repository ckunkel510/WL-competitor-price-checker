let data = [];

document.getElementById('csvFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      data = results.data;
      renderTable();
    }
  });
});

function renderTable() {
  const container = document.getElementById('tableContainer');
  container.innerHTML = '';

  const table = document.createElement('table');
  const headerRow = document.createElement('tr');
  Object.keys(data[0]).forEach(key => {
    const th = document.createElement('th');
    th.textContent = key;
    headerRow.appendChild(th);
  });
  headerRow.appendChild(document.createElement('th')).textContent = 'Actions';
  table.appendChild(headerRow);

  data.forEach((row, index) => {
    const tr = document.createElement('tr');
    Object.values(row).forEach(val => {
      const td = document.createElement('td');
      td.textContent = val;
      tr.appendChild(td);
    });

    const btn = document.createElement('button');
    btn.textContent = 'Check Prices';
    btn.onclick = () => checkPrices(index);
    tr.appendChild(document.createElement('td')).appendChild(btn);

    table.appendChild(tr);
  });

  container.appendChild(table);
}

async function checkPrices(index) {
  const urls = ['HDURL', 'LURL', 'AMZNURL', 'TSCURL', 'MCURL'];
  for (let urlType of urls) {
    const url = data[index][urlType];
    if (!url) continue;

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      if (json.price) {
        const targetCol = urlType.replace('URL', 'Price');
        data[index][targetCol] = json.price;
      }
    } catch (err) {
      console.error('Scrape failed for', urlType, err);
    }
  }

  renderTable();
}

function downloadCSV() {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "updated_prices.csv";
  link.click();
}
