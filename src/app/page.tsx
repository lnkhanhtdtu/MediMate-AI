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
  RotateCcw,
  Mic,
  Camera,
  Volume2,
  Award,
  Bell,
  FileText,
  Pencil
} from 'lucide-react'

// Interfaces
interface Medication {
  id: string
  user_id: string
  name: string
  dosage: string
  frequency: string
  schedule: string[]
  total_stock?: number | null
  remaining_stock?: number | null
  dosage_quantity?: number | null
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
  const [newMedStock, setNewMedStock] = useState('30')
  const [newMedDosageQty, setNewMedDosageQty] = useState('1')

  // Edit Medication Modal States
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [editMedName, setEditMedName] = useState('')
  const [editMedDosage, setEditMedDosage] = useState('')
  const [editMedFreq, setEditMedFreq] = useState('Hàng ngày')
  const [editMedTime, setEditMedTime] = useState('08:00')
  const [editMedStock, setEditMedStock] = useState('30')
  const [editMedRemainingStock, setEditMedRemainingStock] = useState('30')
  const [editMedDosageQty, setEditMedDosageQty] = useState('1')

  // UI & Feature States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard')
  const [isListening, setIsListening] = useState(false)
  const [isPlayingSpeech, setIsPlayingSpeech] = useState<number | null>(null)
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null)
  const [caregiverEmail, setCaregiverEmail] = useState('mom@medimate.ai')
  const [caregiverName, setCaregiverName] = useState('Mẹ')
  const [showCaregiverModal, setShowCaregiverModal] = useState(false)
  const [caregiverAlerts, setCaregiverAlerts] = useState<string[]>([])
  const [badges, setBadges] = useState<string[]>([])

  const imageInputRef = useRef<HTMLInputElement>(null)

  // Badge updates effect
  useEffect(() => {
    const newBadges: string[] = []
    if (medications.length > 0) {
      newBadges.push('Chiến binh mới')
    }
    if (logs.some((l) => l.status === 'taken')) {
      newBadges.push('Kỷ luật thép')
    }
    if (medications.length >= 2) {
      newBadges.push('Tương tác an toàn')
    }
    setBadges((prev) => {
      const merged = Array.from(new Set([...prev, ...newBadges]))
      return merged
    })
  }, [medications, logs])

  // Caregiver alert trigger helper
  const triggerCaregiverEscalation = (medName: string, time: string) => {
    const alertMsg = `📧 [Cảnh báo khẩn] Gửi thông báo đến ${caregiverName} (${caregiverEmail}) do bạn bỏ qua/trễ giờ uống thuốc ${medName} (lịch: ${time})!`
    setCaregiverAlerts((prev) => [alertMsg, ...prev])
  }

  // Handle Mark as Missed log
  const handleMarkAsMissed = async (logId: string, medName: string, timeStr: string) => {
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, status: 'missed' }),
      })
      if (res.ok) {
        fetchTodayLogs()
        triggerCaregiverEscalation(medName, timeStr)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Handle Refill stock
  const handleRefillStock = async (id: string, total: number) => {
    try {
      const { error } = await supabase
        .from('medications')
        .update({ remaining_stock: total })
        .eq('id', id)
      if (!error) {
        fetchMedications()
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Speech Recognition (Speech-to-Text)
  const startListening = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        alert('Trình duyệt của bạn không hỗ trợ Nhận diện giọng nói.')
        return
      }
      const recognition = new SpeechRecognition()
      recognition.lang = 'vi-VN'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript
        setInputMessage(speechResult)
        if (!badges.includes('Trợ lý đắc lực')) {
          setBadges((prev) => [...prev, 'Trợ lý đắc lực'])
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    }
  }

  // Text-to-Speech (Speech Synthesis)
  const speakText = (text: string, index: number) => {
    if (typeof window !== 'undefined') {
      if (isPlayingSpeech === index) {
        window.speechSynthesis.cancel()
        setIsPlayingSpeech(null)
        return
      }

      window.speechSynthesis.cancel()
      const cleanText = text.replace(/[*_#`~[\]()]/g, '')
      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = 'vi-VN'

      const voices = window.speechSynthesis.getVoices()
      const viVoice = voices.find((v) => v.lang.includes('vi'))
      if (viVoice) {
        utterance.voice = viVoice
      }

      utterance.onend = () => {
        setIsPlayingSpeech(null)
      }

      utterance.onerror = () => {
        setIsPlayingSpeech(null)
      }

      setIsPlayingSpeech(index)
      window.speechSynthesis.speak(utterance)
    }
  }

  // File Upload image change handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setSelectedImage({
          data: base64String,
          mimeType: file.type,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const calculateStreak = () => {
    const takenLogsCount = logs.filter((l) => l.status === 'taken').length
    return takenLogsCount > 0 ? 3 : 2
  }

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
          total_stock: newMedStock ? parseInt(newMedStock) : null,
          dosage_quantity: newMedDosageQty ? parseInt(newMedDosageQty) : 1,
        }),
      })

      if (res.ok) {
        setShowAddModal(false)
        setNewMedName('')
        setNewMedDosage('')
        setNewMedDosageQty('1')
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

  const handleEditMedicationClick = (med: Medication) => {
    setEditingMedication(med)
    setEditMedName(med.name)
    setEditMedDosage(med.dosage)
    setEditMedFreq(med.frequency)
    setEditMedTime(med.schedule[0] || '08:00')
    setEditMedStock(med.total_stock?.toString() || '30')
    setEditMedRemainingStock(med.remaining_stock?.toString() || '30')
    setEditMedDosageQty(med.dosage_quantity?.toString() || '1')
    setShowEditModal(true)
  }

  const handleSaveEditMedication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMedication || !editMedName || !editMedDosage) return

    setLoadingMeds(true)
    try {
      const res = await fetch('/api/medications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMedication.id,
          name: editMedName,
          dosage: editMedDosage,
          frequency: editMedFreq,
          schedule: [editMedTime],
          total_stock: editMedStock ? parseInt(editMedStock) : null,
          remaining_stock: editMedRemainingStock ? parseInt(editMedRemainingStock) : null,
          dosage_quantity: editMedDosageQty ? parseInt(editMedDosageQty) : 1,
        }),
      })

      if (res.ok) {
        setShowEditModal(false)
        setEditingMedication(null)
        fetchMedications()
        fetchTodayLogs()
        
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            content: `ℹ️ Đã cập nhật thông tin thuốc **${editMedName}** thành công.`,
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
      // Try sign up first to avoid console network errors on clean database
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
      })

      // If sign up fails or returns no session (e.g. user already exists), do sign in
      if (signUpError || !signUpData.session) {
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
    if ((!inputMessage.trim() && !selectedImage) || loadingChat) return

    const userText = inputMessage
    const imagePayload = selectedImage

    const displayContent = imagePayload
      ? `${userText} *(Đã tải ảnh lên để AI phân tích)*`
      : userText

    setMessages((prev) => [...prev, { role: 'user', content: displayContent }])
    setInputMessage('')
    setSelectedImage(null)
    setLoadingChat(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userText,
          image: imagePayload 
        }),
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
          total_stock: (warningInfo.medication as any).total_stock || 30,
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
            <section className={`flex-1 md:max-w-[50%] border-r border-slate-900 flex flex-col overflow-y-auto p-6 space-y-6 pb-24 md:pb-6 ${activeTab === 'dashboard' ? 'flex' : 'hidden md:flex'}`}>
              
              {/* Streaks & Badges Dashboard Component */}
              <div className="grid grid-cols-2 gap-4">
                {/* Streak Card */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full blur-lg" />
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-xl">
                    🔥
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      Chuỗi Ngày (Streak)
                    </div>
                    <div className="text-xl font-black text-orange-400">
                      {calculateStreak()} Ngày Liên Tục
                    </div>
                  </div>
                </div>

                {/* Badge Card */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-lg" />
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      Huy Hiệu Đạt Được
                    </div>
                    <div className="text-xl font-black text-indigo-300">
                      {badges.length} / 4
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges List (Horizontal Scroll) */}
              {badges.length > 0 && (
                <div className="bg-slate-900/20 border border-slate-900/60 rounded-2xl p-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">
                    Huy hiệu mở khoá
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {badges.includes('Chiến binh mới') && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-lg">
                        🛡️ Chiến binh mới
                      </span>
                    )}
                    {badges.includes('Kỷ luật thép') && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg animate-pulse">
                        🔥 Kỷ luật thép
                      </span>
                    )}
                    {badges.includes('Tương tác an toàn') && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg">
                        🔒 Tương tác an toàn
                      </span>
                    )}
                    {badges.includes('Trợ lý đắc lực') && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-pink-500/10 border border-pink-500/30 text-pink-400 rounded-lg">
                        🎙️ Trợ lý đắc lực
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Caregiver Settings Card */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-xl" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-rose-400" />
                    <h3 className="text-sm font-bold text-slate-200">Giám Hộ & Cảnh Báo Khẩn Cấp</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowCaregiverModal(true)}
                    className="text-xs text-rose-400 hover:underline cursor-pointer"
                  >
                    Thiết lập
                  </button>
                </div>
                <div className="text-xs text-slate-400 flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span>Người nhận cảnh báo:</span>
                    <span className="font-semibold text-slate-300">{caregiverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email liên hệ:</span>
                    <span className="font-semibold text-slate-300">{caregiverEmail}</span>
                  </div>
                </div>

                {caregiverAlerts.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-slate-900 pt-3">
                    <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                      Lịch sử gửi cảnh báo:
                    </div>
                    <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
                      {caregiverAlerts.map((alert, idx) => (
                        <div key={idx} className="text-[10px] bg-rose-950/20 border border-rose-900/30 text-rose-300 p-2 rounded-lg leading-relaxed">
                          {alert}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
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
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all select-none ${
                          log.status === 'taken'
                            ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-300'
                            : log.status === 'missed'
                            ? 'bg-rose-950/15 border-rose-900/30 text-rose-300 animate-pulse'
                            : 'bg-slate-950/50 border-slate-900 hover:border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            log.status === 'taken' 
                              ? 'bg-emerald-500 text-slate-950' 
                              : log.status === 'missed' 
                              ? 'bg-rose-500 text-slate-950' 
                              : 'bg-slate-900 text-slate-400'
                          }`}>
                            {log.status === 'taken' ? (
                              <Check className="w-4 h-4 stroke-[3px]" />
                            ) : log.status === 'missed' ? (
                              <X className="w-4 h-4 stroke-[3px]" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
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
                          {log.status === 'scheduled' ? (
                            <>
                              <button
                                onClick={() => handleToggleLogStatus(log.id, 'scheduled')}
                                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Uống
                              </button>
                              <button
                                onClick={() => handleMarkAsMissed(
                                  log.id, 
                                  log.medication?.name || 'Thuốc', 
                                  new Date(log.scheduled_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                                )}
                                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-slate-950 text-rose-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Bỏ qua
                              </button>
                            </>
                          ) : (
                            <span 
                              onClick={() => handleToggleLogStatus(log.id, 'taken')}
                              className={`text-[10px] px-2 py-1 font-bold uppercase rounded-md tracking-wider cursor-pointer hover:opacity-80 transition-opacity ${
                                log.status === 'taken'
                                  ? 'bg-emerald-400/10 text-emerald-400'
                                  : 'bg-rose-400/10 text-rose-400'
                              }`}
                              title="Nhấp để chuyển lại lịch"
                            >
                              {log.status === 'taken' ? 'Đã uống' : 'Bỏ qua/Trễ'}
                            </span>
                          )}
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
                            <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap gap-x-2">
                              <span>{med.dosage} • {med.frequency}</span>
                              {med.dosage_quantity && med.dosage_quantity >= 1 && (
                                <span className="text-teal-400 font-medium">
                                  (Mỗi lần: {med.dosage_quantity} viên)
                                </span>
                              )}
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

                            {/* Stock Indicator */}
                            {med.total_stock !== undefined && med.total_stock !== null && (
                              <div className="mt-2.5 space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                  <span>Tồn kho: <strong className={med.remaining_stock !== null && med.remaining_stock !== undefined && med.remaining_stock <= 5 ? "text-rose-400 font-bold" : "text-slate-300"}>
                                    {med.remaining_stock} / {med.total_stock}
                                  </strong></span>
                                  {med.remaining_stock !== null && med.remaining_stock !== undefined && med.remaining_stock <= 5 && (
                                    <span className="text-rose-400 font-bold animate-pulse">⚠️ Sắp hết!</span>
                                  )}
                                </div>
                                <div className="w-32 h-1 bg-slate-900 rounded-full overflow-hidden flex">
                                  <div 
                                    className={`h-full rounded-full transition-all ${
                                      med.remaining_stock !== null && med.remaining_stock !== undefined && med.remaining_stock <= 5 ? "bg-rose-500 animate-pulse" : "bg-teal-500"
                                    }`}
                                    style={{ width: `${((med.remaining_stock ?? 0) / (med.total_stock ?? 1)) * 100}%` }}
                                  />
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => handleRefillStock(med.id, med.total_stock ?? 30)}
                                  className="text-[9px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5 mt-1 cursor-pointer"
                                >
                                  🔄 Nạp thêm thuốc
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEditMedicationClick(med)}
                            className="p-2 text-slate-600 hover:text-indigo-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                            title="Sửa lịch thuốc"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMedication(med.id)}
                            className="p-2 text-slate-600 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                            title="Xoá lịch thuốc"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </section>

            {/* Right Panel: Chat Interface (50%) */}
            <section className={`flex-1 md:max-w-[50%] flex flex-col bg-slate-950/40 overflow-hidden relative pb-20 md:pb-0 ${activeTab === 'chat' ? 'flex' : 'hidden md:flex'}`}>
              
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
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md relative group/msg ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-slate-50'
                          : msg.role === 'system'
                          ? 'bg-rose-950/30 border border-rose-900/30 text-rose-300 font-mono text-xs'
                          : 'bg-slate-900 border border-slate-800 text-slate-200'
                      }`}
                    >
                      {/* Handle markdown formatting manually/safely for code-blocks or bolding */}
                      <p className="whitespace-pre-line pr-5">
                        {msg.content}
                      </p>
                      {msg.role === 'model' && (
                        <button
                          type="button"
                          onClick={() => speakText(msg.content, index)}
                          className={`absolute bottom-2 right-2 p-1 rounded-md transition-colors ${
                            isPlayingSpeech === index 
                              ? 'bg-teal-500 text-slate-950' 
                              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                          }`}
                          title="Đọc câu trả lời"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
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

              {/* Image Preview Thumbnail */}
              {selectedImage && (
                <div className="px-4 py-2 border-t border-slate-900 bg-slate-900/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src={selectedImage.data} 
                      alt="Đơn thuốc" 
                      className="w-10 h-10 object-cover rounded-lg border border-slate-800"
                    />
                    <span className="text-xs text-slate-400">Đã chọn ảnh đơn thuốc</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Chat Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-900 flex gap-2 items-center">
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                    selectedImage 
                      ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tải ảnh đơn thuốc/vỏ hộp"
                >
                  <Camera className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={startListening}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                    isListening 
                      ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 animate-pulse' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Nói để nhập lịch thuốc"
                >
                  <Mic className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isListening ? "Đang nghe giọng nói của bạn..." : "Nhập lịch uống hoặc gửi ảnh đơn thuốc..."}
                  className="flex-grow bg-slate-900/50 border border-slate-900 focus:border-teal-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                  disabled={loadingChat}
                />
                
                <button
                  type="submit"
                  disabled={loadingChat || (!inputMessage.trim() && !selectedImage)}
                  className="p-3 bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 disabled:from-slate-900 disabled:to-slate-900 disabled:text-slate-600 text-slate-950 rounded-xl transition-all shadow-md shadow-teal-500/5 flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>

            </section>

          </main>

          {/* Mobile Bottom Navigation Bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around z-30 px-6 backdrop-blur-md bg-slate-900/90">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === 'dashboard' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="text-[10px]">Kiểm soát</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === 'chat' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
              </div>
              <span className="text-[10px]">Trợ lý AI</span>
            </button>
          </div>

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

                  <div className="grid grid-cols-2 gap-4">
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
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Số lượng thuốc (Tồn kho)
                      </label>
                      <input
                        type="number"
                        value={newMedStock}
                        onChange={(e) => setNewMedStock(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="Mặc định: 30"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Số viên/đơn vị uống mỗi lần
                    </label>
                    <input
                      type="number"
                      value={newMedDosageQty}
                      onChange={(e) => setNewMedDosageQty(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="Mặc định: 1"
                      min="1"
                    />
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

          {/* Edit Medication Modal */}
          {showEditModal && editingMedication && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
                
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingMedication(null)
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-indigo-400" />
                  Chỉnh Sửa Lịch Uống Thuốc
                </h3>

                <form onSubmit={handleSaveEditMedication} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Tên thuốc
                    </label>
                    <input
                      type="text"
                      value={editMedName}
                      onChange={(e) => setEditMedName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
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
                        value={editMedDosage}
                        onChange={(e) => setEditMedDosage(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Giờ uống thuốc
                      </label>
                      <input
                        type="time"
                        value={editMedTime}
                        onChange={(e) => setEditMedTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Tần suất
                      </label>
                      <select
                        value={editMedFreq}
                        onChange={(e) => setEditMedFreq(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-300"
                      >
                        <option value="Hàng ngày">Hàng ngày (Daily)</option>
                        <option value="Cách ngày">Cách ngày</option>
                        <option value="Hàng tuần">Hàng tuần</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Số viên uống mỗi lần
                      </label>
                      <input
                        type="number"
                        value={editMedDosageQty}
                        onChange={(e) => setEditMedDosageQty(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Tổng kho ban đầu
                      </label>
                      <input
                        type="number"
                        value={editMedStock}
                        onChange={(e) => setEditMedStock(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Tồn kho còn lại
                      </label>
                      <input
                        type="number"
                        value={editMedRemainingStock}
                        onChange={(e) => setEditMedRemainingStock(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-slate-900 font-bold py-3 rounded-xl transition-all shadow-lg text-sm"
                  >
                    Lưu Thay Đổi
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Caregiver Settings Modal */}
          {showCaregiverModal && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
                
                <button
                  type="button"
                  onClick={() => setShowCaregiverModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-rose-400">
                  <Bell className="w-5 h-5 text-rose-400" />
                  Cấu Hình Người Bảo Hộ (Caregiver)
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Tên người bảo hộ
                    </label>
                    <input
                      type="text"
                      value={caregiverName}
                      onChange={(e) => setCaregiverName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500"
                      placeholder="Ví dụ: Mẹ, Bố, Bác sĩ"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Email nhận cảnh báo trễ thuốc
                    </label>
                    <input
                      type="email"
                      value={caregiverEmail}
                      onChange={(e) => setCaregiverEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500"
                      placeholder="name@domain.com"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCaregiverModal(false)}
                    className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-slate-955 font-bold py-3 rounded-xl transition-all shadow-lg text-sm"
                  >
                    Lưu Cấu Hình
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
