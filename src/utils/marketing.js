// 生成营销话术
export const generateMarketingCopy = (customer, storeName, storePhone) => {
  const { customerName, licensePlate, realtimeMileage, nextMaintenanceMileage } = customer;

  const phoneText = storePhone ? `详询${storePhone}` : '详询门店';

  const copy = `【${storeName}】尊敬的${customerName}：您的爱车${licensePlate}预测里程已达${Math.round(realtimeMileage)}km，接近${nextMaintenanceMileage}km保养点。为了您的行车安全，建议近期进店检查。回复本条微信可预约，${phoneText}。`;

  return copy;
};

// 复制到剪贴板
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (e) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};
