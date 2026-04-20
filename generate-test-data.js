import * as XLSX from 'xlsx';

const carModels = [
  '大众帕萨特', '丰田凯美瑞', '本田雅阁', '日产天籁', '别克君威',
  '宝马3系', '奔驰C级', '奥迪A4L', '特斯拉Model 3', '比亚迪汉',
  '吉利帝豪', '长城哈弗H6', '长安CS75', '荣威RX5', '传祺GS4'
];

const provinces = ['京', '沪', '粤', '川', '渝', '陕', '鄂', '湘', '浙', '苏'];

const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗'];
const secondNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '华', '平', '刚'];

function randomPlate() {
  const prefix = provinces[Math.floor(Math.random() * provinces.length)];
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const letter1 = letters[Math.floor(Math.random() * letters.length)];
  const letter2 = letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${letter1}${letter2}${num}`;
}

function randomName() {
  return firstNames[Math.floor(Math.random() * firstNames.length)] +
         secondNames[Math.floor(Math.random() * secondNames.length)];
}

function randomPhone() {
  return `1${Math.floor(Math.random() * 9) + 3}${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
}

function randomDate() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 90);
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString().split('T')[0];
}

function randomMileage() {
  return Math.floor(Math.random() * 40000) + 5000;
}

// 使用英文字段名 + 中文别名
const customers = [];

for (let i = 0; i < 20; i++) {
  customers.push({
    'customerName': randomName(),
    'phone': randomPhone(),
    'licensePlate': randomPlate(),
    'carModel': carModels[Math.floor(Math.random() * carModels.length)],
    'mileage': randomMileage(),
    'lastDate': randomDate()
  });
}

const worksheet = XLSX.utils.json_to_sheet(customers);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, '客户数据');

XLSX.writeFile(workbook, '测试客户数据.xlsx');
console.log('已生成测试数据: 测试客户数据.xlsx');
