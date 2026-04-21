import { useState, useEffect, useCallback } from 'react';
// 引入 Header 顶部导航栏组件
import Header from './components/Header';
// 引入 CustomerList 左侧客户列表组件
import CustomerList from './components/CustomerList';
// 引入 CustomerDetail 右侧客户详情组件
import CustomerDetail from './components/CustomerDetail';
// 从数据库模块引入客户数据的 CRUD 操作
import { getAllCustomers, addOrUpdateCustomer, clearAllCustomers } from './db/database';
// 从工具模块引入客户数据处理函数（计算实时里程、预测状态等）
import { processCustomerData } from './utils/prediction';
// 从工具模块引入 Excel 导入导出功能
import { importExcel, downloadTemplate } from './utils/excel';

// localStorage 中存储门店名称的键名
const STORE_NAME_KEY = 'autoRepair_storeName';
// localStorage 中存储门店电话的键名
const STORE_PHONE_KEY = 'autoRepair_storePhone';

function App() {
  // 客户列表数据
  const [customers, setCustomers] = useState([]);
  // 当前选中的客户对象
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  // 搜索框的搜索关键字
  const [searchTerm, setSearchTerm] = useState('');
  // 门店名称（从 localStorage 读取，默认"智慧汽修"）
  const [storeName, setStoreName] = useState(() => {
    return localStorage.getItem(STORE_NAME_KEY) || '智慧汽修';
  });
  // 门店电话（从 localStorage 读取）
  const [storePhone, setStorePhone] = useState(() => {
    return localStorage.getItem(STORE_PHONE_KEY) || '';
  });
  // 加载状态（目前未使用但保留）
  const [loading, setLoading] = useState(true);
  // 导入状态提示（loading/success/error）
  const [importStatus, setImportStatus] = useState(null);

  // 从 IndexedDB 加载所有客户数据，并进行数据处理和排序
  const loadCustomers = useCallback(async () => {
    try {
      // 获取所有客户原始数据
      const data = await getAllCustomers();
      // 对每条客户数据进行实时计算（里程、状态预测等）
      const processed = data.map(processCustomerData);
      // 按更新时间倒序排列，最新更新的客户排在最前面
      processed.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setCustomers(processed);
      setLoading(false);
    } catch (error) {
      console.error('加载客户数据失败:', error);
      setLoading(false);
    }
  }, []);

  // 组件首次渲染时加载客户数据
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // 每分钟自动刷新所有客户的实时里程数据
  useEffect(() => {
    const interval = setInterval(() => {
      setCustomers((prev) => prev.map(processCustomerData));
    }, 60000);
    // 组件卸载时清除定时器，防止内存泄漏
    return () => clearInterval(interval);
  }, []);

  // 更新门店名称并同步到 localStorage 持久化存储
  const handleStoreNameChange = (name) => {
    setStoreName(name);
    localStorage.setItem(STORE_NAME_KEY, name);
  };

  // 更新门店电话并同步到 localStorage 持久化存储
  const handleStorePhoneChange = (phone) => {
    setStorePhone(phone);
    localStorage.setItem(STORE_PHONE_KEY, phone);
  };

  // 处理 Excel 文件导入：解析文件、写入数据库、更新界面
  const handleImport = async (file) => {
    try {
      // 显示"正在导入"的加载状态提示
      setImportStatus({ type: 'loading', message: '正在导入...' });

      // 调用 Excel 解析工具获取客户数据集合和错误信息
      const { customers: newCustomers, errors } = await importExcel(file);

      // 如果没有有效数据，显示错误提示并于3秒后清除
      if (newCustomers.length === 0) {
        setImportStatus({ type: 'error', message: '导入失败: 没有有效数据' });
        setTimeout(() => setImportStatus(null), 3000);
        return;
      }

      // 遍历每条客户数据，逐条写入数据库（自动判断新增或更新）
      let added = 0;
      let updated = 0;

      for (const customer of newCustomers) {
        const result = await addOrUpdateCustomer(customer);
        // 根据返回值判断是新增还是更新，累加计数
        if (result.isUpdate) {
          updated++;
        } else {
          added++;
        }
      }

      // 重新从数据库加载最新数据，确保界面与数据库同步
      await loadCustomers();

      // 构造成功提示消息，包含新增条数、更新条数、错误条数
      const message = `导入成功: 新增 ${added} 条, 更新 ${updated} 条${
        errors?.length ? `, ${errors.length} 条错误` : ''
      }`;

      setImportStatus({
        type: 'success',
        message
      });

      // 3秒后自动清除成功提示
      setTimeout(() => setImportStatus(null), 3000);
    } catch (error) {
      // 捕获导入过程中的错误，显示错误提示，5秒后自动清除
      setImportStatus({ type: 'error', message: error.message });
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  // 处理客户列表中的客户点击事件：选中客户并计算其营销数据
  const handleSelectCustomer = (customer) => {
    const processed = processCustomerData(customer);
    setSelectedCustomer(processed);
  };

  // 处理模板下载按钮点击：触发浏览器下载 Excel 模板文件
  const handleDownloadTemplate = () => {
    downloadTemplate();
  };

  // 处理清空所有客户数据：清空数据库并重置相关状态
  const handleClearAll = async () => {
    try {
      // 调用数据库方法清空所有客户记录
      await clearAllCustomers();
      // 清空本地客户列表状态
      setCustomers([]);
      // 清空当前选中客户状态
      setSelectedCustomer(null);
    } catch (error) {
      console.error('清空客户数据失败:', error);
    }
  };

  return (
    // 整个应用采用纵向 Flex 布局，最小高度100vh，背景色浅灰
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* 顶部导航栏：包含 Logo、标题、导入/清空/设置按钮 */}
      <Header
        storeName={storeName}
        storePhone={storePhone}
        onStoreNameChange={handleStoreNameChange}
        onStorePhoneChange={handleStorePhoneChange}
        onImport={handleImport}
        onDownloadTemplate={handleDownloadTemplate}
        onClearAll={handleClearAll}
      />

      {/* 导入状态提示横幅：根据状态类型显示不同颜色和图标 */}
      {importStatus && (
        <div
          className={`mx-6 mt-4 p-2.5 rounded-md text-sm font-medium ${
            importStatus.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-200' // 成功：绿色
              : importStatus.type === 'error'
              ? 'bg-red-100 text-red-700 border border-red-200' // 错误：红色
              : 'bg-blue-100 text-blue-700 border border-blue-200' // 加载中：蓝色
          }`}
        >
          {importStatus.message}
        </div>
      )}

      {/* 主内容区：左右布局，左侧客户列表，右侧详情面板，与顶部导航保持更大间距 */}
      <main className="flex-1 px-6 pb-6">
        {/* 内部容器通过 padding-top 留出20px间距 */}
        <div className="pt-5">
          {/* 水平排列容器，左侧固定宽度440px，右侧自适应，间距20px，左边距16px，上下方间距20px */}
          <div className="flex gap-5 ml-4 mt-5 mb-5">
            {/* 左侧客户列表卡片：固定宽度440px，不收缩 */}
            <div className="w-[440px] flex-shrink-0">
              <CustomerList
                customers={customers}
                selectedCustomer={selectedCustomer}
                onSelectCustomer={handleSelectCustomer}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </div>

            {/* 右侧详情面板：宽度自适应，垂直方向每个模块间距20px */}
            <div className="flex-1 space-y-5">
              <CustomerDetail
                customer={selectedCustomer}
                storeName={storeName}
                storePhone={storePhone}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;