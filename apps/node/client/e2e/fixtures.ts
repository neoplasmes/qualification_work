import ExcelJS from 'exceljs';

const pad = (value: number) => String(value).padStart(3, '0');

export const createCsvFixture = () => {
    const headers = [
        'region',
        'sku',
        'category',
        'sales',
        'cost',
        'margin',
        'active',
        'soldAt',
        'manager',
        'channel',
        'units',
        'discount',
        'rating',
        'notes',
        'segment',
        'priority',
    ];

    const rows = Array.from({ length: 180 }, (_, index) => {
        const row = index + 1;

        return [
            `North-${pad(row)}`,
            `SKU-${1000 + row}`,
            row % 3 === 0 ? 'Hardware' : row % 3 === 1 ? 'Services' : 'Software',
            1200 + row * 17,
            700 + row * 11,
            500 + row * 6,
            row % 2 === 0,
            `2026-05-${pad((row % 28) + 1)}`,
            `Manager ${row % 9}`,
            row % 2 === 0 ? 'Online' : 'Partner',
            row * 3,
            (row % 5) / 100,
            (row % 10) + 1,
            `CSV row ${pad(row)}`,
            row % 4 === 0 ? 'Enterprise' : 'Midmarket',
            row % 3 === 0 ? 'High' : 'Normal',
        ];
    });

    return [headers, ...rows]
        .map(row => row.map(cell => JSON.stringify(String(cell))).join(','))
        .join('\n');
};

export const createXlsxFixture = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dataset');

    worksheet.columns = [
        { header: 'account', key: 'account' },
        { header: 'invoice', key: 'invoice' },
        { header: 'country', key: 'country' },
        { header: 'revenue', key: 'revenue' },
        { header: 'expense', key: 'expense' },
        { header: 'profit', key: 'profit' },
        { header: 'approved', key: 'approved' },
        { header: 'bookedAt', key: 'bookedAt' },
        { header: 'owner', key: 'owner' },
        { header: 'plan', key: 'plan' },
        { header: 'seats', key: 'seats' },
        { header: 'renewalScore', key: 'renewalScore' },
        { header: 'currency', key: 'currency' },
        { header: 'industry', key: 'industry' },
        { header: 'source', key: 'source' },
        { header: 'risk', key: 'risk' },
        { header: 'comment', key: 'comment' },
        { header: 'quarter', key: 'quarter' },
    ];

    for (let index = 1; index <= 150; index += 1) {
        worksheet.addRow({
            account: `Account-${pad(index)}`,
            invoice: `INV-${5000 + index}`,
            country: index % 2 === 0 ? 'US' : 'DE',
            revenue: 2500 + index * 23,
            expense: 900 + index * 9,
            profit: 1600 + index * 14,
            approved: index % 2 === 0,
            bookedAt: new Date(Date.UTC(2026, index % 12, (index % 28) + 1)),
            owner: `Owner ${index % 7}`,
            plan: index % 3 === 0 ? 'Business' : 'Pro',
            seats: 10 + index,
            renewalScore: (index % 100) / 100,
            currency: 'USD',
            industry: index % 4 === 0 ? 'Finance' : 'Technology',
            source: index % 2 === 0 ? 'Import' : 'Manual',
            risk: index % 5 === 0 ? 'Elevated' : 'Low',
            comment: `XLSX row ${pad(index)}`,
            quarter: `Q${(index % 4) + 1}`,
        });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return Buffer.from(buffer);
};
