const TYPE_DIRECTORY_URL = 'https://docs.google.com/spreadsheets/d/1kOzR-QWaQoam2Rs6Ot_6rOHfEBG2q-TZlwGoB4IGJhI/gviz/tq?tqx=out:json&sheet=' + encodeURIComponent('Довідник типів та кольорів');
const DEFAULT_TYPE_COLOR = '#253d40';

function cellValue(row, index) {
  return String(row.c[index]?.v || '').trim();
}

function parseTypeDirectory(raw) {
  const rows = JSON.parse(raw.substring(47).slice(0, -2)).table.rows;
  const header = rows.shift()?.c.map((cell) => String(cell?.v || '').trim().toLowerCase()) || [];
  const column = (names) => header.findIndex((name) => names.includes(name));
  const typeColumn = column(['type_id', 'type']);
  const uaColumn = column(['назва ua', 'label_ua', 'name_ua']);
  const enColumn = column(['назва en', 'label_en', 'name_en']);
  const colorColumn = column(['колір', 'color']);

  if (typeColumn < 0 || colorColumn < 0) throw new Error('Type directory does not have type_id and color columns');

  return rows.reduce((directory, row) => {
    const type = cellValue(row, typeColumn).toLowerCase();
    const hex = cellValue(row, colorColumn).toLowerCase();
    if (!type || !/^#[0-9a-f]{6}$/.test(hex)) return directory;

    directory[type] = {
      color: hex,
      ua: uaColumn >= 0 ? cellValue(row, uaColumn) : '',
      en: enColumn >= 0 ? cellValue(row, enColumn) : ''
    };
    return directory;
  }, {});
}

async function loadTypeDirectory() {
  try {
    const response = await fetch(TYPE_DIRECTORY_URL);
    if (!response.ok) throw new Error(`Type directory request failed: ${response.status}`);

    const directory = parseTypeDirectory(await response.text());
    Object.entries(directory).forEach(([type, config]) => {
      TYPE_COLORS[type] = config.color || DEFAULT_TYPE_COLOR;
      const fallback = LABELS[type] || [type, type];
      LABELS[type] = [config.ua || fallback[0], config.en || fallback[1]];
    });

  } catch (error) {
    console.warn('Не вдалося завантажити довідник типів. Використано fallback-палітру.', error);
  }
}

window.typeDirectoryReady = loadTypeDirectory();
