const LIMIT = 5000;
const T = {
  en: {
    tag: 'Quick price check for Singapore shoppers', name: 'Item name',
    photo: 'Photo (optional – price tag on photo will be auto-detected)', price: 'Price you see (SGD)',
    go: 'Should I buy it?', caution: "💡 Always be cautious with shopping. Don't overspend, and avoid buying duplicate items.",
    disc: 'Disclaimer: This is only a pricing guide, not a decision maker. Prices may be outdated or inaccurate; always verify with the seller.',
    reading: 'Reading price from photo…', detected: 'Detected price: S$', noDetect: 'Could not detect a price on the photo – please type it.',
    need: 'Please enter an item name and a price (or a photo showing the price).',
    searching: 'Searching Google, Singapore shops & resale sites…',
    good: '🎉 Good deal!', fair: '👍 Reasonable', exp: '💸 Too expensive',
    costly: '⚠️ This item is too costly to evaluate (above SGD 5,000). Please consider and study deeper before making the decision.',
    newP: 'Brand new (median)', resP: 'Resale (median)', na: 'Not found', refs: 'References (up to 4)',
    nokey: 'Live price search is not configured on this server (set SERPAPI_KEY). Use these links to compare manually:',
    nodata: 'No prices found for this item. Try a more specific name, or search manually:',
    err: 'Search failed. Please try again.', newTag: 'New', resTag: 'Resale', your: 'Your price',
  },
  zh: {
    tag: '新加坡购物者的快速价格检查', name: '商品名称', photo: '照片（可选 – 会自动识别照片上的价格）', price: '你看到的价格（新币）',
    go: '我该买吗？', caution: '💡 购物请务必谨慎，切勿超支，避免重复购买。',
    disc: '免责声明：本网站仅为价格参考，并非决策依据。价格可能过时或不准确，请向卖家核实。',
    reading: '正在识别照片价格…', detected: '识别到价格：S$', noDetect: '无法识别照片上的价格，请手动输入。',
    need: '请输入商品名称和价格（或带价格的照片）。', searching: '正在搜索 Google、新加坡商店及二手平台…',
    good: '🎉 超值！', fair: '👍 价格合理', exp: '💸 太贵了',
    costly: '⚠️ 此商品价格过高（超过新币5,000），无法评估。请再三考虑并深入研究后再做决定。',
    newP: '全新价（中位数）', resP: '二手价（中位数）', na: '未找到', refs: '参考来源（最多4个）',
    nokey: '此服务器尚未配置实时价格搜索（设置 SERPAPI_KEY）。请使用以下链接手动比较：',
    nodata: '未找到价格。请尝试更具体的名称，或手动搜索：', err: '搜索失败，请重试。', newTag: '全新', resTag: '二手', your: '你的价格',
  },
};
const QUOTES = [
  ['Do not save what is left after spending, but spend what is left after saving.', 'Warren Buffett'],
  ['Beware of little expenses; a small leak will sink a great ship.', 'Benjamin Franklin'],
  ['A penny saved is a penny earned.', 'Benjamin Franklin'],
  ['It’s not how much money you make, but how much money you keep.', 'Robert Kiyosaki'],
  ['Too many people spend money they haven’t earned, to buy things they don’t want, to impress people they don’t like.', 'Will Rogers'],
  ['Rich people have small TVs and big libraries, and poor people have small libraries and big TVs.', 'Zig Ziglar'],
  ['If you buy things you do not need, soon you will have to sell things you need.', 'Warren Buffett'],
  ['The best way to save money is to not spend it.', 'Anonymous'],
];
const $ = id => document.getElementById(id);
let lang = 'en', ocrPrice = null, last = null;
const t = k => T[lang][k];

function applyLang() {
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh';
  document.querySelectorAll('[data-i]').forEach(e => (e.textContent = t(e.dataset.i)));
  $('langBtn').textContent = lang === 'en' ? '中文' : 'English';
  if (last) render(last);
}
$('langBtn').onclick = () => { lang = lang === 'en' ? 'zh' : 'en'; applyLang(); };
const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
$('quote').textContent = `“${q[0]}” — ${q[1]}`;

