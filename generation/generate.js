'use strict';

const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const ROWS = 1250;
const CUSTOMER_COUNT = 420;
const OUT_DIR = __dirname;

// --- transliteration ---
const TRANSLIT_MAP = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
    щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};
const translit = str =>
    str.toLowerCase().split('').map(c => TRANSLIT_MAP[c] ?? c).join('');

// --- helpers ---
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = arr => arr[rand(0, arr.length - 1)];
const weightedPick = (arr, weights) => {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < arr.length; i++) {
        r -= weights[i];
        if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
};
const randDate = (start, end) => {
    const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return d.toISOString().slice(0, 10);
};
const pad = (n, len) => String(n).padStart(len, '0');

// --- seed data ---

const CITIES = [
    { city: 'Москва', region: 'Центральный' },
    { city: 'Санкт-Петербург', region: 'Северо-Западный' },
    { city: 'Новосибирск', region: 'Сибирский' },
    { city: 'Екатеринбург', region: 'Уральский' },
    { city: 'Нижний Новгород', region: 'Приволжский' },
    { city: 'Казань', region: 'Приволжский' },
    { city: 'Челябинск', region: 'Уральский' },
    { city: 'Самара', region: 'Приволжский' },
    { city: 'Омск', region: 'Сибирский' },
    { city: 'Ростов-на-Дону', region: 'Южный' },
    { city: 'Уфа', region: 'Приволжский' },
    { city: 'Красноярск', region: 'Сибирский' },
    { city: 'Воронеж', region: 'Центральный' },
    { city: 'Пермь', region: 'Приволжский' },
    { city: 'Краснодар', region: 'Южный' },
    { city: 'Волгоград', region: 'Южный' },
    { city: 'Саратов', region: 'Приволжский' },
    { city: 'Тюмень', region: 'Уральский' },
    { city: 'Тольятти', region: 'Приволжский' },
    { city: 'Ижевск', region: 'Приволжский' },
    { city: 'Ярославль', region: 'Центральный' },
    { city: 'Хабаровск', region: 'Дальневосточный' },
    { city: 'Иркутск', region: 'Сибирский' },
    { city: 'Томск', region: 'Сибирский' },
    { city: 'Кемерово', region: 'Сибирский' },
];
const CITY_WEIGHTS = [22, 13, 7, 6, 5, 5, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1, 1];

