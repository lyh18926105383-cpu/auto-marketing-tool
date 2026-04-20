import * as XLSX from 'xlsx';

// 解析日期
const parseDate = (value) => {
  if (!value) return new Date().toISOString().split('T')[0];

  if (typeof value === 'string') {
    const formats = [
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/
    ];

    for (const format of formats) {
      const match = value.match(format);
      if (match) {
        if (format === formats[2]) {
          return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
        }
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      }
    }
    return value;
  }

  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
};

const parseMileage = (value) => {
  if (!value && value !== 0) return 0;
  if (typeof value === 'number') return Math.round(value);
  const num = parseInt(String(value).replace(/[^\d]/g, ''), 10);
  return isNaN(num) ? 0 : num;
};

// 标准化字段名
const normalizeFieldName = (name) => {
  if (!name) return null;
  const n = String(name).trim().toLowerCase();

  const mapping = {
    customerName: ['customername', '姓名', '客户名', 'name', '客户姓名', '顾客姓名', '顾客名'],
    phone: ['phone', '手机', '电话', '手机号', '联系电话', '电话号码'],
    licensePlate: ['licenseplate', '车牌', '车牌号', 'license', '车号'],
    carModel: ['carmodel', '车型', '车辆型号', 'car', '车型号', '车辆'],
    mileage: ['mileage', '里程', '本次里程', '公里数', '行驶里程'],
    lastDate: ['lastdate', '日期', '本次日期', '上次进店日期', 'date', '进店日期', '保养日期']
  };

  for (const [key, variants] of Object.entries(mapping)) {
    if (variants.includes(n)) {
      return key;
    }
  }
  return null;
};

// 导入 Excel/CSV 文件
export const importExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 使用原始数组格式获取数据
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        console.log('Excel headers:', jsonData[0]);

        if (jsonData.length < 2) {
          reject(new Error('文件内容为空或格式不正确'));
          return;
        }

        const headers = jsonData[0];
        const fieldIndices = {};

        headers.forEach((header, index) => {
          const field = normalizeFieldName(header);
          if (field) {
            fieldIndices[field] = index;
          }
        });

        console.log('Field indices:', fieldIndices);

        const requiredFields = ['customerName', 'licensePlate'];
        const missingFields = requiredFields.filter(f => !(f in fieldIndices));

        if (missingFields.length > 0) {
          reject(new Error(`缺少必需字段: ${missingFields.join(', ')}，请检查Excel表头是否正确`));
          return;
        }

        const customers = [];
        const errors = [];

        console.log('Total rows:', jsonData.length);
        console.log('First data row:', jsonData[1]);

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          console.log(`Row ${i}:`, row);

          if (!row || row.length === 0 || !row[fieldIndices.licensePlate]) {
            continue;
          }

          try {
            const customer = {
              customerName: String(row[fieldIndices.customerName] || '').trim(),
              phone: String(row[fieldIndices.phone] || '').trim(),
              licensePlate: String(row[fieldIndices.licensePlate] || '').trim().toUpperCase(),
              carModel: String(row[fieldIndices.carModel] || '').trim(),
              mileage: parseMileage(row[fieldIndices.mileage]),
              lastDate: parseDate(row[fieldIndices.lastDate])
            };

            if (!customer.customerName || !customer.licensePlate) {
              errors.push(`第 ${i + 1} 行: 缺少姓名或车牌`);
              continue;
            }

            customers.push(customer);
          } catch (err) {
            errors.push(`第 ${i + 1} 行: ${err.message}`);
          }
        }

        if (customers.length === 0 && errors.length > 0) {
          reject(new Error(errors.join('\n')));
          return;
        }

        resolve({ customers, errors });
      } catch (err) {
        reject(new Error(`解析文件失败: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsArrayBuffer(file);
  });
};

// 生成模板数据
export const generateTemplate = () => {
  const templateData = [
    {
      'customerName': '张三',
      'phone': '13800138000',
      'licensePlate': '京A12345',
      'carModel': '大众帕萨特',
      'mileage': '15000',
      'lastDate': '2024-01-15'
    },
    {
      'customerName': '李四',
      'phone': '13900139000',
      'licensePlate': '京B67890',
      'carModel': '丰田凯美瑞',
      'mileage': '28000',
      'lastDate': '2024-02-20'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '客户数据');

  return workbook;
};

// 下载模板
export const downloadTemplate = () => {
  const workbook = generateTemplate();
  XLSX.writeFile(workbook, '客户数据模板.xlsx');
};
