import { useState } from 'react';
import { Copy, Check, Car, Phone, User, Calendar, Gauge, TrendingUp, History } from 'lucide-react';
import { generateMarketingCopy, copyToClipboard } from '../utils/marketing';

const CustomerDetail = ({ customer, storeName, storePhone }) => {
  const [copied, setCopied] = useState(false);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg shadow-sm border border-gray-200 text-gray-400">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <Car size={24} />
        </div>
        <p className="text-gray-500 text-sm">选择一位客户查看详情</p>
      </div>
    );
  }

  const marketingCopy = generateMarketingCopy(customer, storeName, storePhone);

  const handleCopy = async () => {
    const success = await copyToClipboard(marketingCopy);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue':
        return 'text-red-600';
      case 'critical':
        return 'text-amber-600';
      default:
        return 'text-emerald-600';
    }
  };

  const getDaysUntil = () => {
    if (!customer.predictedDate) return '--';
    const days = Math.ceil(
      (new Date(customer.predictedDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    if (days < 0) return '已逾期';
    if (days === 0) return '今天';
    return `${days} 天`;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 客户基本信息 */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center">
            <Car className="text-blue-600" size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {customer.licensePlate}
            </h2>
            <p className="text-xs text-gray-500">{customer.carModel || '未设置车型'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-md">
            <User size={14} className="text-gray-400" />
            <div>
              <p className="text-[10px] text-gray-400">客户姓名</p>
              <p className="text-sm font-medium text-gray-800">{customer.customerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-md">
            <Phone size={14} className="text-gray-400" />
            <div>
              <p className="text-[10px] text-gray-400">联系电话</p>
              <p className="text-sm font-medium text-gray-800">
                {customer.phone || '未设置'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 预测数据看板 */}
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-xs font-medium text-gray-500 mb-3">预测数据</h3>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 bg-blue-50 rounded-md text-center">
            <Gauge size={16} className="text-blue-600 mx-auto mb-1.5" />
            <p className="text-lg font-semibold text-gray-900">
              {Math.round(customer.realtimeMileage).toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-500">当前里程</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-md text-center">
            <TrendingUp size={16} className="text-emerald-600 mx-auto mb-1.5" />
            <p className="text-lg font-semibold text-gray-900">
              {customer.dailyMileage}
            </p>
            <p className="text-[10px] text-gray-500">日均里程</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-md text-center">
            <Calendar size={16} className="text-purple-600 mx-auto mb-1.5" />
            <p className={`text-lg font-semibold ${getStatusColor(customer.status)}`}>
              {getDaysUntil()}
            </p>
            <p className="text-[10px] text-gray-500">预计到店</p>
          </div>
        </div>

        <div className="mt-3 p-2.5 bg-gray-50 rounded-md flex justify-between items-center">
          <span className="text-xs text-gray-500">下次保养里程</span>
          <span className="text-sm font-semibold text-gray-900">
            {customer.nextMaintenanceMileage.toLocaleString()} km
          </span>
        </div>
      </div>

      {/* 营销话术 */}
      <div className="flex-1 p-5 flex flex-col">
        <h3 className="text-xs font-medium text-gray-500 mb-3">营销话术</h3>
        <div className="flex-1 p-3 bg-gray-50 rounded-md border border-gray-100">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {marketingCopy}
          </p>
        </div>

        <button
          onClick={handleCopy}
          className={`mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium text-sm transition-colors ${
            copied
              ? 'bg-emerald-500 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {copied ? (
            <>
              <Check size={16} />
              已复制
            </>
          ) : (
            <>
              <Copy size={16} />
              一键复制话术
            </>
          )}
        </button>
      </div>

      {/* 历史记录 */}
      {customer.history && customer.history.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 mb-2">
            <History size={12} />
            历史记录
          </div>
          <div className="space-y-1">
            {customer.history.slice(-3).reverse().map((record, index) => (
              <div
                key={index}
                className="text-xs text-gray-500 flex justify-between"
              >
                <span>{record.lastDate}</span>
                <span className="font-medium">{record.mileage.toLocaleString()} km</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
