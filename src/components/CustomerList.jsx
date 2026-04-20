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
        return <AlertTriangle size={14} />;
      case 'critical':
        return <Clock size={14} />;
      default:
        return <CheckCircle size={14} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-50 text-red-600';
      case 'critical':
        return 'bg-amber-50 text-amber-600';
      default:
        return 'bg-emerald-50 text-emerald-600';
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
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 搜索框 */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            id="searchInput"
            name="searchInput"
            placeholder="搜索车牌或姓名..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* 客户列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-gray-400">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <Search size={20} />
            </div>
            <p className="text-sm">{searchTerm ? '未找到匹配的客户' : '暂无客户数据'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.licensePlate}
                onClick={() => onSelectCustomer(customer)}
                className={`p-3.5 cursor-pointer transition-colors ${
                  selectedCustomer?.licensePlate === customer.licensePlate
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 text-sm">
                    {customer.licensePlate}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                      customer.status
                    )}`}
                  >
                    {getStatusIcon(customer.status)}
                    {getStatusText(customer.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{customer.customerName}</span>
                  <span className="text-gray-700 font-medium">
                    {Math.round(customer.realtimeMileage).toLocaleString()} km
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between">
        <span>共 {filteredCustomers.length} 位客户</span>
        <span className={criticalCount > 0 ? 'text-amber-600 font-medium' : ''}>
          {criticalCount} 位待跟进
        </span>
      </div>
    </div>
  );
};

export default CustomerList;
