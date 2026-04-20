// 默认日均里程
const DEFAULT_DAILY_MILEAGE = 40;

// 计算日均里程
export const calculateDailyMileage = (currentMileage, currentDate, lastMileage, lastDate) => {
  if (!lastMileage || !lastDate || currentMileage <= lastMileage) {
    return DEFAULT_DAILY_MILEAGE;
  }

  const daysDiff = Math.max(1, Math.floor((new Date(currentDate) - new Date(lastDate)) / (1000 * 60 * 60 * 24)));
  const mileageDiff = currentMileage - lastMileage;

  if (daysDiff <= 0 || mileageDiff <= 0) {
    return DEFAULT_DAILY_MILEAGE;
  }

  const dailyMileage = mileageDiff / daysDiff;

  // 合理范围检查: 1-500 km/天
  if (dailyMileage < 1 || dailyMileage > 500) {
    return DEFAULT_DAILY_MILEAGE;
  }

  return Math.round(dailyMileage * 10) / 10;
};

// 计算下次保养里程
export const calculateNextMaintenanceMileage = (currentMileage) => {
  const currentBase = Math.ceil(currentMileage / 5000) * 5000;

  // 如果当前里程已经超过或接近保养点，加 5000
  if (currentMileage >= currentBase - 500) {
    return currentBase + 5000;
  }

  return currentBase;
};

// 计算预测到店日期
export const calculatePredictedDate = (currentMileage, dailyMileage, nextMaintenanceMileage, currentDate) => {
  if (dailyMileage <= 0 || dailyMileage === DEFAULT_DAILY_MILEAGE) {
    // 使用默认预测: 30天后
    const predicted = new Date(currentDate);
    predicted.setDate(predicted.getDate() + 30);
    return predicted.toISOString().split('T')[0];
  }

  const mileageToNext = nextMaintenanceMileage - currentMileage;
  if (mileageToNext <= 0) {
    return new Date().toISOString().split('T')[0]; // 今天
  }

  const daysToNext = Math.ceil(mileageToNext / dailyMileage);
  const predicted = new Date(currentDate);
  predicted.setDate(predicted.getDate() + daysToNext);

  return predicted.toISOString().split('T')[0];
};

// 计算实时预测里程
export const calculateRealtimeMileage = (mileage, lastDate, dailyMileage) => {
  if (!lastDate) return mileage;

  const daysSince = Math.floor((new Date() - new Date(lastDate)) / (1000 * 60 * 60 * 24));
  if (daysSince <= 0) return mileage;

  const additionalMileage = daysSince * dailyMileage;
  return Math.round((mileage + additionalMileage) * 10) / 10;
};

// 获取状态
export const getStatus = (predictedDate, currentMileage, nextMaintenanceMileage) => {
  // 逾期: 预测里程已超过保养点
  if (currentMileage >= nextMaintenanceMileage) {
    return 'overdue';
  }

  if (!predictedDate) return 'normal';

  const daysUntil = Math.ceil((new Date(predictedDate) - new Date()) / (1000 * 60 * 60 * 24));

  // 临界: 15天内
  if (daysUntil <= 15) {
    return 'critical';
  }

  return 'normal';
};

// 获取状态文本
export const getStatusText = (status) => {
  switch (status) {
    case 'overdue':
      return '逾期';
    case 'critical':
      return '临界';
    default:
      return '正常';
  }
};

// 处理客户数据并添加预测信息
export const processCustomerData = (customer) => {
  const currentDate = new Date().toISOString().split('T')[0];

  // 获取上次记录
  const lastRecord = customer.history && customer.history.length > 0
    ? customer.history[customer.history.length - 1]
    : null;

  const lastMileage = lastRecord?.mileage || null;
  const lastDate = lastRecord?.lastDate || null;

  // 计算日均里程
  const dailyMileage = calculateDailyMileage(
    customer.mileage,
    customer.lastDate,
    lastMileage,
    lastDate
  );

  // 计算下次保养里程
  const nextMaintenanceMileage = calculateNextMaintenanceMileage(customer.mileage);

  // 计算预测到店日期
  const predictedDate = calculatePredictedDate(
    customer.mileage,
    dailyMileage,
    nextMaintenanceMileage,
    customer.lastDate
  );

  // 计算实时预测里程
  const realtimeMileage = calculateRealtimeMileage(
    customer.mileage,
    customer.lastDate,
    dailyMileage
  );

  // 获取状态
  const status = getStatus(predictedDate, realtimeMileage, nextMaintenanceMileage);

  return {
    ...customer,
    dailyMileage,
    nextMaintenanceMileage,
    predictedDate,
    realtimeMileage,
    status
  };
};