const PRODUCTS = [
    // Верхняя одежда
    { category: 'Верхняя одежда', name: 'Куртка зимняя', sku: 'JKT-WIN', priceMin: 3500, priceMax: 12000 },
    { category: 'Верхняя одежда', name: 'Пальто классическое', sku: 'CT-CLS', priceMin: 5000, priceMax: 18000 },
    { category: 'Верхняя одежда', name: 'Плащ демисезонный', sku: 'RC-DEM', priceMin: 2800, priceMax: 7500 },
    { category: 'Верхняя одежда', name: 'Куртка весенняя', sku: 'JKT-SPR', priceMin: 1800, priceMax: 5500 },
    { category: 'Верхняя одежда', name: 'Пуховик', sku: 'DWN-JKT', priceMin: 4000, priceMax: 14000 },
    // Платья
    { category: 'Платья', name: 'Платье вечернее', sku: 'EVD-GLA', priceMin: 2500, priceMax: 9500 },
    { category: 'Платья', name: 'Платье повседневное', sku: 'CAD-EVR', priceMin: 1100, priceMax: 4200 },
    { category: 'Платья', name: 'Платье летнее', sku: 'SUD-LGT', priceMin: 700, priceMax: 2800 },
    { category: 'Платья', name: 'Платье-футляр', sku: 'DRS-FTL', priceMin: 1800, priceMax: 6000 },
    // Блузки и рубашки
    { category: 'Блузки и рубашки', name: 'Блузка офисная', sku: 'BLZ-OFC', priceMin: 800, priceMax: 2800 },
    { category: 'Блузки и рубашки', name: 'Рубашка мужская', sku: 'SHT-MEN', priceMin: 900, priceMax: 3500 },
    { category: 'Блузки и рубашки', name: 'Рубашка льняная', sku: 'SHT-LNN', priceMin: 1100, priceMax: 3800 },
    { category: 'Блузки и рубашки', name: 'Блузка шифоновая', sku: 'BLZ-CHF', priceMin: 700, priceMax: 2500 },
    // Брюки и джинсы
    { category: 'Брюки и джинсы', name: 'Джинсы прямые', sku: 'JNS-STR', priceMin: 1400, priceMax: 5000 },
    { category: 'Брюки и джинсы', name: 'Джинсы скинни', sku: 'JNS-SKN', priceMin: 1400, priceMax: 4500 },
    { category: 'Брюки и джинсы', name: 'Брюки классические', sku: 'PNT-CLS', priceMin: 1700, priceMax: 6200 },
    { category: 'Брюки и джинсы', name: 'Джинсы широкие', sku: 'JNS-WDE', priceMin: 1600, priceMax: 5500 },
    // Юбки
    { category: 'Юбки', name: 'Юбка мини', sku: 'SKT-MNI', priceMin: 600, priceMax: 2500 },
    { category: 'Юбки', name: 'Юбка макси', sku: 'SKT-MXI', priceMin: 850, priceMax: 3200 },
    { category: 'Юбки', name: 'Юбка-карандаш', sku: 'SKT-PCL', priceMin: 950, priceMax: 3500 },
    // Обувь
    { category: 'Обувь', name: 'Кроссовки', sku: 'SHO-SNK', priceMin: 1800, priceMax: 8500 },
    { category: 'Обувь', name: 'Сапоги зимние', sku: 'SHO-BOT', priceMin: 3200, priceMax: 12000 },
    { category: 'Обувь', name: 'Туфли классические', sku: 'SHO-HEL', priceMin: 2200, priceMax: 9000 },
    { category: 'Обувь', name: 'Балетки', sku: 'SHO-FLT', priceMin: 1000, priceMax: 3800 },
    { category: 'Обувь', name: 'Ботинки демисезон', sku: 'SHO-ANK', priceMin: 2500, priceMax: 8000 },
    // Аксессуары
    { category: 'Аксессуары', name: 'Сумка женская', sku: 'ACC-HBG', priceMin: 1400, priceMax: 8500 },
    { category: 'Аксессуары', name: 'Ремень кожаный', sku: 'ACC-BLT', priceMin: 450, priceMax: 2500 },
    { category: 'Аксессуары', name: 'Шарф шерстяной', sku: 'ACC-SCF', priceMin: 350, priceMax: 1800 },
    { category: 'Аксессуары', name: 'Шапка вязаная', sku: 'ACC-HAT', priceMin: 280, priceMax: 1200 },
    { category: 'Аксессуары', name: 'Перчатки кожаные', sku: 'ACC-GLV', priceMin: 600, priceMax: 3000 },
    // Трикотаж
    { category: 'Трикотаж', name: 'Свитер шерстяной', sku: 'KNT-SWT', priceMin: 1400, priceMax: 5500 },
    { category: 'Трикотаж', name: 'Джемпер хлопковый', sku: 'KNT-JMP', priceMin: 850, priceMax: 3200 },
    { category: 'Трикотаж', name: 'Кардиган', sku: 'KNT-CDG', priceMin: 1100, priceMax: 4500 },
    { category: 'Трикотаж', name: 'Водолазка', sku: 'KNT-TNK', priceMin: 700, priceMax: 2800 },
    // Спортивная одежда
    { category: 'Спортивная одежда', name: 'Леггинсы спортивные', sku: 'SPT-LGG', priceMin: 650, priceMax: 2500 },
    { category: 'Спортивная одежда', name: 'Толстовка с капюшоном', sku: 'SPT-HDY', priceMin: 1100, priceMax: 4200 },
    { category: 'Спортивная одежда', name: 'Спортивные брюки', sku: 'SPT-PNT', priceMin: 750, priceMax: 2800 },
    { category: 'Спортивная одежда', name: 'Спортивный топ', sku: 'SPT-TOP', priceMin: 450, priceMax: 1800 },
];

