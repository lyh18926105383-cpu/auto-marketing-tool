import { useState } from 'react';
import { Copy, Check, Car, Phone, User, Calendar, Gauge, TrendingUp, History } from 'lucide-react';
import { generateMarketingCopy, copyToClipboard } from '../utils/marketing';

const CustomerDetail = ({ customer, storeName, storePhone }) => {
  const [copied, setCopied] = useState(false);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center bg-white rounded-lg border border-gray-200 text-gray-400 h-64">
        <Car size={32} className="mb-3" />
        <p className="text-sm text-gray-500">选择一位客户查看详情</p>
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
        return 'text-yellow-600';
      default:
        return 'text-green-600';
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
    <div className="flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 客户基本信息 */}
      <div className="p-8 border-b border-gray-100">
        <div className="flex items-center gap-5 mb-5">
          <div className="w-14 h-14 bg-blue-500 rounded-lg flex items-center justify-center">
            <Car className="text-white" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {customer.licensePlate}
            </h2>
            <p className="text-sm text-gray-500">{customer.carModel || '未设置车型'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-lg">
            <User size={15} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">客户姓名</p>
              <p className="text-base font-medium text-gray-800">{customer.customerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-lg">
            <Phone size={15} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">联系电话</p>
              <p className="text-base font-medium text-gray-800">
                {customer.phone || '未设置'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 预测数据看板 */}
      <div className="p-8 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-sm font-medium text-gray-500 mb-5">预测数据</h3>
        <div className="grid grid-cols-3 gap-5">
          <div className="p-5 bg-blue-50 rounded-lg text-center">
            <Gauge size={18} className="text-blue-500 mx-auto mb-2" />
            <p className="text-lg font-semibold text-gray-900">
              {Math.round(customer.realtimeMileage).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">当前里程</p>
          </div>
          <div className="p-5 bg-green-50 rounded-lg text-center">
            <TrendingUp size={18} className="text-green-500 mx-auto mb-2" />
            <p className="text-lg font-semibold text-gray-900">
              {customer.dailyMileage}
            </p>
            <p className="text-xs text-gray-500 mt-1">日均里程</p>
          </div>
          <div className="p-5 bg-purple-50 rounded-lg text-center">
            <Calendar size={18} className="text-purple-500 mx-auto mb-2" />
            <p className={`text-lg font-semibold ${getStatusColor(customer.status)}`}>
              {getDaysUntil()}
            </p>
            <p className="text-xs text-gray-500 mt-1">预计到店</p>
          </div>
        </div>

        <div className="mt-5 p-4 bg-white rounded-lg flex justify-between items-center">
          <span className="text-sm text-gray-500">下次保养里程</span>
          <span className="text-base font-medium text-gray-900">
            {customer.nextMaintenanceMileage.toLocaleString()} km
          </span>
        </div>
      </div>

      {/* 营销话术 */}
      <div className="p-8">
        <h3 className="text-sm font-medium text-gray-500 mb-4">营销话术</h3>
        <div className="p-5 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {marketingCopy}
          </p>
        </div>

        <button
          onClick={handleCopy}
          className={`w-full mt-5 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
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
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-3">
            <History size={12} />
            历史记录
          </div>
          <div className="space-y-2">
            {customer.history.slice(-3).reverse().map((record, index) => (
              <div
                key={index}
                className="text-sm text-gray-600 flex justify-between p-3 bg-white rounded-lg"
              >
                <span className="text-gray-400">{record.lastDate}</span>
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
