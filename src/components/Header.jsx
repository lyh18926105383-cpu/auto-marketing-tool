import { useState, useRef } from 'react';
import { Upload, Download, Settings, X, Truck } from 'lucide-react';

const Header = ({ storeName, storePhone, onStoreNameChange, onStorePhoneChange, onImport, onDownloadTemplate }) => {
  const [showSettings, setShowSettings] = useState(false);
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

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
          <Truck className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-900 leading-tight">汽修智能营销</h1>
          <p className="text-xs text-gray-500">{storeName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onDownloadTemplate}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Download size={16} />
          <span>模板</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Upload size={16} />
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
          onClick={() => {
            setLocalName(storeName);
            setLocalPhone(storePhone);
            setShowSettings(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings size={16} />
          <span>设置</span>
        </button>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">门店设置</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 rounded-md"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  门店名称
                </label>
                <input
                  type="text"
                  id="storeName"
                  name="storeName"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  门店电话
                </label>
                <input
                  type="tel"
                  id="storePhone"
                  name="storePhone"
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
