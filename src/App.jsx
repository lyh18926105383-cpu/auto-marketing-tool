import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import CustomerList from './components/CustomerList';
import CustomerDetail from './components/CustomerDetail';
import { getAllCustomers, addOrUpdateCustomer } from './db/database';
import { processCustomerData } from './utils/prediction';
import { importExcel, downloadTemplate } from './utils/excel';

const STORE_NAME_KEY = 'autoRepair_storeName';
const STORE_PHONE_KEY = 'autoRepair_storePhone';

function App() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [storeName, setStoreName] = useState(() => {
    return localStorage.getItem(STORE_NAME_KEY) || '智慧汽修';
  });
  const [storePhone, setStorePhone] = useState(() => {
    return localStorage.getItem(STORE_PHONE_KEY) || '';
  });
  const [loading, setLoading] = useState(true);
  const [importStatus, setImportStatus] = useState(null);

  // 加载客户数据
  const loadCustomers = useCallback(async () => {
    try {
      const data = await getAllCustomers();
      const processed = data.map(processCustomerData);
      // 按更新时间倒序
      processed.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setCustomers(processed);
      setLoading(false);
    } catch (error) {
      console.error('加载客户数据失败:', error);
      setLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // 定时更新实时里程 (每分钟)
  useEffect(() => {
    const interval = setInterval(() => {
      setCustomers((prev) => prev.map(processCustomerData));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // 保存门店设置
  const handleStoreNameChange = (name) => {
    setStoreName(name);
    localStorage.setItem(STORE_NAME_KEY, name);
  };

  const handleStorePhoneChange = (phone) => {
    setStorePhone(phone);
    localStorage.setItem(STORE_PHONE_KEY, phone);
  };

  // 处理 Excel 导入
  const handleImport = async (file) => {
    try {
      setImportStatus({ type: 'loading', message: '正在导入...' });

      const { customers: newCustomers, errors } = await importExcel(file);

      console.log('Parsed customers:', newCustomers);
      console.log('Errors:', errors);

      if (newCustomers.length === 0) {
        setImportStatus({ type: 'error', message: '导入失败: 没有有效数据' });
        setTimeout(() => setImportStatus(null), 3000);
        return;
      }

      // 逐条添加/更新客户
      let added = 0;
      let updated = 0;

      for (const customer of newCustomers) {
        const result = await addOrUpdateCustomer(customer);
        if (result.isUpdate) {
          updated++;
        } else {
          added++;
        }
      }

      // 重新加载数据
      await loadCustomers();

      const message = `导入成功: 新增 ${added} 条, 更新 ${updated} 条${
        errors?.length ? `, ${errors.length} 条错误` : ''
      }`;

      setImportStatus({
        type: 'success',
        message
      });

      if (errors?.length > 0) {
        console.warn('导入错误:', errors);
      }

      setTimeout(() => setImportStatus(null), 3000);
    } catch (error) {
      setImportStatus({ type: 'error', message: error.message });
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  // 处理客户选择
  const handleSelectCustomer = (customer) => {
    // 重新处理数据获取最新状态
    const processed = processCustomerData(customer);
    setSelectedCustomer(processed);
  };

  // 处理下载模板
  const handleDownloadTemplate = () => {
    downloadTemplate();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f6]">
      <Header
        storeName={storeName}
        storePhone={storePhone}
        onStoreNameChange={handleStoreNameChange}
        onStorePhoneChange={handleStorePhoneChange}
        onImport={handleImport}
        onDownloadTemplate={handleDownloadTemplate}
      />

      {/* 导入状态提示 */}
      {importStatus && (
        <div
          className={`mx-6 mt-3 p-2.5 rounded-md text-sm font-medium ${
            importStatus.type === 'success'
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : importStatus.type === 'error'
              ? 'bg-red-100 text-red-700 border border-red-200'
              : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}
        >
          {importStatus.message}
        </div>
      )}

      {/* 主内容区 */}
      <main className="flex-1 p-6 overflow-hidden">
        <div className="h-full flex gap-6">
          {/* 左侧客户列表 */}
          <div className="w-2/5 min-w-[350px]">
            <CustomerList
              customers={customers}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={handleSelectCustomer}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>

          {/* 右侧详情面板 */}
          <div className="flex-1">
            <CustomerDetail
              customer={selectedCustomer}
              storeName={storeName}
              storePhone={storePhone}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