const SIZES_CLOTHING = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SIZES_SHOES = ['36', '37', '38', '39', '40', '41', '42', '43', '44'];
const COLORS = [
    'чёрный', 'белый', 'серый', 'тёмно-синий', 'бежевый', 'красный',
    'зелёный', 'коричневый', 'розовый', 'бордовый', 'горчичный', 'хаки',
];

const FIRST_NAMES_F = [
    'Анна', 'Мария', 'Елена', 'Ольга', 'Наталья', 'Ирина', 'Татьяна',
    'Светлана', 'Юлия', 'Екатерина', 'Алина', 'Дарья', 'Кристина',
    'Виктория', 'Александра', 'Надежда', 'Людмила', 'Вера', 'Галина', 'Вероника',
];
const FIRST_NAMES_M = [
    'Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей',
    'Михаил', 'Иван', 'Артём', 'Николай', 'Владимир', 'Павел', 'Антон',
    'Роман', 'Константин', 'Денис', 'Евгений', 'Илья', 'Тимур', 'Кирилл',
];
const LAST_NAMES = [
    'Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Соколов', 'Лебедев',
    'Козлов', 'Новиков', 'Морозов', 'Петров', 'Волков', 'Соловьёв',
    'Васильев', 'Зайцев', 'Павлов', 'Семёнов', 'Голубев', 'Виноградов',
    'Богданов', 'Воробьёв', 'Фёдоров', 'Михайлов', 'Беляев', 'Тарасов',
];
const EMAIL_DOMAINS = ['mail.ru', 'yandex.ru', 'gmail.com', 'rambler.ru', 'inbox.ru', 'bk.ru'];

const PAYMENT_METHODS = ['Банковская карта', 'СБП', 'Наличные при получении', 'Онлайн-оплата'];
const PAYMENT_WEIGHTS = [44, 28, 18, 10];

const DELIVERY_METHODS = ['СДЭК', 'Почта России', 'Курьер', 'Самовывоз'];
const DELIVERY_DAYS_RANGE = {
    'СДЭК': [1, 7],
    'Почта России': [3, 14],
    'Курьер': [1, 3],
    'Самовывоз': [0, 1],
};

const STATUSES = ['Выполнен', 'Отправлен', 'В обработке', 'Отменён', 'Возврат'];

const MANAGERS = ['Алексеева М.', 'Петров К.', 'Захарова Е.', 'Сидоров А.', 'Кириллова Н.'];

const NOTES = [
    '', '', '', '', '', '', '', '', '', '',
    'Постоянный клиент, скидка согласована',
    'Срочная доставка',
    'Позвонить перед отправкой',
    'Размер уточнён по телефону',
    'Подарочная упаковка',
    'Клиент просит позвонить при доставке',
    'Возможен обмен',
    'Оплачено частично — остаток при получении',
    'Акционный товар',
    'Корпоративный заказ',
    'Клиент оставил положительный отзыв',
    'Повторная покупка за месяц',
];

// --- generate customers ---

const customers = [];
for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const female = Math.random() > 0.38;
    const firstName = female ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
    const lastNameBase = pick(LAST_NAMES);
    const lastName = female ? lastNameBase + 'а' : lastNameBase;
    const emailBase = translit(firstName) + '.' + translit(lastNameBase.toLowerCase());
    const email = `${emailBase}${rand(1, 99)}@${pick(EMAIL_DOMAINS)}`;
    const opCodes = ['900', '901', '903', '910', '915', '916', '917', '918', '920', '925', '926', '950', '960', '985'];
    const phone = `+7 (${pick(opCodes)}) ${pad(rand(100, 999), 3)}-${pad(rand(10, 99), 2)}-${pad(rand(10, 99), 2)}`;
    const loc = weightedPick(CITIES, CITY_WEIGHTS);
    customers.push({
        id: `CUST${pad(i + 1, 4)}`,
        firstName,
        lastName,
        email,
        phone,
        city: loc.city,
        region: loc.region,
    });
}

