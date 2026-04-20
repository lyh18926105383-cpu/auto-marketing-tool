import { Search, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const CustomerList = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  searchTerm,
  onSearchChange
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'overdue':
        return <AlertTriangle size={11} />;
      case 'critical':
        return <Clock size={11} />;
      default:
        return <CheckCircle size={11} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-50 text-red-600';
      case 'critical':
        return 'bg-yellow-50 text-yellow-600';
      default:
        return 'bg-green-50 text-green-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'overdue':
        return '逾期';
      case 'critical':
        return '临界';
      default:
        return '正常';
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const search = searchTerm.toLowerCase();
    return (
      customer.licensePlate.toLowerCase().includes(search) ||
      customer.customerName.toLowerCase().includes(search)
    );
  });

  const criticalCount = filteredCustomers.filter(
    (c) => c.status === 'critical' || c.status === 'overdue'
  ).length;

  return (
    <div className="flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 搜索框 */}
      <div className="p-6 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            id="searchInput"
            name="searchInput"
            placeholder="搜索车牌或姓名..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* 客户列表 */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-320px)]">
        {filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Search size={32} className="mb-3" />
            <p className="text-sm">{searchTerm ? '未找到匹配的客户' : '暂无客户数据'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.licensePlate}
                onClick={() => onSelectCustomer(customer)}
                className={`px-6 py-5 cursor-pointer transition-colors ${
                  selectedCustomer?.licensePlate === customer.licensePlate
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="grid grid-cols-4 items-center text-sm gap-4">
                  <span className="font-medium text-gray-900 truncate">{customer.licensePlate}</span>
                  <span className="text-gray-500 truncate">{customer.customerName}</span>
                  <span className="text-gray-400 truncate">
                    {Math.round(customer.realtimeMileage).toLocaleString()} km
                  </span>
                  <div className="flex justify-end">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                        customer.status
                      )}`}
                    >
                      {getStatusIcon(customer.status)}
                      {getStatusText(customer.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-sm text-gray-500 flex justify-between">
        <span>共 {filteredCustomers.length} 位客户</span>
        <span className={criticalCount > 0 ? 'text-yellow-600 font-medium' : 'text-green-600 font-medium'}>
          {criticalCount > 0 ? `${criticalCount} 位待跟进` : '全部正常'}
        </span>
      </div>
    </div>
  );
};

export default CustomerList;
