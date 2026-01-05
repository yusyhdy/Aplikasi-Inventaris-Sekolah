
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import StatCard from './components/StatCard';
import AiAssistant from './components/AiAssistant';
import { 
  Plus, 
  Search, 
  Filter, 
  Box, 
  Users, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  ArrowRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock4,
  ClipboardList,
  BarChart3,
  Settings,
  Trash2,
  History as HistoryIcon,
  ChevronUp,
  User,
  Edit,
  X,
  ImageIcon,
  Handshake,
  RotateCcw,
  CalendarDays,
  Camera,
  RefreshCw,
  CameraOff,
  Languages,
  Sun,
  Moon,
  ChevronRightSquare,
  CheckSquare
} from 'lucide-react';
import { 
  Department, 
  ToolStatus, 
  LendingStatus, 
  Tool as ITool, 
  LendingRecord 
} from './types';
import { storageService } from './services/storageService';
import { DEPARTMENT_LABELS, DEPARTMENTS, TRANSLATIONS } from './constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const App: React.FC = () => {
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  
  const t = TRANSLATIONS[lang];
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tools, setTools] = useState<ITool[]>([]);
  const [lending, setLending] = useState<LendingRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<ToolStatus | 'ALL'>('ALL');
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);
  const [editingTool, setEditingTool] = useState<ITool | null>(null);
  const [borrowingTool, setBorrowingTool] = useState<ITool | null>(null);
  
  // Selection state for bulk actions
  const [selectedLendingIds, setSelectedLendingIds] = useState<Set<string>>(new Set());
  
  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Borrow form state
  const [borrowForm, setBorrowForm] = useState({
    studentName: '',
    studentClass: '',
    notes: '',
    quantity: 1
  });
  const [borrowError, setBorrowError] = useState<string | null>(null);

  // Sync theme with document and localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Initial load and whenever activeTab changes to inventory/lending
  useEffect(() => {
    refreshData();
    setSearchTerm(''); // Clear search when switching tabs
    setSelectedLendingIds(new Set()); // Reset selection when switching tabs
  }, [activeTab]);

  const refreshData = () => {
    setTools(storageService.getTools());
    setLending(storageService.getLendingRecords());
  };

  const handleStatusUpdate = (record: LendingRecord, newStatus: LendingStatus) => {
    const updated = { ...record, status: newStatus };
    if (newStatus === LendingStatus.RETURNED) {
      updated.returnDate = new Date().toISOString();
    }
    storageService.saveLendingRecord(updated);
    refreshData();
  };

  const handleBulkStatusUpdate = (newStatus: LendingStatus) => {
    const selectedRecords = lending.filter(r => selectedLendingIds.has(r.id));
    selectedRecords.forEach(record => {
      // Basic validation: only pending can be approved/rejected, only approved can be returned
      if (
        (newStatus === LendingStatus.APPROVED && record.status === LendingStatus.PENDING) ||
        (newStatus === LendingStatus.REJECTED && record.status === LendingStatus.PENDING) ||
        (newStatus === LendingStatus.RETURNED && record.status === LendingStatus.APPROVED)
      ) {
        handleStatusUpdate(record, newStatus);
      }
    });
    setSelectedLendingIds(new Set());
  };

  const toggleSelectLending = (id: string) => {
    const newSelected = new Set(selectedLendingIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLendingIds(newSelected);
  };

  const toggleSelectAllLending = () => {
    if (selectedLendingIds.size === filteredLending.length) {
      setSelectedLendingIds(new Set());
    } else {
      setSelectedLendingIds(new Set(filteredLending.map(r => r.id)));
    }
  };

  const handleOpenAddModal = () => {
    const dept = selectedDept === 'ALL' ? Department.RPL : selectedDept;
    setEditingTool({
      id: Date.now().toString(),
      name: '',
      department: dept,
      quantity: 1,
      availableQuantity: 1,
      status: ToolStatus.AVAILABLE,
      location: '',
      image: '',
      notes: ''
    });
  };

  const handleDeleteTool = (id: string) => {
    if (confirm(lang === 'id' ? 'Apakah Anda yakin ingin menghapus alat ini?' : 'Are you sure you want to delete this tool?')) {
      const allTools = storageService.getTools();
      const filtered = allTools.filter(t => t.id !== id);
      localStorage.setItem('smk_inventory_tools', JSON.stringify(filtered));
      refreshData();
    }
  };

  const handleDeleteLending = (id: string) => {
    if (confirm(lang === 'id' ? 'Hapus catatan peminjaman?' : 'Delete lending record?')) {
      storageService.deleteLendingRecord(id);
      refreshData();
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTool) {
      storageService.saveTool(editingTool);
      setEditingTool(null);
      setIsCameraActive(false);
      refreshData();
    }
  };

  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowingTool) return;

    if (borrowForm.quantity > borrowingTool.availableQuantity) {
      setBorrowError(lang === 'id' ? `Maaf, stok hanya ${borrowingTool.availableQuantity}.` : `Sorry, only ${borrowingTool.availableQuantity} available.`);
      return;
    }

    const newRecord: LendingRecord = {
      id: Date.now().toString(),
      toolId: borrowingTool.id,
      toolName: borrowingTool.name,
      studentName: borrowForm.studentName,
      studentClass: borrowForm.studentClass,
      department: borrowingTool.department,
      borrowDate: new Date().toISOString(),
      status: LendingStatus.PENDING,
      notes: borrowForm.notes,
      quantity: borrowForm.quantity
    };

    storageService.saveLendingRecord(newRecord);
    setBorrowingTool(null);
    setBorrowForm({ studentName: '', studentClass: '', notes: '', quantity: 1 });
    setBorrowError(null);
    refreshData();
    setActiveTab('lending');
  };

  // Camera Functions
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert(lang === 'id' ? "Gagal akses kamera." : "Camera access failed.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && editingTool) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        setEditingTool({ ...editingTool, image: imageData });
        stopCamera();
      }
    }
  };

  const filteredTools = tools.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || t.department === selectedDept;
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const filteredLending = lending.filter(record => {
    const matchesSearch = 
      record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.toolName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    totalTools: tools.reduce((acc, curr) => acc + curr.quantity, 0),
    borrowedTools: lending.filter(l => l.status === LendingStatus.APPROVED).length,
    pendingRequests: lending.filter(l => l.status === LendingStatus.PENDING).length,
    maintenance: tools.filter(t => t.status === ToolStatus.MAINTENANCE).length,
  };

  const chartData = DEPARTMENTS.map(dept => ({
    name: dept,
    total: tools.filter(t => t.department === dept).reduce((acc, curr) => acc + curr.quantity, 0)
  }));

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label={t.total_tools} value={stats.totalTools} icon={<Box className="w-6 h-6" />} color="bg-blue-500" />
        <StatCard label={t.tools_borrowed} value={stats.borrowedTools} icon={<Clock className="w-6 h-6" />} color="bg-orange-500" />
        <StatCard label={t.pending_requests} value={stats.pendingRequests} icon={<Users className="w-6 h-6" />} color="bg-purple-500" />
        <StatCard label={t.in_maintenance} value={stats.maintenance} icon={<AlertTriangle className="w-6 h-6" />} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.distribution_chart}</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: isDarkMode ? '#1e293b' : '#f8fafc'}} 
                  contentStyle={{
                    borderRadius: '12px', 
                    border: 'none', 
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#000000'
                  }} 
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#f43f5e', '#8b5cf6', '#06b6d4', '#475569'][index % 9]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">{t.recent_lending}</h3>
          <div className="space-y-6">
            {lending.slice(0, 5).map(record => (
              <div key={record.id} className="flex items-start gap-4">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors"><Clock4 className="w-5 h-5 text-slate-400" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{record.studentName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{record.toolName} • {record.department}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  record.status === LendingStatus.PENDING ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                }`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
          <button onClick={() => setActiveTab('lending')} className="w-full mt-6 py-2 flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
            {t.see_all} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderEditModal = () => {
    if (!editingTool) return null;
    const isNew = !tools.find(t => t.id === editingTool.id);
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-lg rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 my-8 border border-transparent dark:border-slate-800">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold">{isNew ? t.add_new_tool : t.edit_tool}</h3>
            <button onClick={() => { setEditingTool(null); stopCamera(); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-500 dark:text-slate-400" /></button>
          </div>
          <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="w-40 h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative">
                {isCameraActive ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : editingTool.image ? (
                  <img src={editingTool.image} alt="tool" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                )}
                <div className="absolute bottom-2 right-2">
                   {!isCameraActive ? (
                     <button type="button" onClick={startCamera} className="bg-white dark:bg-slate-700 p-2 rounded-full shadow border border-slate-200 dark:border-slate-600 hover:scale-105 transition-transform"><Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" /></button>
                   ) : (
                     <button type="button" onClick={capturePhoto} className="bg-blue-600 p-2 rounded-full shadow hover:scale-105 transition-transform"><Camera className="w-4 h-4 text-white" /></button>
                   )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t.name_photo}</label>
              <input type="text" required value={editingTool.name} onChange={(e) => setEditingTool({...editingTool, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t.stock_label}</label>
                 <input type="number" required value={editingTool.quantity} onChange={(e) => setEditingTool({...editingTool, quantity: parseInt(e.target.value) || 0, availableQuantity: parseInt(e.target.value) || 0})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none dark:text-white" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t.status}</label>
                 <select value={editingTool.status} onChange={(e) => setEditingTool({...editingTool, status: e.target.value as any})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none dark:text-white">
                   {Object.values(ToolStatus).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t.location}</label>
              <input type="text" required value={editingTool.location} onChange={(e) => setEditingTool({...editingTool, location: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t.tool_notes}</label>
              <textarea 
                value={editingTool.notes || ''} 
                onChange={(e) => setEditingTool({...editingTool, notes: e.target.value})} 
                placeholder={t.notes_placeholder}
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:text-white"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setEditingTool(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">{t.cancel}</button>
              <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">{t.save_changes}</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderBorrowModal = () => {
    if (!borrowingTool) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-lg rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 border border-transparent dark:border-slate-800">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold">{t.borrow_form}</h3>
            <button onClick={() => setBorrowingTool(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-500 dark:text-slate-400" /></button>
          </div>
          <form onSubmit={handleBorrowSubmit} className="p-6 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-2xl flex items-center gap-4 transition-colors">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-900/30 overflow-hidden">
                {borrowingTool.image ? <img src={borrowingTool.image} className="w-full h-full object-cover" /> : <Box className="w-6 h-6 text-blue-500" />}
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{t.inventory}</p>
                <p className="font-bold text-slate-900 dark:text-white">{borrowingTool.name}</p>
              </div>
            </div>

            {borrowError && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/50">{borrowError}</div>}
            
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t.student_name}</label>
              <input type="text" required value={borrowForm.studentName} onChange={(e) => setBorrowForm({...borrowForm, studentName: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t.class_label}</label>
                 <input type="text" required value={borrowForm.studentClass} onChange={(e) => setBorrowForm({...borrowForm, studentClass: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none dark:text-white" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t.borrow_qty}</label>
                 <input type="number" required min="1" value={borrowForm.quantity} onChange={(e) => setBorrowForm({...borrowForm, quantity: parseInt(e.target.value) || 1})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none dark:text-white" />
               </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">{t.notes}</label>
              <textarea 
                value={borrowForm.notes}
                onChange={(e) => setBorrowForm({...borrowForm, notes: e.target.value})}
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:text-white"
                placeholder="..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setBorrowingTool(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">{t.cancel}</button>
              <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">{t.submit_borrow}</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderInventory = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder={t.search_tools} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none dark:text-white transition-colors" />
          </div>
        </div>
        <button onClick={handleOpenAddModal} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 shrink-0">
          <Plus className="w-5 h-5" /> {t.add_tool}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto transition-colors">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.name_photo}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.department}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.available}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.location}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-right">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTools.map(tool => {
              const isAvailable = tool.availableQuantity > 0;
              const isExpanded = expandedToolId === tool.id;
              const toolHistory = lending.filter(l => l.toolId === tool.id);
              return (
                <React.Fragment key={tool.id}>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{tool.name}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded text-[10px] font-bold">{tool.department}</span></td>
                    <td className="px-6 py-4 dark:text-slate-300">{tool.availableQuantity}/{tool.quantity}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{tool.location}</td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button 
                        disabled={!isAvailable} 
                        onClick={() => setBorrowingTool({...tool})} 
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${isAvailable ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'}`}
                      >
                        {t.pinjam}
                      </button>
                      <button onClick={() => setExpandedToolId(isExpanded ? null : tool.id)} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">{t.see_history}</button>
                      <button onClick={() => setEditingTool({...tool})} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteTool(tool.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50 dark:bg-slate-800/30">
                      <td colSpan={5} className="px-8 py-4 border-b dark:border-slate-800 transition-colors">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                           <div>
                             <h4 className="font-bold text-sm mb-1 dark:text-slate-200">{t.tool_notes}</h4>
                             <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 min-h-[60px] transition-colors">{tool.notes || '-'}</p>
                           </div>
                           <div>
                             <h4 className="font-bold text-sm mb-1 dark:text-slate-200">{t.total_records}</h4>
                             <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
                               <p className="text-xl font-bold text-blue-600">{toolHistory.length}</p>
                             </div>
                           </div>
                        </div>

                        <h4 className="font-bold text-sm mb-2 dark:text-slate-200">{t.recent_lending}</h4>
                        {toolHistory.length > 0 ? (
                          <div className="space-y-2">
                            {toolHistory.slice(0, 5).map(h => (
                              <div key={h.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex justify-between text-xs dark:text-slate-300 transition-colors">
                                <span>{h.studentName} ({h.studentClass})</span>
                                <span className={`font-bold ${h.status === LendingStatus.RETURNED ? 'text-blue-500' : 'text-orange-500'}`}>{h.status}</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className="text-xs text-slate-400 dark:text-slate-500 italic">{t.no_history}</p>}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLending = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Bulk Action Bar */}
      {selectedLendingIds.size > 0 && (
        <div className="flex items-center justify-between bg-blue-600 text-white p-4 rounded-2xl shadow-lg animate-in slide-in-from-top-4 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">
              {selectedLendingIds.size}
            </div>
            <span className="font-medium text-sm">{t.items_selected}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleBulkStatusUpdate(LendingStatus.APPROVED)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all"
            >
              <CheckSquare className="w-4 h-4" /> {t.approve_selected}
            </button>
            <button 
              onClick={() => handleBulkStatusUpdate(LendingStatus.REJECTED)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all"
            >
              <XCircle className="w-4 h-4" /> {t.reject_selected}
            </button>
            <button 
              onClick={() => handleBulkStatusUpdate(LendingStatus.RETURNED)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all"
            >
              <RotateCcw className="w-4 h-4" /> {t.return_selected}
            </button>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <button 
              onClick={() => setSelectedLendingIds(new Set())}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto transition-colors">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 w-12">
                <input 
                  type="checkbox" 
                  checked={filteredLending.length > 0 && selectedLendingIds.size === filteredLending.length}
                  onChange={toggleSelectAllLending}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.inventory}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.student_class}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.borrow_date}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.status}</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-right">{t.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLending.map(record => (
              <tr 
                key={record.id} 
                className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedLendingIds.has(record.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
              >
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedLendingIds.has(record.id)}
                    onChange={() => toggleSelectLending(record.id)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{record.toolName}</td>
                <td className="px-6 py-4 dark:text-slate-300">{record.studentName} / {record.studentClass}</td>
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{new Date(record.borrowDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    record.status === LendingStatus.PENDING ? 'bg-orange-100 text-orange-600' :
                    record.status === LendingStatus.APPROVED ? 'bg-green-100 text-green-600' :
                    record.status === LendingStatus.RETURNED ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                   {record.status === LendingStatus.PENDING && (
                     <>
                        <button onClick={() => handleStatusUpdate(record, LendingStatus.APPROVED)} title={t.approve_selected} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                        <button onClick={() => handleStatusUpdate(record, LendingStatus.REJECTED)} title={t.reject_selected} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><XCircle className="w-4 h-4" /></button>
                     </>
                   )}
                   {record.status === LendingStatus.APPROVED && (
                     <button onClick={() => handleStatusUpdate(record, LendingStatus.RETURNED)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 transition-all">{lang === 'id' ? 'Kembalikan' : 'Return'}</button>
                   )}
                   <button onClick={() => handleDeleteLending(record.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} t={t} />
      <main className="flex-1 ml-64 p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white transition-colors">{t[activeTab as keyof typeof t] || activeTab}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t.welcome}</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
            >
              <Languages className="w-4 h-4" />
              {lang === 'id' ? 'EN' : 'ID'}
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800 transition-colors">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">Ahmad Fauzi</p>
                <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mt-1">Super Admin</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">AF</div>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'inventory' && renderInventory()}
        {activeTab === 'lending' && renderLending()}
        {activeTab === 'reports' && (
           <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
             <BarChart3 className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.reports}</h3>
             <p className="text-slate-400 max-w-sm mx-auto mt-2 italic">Module under development.</p>
           </div>
        )}
        {activeTab === 'settings' && (
           <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
             <Settings className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.settings}</h3>
             <p className="text-slate-400 max-w-sm mx-auto mt-2 italic">System configuration settings.</p>
           </div>
        )}
      </main>
      {renderEditModal()}
      {renderBorrowModal()}
      <AiAssistant />
    </div>
  );
};

export default App;
