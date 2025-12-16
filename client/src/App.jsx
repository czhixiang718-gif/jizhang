import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { 
  LayoutDashboard, Database, LogOut, User, Calendar, DollarSign, AlertTriangle, CheckCircle, Plus, Trash2, Search, History, X, TrendingUp, Settings, Lock, Key, ShieldCheck, Sparkles, MessageSquare, FileText, Loader2, Building2, Receipt, ChevronDown, ChevronRight, FolderOpen, Wallet, Phone, JapaneseYen, Download, Upload, Printer, FileSpreadsheet, Save, Clock, RotateCcw, ToggleLeft, ToggleRight, AlertCircle, Camera, List, Sigma, Minus, ZoomIn, ZoomOut, File, AlignJustify, Wand2
} from 'lucide-react';

// ==========================================
// 1. 系统配置与工具函数
// ==========================================

// ⚠️ 核心开关：生产环境设为 false 以连接真实数据库
const USE_MOCK_DATA = false; 

const API_BASE_URL = "/api";
const apiKey = ""; 

const callDoubaoAI = async (prompt) => {
  const url = `${API_BASE_URL}/ai/generate`;
  const apiKey = localStorage.getItem('doubao_api_key') || "";
  const endpointId = localStorage.getItem('doubao_endpoint_id') || "";
  const payload = { prompt, apiKey, endpointId };

  const maxRetries = 3;
  const delays = [1000, 2000, 4000];

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      return data.text || "AI 暂时无法响应，请稍后再试。";
    } catch (error) {
      if (i === maxRetries - 1) return `连接 AI 服务失败: ${error.message}`;
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
  return "AI 连接超时";
};

// 保持原函数名以兼容现有调用，但内部改为调用 callDoubaoAI
const callGeminiAI = callDoubaoAI;

// --- 初始模拟数据 (仅当 USE_MOCK_DATA = true 或 后端断连时作为兜底显示) ---
const INITIAL_DATA = []; // 真实环境初始为空，等待加载

// 本地内存数据库 (用于演示模式)
let mockDB = [
  { 
    id: 1, 
    name: "演示项目：智慧城市一期", 
    entity: "某市大数据局", 
    invoiceInfo: "税号: 1234567890ABCDEF", 
    signDate: "2023-01-15", 
    paymentDate: "2023-06-30", 
    manager: "张伟", 
    contact: "13800138000", 
    amount: 500, 
    collected: 500, 
    status: "已完成",
    payments: [
      { id: 101, date: "2023-02-01", amount: 200 },
      { id: 102, date: "2023-04-15", amount: 300 }
    ]
  }
];

// ==========================================
// 2. 组件定义 (全部前置，防止引用错误)
// ==========================================

