// 引入 React 的 useState Hook，用于管理复制按钮的选中状态
import { useState } from 'react';
// 从 lucide-react 引入所需图标：复制、勾选、车辆、电话、用户、日历、仪表盘、趋势上升、历史记录
import { Copy, Check, Car, Phone, User, Calendar, Gauge, TrendingUp, History } from 'lucide-react';
// 从营销工具模块引入：生成营销话术、复制到剪贴板
import { generateMarketingCopy, copyToClipboard } from '../utils/marketing';

// 客户详情组件：接收选中客户数据、门店名称、门店电话作为props
const CustomerDetail = ({ customer, storeName, storePhone }) => {
  // copied 状态用于控制复制成功后的按钮文字反馈
  const [copied, setCopied] = useState(false);

  // 如果当前没有选中任何客户，显示空状态占位图
  if (!customer) {
    return (
      // 采用纵向居中布局，白色卡片，圆角12px，轻微阴影，高度自适应
      <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-gray-100 shadow-sm text-gray-400 customer-detail-empty min-h-[200px]">
        {/* 显示车辆图标，尺寸32px，底部间距12px */}
        <Car size={32} className="mb-3" />
        {/* 提示文字，让用户选择一位客户 */}
        <p className="text-sm text-gray-500">选择一位客户查看详情</p>
      </div>
    );
  }

  // 根据选中客户数据、门店信息生成个性化营销话术
  const marketingCopy = generateMarketingCopy(customer, storeName, storePhone);

  // 处理复制按钮点击：将话术复制到系统剪贴板
  const handleCopy = async () => {
    // 调用剪贴板工具函数，传入话术文本
    const success = await copyToClipboard(marketingCopy);
    if (success) {
      // 复制成功后更新状态为已复制
      setCopied(true);
      // 2秒后自动恢复为未复制状态
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 根据客户状态返回对应的文字颜色（逾期-红、临界-黄、正常-绿）
  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue':
        return 'text-red-600'; // 已逾期状态显示红色
      case 'critical':
        return 'text-yellow-600'; // 临界状态显示黄色
      default:
        return 'text-green-600'; // 正常状态显示绿色
    }
  };

  // 计算距离预计到店日期的天数
  const getDaysUntil = () => {
    // 如果没有预测日期，显示占位符"--"
    if (!customer.predictedDate) return '--';
    // 计算预测日期与今天之间的天数差
    const days = Math.ceil(
      (new Date(customer.predictedDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    // 天数小于0表示已逾期
    if (days < 0) return '已逾期';
    // 天数为0表示今天
    if (days === 0) return '今天';
    // 否则返回具体天数
    return `${days} 天`;
  };

  return (
    // 采用纵向布局，每个子模块之间间距12px，紧凑布局
    <div className="flex flex-col gap-3 overflow-y-auto">
      {/* ======= 模块1：客户基本信息卡片 ======= */}
      <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm h-[180px]">
        {/* 顶部区域：车辆图标 + 车牌号 + 车型，水平排列，间距12px */}
        <div className="flex items-center gap-3 mb-3">
          {/* 车辆图标容器：蓝色背景，圆角8px，宽高40px，水平垂直居中 */}
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Car className="text-white" size={16} />
          </div>
          <div>
            {/* 车牌号：一级标题，16px，黑色，加粗 */}
            <h2 className="text-base font-semibold text-gray-900">
              {customer.licensePlate}
            </h2>
            {/* 车型：二级文字，灰色，如果未设置则显示"未设置车型" */}
            <p className="text-xs text-gray-500">{customer.carModel || '未设置车型'}</p>
          </div>
        </div>

        {/* 下方网格布局：2列，间距12px，用于展示客户姓名和电话 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 客户姓名：灰色背景卡片，圆角8px，左侧图标 + 右侧文字信息 */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg h-[80px]">
            <User size={12} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">客户姓名</p>
              <p className="text-sm font-medium text-gray-800">{customer.customerName}</p>
            </div>
          </div>
          {/* 联系电话：结构同上 */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg h-[80px]">
            <Phone size={12} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">联系电话</p>
              <p className="text-sm font-medium text-gray-800">
                {customer.phone || '未设置'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======= 模块2：预测数据看板卡片 ======= */}
      <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* 标题：预测数据 */}
        <h3 className="text-xs font-medium text-gray-500 mb-3">预测数据</h3>
        {/* 三列网格布局，展示三个关键指标 */}
        <div className="grid grid-cols-3 gap-3">
          {/* 当前里程：蓝色背景卡片 */}
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <Gauge size={14} className="text-blue-500 mx-auto mb-1" />
            <p className="text-sm font-semibold text-gray-900">
              {Math.round(customer.realtimeMileage).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">当前里程</p>
          </div>
          {/* 日均里程：绿色背景卡片 */}
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <TrendingUp size={14} className="text-green-500 mx-auto mb-1" />
            <p className="text-sm font-semibold text-gray-900">
              {customer.dailyMileage}
            </p>
            <p className="text-xs text-gray-500">日均里程</p>
          </div>
          {/* 预计到店：紫色背景卡片，文字颜色根据状态变化 */}
          <div className="p-3 bg-purple-50 rounded-lg text-center">
            <Calendar size={14} className="text-purple-500 mx-auto mb-1" />
            <p className={`text-sm font-semibold ${getStatusColor(customer.status)}`}>
              {getDaysUntil()}
            </p>
            <p className="text-xs text-gray-500">预计到店</p>
          </div>
        </div>

        {/* 下方展示下次保养里程：灰色背景卡片 */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
          <span className="text-xs text-gray-500">下次保养里程</span>
          <span className="text-sm font-medium text-gray-900">
            {customer.nextMaintenanceMileage.toLocaleString()} km
          </span>
        </div>
      </div>

      {/* ======= 模块3：营销话术卡片 ======= */}
      <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* 标题：营销话术 */}
        <h3 className="text-xs font-medium text-gray-500 mb-2">营销话术</h3>
        {/* 话术内容区：灰色背景，pre-wrap保留换行 */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
            {marketingCopy}
          </p>
        </div>

        {/* 复制按钮：宽度100%，蓝色背景，悬停加深，圆角8px */}
        <button
          onClick={handleCopy}
          className={`w-full mt-3 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-medium transition-colors ${
            copied
              ? 'bg-green-500 text-white' // 复制成功显示绿色
              : 'bg-blue-500 hover:bg-blue-600 text-white' // 默认蓝色，悬停加深
          }`}
        >
          {/* 根据copied状态显示不同内容：勾选图标+已复制 或 复制图标+一键复制话术 */}
          {copied ? (
            <>
              <Check size={12} />
              已复制
            </>
          ) : (
            <>
              <Copy size={12} />
              一键复制话术
            </>
          )}
        </button>
      </div>

      {/* ======= 模块4：历史记录卡片（仅当有历史记录时显示） ======= */}
      {customer.history && customer.history.length > 0 && (
        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
          {/* 小标题 + 历史图标 */}
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
            <History size={10} />
            历史记录
          </div>
          {/* 纵向列表，每条记录间距6px */}
          <div className="space-y-1.5">
            {/* 只显示最近3条记录，且倒序显示（最新的在最上面） */}
            {customer.history.slice(-3).reverse().map((record, index) => (
              <div
                key={index}
                className="text-xs text-gray-600 flex justify-between p-2 bg-gray-50 rounded-lg"
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