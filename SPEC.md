# 汽修智能营销预测工具 (MVP) 规范文档

## 1. 项目概述

- **项目名称**: 汽修门店智能营销工具
- **项目类型**: Web 应用 (SPA)
- **核心功能**: 通过 Excel 导入客户车辆数据，计算日均里程，预测下次保养时间，生成营销话术
- **目标用户**: 汽修门店工作人员

## 2. 技术栈

- **框架**: React 18 + Vite
- **样式**: Tailwind CSS
- **存储**: IndexedDB (使用 dexie.js)
- **Excel 处理**: xlsx 库
- **图标**: Lucide React

## 3. UI/UX 规范

### 3.1 布局结构

- **顶部栏**: 高度 64px，包含门店设置和操作按钮
- **主体区域**: 左右两栏布局
  - 左侧列表: 40% 宽度，客户搜索 + 列表
  - 右侧详情: 60% 宽度，客户详情和话术生成

### 3.2 配色方案

- **主色**: #1e3a5f (深蓝色)
- **次色**: #3b82f6 (蓝色)
- **背景**: #f8fafc (浅灰白)
- **卡片背景**: #ffffff
- **文字主色**: #1e293b
- **文字次色**: #64748b
- **状态颜色**:
  - 正常: #22c55e (绿色)
  - 临界: #f59e0b (橙色)
  - 逾期: #ef4444 (红色)

### 3.3 字体

- **主字体**: "Inter", -apple-system, BlinkMacSystemFont, sans-serif
- **标题**: 24px / 20px / 16px (粗体)
- **正文**: 14px (常规)
- **小字**: 12px

## 4. 功能规范

### 4.1 门店设置

- 门店名称输入框 (默认: "智慧汽修")
- 门店电话输入框 (默认: "")
- 设置持久化到 localStorage

### 4.2 Excel 导入

- 支持 .xlsx 和 .csv 格式
- 必需字段: 客户姓名、手机号、车牌号、车型、本次里程、本次日期
- 字段名映射 (不区分大小写):
  - 姓名/name/客户名 → customerName
  - 手机/电话/手机号 → phone
  - 车牌/车牌号 → licensePlate
  - 车型/车辆型号 → carModel
  - 里程/本次里程 → mileage
  - 日期/本次日期/上次进店日期 → lastDate
- 重复车牌处理: 原有数据移到 history，新数据作为当前记录

### 4.3 日均里程算法

```
D = (当前日期 - 上次日期) / (当前里程 - 上次里程)
默认 D = 40 km/天 (首次导入或无历史)
```

### 4.4 预测算法

```
下次保养里程 T = ceil(当前里程 / 5000) * 5000
(若已超过保养点，加 5000)

预测到店日期 P = 当前日期 + (T - 当前里程) / D
```

### 4.5 客户列表

- 显示: 车牌、车型、预测里程、状态色块
- 搜索: 按车牌或姓名搜索
- 状态分类:
  - 正常: 距保养日期 > 15 天
  - 临界: ≤ 15 天
  - 逾期: 预测里程已超过保养点

### 4.6 营销话术

模板:
```
【{门店名称}】尊敬的{姓名}：您的爱车{车牌}预测里程已达{预测里程}km，接近{下次保养里程}km保养点。为了您的行车安全，建议近期进店检查。回复本条微信可预约，详询{门店电话}。
```

- 一键复制功能
- 复制成功提示

## 5. 数据模型

### Customer 表

```typescript
interface Customer {
  id: string;
  customerName: string;
  phone: string;
  licensePlate: string;
  carModel: string;
  mileage: number;
  lastDate: string; // ISO 日期
  dailyMileage: number; // 日均里程
  nextMaintenanceMileage: number; // 下次保养里程
  predictedDate: string; // 预测到店日期
  history: HistoryRecord[];
  createdAt: string;
  updatedAt: string;
}

interface HistoryRecord {
  mileage: number;
  lastDate: string;
}
```

## 6. 验收标准

- [ ] 可以设置和保存门店名称、电话
- [ ] 可以下载 Excel 模板
- [ ] 可以导入 Excel 文件，正确处理重复车牌
- [ ] 列表正确显示客户信息和状态
- [ ] 搜索功能正常工作
- [ ] 点击客户显示详细预测信息
- [ ] 话术正确生成并可复制
- [ ] 刷新页面数据持久化