function PaymentDetailsCell({ payments }) {
  if (!payments || payments.length === 0) {
    return <span className="text-slate-400 text-xs italic">暂无回款</span>;
  }
  return (
    <div className="text-xs text-slate-600">
      <div className="font-bold text-slate-700 mb-1 flex items-center">
        <List className="w-3 h-3 mr-1" /> 共 {payments.length} 笔
      </div>
      <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
        {payments.map((p, idx) => (
          <div key={idx} className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
            <div className="text-slate-500 text-[10px] mb-0.5 flex items-center"><Clock className="w-3 h-3 mr-1 inline"/>{p.date}</div>
            <div className="font-medium text-blue-600">¥{p.amount} 万</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status, paymentDate, amount, collected }) {
  const isOverdue = new Date(paymentDate) < new Date() && collected < amount;
  if (isOverdue) return (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse"><AlertTriangle className="w-3 h-3 mr-1" /> 严重逾期</span>);
  if (collected >= amount) return (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> 已结清</span>);
  return (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">进行中</span>);
}

function LoginPage({ onLogin, credentials, onResetPassword }) {
  const [view, setView] = useState('login'); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [newPass, setNewPass] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === credentials.username && password === credentials.password) {
      onLogin();
    } else {
      setError('用户名或密码错误');
    }
  };

  const handleReset = (e) => {
    e.preventDefault();
    if (secretKey === (credentials.secretKey || 'root')) {
      onResetPassword(newPass);
      alert('密码重置成功！请使用新密码登录。');
      setView('login'); setPassword(''); setSecretKey(''); setNewPass(''); setError('');
    } else {
      setError('安全密钥错误');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md transition-all duration-300">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            {view === 'login' ? <Database className="text-white w-8 h-8" /> : <ShieldCheck className="text-white w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-bold text-slate-800">海南万企回款管理系统</h2>
          <p className="text-slate-500">{view === 'login' ? '管理员登录' : '找回管理员密码'}</p>
        </div>
        
        {view === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">用户名</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入用户名"/></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">密码</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入密码"/></div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition duration-200">立即登录</button>
            <div className="flex justify-end items-center text-sm mt-4"><button type="button" onClick={() => {setView('forgot'); setError('');}} className="text-blue-600 hover:underline">忘记密码?</button></div>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
             <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-700 mb-4">请输入系统预设的安全密钥来验证身份。</div>
             <div><label className="block text-sm font-medium text-slate-700 mb-1">安全密钥 (Key)</label><input type="text" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="测试请输入: root"/></div>
             <div><label className="block text-sm font-medium text-slate-700 mb-1">设置新密码</label><input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入新密码" required minLength={6}/></div>
             {error && <p className="text-red-500 text-sm text-center">{error}</p>}
             <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition duration-200">重置密码</button>
             <div className="text-center mt-4"><button type="button" onClick={() => {setView('login'); setError('');}} className="text-slate-500 hover:text-slate-800 text-sm">返回登录</button></div>
          </form>
        )}
      </div>
    </div>
  );
}

function AccountSettingsModal({ isOpen, onClose, credentials, onUpdateCredentials }) {
  const [formData, setFormData] = useState({ oldPassword: '', newUsername: credentials.username, newPassword: '', newSecretKey: credentials.secretKey || 'root' });
  const [aiConfig, setAiConfig] = useState({ 
    apiKey: localStorage.getItem('doubao_api_key') || '', 
    endpointId: localStorage.getItem('doubao_endpoint_id') || '' 
  });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('account'); // 'account' or 'ai'

  useEffect(() => {
    if (isOpen) {
      setFormData({ oldPassword: '', newUsername: credentials.username, newPassword: '', newSecretKey: credentials.secretKey || 'root' });
    }
  }, [isOpen, credentials]);

  if (!isOpen) return null;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'account') {
      if (formData.oldPassword !== credentials.password) { setError('旧密码错误'); return; }
      if (formData.newPassword && formData.newPassword.length < 6) { setError('新密码长度至少6位'); return; }
      onUpdateCredentials({ 
        username: formData.newUsername, 
        password: formData.newPassword || credentials.password,
        secretKey: formData.newSecretKey || credentials.secretKey
      });
      alert('账号更新成功！'); 
      onClose(); 
      setFormData({ oldPassword: '', newUsername: credentials.username, newPassword: '', newSecretKey: credentials.secretKey }); 
    } else {
      localStorage.setItem('doubao_api_key', aiConfig.apiKey);
      localStorage.setItem('doubao_endpoint_id', aiConfig.endpointId);
      alert('AI 配置已保存！');
      onClose();
    }
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{zIndex: 9999}}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-slate-600" />设置
          </h3>
          <button onClick={onClose}><X className="w-6 h-6 text-slate-400" /></button>
        </div>
        
        <div className="flex border-b border-slate-100">
          <button 
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'account' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('account')}
          >
            账号安全
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'ai' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('ai')}
          >
            AI 配置 (豆包)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {activeTab === 'account' ? (
            <>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">当前密码</label><div className="relative"><input type="password" required value={formData.oldPassword} onChange={e => setFormData({...formData, oldPassword: e.target.value})} className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none"/><Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" /></div></div>
              <div className="border-t border-slate-100 my-4 pt-4"><p className="text-xs text-slate-500 mb-3">修改信息</p><div className="mb-4"><label className="block text-sm font-medium text-slate-700 mb-1">新用户名</label><div className="relative"><input type="text" value={formData.newUsername} onChange={e => setFormData({...formData, newUsername: e.target.value})} className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none"/><User className="w-4 h-4 text-slate-400 absolute left-3 top-3" /></div></div><div><label className="block text-sm font-medium text-slate-700 mb-1">新密码</label><div className="relative"><input type="password" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" placeholder="设置新密码"/><Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" /></div></div><div className="mt-4"><label className="block text-sm font-medium text-slate-700 mb-1">安全密钥 (用于找回密码)</label><div className="relative"><input type="text" value={formData.newSecretKey} onChange={e => setFormData({...formData, newSecretKey: e.target.value})} className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none" placeholder="默认为 root"/><ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" /></div></div></div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 leading-relaxed">
                本项目接入 <strong>豆包大模型 (Volcengine Ark)</strong>，国内可直接使用。
                <br/>请前往火山引擎控制台获取 API Key 和 Endpoint ID。
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                <input 
                  type="password" 
                  value={aiConfig.apiKey} 
                  onChange={e => setAiConfig({...aiConfig, apiKey: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="sk-..." 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Endpoint ID (推理接入点)</label>
                <input 
                  type="text" 
                  value={aiConfig.endpointId} 
                  onChange={e => setAiConfig({...aiConfig, endpointId: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="ep-2024..." 
                />
                <p className="text-xs text-slate-400 mt-1">例如: ep-20250215001234-abcde</p>
              </div>

              <div className="pt-2">
                <a 
                  href="https://console.volcengine.com/ark/region:ark+cn-beijing/endpoint" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  申请 API Key 与接入点
                </a>
              </div>
            </div>
          )}

           {error && <p className="text-red-500 text-sm">{error}</p>}
           <div className="flex justify-end pt-2"><button type="button" onClick={onClose} className="mr-3 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">取消</button><button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm">保存</button></div>
        </form>
      </div>
    </div>
  );
}

function ProjectModal({ project, isOpen, onClose, isEditing, onAddPayment, onDeletePayment }) {
  const [newPayment, setNewPayment] = useState({ amount: '', date: '' });
  const [aiResult, setAiResult] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState(null); 
  const [confirmingPaymentId, setConfirmingPaymentId] = useState(null);

  if (!isOpen || !project) return null;
  const remaining = (parseFloat(project.amount) - parseFloat(project.collected)).toFixed(2);
  const progress = project.amount > 0 ? Math.min(100, (project.collected / project.amount) * 100) : 0;

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (newPayment.amount && newPayment.date) {
      onAddPayment(project.id, { amount: parseFloat(newPayment.amount), date: newPayment.date });
      setNewPayment({ amount: '', date: '' });
    }
  };

  const generateCollectionEmail = async () => {
    setAiMode('email'); setIsAiLoading(true); setAiResult('');
    const overdue = parseFloat(project.amount) - parseFloat(project.collected);
    const prompt = `
      你是一名专业的项目经理。请帮我起草一份催款消息。
      项目：${project.name}，签约主体：${project.entity}
      负责人：${project.manager}，截止日期：${project.paymentDate}
      总额：${project.amount}万，已回：${project.collected}万，未回：${overdue.toFixed(2)}万。
      请生成委婉的微信通知和正式邮件。中文。
    `;
    const result = await callGeminiAI(prompt); setAiResult(result); setIsAiLoading(false);
  };

  const analyzeRisk = async () => {
    setAiMode('risk'); setIsAiLoading(true); setAiResult('');
    const prompt = `请分析资金回款风险：项目：${project.name}，客户：${project.entity}，签约日：${project.signDate}，约定回款：${project.paymentDate}，进度：${((project.collected / project.amount) * 100).toFixed(1)}%。请给出风险等级和建议。中文。`;
    const result = await callGeminiAI(prompt); setAiResult(result); setIsAiLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row max-h-[90vh]">
        {/* 左侧详情 */}
        <div className="flex-1 p-6 overflow-y-auto border-r border-slate-100">
          <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{project.name}</h3>
              <div className="flex items-center text-sm text-slate-500 mt-2 space-x-4">
                 <span className="flex items-center"><Building2 className="w-3.5 h-3.5 mr-1"/> {project.entity || '未录入主体'}</span>
                 <span className="flex items-center"><User className="w-3.5 h-3.5 mr-1"/> {project.manager}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm space-y-2">
               <div className="flex justify-between"><span className="text-slate-500">签约主体:</span><span className="font-medium text-slate-800">{project.entity || '-'}</span></div>
               <div className="flex justify-between items-start"><span className="text-slate-500 whitespace-nowrap mr-2">开票信息:</span><span className="font-medium text-slate-800 text-right break-all">{project.invoiceInfo || '-'}</span></div>
               <div className="flex justify-between pt-2 border-t border-slate-200 mt-2"><span className="text-slate-500">联系电话:</span><span className="text-slate-800">{project.contact}</span></div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-blue-50 rounded-lg"><p className="text-xs text-blue-600">总额 (万)</p><p className="text-lg font-bold text-slate-800">¥{project.amount}</p></div>
              <div className="p-3 bg-emerald-50 rounded-lg"><p className="text-xs text-emerald-600">已回 (万)</p><p className="text-lg font-bold text-emerald-600">¥{project.collected}</p></div>
              <div className="p-3 bg-red-50 rounded-lg"><p className="text-xs text-red-600">未收 (万)</p><p className={`text-lg font-bold ${remaining > 0 ? 'text-red-500' : 'text-green-500'}`}>¥{remaining}</p></div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">回款进度</span><span className="font-medium text-blue-600">{progress.toFixed(1)}%</span></div>
              <div className="w-full bg-slate-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 flex justify-between items-center"><span>回款记录</span><History className="w-4 h-4" /></div>
              <div className="max-h-48 overflow-y-auto">
                {project.payments.length === 0 ? <div className="p-4 text-center text-slate-400 text-sm">暂无回款记录</div> : 
                  <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-2">日期</th><th className="px-4 py-2 text-right">金额</th>{isEditing && <th className="px-4 py-2 text-center">操作</th>}</tr></thead>
                    <tbody className="divide-y divide-slate-100">{project.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2 text-slate-600">{p.date}</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-800">+{p.amount}</td>
                        {isEditing && (
                          <td className="px-4 py-2 text-center">
                            {confirmingPaymentId === p.id ? (
                              <div className="flex items-center justify-center space-x-1">
                                <button onClick={(e) => {e.stopPropagation(); onDeletePayment(project.id, p.id); setConfirmingPaymentId(null);}} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">确认</button>
                                <button onClick={(e) => {e.stopPropagation(); setConfirmingPaymentId(null);}} className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-slate-300">取消</button>
                              </div>
                            ) : (
                              <button onClick={(e) => {e.stopPropagation(); setConfirmingPaymentId(p.id);}} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition"><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}</tbody></table>}
              </div>
            </div>
            {isEditing && (<div className="bg-blue-50 p-4 rounded-lg border border-blue-100"><h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center"><Plus className="w-4 h-4 mr-1" /> 录入回款</h4><form onSubmit={handlePaymentSubmit} className="flex flex-col space-y-2"><input type="number" placeholder="金额 (万)" required min="0" step="0.01" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} className="px-3 py-1.5 text-sm border rounded" /><input type="date" required value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} className="px-3 py-1.5 text-sm border rounded" /><button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm">确认添加</button></form></div>)}
          </div>
        </div>

        {/* 右侧: AI */}
        <div className="w-full md:w-80 bg-indigo-50/50 p-6 flex flex-col border-l border-indigo-100">
           <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-indigo-900 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-indigo-600" />AI 智能助手</h3><button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button></div>
           <div className="space-y-3 mb-4">
             <p className="text-sm text-indigo-700 mb-2">智能决策支持：</p>
             <div className="grid grid-cols-2 gap-2">
               <button onClick={generateCollectionEmail} disabled={isAiLoading} className="flex items-center justify-center px-3 py-2 bg-white border border-indigo-200 rounded-lg shadow-sm hover:bg-indigo-50 text-sm text-indigo-800 font-medium disabled:opacity-50"><MessageSquare className="w-4 h-4 mr-2 text-indigo-500" />生成催款函</button>
               <button onClick={analyzeRisk} disabled={isAiLoading} className="flex items-center justify-center px-3 py-2 bg-white border border-indigo-200 rounded-lg shadow-sm hover:bg-indigo-50 text-sm text-indigo-800 font-medium disabled:opacity-50"><ShieldCheck className="w-4 h-4 mr-2 text-indigo-500" />风险评估</button>
             </div>
           </div>
           <div className="flex-1 bg-white rounded-xl border border-indigo-100 shadow-inner p-4 overflow-y-auto min-h-[300px]">
             {isAiLoading ? <div className="h-full flex flex-col items-center justify-center text-indigo-400"><Loader2 className="w-8 h-8 animate-spin mb-2" /><p className="text-sm">AI 思考中...</p></div> : aiResult ? <div><h4 className="text-xs font-bold uppercase text-indigo-400 mb-2">AI 建议</h4><div className="prose prose-sm text-slate-700 whitespace-pre-wrap">{aiResult}</div><button onClick={() => navigator.clipboard.writeText(aiResult)} className="mt-4 text-xs text-indigo-600 flex items-center"><FileText className="w-3 h-3 mr-1" /> 复制</button></div> : <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center"><Sparkles className="w-10 h-10 mb-3 text-slate-200" /><p className="text-sm">点击上方按钮<br/>分析项目风险或文案</p></div>}
           </div>
        </div>
      </div>
    </div>
  );
}

function SmartFillModal({ isOpen, onClose, onFill }) {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    const prompt = `Please extract project information from the following text and return it as a valid JSON object... Text: "${inputText}"`;
    try {
      const resultText = await callGeminiAI(prompt);
      const jsonString = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonString);
      onFill(data);
      onClose();
      setInputText('');
    } catch (error) {
      alert("AI 解析失败，请重试或检查输入内容。");
      console.error("Smart fill error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
           <h3 className="text-xl font-bold flex items-center"><Wand2 className="w-5 h-5 mr-2" /> AI 智能填单</h3>
           <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">请粘贴包含项目信息的文本...</p>
          <textarea className="w-full h-40 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm" value={inputText} onChange={(e) => setInputText(e.target.value)}></textarea>
          <div className="flex justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">取消</button>
            <button onClick={handleAnalyze} disabled={isProcessing || !inputText.trim()} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md font-medium flex items-center transition disabled:opacity-50">{isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}{isProcessing ? '正在分析...' : '开始识别'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintPreviewModal({ isOpen, onClose, projects, stats }) {
  const [fontSize, setFontSize] = useState(12);
  const [orientation, setOrientation] = useState('landscape');
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);

  const printStyle = `
    @media print {
      @page { size: A4 ${orientation}; margin: 10mm; }
      body * { visibility: hidden; }
      #print-content, #print-content * { visibility: visible; }
      #print-content { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white !important; overflow: visible !important; }
      .print-hidden { display: none !important; }
    }
    .preview-table th { background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; }
    .preview-table td { border-bottom: 1px solid #f1f5f9; }
    .preview-table tr:last-child td { border-bottom: none; }
  `;

  const columns = [
    { id: 'id', label: 'ID', width: '40px' },
    { id: 'name', label: '项目名称' },
    { id: 'entity', label: '签约主体' },
    { id: 'invoiceInfo', label: '开票信息', width: '150px' },
    { id: 'manager', label: '负责人', width: '60px' },
    { id: 'contact', label: '联系方式', width: '90px' },
    { id: 'signDate', label: '签约日期', width: '80px' },
    { id: 'paymentDate', label: '预期回款', width: '80px' },
    { id: 'amount', label: '合同额', align: 'right', width: '70px' },
    { id: 'collected', label: '已回款', align: 'right', width: '70px' },
    { id: 'uncollected', label: '未回款', align: 'right', width: '70px' },
    { id: 'payDates', label: '回款日期明细', width: '90px' },
    { id: 'payAmounts', label: '回款金额明细', align: 'right', width: '90px' },
    { id: 'status', label: '状态', width: '60px' },
  ];

  const toggleColumn = (colId) => {
    setHiddenColumns(prev => prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]);
  };

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div id="print-preview-root" className="fixed inset-0 z-[9999] bg-slate-900/90 flex flex-col">
      <style>{printStyle}</style>
      <div className="bg-white p-4 shadow-md flex justify-between items-center print-hidden shrink-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center"><Printer className="w-5 h-5 mr-2" /> 打印预览编辑器</h2>
          <div className="h-6 w-px bg-slate-300 mx-2"></div>
          <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1">
             <button onClick={() => setOrientation('portrait')} className={`px-3 py-1 rounded text-sm ${orientation === 'portrait' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>纵向</button>
             <button onClick={() => setOrientation('landscape')} className={`px-3 py-1 rounded text-sm ${orientation === 'landscape' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>横向</button>
          </div>
          <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1">
             <button onClick={() => setFontSize(prev => Math.max(8, prev - 1))} className="p-1.5 hover:bg-white rounded text-slate-600"><Minus className="w-4 h-4" /></button>
             <span className="text-sm font-mono w-8 text-center">{fontSize}px</span>
             <button onClick={() => setFontSize(prev => Math.min(20, prev + 1))} className="p-1.5 hover:bg-white rounded text-slate-600"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="relative">
            <button onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)} className={`flex items-center space-x-1 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors ${isColumnSelectorOpen ? 'bg-slate-200 ring-2 ring-slate-300' : ''}`}><AlignJustify className="w-4 h-4" /> <span>显示/隐藏列</span>{isColumnSelectorOpen ? <ChevronDown className="w-3 h-3 ml-1" /> : <ChevronRight className="w-3 h-3 ml-1" />}</button>
            {isColumnSelectorOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsColumnSelectorOpen(false)}></div>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white shadow-xl rounded-lg border border-slate-200 p-2 z-20 max-h-[60vh] overflow-y-auto">
                  <div className="text-xs font-semibold text-slate-400 px-2 py-1 mb-1 uppercase">选择要显示的列</div>
                  {columns.map(col => (
                    <label key={col.id} className="flex items-center space-x-2 p-2 hover:bg-slate-50 cursor-pointer text-sm rounded"><input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" checked={!hiddenColumns.includes(col.id)} onChange={() => toggleColumn(col.id)} /><span className={hiddenColumns.includes(col.id) ? 'text-slate-400' : 'text-slate-700'}>{col.label}</span></label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-500 mr-2">💡 提示：点击表格内容可直接修改</span>
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">取消</button>
          <button onClick={handlePrint} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md font-medium flex items-center transition"><Printer className="w-4 h-4 mr-2" /> 确认打印</button>
        </div>
      </div>
      <div id="print-content" className="flex-1 overflow-auto bg-slate-800 p-8 flex justify-center print:p-0 print:bg-white print:overflow-visible">
        <div className="bg-white shadow-2xl print:shadow-none mx-auto p-[10mm] box-border transition-all duration-300 ease-in-out" style={{ width: orientation === 'portrait' ? '210mm' : '297mm', minHeight: orientation === 'portrait' ? '297mm' : '210mm', fontSize: `${fontSize}px` }}>
          <div className="text-center mb-8 border-b border-slate-200 pb-6">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight" contentEditable suppressContentEditableWarning={true}>海南万企回款管理系统</h1>
            <h2 className="text-xl text-slate-600 font-medium" contentEditable suppressContentEditableWarning={true}>项目财务报表</h2>
            <p className="text-slate-400 text-sm mt-2" contentEditable suppressContentEditableWarning={true}>打印日期: {new Date().toLocaleDateString()}</p>
          </div>
          <table className="w-full border-collapse text-left preview-table">
            <thead><tr>{columns.map(col => !hiddenColumns.includes(col.id) && (<th key={col.id} className="p-3 font-bold text-slate-700 uppercase tracking-wider border-b-2 border-slate-300 bg-slate-50 whitespace-nowrap" style={{ width: col.width, textAlign: col.align || 'left' }}>{col.label}</th>))}</tr></thead>
            <tbody>
              {projects.map((p, idx) => {
                const uncollected = (p.amount - p.collected).toFixed(2);
                let payDates = "-", payAmounts = "0.00";
                if (p.payments && p.payments.length > 0) {
                   payDates = p.payments.map(pay => pay.date).join('\n') + '\n(合计)';
                   const amountsList = p.payments.map(pay => parseFloat(pay.amount).toFixed(2));
                   const totalRec = amountsList.reduce((a, b) => a + parseFloat(b), 0).toFixed(2);
                   payAmounts = amountsList.join('\n') + `\n小计:${totalRec}`;
                }
                return (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    {!hiddenColumns.includes('id') && <td className="p-3 align-top text-slate-600" contentEditable suppressContentEditableWarning={true}>{p.id}</td>}
                    {!hiddenColumns.includes('name') && <td className="p-3 align-top font-medium text-slate-800" contentEditable suppressContentEditableWarning={true}>{p.name}</td>}
                    {!hiddenColumns.includes('entity') && <td className="p-3 align-top text-slate-700" contentEditable suppressContentEditableWarning={true}>{p.entity}</td>}
                    {!hiddenColumns.includes('invoiceInfo') && <td className="p-3 align-top text-xs text-slate-500" contentEditable suppressContentEditableWarning={true}>{p.invoiceInfo}</td>}
                    {!hiddenColumns.includes('manager') && <td className="p-3 align-top text-slate-700" contentEditable suppressContentEditableWarning={true}>{p.manager}</td>}
                    {!hiddenColumns.includes('contact') && <td className="p-3 align-top text-xs text-slate-500" contentEditable suppressContentEditableWarning={true}>{p.contact}</td>}
                    {!hiddenColumns.includes('signDate') && <td className="p-3 align-top text-slate-600 whitespace-nowrap" contentEditable suppressContentEditableWarning={true}>{p.signDate}</td>}
                    {!hiddenColumns.includes('paymentDate') && <td className="p-3 align-top text-slate-600 whitespace-nowrap" contentEditable suppressContentEditableWarning={true}>{p.paymentDate}</td>}
                    {!hiddenColumns.includes('amount') && <td className="p-3 align-top text-right font-semibold text-slate-800" contentEditable suppressContentEditableWarning={true}>{p.amount}</td>}
                    {!hiddenColumns.includes('collected') && <td className="p-3 align-top text-right text-emerald-600 font-medium" contentEditable suppressContentEditableWarning={true}>{p.collected}</td>}
                    {!hiddenColumns.includes('uncollected') && <td className="p-3 align-top text-right text-red-600 font-bold" contentEditable suppressContentEditableWarning={true}>{uncollected}</td>}
                    {!hiddenColumns.includes('payDates') && <td className="p-3 align-top whitespace-pre-line text-xs text-slate-500" contentEditable suppressContentEditableWarning={true}>{payDates}</td>}
                    {!hiddenColumns.includes('payAmounts') && <td className="p-3 align-top whitespace-pre-line text-xs text-right text-slate-600 font-mono" contentEditable suppressContentEditableWarning={true}>{payAmounts}</td>}
                    {!hiddenColumns.includes('status') && <td className="p-3 align-top text-center text-xs" contentEditable suppressContentEditableWarning={true}>{p.status}</td>}
                  </tr>
                );
              })}
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                <td colSpan={columns.filter(c => !hiddenColumns.includes(c.id) && ['id','name','entity','invoiceInfo','manager','contact','signDate','paymentDate'].includes(c.id)).length} className="p-3 text-center text-slate-800">合计</td>
                {!hiddenColumns.includes('amount') && <td className="p-3 text-right text-slate-900">{stats.totalAmount}</td>}
                {!hiddenColumns.includes('collected') && <td className="p-3 text-right text-emerald-700">{stats.totalCollected}</td>}
                {!hiddenColumns.includes('uncollected') && <td className="p-3 text-right text-red-700">{(stats.totalAmount - stats.totalCollected).toFixed(2)}</td>}
                <td colSpan={10} className="p-3"></td>
              </tr>
            </tbody>
          </table>
          <div className="mt-8 flex justify-between text-xs text-slate-400 border-t border-slate-200 pt-4"><span>制表人：{window.localStorage.getItem('admin_user') || 'Admin'}</span><span>第 1 页</span></div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. 主应用组件
// ==========================================

export default function App() {
  const [credentials, setCredentials] = useState({ username: 'admin', password: '123456', secretKey: 'root' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [projects, setProjects] = useState(INITIAL_DATA);
  const fileInputRef = useRef(null);
  
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalEditing, setIsModalEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedEntity, setExpandedEntity] = useState(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false); 
  const [isSmartFillOpen, setIsSmartFillOpen] = useState(false);

  // --- 备份 & 删除确认状态 ---
  const [backups, setBackups] = useState([]);
  const [isAutoBackupOn, setIsAutoBackupOn] = useState(false);
  const [backupInterval, setBackupInterval] = useState(1); 
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null); 
  const [confirmingRestoreId, setConfirmingRestoreId] = useState(null); 

  const projectsRef = useRef(projects);
  const lastBackupTimeRef = useRef(Date.now());

  // 保持 projectsRef 最新，以便在定时器中访问最新数据
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  const [formData, setFormData] = useState({
    name: '', entity: '', invoiceInfo: '', signDate: '', paymentDate: '', manager: '', contact: '', amount: '', status: '进行中'
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/projects`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setProjects(data);
        } else if (USE_MOCK_DATA) {
          setProjects(mockDB);
        }
      } catch (e) {
        if (USE_MOCK_DATA) {
          setProjects(mockDB);
        }
      }
    };
    load();
  }, []);

  // --- 自动备份副作用 ---
  useEffect(() => {
    let interval;
    if (isAutoBackupOn) {
      // 这里的逻辑改为每 10 秒检查一次是否达到备份时间间隔
      // 避免 setInterval 长时间设定导致的溢出问题 (特别是 30 天的情况)
      // 同时也避免 projects 更新导致定时器重置
      interval = setInterval(() => {
        const now = Date.now();
        const timeSinceLast = now - lastBackupTimeRef.current;
        const targetIntervalMs = backupInterval * 60 * 1000;

        if (timeSinceLast >= targetIntervalMs) {
          const currentProjects = projectsRef.current;
          const newBackup = { id: now, timestamp: new Date().toLocaleString(), data: JSON.parse(JSON.stringify(currentProjects)), type: '自动' };
          setBackups(prev => [newBackup, ...prev].slice(0, 20));
          lastBackupTimeRef.current = now;
        }
      }, 10000); // 每 10 秒检查一次
    }
    return () => clearInterval(interval);
  }, [isAutoBackupOn, backupInterval]);

  const createManualBackup = () => {
    const newBackup = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      data: JSON.parse(JSON.stringify(projects)),
      type: '手动'
    };
    setBackups(prev => [newBackup, ...prev].slice(0, 20));
    alert('已成功创建手动快照，可随时恢复至此状态。');
  };

  // --- 导出与打印逻辑 ---
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(projects, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HNWanQi_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data)) {
          setProjects(data);
          alert("数据恢复成功！");
        } else {
          alert("文件格式错误：必须是项目数组备份。");
        }
      } catch (err) {
        alert("文件解析失败，请确保是有效的备份文件。");
      }
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const handleExportExcel = () => {
    const tableStyle = 'border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;';
    const thStyle = 'background-color: #f3f4f6; border: 1px solid #d1d5db; padding: 8px; font-weight: bold; text-align: center;';
    const tdStyle = 'border: 1px solid #d1d5db; padding: 8px; vertical-align: top;';
    const tdRedStyle = 'border: 1px solid #d1d5db; padding: 8px; vertical-align: top; color: #ef4444; font-weight: bold;';
    const tdSummaryStyle = 'background-color: #e5e7eb; border: 1px solid #9ca3af; padding: 8px; font-weight: bold;';

    let html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>项目回款表</x:Name>
              <x:WorksheetOptions>
                <x:Print>
                  <x:ValidPrinterInfo/>
                </x:Print>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body>
      <table style="${tableStyle}">
        <thead>
          <tr>
            <th style="${thStyle}">ID</th>
            <th style="${thStyle}">项目名称</th>
            <th style="${thStyle}">签约主体</th>
            <th style="${thStyle}">开票信息</th>
            <th style="${thStyle}">负责人</th>
            <th style="${thStyle}">联系方式</th>
            <th style="${thStyle}">签约日期</th>
            <th style="${thStyle}">预期回款日期</th>
            <th style="${thStyle}">合同金额(万)</th>
            <th style="${thStyle}">已回款(万)</th>
            <th style="${thStyle}">未回款(万)</th>
            <th style="${thStyle}">回款日期明细</th>
            <th style="${thStyle}">回款金额明细(万)</th>
            <th style="${thStyle}">状态</th>
          </tr>
        </thead>
        <tbody>`;

    projects.forEach(p => {
        const uncollected = (p.amount - p.collected).toFixed(2);
        let payDates = "无";
        let payAmounts = "0.00";
        if (p.payments && p.payments.length > 0) {
          payDates = p.payments.map(pay => pay.date).join('<br style="mso-data-placement:same-cell;" />') + '<br style="mso-data-placement:same-cell;" />(合计)';
          const amountsList = p.payments.map(pay => parseFloat(pay.amount).toFixed(2));
          const totalRec = amountsList.reduce((a, b) => a + parseFloat(b), 0).toFixed(2);
          payAmounts = amountsList.join('<br style="mso-data-placement:same-cell;" />') + `<br style="mso-data-placement:same-cell;" /><b>${totalRec}</b>`;
        }
        html += `<tr>
            <td style="${tdStyle}">${p.id}</td>
            <td style="${tdStyle}">${p.name}</td>
            <td style="${tdStyle}">${p.entity || ''}</td>
            <td style="${tdStyle}">${p.invoiceInfo || ''}</td>
            <td style="${tdStyle}">${p.manager}</td>
            <td style="${tdStyle}">${p.contact}</td>
            <td style="${tdStyle}">${p.signDate}</td>
            <td style="${tdStyle}">${p.paymentDate}</td>
            <td style="${tdStyle}">${p.amount}</td>
            <td style="${tdStyle}">${p.collected}</td>
            <td style="${tdRedStyle}">${uncollected}</td>
            <td style="${tdStyle}">${payDates}</td>
            <td style="${tdStyle}">${payAmounts}</td>
            <td style="${tdStyle}">${p.status}</td>
          </tr>`;
    });
    const totalAmount = projects.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2);
    const totalCollected = projects.reduce((sum, p) => sum + Number(p.collected), 0).toFixed(2);
    const totalUncollected = (totalAmount - totalCollected).toFixed(2);
    html += `<tr><td colspan="8" style="${tdSummaryStyle} text-align: center;">合计</td><td style="${tdSummaryStyle}">${totalAmount}</td><td style="${tdSummaryStyle}">${totalCollected}</td><td style="${tdSummaryStyle} color: #b91c1c;">${totalUncollected}</td><td colspan="3" style="${tdSummaryStyle}"></td></tr>`;
    html += `</tbody></table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HNWanQi_Export_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => { 
    setTimeout(() => {
      window.focus();
      window.print();
    }, 100);
  };

  const restoreFromHistory = (backup) => {
    setProjects(backup.data);
    setConfirmingRestoreId(null);
    alert(`已成功恢复至 ${backup.timestamp} 的数据版本。`);
  };

  // --- 统计逻辑 ---
  const checkOverdue = (project) => {
    const today = new Date();
    const pDate = new Date(project.paymentDate);
    return pDate < today && parseFloat(project.collected) < parseFloat(project.amount);
  };

  const stats = useMemo(() => {
    const total = projects.length;
    const overdue = projects.filter(checkOverdue).length;
    const totalAmount = projects.reduce((acc, cur) => acc + parseFloat(cur.amount), 0);
    const totalCollected = projects.reduce((acc, cur) => acc + parseFloat(cur.collected), 0);
    const collectionRate = totalAmount > 0 ? ((totalCollected / totalAmount) * 100).toFixed(1) : 0;
    return { total, overdue, totalAmount, totalCollected, collectionRate };
  }, [projects]);

  const entityStats = useMemo(() => {
    const map = {};
    projects.forEach(p => {
      const entity = p.entity || "未分类";
      if (!map[entity]) {
        map[entity] = { name: entity, count: 0, amount: 0, collected: 0, projects: [] };
      }
      map[entity].count += 1;
      map[entity].amount += parseFloat(p.amount);
      map[entity].collected += parseFloat(p.collected);
      map[entity].projects.push(p); 
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount); 
  }, [projects]);

  const pieData = [
    { name: '已结清', value: projects.filter(p => parseFloat(p.collected) >= parseFloat(p.amount)).length },
    { name: '进行中', value: projects.filter(p => !checkOverdue(p) && parseFloat(p.collected) < parseFloat(p.amount)).length },
    { name: '逾期', value: projects.filter(checkOverdue).length },
  ];

  const barData = projects.map(p => ({ name: p.name, contract: p.amount, collected: p.collected }));

  // --- CRUD 操作 ---
  const handleAddProject = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      entity: formData.entity,
      invoiceInfo: formData.invoiceInfo,
      signDate: formData.signDate,
      paymentDate: formData.paymentDate,
      manager: formData.manager,
      contact: formData.contact,
      amount: parseFloat(formData.amount),
      status: formData.status
    };
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const created = await res.json();
      setProjects(prev => [created, ...prev]);
      alert("项目添加成功！");
      setFormData({ name: '', entity: '', invoiceInfo: '', signDate: '', paymentDate: '', manager: '', contact: '', amount: '', status: '进行中' });
    } catch (e) {
      if (USE_MOCK_DATA) {
        const newProject = { id: projects.length + 1, ...payload, collected: 0, payments: [] };
        setProjects([...projects, newProject]);
        alert("项目添加成功！");
        setFormData({ name: '', entity: '', invoiceInfo: '', signDate: '', paymentDate: '', manager: '', contact: '', amount: '', status: '进行中' });
      } else {
        alert("项目添加失败，请稍后重试。");
      }
    }
  };

  const handleSmartFill = (data) => {
     setFormData(prev => ({
       ...prev,
       name: data.name || prev.name,
       entity: data.entity || prev.entity,
       invoiceInfo: data.invoiceInfo || prev.invoiceInfo,
       manager: data.manager || prev.manager,
       contact: data.contact || prev.contact,
       amount: data.amount || prev.amount,
       signDate: data.signDate || prev.signDate,
       paymentDate: data.paymentDate || prev.paymentDate
     }));
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/projects/${id}`, { method: 'DELETE' });
      setProjects(projects.filter(p => p.id !== id));
      setConfirmingDeleteId(null);
    } catch (e) {
      if (USE_MOCK_DATA) {
        setProjects(projects.filter(p => p.id !== id));
        setConfirmingDeleteId(null);
      } else {
        alert("删除失败，请稍后重试。");
      }
    }
  };
  
  const handleAddPayment = async (projectId, paymentData) => {
    try {
      await fetch(`${API_BASE_URL}/projects/${projectId}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paymentData) });
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      const updated = await res.json();
      setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
      setSelectedProject(updated);
    } catch (e) {
      if (USE_MOCK_DATA) {
        const updatedProjects = projects.map(p => {
          if (p.id === projectId) {
            const newPayments = [...p.payments, { id: Date.now(), ...paymentData }];
            const newCollected = newPayments.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
            let newStatus = p.status;
            if (newCollected >= p.amount) newStatus = '已完成';
            else if (new Date(p.paymentDate) < new Date()) newStatus = '逾期风险';
            return { ...p, payments: newPayments, collected: newCollected, status: newStatus };
          }
          return p;
        });
        setProjects(updatedProjects);
        setSelectedProject(updatedProjects.find(p => p.id === projectId));
      } else {
        alert("添加回款失败，请稍后重试。");
      }
    }
  };

  const handleDeletePayment = async (projectId, paymentId) => {
    try {
      await fetch(`${API_BASE_URL}/payments/${paymentId}`, { method: 'DELETE' });
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      const updated = await res.json();
      setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
      setSelectedProject(updated);
    } catch (e) {
      if (USE_MOCK_DATA) {
        const updatedProjects = projects.map(p => {
          if (p.id === projectId) {
            const newPayments = p.payments.filter(pay => pay.id !== paymentId);
            const newCollected = newPayments.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
            let newStatus = '进行中';
            if (newCollected >= p.amount) newStatus = '已完成';
            else if (new Date(p.paymentDate) < new Date()) newStatus = '逾期风险';
            return { ...p, payments: newPayments, collected: newCollected, status: newStatus };
          }
          return p;
        });
        setProjects(updatedProjects);
        setSelectedProject(updatedProjects.find(p => p.id === projectId));
      } else {
        alert("删除回款失败，请稍后重试。");
      }
    }
  };

  const openDetailModal = (project) => { setSelectedProject(project); setIsModalEditing(false); };
  const openPaymentEntryModal = (project) => { setSelectedProject(project); setIsModalEditing(true); };
  const toggleEntityExpand = (entityName) => { setExpandedEntity(expandedEntity === entityName ? null : entityName); };

  if (!isLoggedIn) return <LoginPage credentials={credentials} onLogin={() => setIsLoggedIn(true)} onResetPassword={(newPass) => setCredentials(prev => ({...prev, password: newPass}))} />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden print:h-auto print:overflow-visible">
      {/* 侧边栏 */}
      <div className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex print:hidden">
        <div className="p-6 flex items-center space-x-3"><Database className="w-8 h-8 text-blue-400" /><span className="text-xl font-bold">海南万企回款管理系统</span></div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard className="w-5 h-5" /><span>数据大屏</span></button>
          <button onClick={() => setCurrentView('analysis')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'analysis' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Building2 className="w-5 h-5" /><span>客户分析</span></button>
          <button onClick={() => setCurrentView('admin')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}><Plus className="w-5 h-5" /><span>数据录入管理</span></button>
        </nav>
        <div className="p-4 border-t border-slate-800"><button onClick={() => setIsLoggedIn(false)} className="flex items-center space-x-3 text-slate-400 hover:text-white px-4 py-2"><LogOut className="w-5 h-5" /><span>退出登录</span></button></div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible print:w-full">
        {/* Header */}
        <header className="bg-white shadow-sm z-10 px-6 py-4 flex justify-between items-center print:hidden">
          <div className="md:hidden font-bold text-lg text-slate-800">海南万企回款管理系统</div>
          <div className="flex items-center space-x-4 ml-auto">
            <button onClick={() => setIsPrintPreviewOpen(true)} className="flex items-center text-slate-600 hover:bg-slate-100 px-3 py-1 rounded-full transition" title="打印预览"><Printer className="w-4 h-4 mr-1" /><span className="text-sm">打印</span></button>
            <div className="flex items-center text-slate-600 bg-slate-100 px-3 py-1 rounded-full"><User className="w-4 h-4 mr-2" /><span className="text-sm">管理员: {credentials.username}</span></div>
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center text-slate-600 hover:bg-slate-100 px-3 py-1 rounded-full transition" title="账号设置"><Settings className="w-4 h-4 mr-1" /><span className="text-sm">设置</span></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible">
          {/* ... (Dashboard) ... */}
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 print:mb-4">项目进度与回款监控</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:grid-cols-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-sm">总项目数</p><h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.total}</h3></div><div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Database className="w-6 h-6" /></div></div></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-sm">逾期预警</p><h3 className="text-3xl font-bold text-red-600 mt-2">{stats.overdue}</h3><p className="text-xs text-red-400 mt-1">需立即处理</p></div><div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle className="w-6 h-6" /></div></div></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-sm">总合同额 (万元)</p><h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.totalAmount}</h3></div><div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><JapaneseYen className="w-6 h-6" /></div></div></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><div className="flex justify-between items-start"><div><p className="text-slate-500 text-sm">回款率</p><h3 className="text-3xl font-bold text-blue-600 mt-2">{stats.collectionRate}%</h3><div className="w-full bg-slate-200 rounded-full h-1.5 mt-2"><div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${stats.collectionRate}%` }}></div></div></div><div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><CheckCircle className="w-6 h-6" /></div></div></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><h3 className="text-lg font-bold text-slate-800 mb-4">项目资金回笼情况</h3><div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={barData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{fontSize: 12}} interval={0} angle={-15} textAnchor="end" height={60}/><YAxis /><RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} /><Legend /><Bar dataKey="contract" name="合同金额" fill="#cbd5e1" radius={[4, 4, 0, 0]} /><Bar dataKey="collected" name="已回款" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><h3 className="text-lg font-bold text-slate-800 mb-4">项目回款状态分布</h3><div className="h-80 flex items-center justify-center"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value">{pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={[ '#10b981', '#3b82f6', '#ef4444'][index % 3]} />))}</Pie><RechartsTooltip /><Legend verticalAlign="bottom" height={36}/></PieChart></ResponsiveContainer></div></div>
              </div>
              
              {/* 列表 - 新增未回款列 & 合计行 - 美化版 */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50"><h3 className="text-lg font-bold text-slate-800">重点项目监控表</h3></div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                    <tr><th className="px-6 py-4">项目名称</th><th className="px-6 py-4">签约主体</th><th className="px-6 py-4">负责人</th><th className="px-6 py-4 text-right">总额/已回</th><th className="px-6 py-4 text-right text-red-600">未回款</th><th className="px-6 py-4">状态</th><th className="px-6 py-4">回款明细</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                  {projects.map((project) => (
                    <tr key={project.id} onClick={() => openDetailModal(project)} className={`hover:bg-blue-50/30 transition-all duration-200 cursor-pointer group ${checkOverdue(project) ? 'bg-red-50/10' : ''}`}>
                      <td className="px-6 py-4 font-medium text-blue-600 group-hover:underline">{project.name}</td><td className="px-6 py-4 text-slate-600">{project.entity || '-'}</td><td className="px-6 py-4 text-slate-500"><div>{project.manager}</div><div className="text-xs text-slate-400">{project.contact}</div></td><td className="px-6 py-4 text-right"><span className="font-bold text-slate-700">¥{project.amount}</span> <span className="text-slate-400">/</span> <span className="text-slate-500">{project.collected}</span></td><td className="px-6 py-4 text-right text-red-600 font-medium">¥{project.amount - project.collected}</td><td className="px-6 py-4"><StatusBadge status={project.status} paymentDate={project.paymentDate} amount={project.amount} collected={project.collected} /></td><td className="px-6 py-4"><PaymentDetailsCell payments={project.payments} /></td>
                    </tr>
                  ))}
                  {/* 合计行 */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-200 text-slate-800">
                    <td className="px-6 py-4 flex items-center"><Sigma className="w-4 h-4 mr-2"/> 总计</td>
                    <td colSpan={2}></td>
                    <td className="px-6 py-4 text-right">¥{stats.totalAmount} / ¥{stats.totalCollected}</td>
                    <td className="px-6 py-4 text-right text-red-600">¥{stats.totalAmount - stats.totalCollected}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody></table>
              </div>
            </div>
          )}

           {/* Analysis View - Reuse similar table styles for consistency if needed, currently keep as previous functional implementation but you can apply same classes */}
           {currentView === 'analysis' && (
             <div className="space-y-6">
              {/* ... Analysis content ... */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between"><div><p className="text-slate-500 text-sm">合作客户总数</p><h3 className="text-3xl font-bold text-slate-800 mt-2">{entityStats.length}</h3></div><div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Building2 className="w-8 h-8" /></div></div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between"><div><p className="text-slate-500 text-sm">平均单客合同额</p><h3 className="text-3xl font-bold text-slate-800 mt-2">¥{(stats.totalAmount / entityStats.length || 0).toFixed(0)}</h3></div><div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><JapaneseYen className="w-8 h-8" /></div></div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between"><div><p className="text-slate-500 text-sm">累计未回款总额</p><h3 className="text-3xl font-bold text-red-600 mt-2">¥{(stats.totalAmount - stats.totalCollected).toFixed(0)}</h3></div><div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertTriangle className="w-8 h-8" /></div></div>
              </div>
               
               {/* Chart */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100"><h3 className="text-lg font-bold text-slate-800 mb-4">客户合同价值排行 (Top 10)</h3><div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={entityStats.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" /><YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} /><RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px'}} /><Legend /><Bar dataKey="amount" name="累计合同额 (万)" fill="#8884d8" barSize={20} radius={[0, 4, 4, 0]} /><Bar dataKey="collected" name="累计已回款 (万)" fill="#82ca9d" barSize={20} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></div>

               {/* Entity Table - Apply New Styles */}
               <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50"><h3 className="text-lg font-bold text-slate-800">客户详细数据聚合表 (点击行可展开详情)</h3></div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                    <tr><th className="px-6 py-4">签约主体名称</th><th className="px-6 py-4 text-center">签约项目数</th><th className="px-6 py-4 text-right">累计合同总额</th><th className="px-6 py-4 text-right">累计已回款</th><th className="px-6 py-4 text-right text-red-600">累计未回款</th><th className="px-6 py-4 text-right">回款比例</th><th className="px-6 py-4 text-center w-10"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {entityStats.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <tr onClick={() => toggleEntityExpand(item.name)} className={`cursor-pointer transition-colors hover:bg-blue-50/30 ${expandedEntity === item.name ? 'bg-blue-50/50' : ''}`}>
                          <td className="px-6 py-4 font-medium text-slate-800 flex items-center"><Building2 className="w-4 h-4 mr-2 text-slate-400" />{item.name}</td>
                          <td className="px-6 py-4 text-center"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-full text-xs">{item.count} 个</span></td>
                          <td className="px-6 py-4 text-right font-bold text-slate-700">¥{item.amount}</td>
                          <td className="px-6 py-4 text-right text-blue-600">¥{item.collected}</td>
                          <td className="px-6 py-4 text-right text-red-600 font-medium">¥{item.amount - item.collected}</td>
                          <td className="px-6 py-4 text-right text-slate-500">{item.amount > 0 ? ((item.collected / item.amount) * 100).toFixed(1) : 0}%</td>
                          <td className="px-6 py-4 text-center text-slate-400">{expandedEntity === item.name ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</td>
                        </tr>
                        {expandedEntity === item.name && (
                          <tr className="bg-slate-50/50 border-b border-slate-200 shadow-inner">
                            <td colSpan={7} className="px-6 py-4">
                               <div className="bg-white rounded-lg border border-blue-100 overflow-hidden">
                                <div className="bg-blue-50/50 px-4 py-2 border-b border-blue-100 flex items-center text-xs font-bold text-blue-800 uppercase tracking-wider"><FolderOpen className="w-3.5 h-3.5 mr-2" />{item.name} - 旗下项目列表</div>
                                <table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500 text-xs"><tr><th className="px-4 py-2 text-left">项目名称</th><th className="px-4 py-2 text-left">负责人</th><th className="px-4 py-2 text-left">联系电话</th><th className="px-4 py-2 text-left">签约日期</th><th className="px-4 py-2 text-right">合同金额</th><th className="px-4 py-2 text-right">已回款</th><th className="px-4 py-2 text-right text-red-500">未回款</th><th className="px-4 py-2 text-left">回款明细</th><th className="px-4 py-2 text-center">状态</th></tr></thead><tbody className="divide-y divide-slate-100">{item.projects.map((p, pIdx) => (<tr key={pIdx} className="hover:bg-slate-50"><td className="px-4 py-2 font-medium text-slate-700">{p.name}</td><td className="px-4 py-2 text-slate-600">{p.manager}</td><td className="px-4 py-2 text-slate-500">{p.contact}</td><td className="px-4 py-2 text-slate-500">{p.signDate}</td><td className="px-4 py-2 text-right">¥{p.amount}</td><td className="px-4 py-2 text-right text-blue-600">¥{p.collected}</td><td className="px-4 py-2 text-right text-red-500 font-medium">¥{p.amount - p.collected}</td><td className="px-4 py-2"><PaymentDetailsCell payments={p.payments} /></td><td className="px-4 py-2 text-center"><StatusBadge status={p.status} paymentDate={p.paymentDate} amount={p.amount} collected={p.collected} /></td></tr>))}</tbody></table>
                               </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
             </div>
           )}

          {/* 视图 3: 后台管理 & 数据维护 */}
          {currentView === 'admin' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* 标题栏 - 打印隐藏 */}
              <div className="flex justify-between items-center print:hidden">
                 <h2 className="text-2xl font-bold text-slate-800">项目数据录入与管理</h2>
                 <button onClick={() => setIsSettingsOpen(true)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center text-sm"><Settings className="w-4 h-4 mr-2" /> 账号安全设置</button>
              </div>

              {/* 数据维护工具栏 - 打印隐藏 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 print:hidden">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <Database className="w-5 h-5 mr-2 text-indigo-600" /> 数据维护与导出
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={handleExportJSON} className="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition group"><div className="bg-indigo-100 p-2 rounded-full mr-3 group-hover:bg-white transition"><Save className="w-5 h-5 text-indigo-600" /></div><div className="text-left"><div className="font-medium text-slate-700">导出备份 (.json)</div><div className="text-xs text-slate-500">完整数据库快照</div></div></button>
                  <div className="relative"><input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><div className="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-lg hover:bg-amber-50 hover:border-amber-200 transition group h-full cursor-pointer"><div className="bg-amber-100 p-2 rounded-full mr-3 group-hover:bg-white transition"><Upload className="w-5 h-5 text-amber-600" /></div><div className="text-left"><div className="font-medium text-slate-700">恢复备份</div><div className="text-xs text-slate-500">点击上传 .json 文件</div></div></div></div>
                  <button onClick={handleExportExcel} className="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition group"><div className="bg-emerald-100 p-2 rounded-full mr-3 group-hover:bg-white transition"><FileSpreadsheet className="w-5 h-5 text-emerald-600" /></div><div className="text-left"><div className="font-medium text-slate-700">导出 Excel (.xls)</div><div className="text-xs text-slate-500">带样式的财务报表</div></div></button>
                </div>
              </div>

              {/* 自动备份与历史回溯 - 打印隐藏 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 print:hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" /> 数据安全与时光机
                  </h3>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={createManualBackup}
                      className="flex items-center px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition"
                    >
                      <Camera className="w-4 h-4 mr-1" /> 立即备份
                    </button>
                    {isAutoBackupOn && (
                      <select 
                        value={backupInterval}
                        onChange={(e) => setBackupInterval(Number(e.target.value))}
                        className="bg-slate-100 border-none text-sm rounded-lg px-3 py-1.5 text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value={1}>每 1 分钟</option>
                        <option value={5}>每 5 分钟</option>
                        <option value={30}>每 30 分钟</option>
                        <option value={60}>每 1 小时</option>
                        <option value={1440}>每 1 天</option>
                        <option value={43200}>每 1 个月</option>
                      </select>
                    )}
                    <button 
                      onClick={() => setIsAutoBackupOn(!isAutoBackupOn)} 
                      className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition ${isAutoBackupOn ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {isAutoBackupOn ? <ToggleRight className="w-5 h-5 mr-1" /> : <ToggleLeft className="w-5 h-5 mr-1" />}
                      {isAutoBackupOn ? '自动备份已开启' : '自动备份已关闭'}
                    </button>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                  <div className="px-4 py-2 bg-slate-100 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 flex justify-between">
                    <span>备份时间点</span>
                    <span>操作</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {backups.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-sm">暂无历史备份记录，开启自动备份或手动导出后将显示在此。</div>
                    ) : (
                      <ul className="divide-y divide-slate-200">
                        {backups.map(backup => (
                          <li key={backup.id} className="px-4 py-3 flex justify-between items-center hover:bg-white transition">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-700">{backup.timestamp}</span>
                              <span className="text-xs text-slate-400">类型: {backup.type} | 数据量: {backup.data.length} 条</span>
                            </div>
                            {confirmingRestoreId === backup.id ? (
                              <div className="flex space-x-2">
                                <button onClick={() => restoreFromHistory(backup)} className="flex items-center text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">确认恢复</button>
                                <button onClick={() => setConfirmingRestoreId(null)} className="flex items-center text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-slate-200">取消</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmingRestoreId(backup.id)} className="flex items-center text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1 rounded hover:bg-blue-50 transition">
                                <RotateCcw className="w-3 h-3 mr-1" /> 恢复至此状态
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 录入表单 - 打印隐藏 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 print:hidden">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center"><Plus className="w-5 h-5 mr-2 text-blue-600" /> 录入新项目</h3>
                  <button onClick={() => setFormData({name: '', entity: '', invoiceInfo: '', signDate: '', paymentDate: '', manager: '', contact: '', amount: '', status: '进行中'})} className="text-sm text-slate-500 hover:text-blue-600 flex items-center"><X className="w-3 h-3 mr-1" /> 清空表单</button>
                </div>
                <form onSubmit={handleAddProject} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">项目名称</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none" placeholder="项目全称"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">签约主体 (甲方公司)</label><div className="relative"><input required type="text" value={formData.entity} onChange={e => setFormData({...formData, entity: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none" placeholder="例如：xx科技集团"/><Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" /></div></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">开票信息</label><div className="relative"><input required type="text" value={formData.invoiceInfo} onChange={e => setFormData({...formData, invoiceInfo: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none" placeholder="税号、开户行等"/><Receipt className="w-4 h-4 text-slate-400 absolute left-3 top-3" /></div></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">项目负责人</label><input required type="text" value={formData.manager} onChange={e => setFormData({...formData, manager: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">联系方式</label><input required type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">合同总金额 (万元)</label><input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">签约日期</label><input required type="date" value={formData.signDate} onChange={e => setFormData({...formData, signDate: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none"/></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">预期回款日期</label><input required type="date" value={formData.paymentDate} onChange={e => setFormData({...formData, paymentDate: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none"/></div>
                  <div className="md:col-span-2 flex justify-end mt-4"><button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200 flex items-center"><Plus className="w-4 h-4 mr-2" /> 添加项目</button></div>
                </form>
              </div>

              {/* 列表 - 这个会保留打印 */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800">现有项目库管理</h3></div>
                <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600 uppercase"><tr><th className="px-6 py-4">项目名称</th><th className="px-6 py-4">签约主体</th><th className="px-6 py-4">负责人</th><th className="px-6 py-4 text-right">总额/已回</th><th className="px-6 py-4 text-right text-red-600">未回款</th><th className="px-6 py-4 text-right print:hidden">回款操作</th><th className="px-6 py-4 text-right print:hidden">管理</th><th className="px-6 py-4 print:w-32">回款明细</th></tr></thead><tbody className="divide-y divide-slate-100">
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td className="px-6 py-3 font-medium text-slate-800">{project.name}</td><td className="px-6 py-3 text-slate-600">{project.entity || '-'}</td><td className="px-6 py-3 text-slate-600">{project.amount} / {project.collected}</td><td className="px-6 py-3 text-right text-red-600">¥{project.amount - project.collected}</td><td className="px-6 py-3 text-right print:hidden"><button onClick={() => openPaymentEntryModal(project)} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1 rounded border border-emerald-200 transition flex items-center justify-end ml-auto"><TrendingUp className="w-4 h-4 mr-1" /> 录入</button></td>
                      <td className="px-6 py-3 text-right print:hidden">
                        {confirmingDeleteId === project.id ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => handleDelete(project.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition">确认删除</button>
                            <button onClick={() => setConfirmingDeleteId(null)} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 transition">取消</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmingDeleteId(project.id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </td>
                      <td className="px-6 py-3"><PaymentDetailsCell payments={project.payments} /></td>
                    </tr>
                  ))}
                  {/* 合计行 */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-200 text-slate-800">
                    <td className="px-6 py-4 flex items-center"><Sigma className="w-4 h-4 mr-2"/> 总计</td>
                    <td colSpan={2}></td>
                    <td className="px-6 py-4 text-right">¥{stats.totalAmount} / ¥{stats.totalCollected}</td>
                    <td className="px-6 py-4 text-right text-red-600">¥{stats.totalAmount - stats.totalCollected}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody></table>
              </div>
            </div>
          )}
        </main>
        
        {/* 弹窗 & 设置 */}
        <ProjectModal project={selectedProject} isOpen={!!selectedProject} onClose={() => setSelectedProject(null)} isEditing={isModalEditing} onAddPayment={handleAddPayment} onDeletePayment={handleDeletePayment} />
        <AccountSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} credentials={credentials} onUpdateCredentials={setCredentials} />
        <PrintPreviewModal isOpen={isPrintPreviewOpen} onClose={() => setIsPrintPreviewOpen(false)} projects={projects} stats={stats} />
        <SmartFillModal isOpen={isSmartFillOpen} onClose={() => setIsSmartFillOpen(false)} onFill={handleSmartFill} />
      </div>
    </div>
  );
}
