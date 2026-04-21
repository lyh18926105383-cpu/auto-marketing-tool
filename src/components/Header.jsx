import { useState, useRef } from 'react';
import { UploadOutlined, DownloadOutlined, SettingOutlined, DeleteOutlined, ToolOutlined } from '@ant-design/icons';
import { Modal, Input } from 'antd';

const Header = ({ storeName, storePhone, onStoreNameChange, onStorePhoneChange, onImport, onDownloadTemplate, onClearAll }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [localName, setLocalName] = useState(storeName);
  const [localPhone, setLocalPhone] = useState(storePhone);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  const handleSaveSettings = () => {
    onStoreNameChange(localName);
    onStorePhoneChange(localPhone);
    setShowSettings(false);
  };

  const handleClearAll = () => {
    setShowClearConfirm(false);
    onClearAll();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-10 py-5 flex items-center justify-between sticky top-0 z-50 h-[90px]">
      <div className="flex items-center gap-3">
        <div className="w-[50px] h-[50px] bg-blue-500 rounded-lg flex items-center justify-center ml-5 mr-5 pb-0 mb-2.5">
          <ToolOutlined />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900 leading-tight h-[50px] w-[200px] mt-2.5 mb-2.5 pt-3.75 pb-2.5 text-[30px] ml-[-20px] text-left">汽修智能营销</h1>
          <p className="text-xs text-gray-500 mt-0.75 mb-0.75 ml-[-20px] text-[13px]">{storeName}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onDownloadTemplate}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <DownloadOutlined />
          <span>模板</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          <UploadOutlined />
          <span>导入</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          id="excel-upload"
          name="excel-upload"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <DeleteOutlined />
          <span>清空</span>
        </button>

        <button
          onClick={() => {
            setLocalName(storeName);
            setLocalPhone(storePhone);
            setShowSettings(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <SettingOutlined />
          <span>设置</span>
        </button>
      </div>

      {/* 清空确认弹窗 */}
      <Modal
        title="确认清空"
        open={showClearConfirm}
        onCancel={() => setShowClearConfirm(false)}
        onOk={handleClearAll}
        okText="确认清空"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <p className="text-sm text-gray-600">
          确定要清空所有客户数据吗？此操作将删除所有客户信息，且无法恢复。
        </p>
      </Modal>

      {showSettings && (
        <Modal
          title="门店设置"
          open={showSettings}
          onCancel={() => setShowSettings(false)}
          footer={null}
        >
          <div className="py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                门店名称
              </label>
              <Input
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="请输入门店名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                门店电话
              </label>
              <Input
                value={localPhone}
                onChange={(e) => setLocalPhone(e.target.value)}
                placeholder="请输入门店电话"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </Modal>
      )}
    </header>
  );
};

export default Header;