$('photo').onchange = async e => {
  const f = e.target.files[0];
  ocrPrice = null;
  if (!f) { $('preview').hidden = true; return; }
  $('preview').src = URL.createObjectURL(f);
  $('preview').hidden = false;
  const o = $('ocr'); o.hidden = false; o.textContent = t('reading');
  try {
    const { data } = await Tesseract.recognize(f, 'eng');
    const nums = [...data.text.matchAll(/(?:S?\$|SGD)\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi)]
      .map(m => parseFloat(m[1].replace(/,/g, '')));
    if (nums.length) {
      ocrPrice = nums[0];
      if (!$('price').value) $('price').value = ocrPrice;
      o.textContent = t('detected') + ocrPrice;
    } else o.textContent = t('noDetect');
  } catch { o.textContent = t('noDetect'); }
};

const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const money = n => 'S$' + n.toLocaleString('en-SG', { maximumFractionDigits: 2 });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => (/^https?:\/\//i.test(u) ? esc(u) : '#');

function manualLinks(name) {
  const e = encodeURIComponent(name);
  return [['Google Shopping SG', `https://www.google.com.sg/search?tbm=shop&q=${e}`], ['Carousell', `https://www.carousell.sg/search/${e}`],
    ['Shopee', `https://shopee.sg/search?keyword=${e}`], ['Lazada', `https://www.lazada.sg/catalog/?q=${e}`], ['Qoo10', `https://www.qoo10.sg/s/${e}`]];
}

function render(s) {
  const r = $('result'); r.hidden = false;
  if (s.price > LIMIT || (s.newMed && s.newMed > LIMIT)) { r.innerHTML = `<div class="verdict warn">${t('costly')}</div>`; return; }
  const links = () => '<ul>' + manualLinks(s.name).map(l => `<li><a href="${l[1]}" target="_blank" rel="noopener">${l[0]}</a></li>`).join('') + '</ul>';
  if (s.state === 'nokey' || s.state === 'nodata' || s.state === 'err') {
    r.innerHTML = `<p>${t(s.state)}</p>${s.state === 'err' ? '' : links()}`; return;
  }
  const base = s.newMed ?? s.resMed;
  const ratio = s.price / base;
  const v = ratio <= 0.85 ? ['good', 'good'] : ratio <= 1.15 ? ['fair', 'fair'] : ['exp', 'exp'];
  const refs = s.items.slice(0, 4).map(i => `<li><b>${t(i.type === 'new' ? 'newTag' : 'resTag')}</b> ${money(i.price)} – <a href="${safeUrl(i.link)}" target="_blank" rel="noopener">${esc(i.store)}</a></li>`).join('');
  r.innerHTML = `<div class="verdict ${v[0]}">${t(v[1])}</div>
    <div class="box"><div>${t('your')}<b>${money(s.price)}</b></div><div>${t('newP')}<b>${s.newMed ? money(s.newMed) : t('na')}</b></div><div>${t('resP')}<b>${s.resMed ? money(s.resMed) : t('na')}</b></div></div>
    <h3>${t('refs')}</h3><ul>${refs}</ul>`;
}

$('form').onsubmit = async e => {
  e.preventDefault();
  const name = $('name').value.trim(), price = parseFloat($('price').value);
  const r = $('result');
  if (!name || !(price >= 0)) { r.hidden = false; r.textContent = t('need'); last = null; return; }
  if (price > LIMIT) { last = { name, price }; return render(last); }
  r.hidden = false; r.textContent = t('searching'); $('go').disabled = true;
  try {
    const d = await (await fetch('/api/search?q=' + encodeURIComponent(name))).json();
    if (d.error) throw 0;
    const nw = d.items.filter(i => i.type === 'new'), rs = d.items.filter(i => i.type === 'resale');
    // up to 4 references: 2 new + 2 resale, filled by whichever is available
    const items = [...nw.slice(0, 2), ...rs.slice(0, 2)];
    for (const i of d.items) if (items.length < 4 && !items.includes(i)) items.push(i);
    last = { name, price, items, newMed: median(nw.map(i => i.price)), resMed: median(rs.map(i => i.price)),
      state: !d.configured ? 'nokey' : d.items.length ? 'ok' : 'nodata' };
  } catch { last = { name, price, state: 'err' }; }
  $('go').disabled = false;
  render(last);
};
applyLang();