const customerOrderCount = new Map(customers.map(c => [c.id, 0]));

// --- generate orders ---

const WINTER_MONTHS = [11, 12, 1, 2];
const SUMMER_MONTHS = [6, 7, 8];
const dateStart = new Date('2023-01-05');
const dateEnd = new Date('2024-12-20');

const records = [];

for (let i = 0; i < ROWS; i++) {
    const orderDate = randDate(dateStart, dateEnd);
    const month = parseInt(orderDate.slice(5, 7), 10);

    // seasonal product selection
    let product;
    const isWinter = WINTER_MONTHS.includes(month);
    const isSummer = SUMMER_MONTHS.includes(month);
    if (isWinter && Math.random() > 0.45) {
        const pool = PRODUCTS.filter(p =>
            p.category === 'Верхняя одежда' ||
            p.category === 'Трикотаж' ||
            p.category === 'Аксессуары' ||
            p.name.includes('зим')
        );
        product = pick(pool.length ? pool : PRODUCTS);
    } else if (isSummer && Math.random() > 0.45) {
        const pool = PRODUCTS.filter(p =>
            p.category === 'Платья' ||
            p.category === 'Юбки' ||
            p.category === 'Спортивная одежда' ||
            p.name.includes('лет')
        );
        product = pick(pool.length ? pool : PRODUCTS);
    } else {
        product = pick(PRODUCTS);
    }

    const isShoes = product.category === 'Обувь';
    const size = isShoes ? pick(SIZES_SHOES) : pick(SIZES_CLOTHING);
    const color = pick(COLORS);
    const sku = `${product.sku}-${color.slice(0, 3).toUpperCase()}-${size}`;

    const qty = rand(1, 3);
    const unitPrice = rand(product.priceMin, product.priceMax);

    const discountRoll = Math.random();
    const discountPct =
        discountRoll > 0.95 ? rand(16, 30) :
        discountRoll > 0.80 ? rand(5, 15) : 0;

    const totalAmount = Math.round(qty * unitPrice * (1 - discountPct / 100));

    const paymentMethod = weightedPick(PAYMENT_METHODS, PAYMENT_WEIGHTS);

    const deliveryMethod =
        paymentMethod === 'Наличные при получении'
            ? weightedPick(['Курьер', 'Самовывоз'], [70, 30])
            : weightedPick(DELIVERY_METHODS, [35, 25, 25, 15]);

    const [dMin, dMax] = DELIVERY_DAYS_RANGE[deliveryMethod];
    const deliveryDays = rand(dMin, dMax);

    const ageDays = (dateEnd.getTime() - new Date(orderDate).getTime()) / 86400000;
    let status;
    if (ageDays > 60) {
        status = weightedPick(STATUSES, [75, 5, 2, 12, 6]);
    } else if (ageDays > 14) {
        status = weightedPick(STATUSES, [50, 25, 10, 10, 5]);
    } else {
        status = weightedPick(STATUSES, [20, 40, 30, 8, 2]);
    }

    // bias first 60 customers as "loyal" — they appear more often
    const customer = Math.random() > 0.35
        ? customers[rand(0, CUSTOMER_COUNT - 1)]
        : customers[rand(0, Math.min(59, CUSTOMER_COUNT - 1))];

    const prevOrders = customerOrderCount.get(customer.id);
    customerOrderCount.set(customer.id, prevOrders + 1);

    records.push({
        order_id: '',  // filled after sort
        order_date: orderDate,
        customer_id: customer.id,
        customer_name: `${customer.lastName} ${customer.firstName}`,
        customer_email: customer.email,
        customer_phone: customer.phone,
        city: customer.city,
        region: customer.region,
        product_category: product.category,
        product_name: product.name,
        sku,
        size,
        color,
        quantity: qty,
        unit_price: unitPrice,
        discount_percent: discountPct,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        order_status: status,
        delivery_method: deliveryMethod,
        delivery_days: deliveryDays,
        is_repeat_customer: prevOrders > 0,
        manager: pick(MANAGERS),
        notes: pick(NOTES),
    });
}

