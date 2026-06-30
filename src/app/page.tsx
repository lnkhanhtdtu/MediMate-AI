'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  Plus,
  Trash2,
  User as UserIcon,
  AlertTriangle,
  Send,
  LogOut,
  Sparkles,
  HelpCircle,
  X,
  Check,
  RotateCcw
} from 'lucide-react'

// Interfaces
interface Medication {
  id: string
  user_id: string
  name: string
  dosage: string
  frequency: string
  schedule: string[]
  created_at: string
}

interface MedicationLog {
  id: string
  user_id: string
  medication_id: string
  scheduled_time: string
  taken_at: string | null
  status: 'taken' | 'missed' | 'scheduled'
  medication?: Medication
}

interface ChatMessage {
  role: 'user' | 'model' | 'system'
  content: string
}

export default function Home() {
  const supabase = createClient()

  // State Variables
  const [user, setUser] = useState<any>(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const [medications, setMedications] = useState<Medication[]>([])
  const [logs, setLogs] = useState<MedicationLog[]>([])
  const [loadingMeds, setLoadingMeds] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content:
        'Xin chào! Tôi là trợ lý sức khỏe MediMate AI. Bạn có thể nhập lịch uống thuốc bằng ngôn ngữ tự nhiên (ví dụ: "Nhắc tớ uống Aspirin 81mg lúc 8h sáng hàng ngày") hoặc nhắn cho tôi khi đã uống thuốc (ví dụ: "Tớ đã uống Aspirin rồi"). Tôi sẽ tự động kiểm tra tương tác thuốc giúp bạn nhé! 💊',
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)

  // Floating modal for manual add (optional helper)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newMedName, setNewMedName] = useState('')
  const [newMedDosage, setNewMedDosage] = useState('')
  const [newMedFreq, setNewMedFreq] = useState('Hàng ngày')
  const [newMedTime, setNewMedTime] = useState('08:00')

  // Warning Interaction State
  const [warningInfo, setWarningInfo] = useState<{
    severity: string
    explanation: string
    medication: {
      name: string
      dosage: string
      frequency: string
      schedule: string[]
    }
  } | null>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auth State Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch Data when User logs in
  useEffect(() => {
    if (user) {
      fetchMedications()
      fetchTodayLogs()
    } else {
      setMedications([])
      setLogs([])
    }
  }, [user])

  // CRUD & Fetch Functions
  const fetchMedications = async () => {
    setLoadingMeds(true)
    try {
      const res = await fetch('/api/medications')
      const data = await res.json()
      if (Array.isArray(data)) {
        setMedications(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMeds(false)
    }
  }

  const fetchTodayLogs = async () => {
    setLoadingLogs(true)
    try {
      const res = await fetch('/api/logs')
      const data = await res.json()
      if (Array.isArray(data)) {
        setLogs(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleManualAddMedication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMedName || !newMedDosage) return

    setLoadingMeds(true)
    try {
      const res = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMedName,
          dosage: newMedDosage,
          frequency: newMedFreq,
          schedule: [newMedTime],
        }),
      })

      if (res.ok) {
        setShowAddModal(false)
        setNewMedName('')
        setNewMedDosage('')
        fetchMedications()
        fetchTodayLogs()
        
        // Add helper bot message
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            content: `✅ Đã thêm thuốc **${newMedName}** vào lịch trình của bạn thành công (uống lúc ${newMedTime}).`,
          },
        ])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMeds(false)
    }
  }

  const handleDeleteMedication = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá lịch uống loại thuốc này?')) return
    try {
      const res = await fetch(`/api/medications?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchMedications()
        fetchTodayLogs()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleLogStatus = async (logId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'taken' ? 'scheduled' : 'taken'
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, status: nextStatus }),
      })
      if (res.ok) {
        fetchTodayLogs()
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Auth Operations
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError(null)

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        })
        if (error) throw error
        alert('Đăng ký thành công! Hãy kiểm tra email để xác nhận tài khoản (nếu cần) hoặc đăng nhập ngay.')
        setAuthMode('login')
      }
    } catch (err: any) {
      setAuthError(err.message || 'Lỗi xác thực.')
    } finally {
      setAuthLoading(false)
    }
  }

  // Quick Guest/Demo Sign In for Hackathon Judges
  const handleDemoSignIn = async () => {
    setAuthLoading(true)
    setAuthError(null)
    const demoEmail = 'demo@medimate.ai'
    const demoPassword = 'demomedimate123'

    try {
      // Try login first
      const { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      })

      if (error) {
        // If user doesn't exist, sign up then login
        const { error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
        })
        if (signUpError) throw signUpError

        // Sign in after sign up
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        })
        if (signInError) throw signInError
      }
    } catch (err: any) {
      setAuthError(err.message || 'Không thể tạo phiên demo.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  // Chat/Agent Operations
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputMessage.trim() || loadingChat) return

    const userText = inputMessage
    setMessages((prev) => [...prev, { role: 'user', content: userText }])
    setInputMessage('')
    setLoadingChat(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      })

      const data = await res.json()

      if (data.error) {
        setMessages((prev) => [...prev, { role: 'system', content: `❌ Lỗi: ${data.error}` }])
      } else if (data.action === 'WARNING_INTERACTION') {
        // We received a drug interaction warning!
        setWarningInfo(data.warning)
        setMessages((prev) => [...prev, { role: 'model', content: data.message }])
      } else {
        // Success response
        setMessages((prev) => [...prev, { role: 'model', content: data.message }])
        // Refresh local data in case medication or log was modified
        if (data.action === 'MEDICATION_ADDED' || data.action === 'LOG_RECORDED') {
          fetchMedications()
          fetchTodayLogs()
        }
      }
    } catch (err) {
      console.error(err)
      setMessages((prev) => [...prev, { role: 'system', content: '❌ Lỗi kết nối đến máy chủ.' }])
    } finally {
      setLoadingChat(false)
    }
  }

  // Force Add Medication ignoring warnings
  const handleBypassWarningAndAdd = async () => {
    if (!warningInfo) return
    setLoadingMeds(true)
    try {
      const res = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: warningInfo.medication.name,
          dosage: warningInfo.medication.dosage,
          frequency: warningInfo.medication.frequency,
          schedule: warningInfo.medication.schedule,
        }),
      })

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            content: `⚠️ *Bỏ qua cảnh báo.* Đã thêm thuốc **${warningInfo.medication.name}** vào lịch trình theo yêu cầu của bạn.`,
          },
        ])
        setWarningInfo(null)
        fetchMedications()
        fetchTodayLogs()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMeds(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-900">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-900/20 via-slate-950 to-slate-950 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950 to-slate-950 pointer-events-none z-0" />

      {/* Auth Screen */}
      {!user ? (
        <div className="flex flex-col items-center justify-center flex-1 px-4 py-12 z-10">
          <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-tr from-teal-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 mb-4 animate-pulse">
                <Activity className="w-9 h-9 text-slate-900" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-300 to-indigo-300 bg-clip-text text-transparent">
                MediMate AI
              </h1>
              <p className="text-sm text-slate-400 mt-2">
                AI-powered medication reminder & safety agent
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                  placeholder="name@domain.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>

              {authError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-slate-900 font-bold py-3 rounded-xl transition-all shadow-lg shadow-teal-500/15 text-sm"
              >
                {authLoading ? 'Đang xử lý...' : authMode === 'login' ? 'Đăng Nhập' : 'Đăng Ký'}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-4 text-center">
              <button
                onClick={() => setAuthMode((m) => (m === 'login' ? 'signup' : 'login'))}
                className="text-xs text-teal-400 hover:underline cursor-pointer"
              >
                {authMode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
              </button>

              <div className="w-full flex items-center my-1 text-slate-600">
                <div className="flex-grow border-t border-slate-800" />
                <span className="px-3 text-xs uppercase tracking-wider font-semibold">Hoặc</span>
                <div className="flex-grow border-t border-slate-800" />
              </div>

              <button
                onClick={handleDemoSignIn}
                disabled={authLoading}
                className="w-full bg-slate-950/60 border border-slate-800 hover:border-indigo-500 text-indigo-300 hover:text-indigo-200 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Dùng Thử Tài Khoản Demo (Không Cần Đăng Ký)
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* App Main Screen */
        <div className="flex flex-col flex-grow z-10 max-h-screen">
          
          {/* Header */}
          <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-teal-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-md shadow-teal-500/10">
                <Activity className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-teal-300 to-indigo-300 bg-clip-text text-transparent flex items-center gap-2">
                  MediMate AI
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                  Personal Health Agent
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300 font-medium">{user.email}</span>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Main Workspace Layout */}
          <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Left Panel: Dashboard (50%) */}
            <section className="flex-1 md:max-w-[50%] border-r border-slate-900 flex flex-col overflow-y-auto p-6 space-y-6">
              
              {/* Daily Checklist Tracker */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl" />
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-teal-400" />
                    <h2 className="text-lg font-bold">Lịch Uống Thuốc Hôm Nay</h2>
                  </div>
                  
                  <span className="text-xs px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full font-medium">
                    {logs.filter(l => l.status === 'taken').length}/{logs.length} Đã dùng
                  </span>
                </div>

                {loadingLogs ? (
                  <div className="space-y-3">
                    <div className="h-12 bg-slate-800/40 animate-pulse rounded-xl" />
                    <div className="h-12 bg-slate-800/40 animate-pulse rounded-xl" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    Chưa có lịch trình thuốc nào cho hôm nay.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        onClick={() => handleToggleLogStatus(log.id, log.status)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none ${
                          log.status === 'taken'
                            ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-300'
                            : 'bg-slate-950/50 border-slate-900 hover:border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            log.status === 'taken' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400'
                          }`}>
                            {log.status === 'taken' ? <Check className="w-4 h-4 stroke-[3px]" /> : <Clock className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-sm">
                              {log.medication?.name} - {log.medication?.dosage}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {new Date(log.scheduled_time).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded-md tracking-wider ${
                            log.status === 'taken'
                              ? 'bg-emerald-400/10 text-emerald-400'
                              : 'bg-slate-800 text-slate-500'
                          }`}>
                            {log.status === 'taken' ? 'Đã uống' : 'Chưa uống'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Medication Management List */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-lg font-bold">Danh Sách Thuốc Đang Dùng</h2>
                  </div>

                  <button
                    onClick={() => setShowAddModal(true)}
                    className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500 hover:text-slate-950 text-indigo-400 rounded-lg transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm Nhanh
                  </button>
                </div>

                {loadingMeds ? (
                  <div className="space-y-3 flex-grow">
                    <div className="h-16 bg-slate-800/40 animate-pulse rounded-xl" />
                    <div className="h-16 bg-slate-800/40 animate-pulse rounded-xl" />
                  </div>
                ) : medications.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm flex-grow flex flex-col items-center justify-center">
                    <HelpCircle className="w-10 h-10 mb-2 text-slate-700" />
                    Chưa đăng ký loại thuốc nào.
                    <br />
                    Hãy chat với MediMate AI ở khung bên phải để thêm thuốc!
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[300px] md:max-h-[400px]">
                    {medications.map((med) => (
                      <div
                        key={med.id}
                        className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-900 hover:border-slate-800 rounded-xl transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-indigo-400 text-sm">
                              {med.name.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-200">{med.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {med.dosage} • {med.frequency}
                            </div>
                            <div className="flex gap-1.5 mt-1.5">
                              {med.schedule.map((time, idx) => (
                                <span
                                  key={idx}
                                  className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-md"
                                >
                                  {time}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteMedication(med.id)}
                          className="p-2 text-slate-600 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                          title="Xoá lịch thuốc"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </section>

            {/* Right Panel: Chat Interface (50%) */}
            <section className="flex-1 md:max-w-[50%] flex flex-col bg-slate-950/40 overflow-hidden relative">
              
              {/* Chat Title / Agent Indicator */}
              <div className="px-6 py-4 border-b border-slate-900 flex items-center justify-between bg-slate-950/20">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-teal-400" />
                  <span className="font-bold text-sm">Hội thoại với Trợ lý AI</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Gemini 3.1 Flash-Lite
                </div>
              </div>

              {/* Chat Log Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-slate-50'
                          : msg.role === 'system'
                          ? 'bg-rose-950/30 border border-rose-900/30 text-rose-300 font-mono text-xs'
                          : 'bg-slate-900 border border-slate-800 text-slate-200'
                      }`}
                    >
                      {/* Handle markdown formatting manually/safely for code-blocks or bolding */}
                      <p className="whitespace-pre-line">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}

                {loadingChat && (
                  <div className="flex justify-start">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Interaction Warning Panel Overlay */}
              {warningInfo && (
                <div className="absolute inset-x-0 bottom-[76px] bg-slate-900 border-t border-rose-900/50 p-4 shadow-xl z-20 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-rose-400">
                        Cảnh Báo Tương Tác Y Khoa Nghiêm Trọng!
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        {warningInfo.explanation}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => setWarningInfo(null)}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 rounded-lg transition-colors cursor-pointer"
                    >
                      Huỷ bỏ & Không thêm
                    </button>
                    <button
                      onClick={handleBypassWarningAndAdd}
                      className="px-3 py-2 bg-rose-500/20 border border-rose-500/30 hover:bg-rose-500 hover:text-slate-950 text-rose-300 rounded-lg transition-all font-semibold cursor-pointer"
                    >
                      Bỏ qua & Tiếp tục thêm
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-900 flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Nhập lịch uống thuốc mới hoặc báo đã uống thuốc..."
                  className="flex-grow bg-slate-900/50 border border-slate-900 focus:border-teal-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                  disabled={loadingChat}
                />
                
                <button
                  type="submit"
                  disabled={loadingChat || !inputMessage.trim()}
                  className="p-3 bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 disabled:from-slate-900 disabled:to-slate-900 disabled:text-slate-600 text-slate-950 rounded-xl transition-all shadow-md shadow-teal-500/5 flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>

            </section>

          </main>

          {/* Manual Add Medication Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
                
                <button
                  onClick={() => setShowAddModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-400" />
                  Đăng Ký Lịch Uống Thuốc Mới
                </h3>

                <form onSubmit={handleManualAddMedication} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Tên thuốc
                    </label>
                    <input
                      type="text"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="Ví dụ: Aspirin, Paracetamol"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Liều lượng
                      </label>
                      <input
                        type="text"
                        value={newMedDosage}
                        onChange={(e) => setNewMedDosage(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="Ví dụ: 81mg, 1 viên"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Thời gian uống
                      </label>
                      <input
                        type="time"
                        value={newMedTime}
                        onChange={(e) => setNewMedTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Tần suất
                    </label>
                    <select
                      value={newMedFreq}
                      onChange={(e) => setNewMedFreq(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-300"
                    >
                      <option value="Hàng ngày">Hàng ngày (Daily)</option>
                      <option value="Cách ngày">Cách ngày</option>
                      <option value="Hàng tuần">Hàng tuần</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-slate-900 font-bold py-3 rounded-xl transition-all shadow-lg text-sm"
                  >
                    Thêm Lịch Trình
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
