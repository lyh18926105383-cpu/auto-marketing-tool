// 从 lucide-react 引入状态图标：警告三角、勾选圆、时钟、信息
import { AlertTriangle, CheckCircle, Clock, Info } from 'lucide-react';

// 客户列表组件：接收客户数据、选中客户、选择回调、搜索关键字、搜索回调作为props
const CustomerList = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  searchTerm,
  onSearchChange
}) => {
  // 根据客户状态返回对应的状态图标（逾期-警告三角、临界-时钟、正常-勾选）
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

  // 根据客户状态返回对应的背景色和文字颜色组合
  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-50 text-red-600'; // 逾期：红底红字
      case 'critical':
        return 'bg-yellow-50 text-yellow-600'; // 临界：黄底黄字
      default:
        return 'bg-green-50 text-green-600'; // 正常：绿底绿字
    }
  };

  // 根据客户状态返回对应的中文文字标签
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

  // 根据搜索关键字过滤客户列表（匹配车牌号或客户姓名，不区分大小写）
  const filteredCustomers = customers.filter((customer) => {
    const search = searchTerm.toLowerCase();
    return (
      customer.licensePlate.toLowerCase().includes(search) ||
      customer.customerName.toLowerCase().includes(search)
    );
  });

  // 统计处于临界或逾期状态的客户数量
  const criticalCount = filteredCustomers.filter(
    (c) => c.status === 'critical' || c.status === 'overdue'
  ).length;

  return (
    // 整体采用纵向布局，白色背景，圆角12px，轻微阴影，溢出隐藏
    <div className="flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden customer-list-container min-h-[400px] mt-1.25 mb-1.25">
      {/* ======= 搜索框区域 ======= */}
      <div className="p-2.5 border-b border-gray-100 h-[50px]">
        <div className="relative">
          {/* 搜索输入框：全宽，内边距左右16px上下12px，圆角8px，获得焦点时显示蓝色光环 */}
          <input
            type="text"
            id="searchInput"
            name="searchInput"
            placeholder="搜索车牌或姓名..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-1.5 pr-1.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all h-[30px]"
          />
        </div>
      </div>

      {/* ======= 客户列表区域 ======= */}
      {/* 可滚动区域，最大高度为视口高度减去320px，保证底部统计栏始终可见 */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-320px)]">
        {/* 无客户数据时的空状态提示 */}
        {filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Info size={32} className="mb-3" />
            <p className="text-sm">{searchTerm ? '未找到匹配的客户' : '暂无客户数据'}</p>
          </div>
        ) : (
          // 有客户数据时，渲染客户列表，每行之间用浅灰线分隔
          <div className="divide-y divide-gray-100">
            {filteredCustomers.map((customer) => (
              // 每行客户记录：点击可选中，间距用padding控制
              <div
                key={customer.licensePlate}
                onClick={() => onSelectCustomer(customer)}
                className={`px-6 py-2.5 cursor-pointer transition-colors ${
                  selectedCustomer?.licensePlate === customer.licensePlate
                    ? 'bg-blue-50' // 选中项：浅蓝背景
                    : 'hover:bg-gray-50' // 悬停项：浅灰背景
                }`}
              >
                {/* 四列网格布局：车牌、姓名、里程、状态标签 */}
                <div className="grid grid-cols-4 items-center text-sm gap-4">
                  <span className="font-medium text-gray-900 truncate">{customer.licensePlate}</span>
                  <span className="text-gray-500 truncate">{customer.customerName}</span>
                  <span className="text-gray-400 truncate">
                    {Math.round(customer.realtimeMileage).toLocaleString()} km
                  </span>
                  <div className="flex justify-end">
                    {/* 状态标签：根据状态显示不同颜色，包含图标和文字 */}
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

      {/* ======= 底部统计栏 ======= */}
      {/* 左右分布布局，浅灰背景，底部分别设置圆角（与外层卡片衔接） */}
      <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 text-sm text-gray-500 flex justify-between items-center rounded-b-xl h-[22px]">
        <span className="pl-2.5 pr-2.5 w-auto text-[13px]">共 {filteredCustomers.length} 位客户</span>
        {/* 待跟进数量：根据criticalCount是否为0显示不同颜色和文字 */}
        <span className={criticalCount > 0 ? 'text-yellow-600 font-medium ml-3.75 mr-3.75 pl-2.5 pr-2.5' : 'text-green-600 font-medium ml-3.75 mr-3.75 pl-2.5 pr-2.5'}>
          {criticalCount > 0 ? `${criticalCount} 位待跟进` : '全部正常'}
        </span>
      </div>
    </div>
  );
};

export default CustomerList;