// sort chronologically and assign final IDs
records.sort((a, b) => a.order_date.localeCompare(b.order_date));
records.forEach((r, i) => {
    r.order_id = `ORD-${r.order_date.slice(0, 4)}-${pad(i + 1, 5)}`;
});

// --- write CSV ---

const CSV_PATH = path.join(OUT_DIR, 'orders.csv');
const headers = Object.keys(records[0]);
const csvLines = [
    headers.join(','),
    ...records.map(r =>
        headers.map(h => {
            const v = String(r[h]);
            return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
        }).join(',')
    ),
];
// BOM for Excel UTF-8 compat
fs.writeFileSync(CSV_PATH, '﻿' + csvLines.join('\n'), 'utf8');

// --- write XLSX ---

async function writeXlsx() {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'generation/generate.js';
    const ws = wb.addWorksheet('Заказы');

    const COL_META = [
        { key: 'order_id', header: 'order_id', width: 20 },
        { key: 'order_date', header: 'order_date', width: 13 },
        { key: 'customer_id', header: 'customer_id', width: 11 },
        { key: 'customer_name', header: 'customer_name', width: 26 },
        { key: 'customer_email', header: 'customer_email', width: 30 },
        { key: 'customer_phone', header: 'customer_phone', width: 20 },
        { key: 'city', header: 'city', width: 20 },
        { key: 'region', header: 'region', width: 18 },
        { key: 'product_category', header: 'product_category', width: 22 },
        { key: 'product_name', header: 'product_name', width: 28 },
        { key: 'sku', header: 'sku', width: 20 },
        { key: 'size', header: 'size', width: 7 },
        { key: 'color', header: 'color', width: 16 },
        { key: 'quantity', header: 'quantity', width: 9 },
        { key: 'unit_price', header: 'unit_price', width: 12 },
        { key: 'discount_percent', header: 'discount_percent', width: 14 },
        { key: 'total_amount', header: 'total_amount', width: 14 },
        { key: 'payment_method', header: 'payment_method', width: 24 },
        { key: 'order_status', header: 'order_status', width: 16 },
        { key: 'delivery_method', header: 'delivery_method', width: 18 },
        { key: 'delivery_days', header: 'delivery_days', width: 13 },
        { key: 'is_repeat_customer', header: 'is_repeat_customer', width: 16 },
        { key: 'manager', header: 'manager', width: 16 },
        { key: 'notes', header: 'notes', width: 36 },
    ];

    ws.columns = COL_META;

    // header row styling
    ws.getRow(1).eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E2E2E' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    for (const r of records) {
        ws.addRow(r);
    }

    // freeze header
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    const XLSX_PATH = path.join(OUT_DIR, 'orders.xlsx');
    await wb.xlsx.writeFile(XLSX_PATH);
    return XLSX_PATH;
}

// --- run ---

writeXlsx().then(xlsxPath => {
    const totalRevenue = records
        .filter(r => r.order_status === 'Выполнен')
        .reduce((s, r) => s + r.total_amount, 0);
    const completed = records.filter(r => r.order_status === 'Выполнен').length;
    const uniqueCustomers = new Set(records.map(r => r.customer_id)).size;

    console.log(`Generated ${records.length} orders, ${headers.length} columns`);
    console.log(`Unique customers: ${uniqueCustomers} / ${CUSTOMER_COUNT}`);
    console.log(`Completed orders: ${completed} (${((completed / records.length) * 100).toFixed(1)}%)`);
    console.log(`Revenue from completed: ${totalRevenue.toLocaleString('ru-RU')} RUB`);
    console.log(`CSV  → ${CSV_PATH}`);
    console.log(`XLSX → ${xlsxPath}`);
}).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
