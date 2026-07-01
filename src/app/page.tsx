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
  Pencil,
  ShieldAlert,
  Users
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
  prescription_name?: string | null
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

const translations = {
  vi: {
    title: "MediMate AI",
    subtitle: "Trợ lý Sức khỏe Cá nhân",
    streak: "Chuỗi Ngày (Streak)",
    streakSub: "Đã uống thuốc đều đặn!",
    badges: "Huy Hiệu Đạt Được",
    badgesSub: "Thành tích tuân thủ điều trị",
    todaySchedule: "Lịch Uống Thuốc Hôm Nay",
    noMedsToday: "Chưa có lịch trình thuốc nào cho hôm nay.",
    medList: "Danh Sách Thuốc Đang Dùng",
    addFast: "Thêm Nhanh",
    noMedsRegistered: "Chưa đăng ký loại thuốc nào.",
    chatPrompt: "Hãy chat với MediMate AI ở khung bên phải hoặc chụp đơn thuốc để thêm thuốc!",
    guardian: "Giám Hộ & Cảnh Báo Khẩn Cấp",
    guardianName: "Người nhận cảnh báo:",
    guardianEmail: "Email liên hệ:",
    alertHistory: "Lịch sử gửi cảnh báo:",
    setup: "Thiết lập",
    takeGroup: "Uống nhóm",
    skip: "Bỏ qua",
    taken: "Đã uống",
    scheduled: "Chưa uống",
    skippedBadge: "Bỏ qua",
    medName: "Tên thuốc",
    dosage: "Liều lượng",
    frequency: "Tần suất",
    time: "Giờ uống",
    stock: "Số lượng thuốc (Tồn kho)",
    dosageQty: "Số viên uống mỗi lần",
    save: "Lưu Lại",
    cancel: "Hủy",
    prescriptionName: "Nhãn đơn thuốc (Tùy chọn)",
    course: "Liệu trình",
    remaining: "Còn lại",
    estimatedEnd: "dự kiến hết ngày",
    demoSignIn: "Dùng Thử Tài Khoản Demo (Không Cần Đăng Ký)",
    customLabel: "Nhãn đơn tự đặt hoặc nhập mới",
    optional: "Tùy chọn",
    guardianSetup: "Cấu Hình Người Bảo Hộ (Caregiver)",
    guardianNameInput: "Tên người bảo hộ",
    guardianEmailInput: "Email nhận cảnh báo trễ thuốc",
    saveConfig: "Lưu Cấu Hình",
    weekly: "Hàng tuần",
    everyOtherDay: "Cách ngày",
    daily: "Hàng ngày",
    editMed: "Chỉnh Sửa Thông Tin Thuốc",
    initialStock: "Tổng kho ban đầu",
    remainingStock: "Tồn kho còn lại",
    deleteMed: "Xóa Thuốc",
    addMedTitle: "Đăng Ký Lịch Uống Thuốc Mới",
    emptyLogs: "Chưa có nhật ký hôm nay.",
    emptyMeds: "Chưa có thuốc nào.",
    quickAddPlaceholder: "Ví dụ: Aspirin, Paracetamol",
    logout: "Đăng xuất",
    welcome: "Xin chào! Tôi là trợ lý sức khỏe MediMate AI. Bạn có thể nhập lịch uống thuốc bằng ngôn ngữ tự nhiên (ví dụ: \"Nhắc tớ uống Aspirin 81mg lúc 8h sáng hàng ngày\") hoặc nhắn cho tôi khi đã uống thuốc (ví dụ: \"Tớ đã uống Aspirin rồi\"). Tôi sẽ tự động kiểm tra tương tác thuốc giúp bạn nhé! 💊",
    typeMsg: "Nhập tin nhắn nhắc thuốc, hỏi đáp sức khỏe...",
    aiThinking: "MediMate AI đang phân tích...",
    send: "Gửi",
    loginTitle: "Chào Mừng Đến Với MediMate AI",
    loginSub: "Trợ lý ảo thông minh nhắc lịch và phân tích tương tác thuốc bằng AI",
    authLogin: "Đăng Nhập",
    authSignup: "Đăng Ký",
    emailLabel: "Địa chỉ Email",
    passLabel: "Mật khẩu",
    emailPlaceholder: "name@example.com",
    passPlaceholder: "Nhập mật khẩu",
    noAccount: "Chưa có tài khoản? Đăng ký ngay",
    haveAccount: "Đã có tài khoản? Đăng nhập",
    days: "ngày",
    capsules: "viên",
    or: "Hoặc",
    processing: "Đang xử lý...",
    guardianAlert: "Cảnh báo khẩn",
    guardianAlertSent: "Gửi thông báo đến",
    dueToMissed: "do bạn bỏ qua/trễ giờ uống thuốc",
  },
  en: {
    title: "MediMate AI",
    subtitle: "Personal Health Agent",
    streak: "Compliance Streak",
    streakSub: "Consistent pill adherence!",
    badges: "Badges Earned",
    badgesSub: "Adherence achievements",
    todaySchedule: "Today's Medication Schedule",
    noMedsToday: "No medications scheduled for today.",
    medList: "Current Medications List",
    addFast: "Quick Add",
    noMedsRegistered: "No medications registered.",
    chatPrompt: "Chat with MediMate AI on the right or upload a prescription to add medications!",
    guardian: "Guardian & Emergency Warning",
    guardianName: "Recipient Name:",
    guardianEmail: "Contact Email:",
    alertHistory: "Alert History:",
    setup: "Configure",
    takeGroup: "Take Group",
    skip: "Skip",
    taken: "Taken",
    scheduled: "Scheduled",
    skippedBadge: "Skipped",
    medName: "Medication Name",
    dosage: "Dosage",
    frequency: "Frequency",
    time: "Time",
    stock: "Stock Quantity",
    dosageQty: "Dosage Quantity",
    save: "Save",
    cancel: "Cancel",
    prescriptionName: "Prescription Label (Optional)",
    course: "Duration",
    remaining: "Remaining",
    estimatedEnd: "estimated end date",
    demoSignIn: "Try Demo Account (No Registration Required)",
    customLabel: "Custom label or enter new one",
    optional: "Optional",
    guardianSetup: "Configure Guardian (Caregiver)",
    guardianNameInput: "Guardian Name",
    guardianEmailInput: "Alert Recipient Email",
    saveConfig: "Save Configuration",
    weekly: "Weekly",
    everyOtherDay: "Every Other Day",
    daily: "Daily",
    editMed: "Edit Medication Details",
    initialStock: "Initial Stock",
    remainingStock: "Remaining Stock",
    deleteMed: "Delete Medication",
    addMedTitle: "Add New Medication Schedule",
    emptyLogs: "No logs for today.",
    emptyMeds: "No medications registered.",
    quickAddPlaceholder: "e.g. Aspirin, Paracetamol",
    logout: "Log Out",
    welcome: "Hello! I am your MediMate AI health assistant. You can enter your medication schedule using natural language (e.g., \"Remind me to take Aspirin 81mg at 8 AM daily\") or tell me when you have taken a pill (e.g., \"I took my Aspirin\"). I will automatically check for drug interactions for you! 💊",
    typeMsg: "Type a medication reminder or ask health questions...",
    aiThinking: "MediMate AI is analyzing...",
    send: "Send",
    loginTitle: "Welcome to MediMate AI",
    loginSub: "Intelligent virtual assistant for medication reminders and AI drug interaction checks",
    authLogin: "Log In",
    authSignup: "Sign Up",
    emailLabel: "Email Address",
    passLabel: "Password",
    emailPlaceholder: "name@example.com",
    passPlaceholder: "Enter your password",
    noAccount: "Don't have an account? Sign up",
    haveAccount: "Already have an account? Log in",
    days: "days",
    capsules: "pills",
    or: "Or",
    processing: "Processing...",
    guardianAlert: "Emergency Alert",
    guardianAlertSent: "Alert sent to",
    dueToMissed: "due to missing medication",
  }
}

export default function Home() {
  const supabase = createClient()

  // State Variables
  const [lang, setLang] = useState<'vi' | 'en'>('vi')
  const t = translations[lang]

  const [user, setUser] = useState<any>(null)
  const isAdmin = user && user.email && (user.email.toLowerCase().includes('admin') || user.email === 'admin@medimate.ai')
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
  const [newMedPrescriptionName, setNewMedPrescriptionName] = useState('')

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
  const [editMedPrescriptionName, setEditMedPrescriptionName] = useState('')

  // UI & Feature States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'admin'>('dashboard')
  const [isListening, setIsListening] = useState(false)
  const [isPlayingSpeech, setIsPlayingSpeech] = useState<number | null>(null)
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null)
  const [caregiverEmail, setCaregiverEmail] = useState('mom@medimate.ai')
  const [caregiverName, setCaregiverName] = useState('Mẹ')
  const [showCaregiverModal, setShowCaregiverModal] = useState(false)
  const [caregiverAlerts, setCaregiverAlerts] = useState<string[]>([])
  const [badges, setBadges] = useState<string[]>([])

  // Admin & Stats States
  const [streak, setStreak] = useState<number>(0)
  const [adminData, setAdminData] = useState<{
    stats: {
      totalUsers: number
      totalMeds: number
      totalLogs: number
      complianceRate: number
    }
    users: Array<{
      id: string
      email: string
      created_at: string
      medCount: number
      todayLogs: { taken: number; total: number }
      streak: number
      medications: any[]
    }>
  } | null>(null)
  const [loadingAdmin, setLoadingAdmin] = useState(false)
  const [selectedAdminUser, setSelectedAdminUser] = useState<any | null>(null)
  const [broadcastMessage, setBroadcastMessage] = useState('')

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
    const alertMsg = `📧 [${t.guardianAlert}] ${t.guardianAlertSent} ${caregiverName} (${caregiverEmail}) ${t.dueToMissed} ${medName} (lịch: ${time})!`
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
      const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp']
      const MAX_SIZE = 5 * 1024 * 1024 // 5MB
      if (!ALLOWED_MIME.includes(file.type)) {
        alert(lang === 'vi' ? 'Định dạng ảnh không được hỗ trợ. Vui lòng gửi ảnh PNG, JPEG hoặc WEBP.' : 'Unsupported format. Please send a PNG, JPEG, or WEBP image.')
        if (imageInputRef.current) imageInputRef.current.value = ''
        return
      }
      if (file.size > MAX_SIZE) {
        alert(lang === 'vi' ? 'Ảnh vượt quá dung lượng tối đa 5MB.' : 'Image size exceeds the 5MB limit.')
        if (imageInputRef.current) imageInputRef.current.value = ''
        return
      }
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

  // Update initial welcome message on language switch
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'model') {
        return [{ role: 'model', content: t.welcome }]
      }
      return prev
    })
  }, [lang, t.welcome])

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
      fetchStats()
      if (user.email && (user.email.toLowerCase().includes('admin') || user.email === 'admin@medimate.ai')) {
        fetchAdminData()
      }
    } else {
      setMedications([])
      setLogs([])
      setStreak(0)
      setAdminData(null)
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

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      if (data && typeof data.streak === 'number') {
        setStreak(data.streak)
      }
    } catch (e) {
      console.error('Error fetching stats:', e)
    }
  }

  const fetchAdminData = async () => {
    setLoadingAdmin(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data && data.users) {
        setAdminData(data)
      }
    } catch (e) {
      console.error('Error fetching admin data:', e)
    } finally {
      setLoadingAdmin(false)
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
          total_stock: newMedStock ? parseFloat(newMedStock) : null,
          dosage_quantity: newMedDosageQty ? parseFloat(newMedDosageQty) : 1,
          prescription_name: newMedPrescriptionName || null,
        }),
      })

      if (res.ok) {
        setShowAddModal(false)
        setNewMedName('')
        setNewMedDosage('')
        setNewMedDosageQty('1')
        setNewMedPrescriptionName('')
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
    setEditMedPrescriptionName(med.prescription_name || '')
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
          total_stock: editMedStock ? parseFloat(editMedStock) : null,
          remaining_stock: editMedRemainingStock ? parseFloat(editMedRemainingStock) : null,
          dosage_quantity: editMedDosageQty ? parseFloat(editMedDosageQty) : 1,
          prescription_name: editMedPrescriptionName || null,
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
        fetchMedications()
        fetchStats()
        if (user?.email && (user.email.toLowerCase().includes('admin') || user.email === 'admin@medimate.ai')) {
          fetchAdminData()
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleBatchTakeAll = async (logsToTake: typeof logs) => {
    try {
      await Promise.all(
        logsToTake.map(log => 
          fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logId: log.id, status: 'taken' }),
          })
        )
      )
      fetchTodayLogs()
      fetchMedications()
      fetchStats()
      if (user?.email && (user.email.toLowerCase().includes('admin') || user.email === 'admin@medimate.ai')) {
        fetchAdminData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleBatchMissAll = async (logsToMiss: typeof logs) => {
    try {
      await Promise.all(
        logsToMiss.map(log => 
          fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logId: log.id, status: 'missed' }),
          })
        )
      )
      fetchTodayLogs()
      fetchMedications()
      fetchStats()
      if (user?.email && (user.email.toLowerCase().includes('admin') || user.email === 'admin@medimate.ai')) {
        fetchAdminData()
      }
      logsToMiss.forEach(log => {
        const timeStr = new Date(log.scheduled_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        triggerCaregiverEscalation(log.medication?.name || 'Thuốc', timeStr)
      })
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
          dosage_quantity: (warningInfo.medication as any).dosage_quantity || 1,
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
              <button
                onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
                className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-teal-500/50 text-slate-300 rounded-full text-xs font-semibold cursor-pointer select-none transition-all flex items-center gap-1"
              >
                <span>{lang === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
                <span>{lang === 'vi' ? 'VI' : 'EN'}</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setActiveTab(activeTab === 'admin' ? 'dashboard' : 'admin')}
                  className={`hidden md:flex px-3 py-1.5 border rounded-xl text-xs font-semibold items-center gap-1.5 cursor-pointer transition-all ${
                    activeTab === 'admin' 
                      ? 'bg-teal-500/20 border-teal-500 text-teal-400' 
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-teal-500/30'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? 'Quản trị' : 'Admin'}</span>
                </button>
              )}

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300 font-medium">{user.email}</span>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                title={t.logout}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Main Workspace Layout */}
          <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Left Panel: Dashboard (50%) */}
            <section className={`flex-1 md:max-w-[50%] border-r border-slate-900 flex flex-col overflow-y-auto p-6 space-y-6 pb-24 md:pb-6 ${activeTab === 'dashboard' ? 'flex' : (activeTab === 'admin' ? 'hidden' : 'hidden md:flex')}`}>
              
              {/* Streaks & Badges Dashboard Component */}
              <div className="grid grid-cols-2 gap-4 shrink-0">
                {/* Streak Card */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full blur-lg" />
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-xl">
                    🔥
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      {t.streak}
                    </div>
                    <div className="text-xl font-black text-orange-400">
                      {streak} {lang === 'vi' ? 'Ngày Liên Tục' : 'Days Streak'}
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
                      {t.badges}
                    </div>
                    <div className="text-xl font-black text-indigo-300">
                      {badges.length} / 4
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges List (Horizontal Scroll) */}
              {badges.length > 0 && (
                <div className="bg-slate-900/20 border border-slate-900/60 rounded-2xl p-4 shrink-0">
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
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-xl" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-rose-400" />
                    <h3 className="text-sm font-bold text-slate-200">{t.guardian}</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowCaregiverModal(true)}
                    className="text-xs text-rose-400 hover:underline cursor-pointer"
                  >
                    {t.setup}
                  </button>
                </div>
                <div className="text-xs text-slate-400 flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span>{t.guardianName}</span>
                    <span className="font-semibold text-slate-300">{caregiverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.guardianEmail}</span>
                    <span className="font-semibold text-slate-300">{caregiverEmail}</span>
                  </div>
                </div>

                {caregiverAlerts.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-slate-900 pt-3">
                    <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                      {t.alertHistory}
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
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl" />
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-teal-400" />
                    <h2 className="text-lg font-bold">{t.todaySchedule}</h2>
                  </div>
                  
                  <span className="text-xs px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full font-medium">
                    {logs.filter(l => l.status === 'taken').length}/{logs.length} {t.taken}
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
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {(() => {
                      // 1. Group logs by scheduled time (HH:MM)
                      const groupedByTime: Record<string, typeof logs> = {}
                      logs.forEach(log => {
                        const timeKey = new Date(log.scheduled_time).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        if (!groupedByTime[timeKey]) groupedByTime[timeKey] = []
                        groupedByTime[timeKey].push(log)
                      })

                      return Object.entries(groupedByTime).map(([timeSlot, slotLogs]) => {
                        const hasScheduled = slotLogs.some(l => l.status === 'scheduled')
                        const allTaken = slotLogs.every(l => l.status === 'taken')

                        // 2. Within this time slot, group logs by prescription name
                        const groupedByPrescription: Record<string, typeof logs> = {}
                        slotLogs.forEach(log => {
                          const prescriptionKey = log.medication?.prescription_name || 'Thuốc lẻ / Tự thêm'
                          if (!groupedByPrescription[prescriptionKey]) groupedByPrescription[prescriptionKey] = []
                          groupedByPrescription[prescriptionKey].push(log)
                        })

                        return (
                          <div key={timeSlot} className="p-4 bg-slate-950/30 border border-slate-900/60 rounded-2xl space-y-3 relative overflow-hidden">
                            {/* Blue decorative left bar */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-teal-500/20" />
                            
                            {/* Time Slot Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-900/40">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-teal-400" />
                                <span className="font-bold text-sm text-slate-200">{timeSlot}</span>
                              </div>
                            </div>

                            {/* Prescription Subgroups */}
                            <div className="space-y-3 pt-1">
                              {Object.entries(groupedByPrescription).map(([prescriptionName, prescriptionLogs]) => {
                                const hasPrescriptionScheduled = prescriptionLogs.some(l => l.status === 'scheduled')
                                
                                return (
                                  <div key={prescriptionName} className="space-y-1.5 pl-1.5 border-l border-indigo-500/20">
                                    {/* Subgroup Header */}
                                    <div className="flex items-center justify-between pb-1 pr-1">
                                      <div className="flex items-center gap-1.5">
                                        <FileText className="w-3 h-3 text-indigo-400/80" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                          {prescriptionName}
                                        </span>
                                      </div>

                                      <div className="flex gap-1.5">
                                        {hasPrescriptionScheduled && (
                                          <>
                                            <button
                                              onClick={() => handleBatchTakeAll(prescriptionLogs.filter(l => l.status === 'scheduled'))}
                                              className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 rounded text-[9px] font-bold transition-all cursor-pointer"
                                            >
                                              {t.takeGroup}
                                            </button>
                                            <button
                                              onClick={() => handleBatchMissAll(prescriptionLogs.filter(l => l.status === 'scheduled'))}
                                              className="px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500 hover:text-slate-950 text-rose-400 rounded text-[9px] font-bold transition-all cursor-pointer"
                                            >
                                              {t.skip}
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {/* List of Medications */}
                                    <div className="space-y-1.5 pl-1">
                                      {prescriptionLogs.map(log => (
                                        <div key={log.id} className="flex items-center justify-between py-0.5">
                                          <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                              log.status === 'taken' ? 'bg-emerald-500' : log.status === 'missed' ? 'bg-rose-500 animate-pulse' : 'bg-slate-700'
                                            }`} />
                                            <span className={`text-[11px] font-medium ${log.status === 'taken' ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                              {log.medication?.name} - {log.medication?.dosage}
                                            </span>
                                            {log.medication?.dosage_quantity && log.medication.dosage_quantity >= 0.1 && (
                                              <span className="text-[9px] text-teal-400 font-semibold bg-teal-500/10 border border-teal-500/20 px-1 py-0.5 rounded">
                                                {log.medication.dosage_quantity} {t.capsules}
                                              </span>
                                            )}
                                          </div>

                                          <span
                                            onClick={() => handleToggleLogStatus(log.id, log.status)}
                                            className={`text-[8px] px-1.5 py-0.5 rounded cursor-pointer select-none transition-all font-bold border ${
                                              log.status === 'taken'
                                                ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400 hover:bg-emerald-900/20'
                                                : log.status === 'missed'
                                                ? 'bg-rose-950/25 border-rose-900/30 text-rose-400 hover:bg-rose-900/20'
                                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                                            }`}
                                          >
                                            {log.status === 'taken' ? t.taken : log.status === 'missed' ? t.skippedBadge : t.scheduled}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}
              </div>

              {/* Medication Management List */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-lg font-bold">{t.medList}</h2>
                  </div>

                  <button
                    onClick={() => setShowAddModal(true)}
                    className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500 hover:text-slate-950 text-indigo-400 rounded-lg transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {t.addFast}
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
                    {t.noMedsRegistered}
                    <br />
                    {t.chatPrompt}
                  </div>
                ) : (
                  <div className="space-y-6 overflow-y-auto max-h-[300px] md:max-h-[400px] pr-1">
                    {(() => {
                      const grouped: Record<string, Medication[]> = {}
                      medications.forEach(med => {
                        const groupKey = med.prescription_name || 'Thuốc lẻ / Tự thêm'
                        if (!grouped[groupKey]) grouped[groupKey] = []
                        grouped[groupKey].push(med)
                      })
                      return Object.entries(grouped).map(([groupName, groupMeds]) => (
                        <div key={groupName} className="space-y-2.5">
                          {/* Group Header */}
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/30 rounded-xl border border-slate-900/60 sticky top-0 bg-slate-950/80 backdrop-blur z-10 shrink-0">
                            <FileText className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                              {groupName}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-900 text-slate-500 rounded-md font-mono font-bold">
                              {groupMeds.length} {lang === 'vi' ? 'thuốc' : 'meds'}
                            </span>
                          </div>

                          {/* Group Medications */}
                          <div className="space-y-3">
                            {groupMeds.map((med) => (
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
                                      {med.dosage_quantity && med.dosage_quantity >= 0.1 && (
                                        <span className="text-teal-400 font-medium">
                                          ({lang === 'vi' ? 'Mỗi lần' : 'Each'}: {med.dosage_quantity} {t.capsules})
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
                                          <span>{lang === 'vi' ? 'Tồn kho' : 'Stock'}: <strong className={med.remaining_stock !== null && med.remaining_stock !== undefined && med.remaining_stock <= 5 ? "text-rose-400 font-bold" : "text-slate-300"}>
                                            {med.remaining_stock} / {med.total_stock}
                                          </strong></span>
                                          {med.remaining_stock !== null && med.remaining_stock !== undefined && med.remaining_stock <= 5 && (
                                            <span className="text-rose-400 font-bold animate-pulse">{lang === 'vi' ? '⚠️ Sắp hết!' : '⚠️ Low stock!'}</span>
                                          )}
                                        </div>

                                        {/* Prescription projection calculation */}
                                        {(() => {
                                          const timesPerDay = med.schedule.length || 1
                                          const doseQty = med.dosage_quantity || 1
                                          const dosePerDay = timesPerDay * doseQty
                                          if (med.total_stock) {
                                            const totalDays = Math.ceil(med.total_stock / dosePerDay)
                                            const remainingDays = med.remaining_stock !== undefined && med.remaining_stock !== null 
                                              ? Math.ceil(med.remaining_stock / dosePerDay)
                                              : totalDays

                                            const startDate = new Date(med.created_at)
                                            const endDate = new Date(startDate.getTime() + totalDays * 24 * 60 * 60 * 1000)
                                            const endDateStr = endDate.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })

                                            return (
                                              <div className="text-[10px] text-indigo-300 font-medium mt-1 leading-relaxed">
                                                ⏱️ {t.course}: <strong className="text-slate-200">{totalDays} {t.days}</strong> ({t.remaining}: <strong className="text-slate-200">{remainingDays} {t.days}</strong>, {t.estimatedEnd} {endDateStr})
                                              </div>
                                            )
                                          }
                                          return null
                                        })()}

                                        <div className="w-32 h-1 bg-slate-900 rounded-full overflow-hidden flex mt-1">
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
                                          🔄 {lang === 'vi' ? 'Nạp thêm thuốc' : 'Refill Medication'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleEditMedicationClick(med)}
                                    className="p-2 text-slate-600 hover:text-indigo-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                                    title={lang === 'vi' ? 'Sửa lịch thuốc' : 'Edit Medication'}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMedication(med.id)}
                                    className="p-2 text-slate-600 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                                    title={lang === 'vi' ? 'Xoá lịch thuốc' : 'Delete Medication'}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                )}
              </div>

            </section>

            {/* Right Panel: Chat Interface (50%) */}
            <section className={`flex-1 md:max-w-[50%] flex flex-col bg-slate-950/40 overflow-hidden relative pb-20 md:pb-0 ${activeTab === 'chat' ? 'flex' : (activeTab === 'admin' ? 'hidden' : 'hidden md:flex')}`}>
              
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
                  title={lang === 'vi' ? 'Nói để nhập lịch thuốc' : 'Speak to input schedule'}
                >
                  <Mic className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isListening ? (lang === 'vi' ? "Đang nghe..." : "Listening...") : (lang === 'vi' ? "Nhập lịch uống hoặc gửi ảnh đơn thuốc..." : "Enter schedule or send prescription image...")}
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

            {/* Admin Portal (Full Width) */}
            {activeTab === 'admin' && isAdmin && (
              <section className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6 pb-24 md:pb-6 bg-slate-950/20">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
                      <ShieldAlert className="w-6 h-6 text-teal-400" />
                      {lang === 'vi' ? 'Quản trị Hệ thống' : 'System Administration'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {lang === 'vi' ? 'Xem thống kê toàn hệ thống, giám sát tuân thủ và hỗ trợ người dùng.' : 'View system metrics, monitor patient adherence, and support users.'}
                    </p>
                  </div>
                  <button
                    onClick={fetchAdminData}
                    disabled={loadingAdmin}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/30 text-teal-400 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${loadingAdmin ? 'animate-spin' : ''}`} />
                    {lang === 'vi' ? 'Làm mới dữ liệu' : 'Refresh Data'}
                  </button>
                </div>

                {/* System Stats Overview */}
                {adminData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden">
                      <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                          {lang === 'vi' ? 'Người dùng' : 'Active Users'}
                        </div>
                        <div className="text-xl font-black text-teal-300">
                          {adminData.stats.totalUsers}
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden">
                      <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                          {lang === 'vi' ? 'Đơn thuốc' : 'Medications'}
                        </div>
                        <div className="text-xl font-black text-indigo-300">
                          {adminData.stats.totalMeds}
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                          {lang === 'vi' ? 'Lượt uống hôm nay' : 'Logs Today'}
                        </div>
                        <div className="text-xl font-black text-orange-300">
                          {adminData.stats.totalLogs}
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                          {lang === 'vi' ? 'Tỷ lệ tuân thủ' : 'Adherence Rate'}
                        </div>
                        <div className="text-xl font-black text-emerald-300">
                          {adminData.stats.complianceRate}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Users List Table */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    {lang === 'vi' ? 'Danh sách bệnh nhân' : 'Patient Adherence Directory'}
                  </h3>
                  {loadingAdmin ? (
                    <div className="py-12 flex justify-center items-center text-sm text-slate-400 gap-2">
                      <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      {lang === 'vi' ? 'Đang tải danh sách người dùng...' : 'Loading patient directory...'}
                    </div>
                  ) : adminData && adminData.users.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-bold">
                            <th className="py-3 px-4">{lang === 'vi' ? 'Bệnh nhân' : 'Patient Email'}</th>
                            <th className="py-3 px-4">{lang === 'vi' ? 'Ngày tham gia' : 'Joined Date'}</th>
                            <th className="py-3 px-4 text-center">{lang === 'vi' ? 'Số thuốc' : 'Medications'}</th>
                            <th className="py-3 px-4 text-center">{lang === 'vi' ? 'Nhật ký hôm nay' : 'Today Adherence'}</th>
                            <th className="py-3 px-4 text-center">{lang === 'vi' ? 'Chuỗi ngày' : 'Streak'}</th>
                            <th className="py-3 px-4 text-right">{lang === 'vi' ? 'Hành động' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminData.users.map((item) => (
                            <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-900/10 text-slate-300">
                              <td className="py-3 px-4 font-medium max-w-[200px] truncate">{item.email}</td>
                              <td className="py-3 px-4 text-xs text-slate-500">
                                {new Date(item.created_at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                              </td>
                              <td className="py-3 px-4 text-center font-semibold text-indigo-400">{item.medCount}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  item.todayLogs.total === 0 
                                    ? 'bg-slate-800 text-slate-400' 
                                    : (item.todayLogs.taken === item.todayLogs.total ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400')
                                }`}>
                                  {item.todayLogs.taken} / {item.todayLogs.total}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="font-bold text-orange-400">🔥 {item.streak}</span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => setSelectedAdminUser(item)}
                                  className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-teal-400 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                                >
                                  {lang === 'vi' ? 'Xem lịch thuốc' : 'View Schedule'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-slate-500">
                      {lang === 'vi' ? 'Chưa có người dùng nào.' : 'No users found.'}
                    </div>
                  )}
                </div>

                {/* Announcement Broadcast Section */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-400" />
                    {lang === 'vi' ? 'Phát thông báo hệ thống' : 'System-Wide Broadcast Alerts'}
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder={lang === 'vi' ? 'Nhập nội dung thông báo khẩn cấp...' : 'Enter message to broadcast...'}
                      className="flex-grow bg-slate-900/50 border border-slate-900 focus:border-teal-500 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors text-slate-200"
                    />
                    <button
                      onClick={() => {
                        if (!broadcastMessage.trim()) return
                        alert(lang === 'vi' ? `Đã phát thông báo: "${broadcastMessage}" tới tất cả người dùng!` : `Broadcasted: "${broadcastMessage}" to all users!`)
                        setBroadcastMessage('')
                      }}
                      className="px-5 py-3 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-slate-950 font-bold rounded-xl transition-all shadow-md cursor-pointer text-sm"
                    >
                      {lang === 'vi' ? 'Gửi' : 'Send'}
                    </button>
                  </div>
                </div>
              </section>
            )}

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
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  activeTab === 'admin' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
                <span className="text-[10px]">Quản trị</span>
              </button>
            )}
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
                        min="0.1"
                        step="any"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Số viên uống mỗi lần
                      </label>
                      <input
                        type="number"
                        value={newMedDosageQty}
                        onChange={(e) => setNewMedDosageQty(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="Mặc định: 1"
                        min="0.1"
                        step="any"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Nhãn đơn thuốc (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={newMedPrescriptionName}
                        onChange={(e) => setNewMedPrescriptionName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="Ví dụ: Đơn khớp, Đơn huyết áp"
                      />
                    </div>
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
                  <div className="grid grid-cols-2 gap-4">
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
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Nhãn đơn thuốc (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={editMedPrescriptionName}
                        onChange={(e) => setEditMedPrescriptionName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="Ví dụ: Đơn khớp, Đơn huyết áp"
                      />
                    </div>
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
                        min="0.1"
                        step="any"
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
                        min="0.1"
                        step="any"
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
                        step="any"
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
                    className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg text-sm"
                  >
                    Lưu Cấu Hình
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Admin view user medication schedule modal */}
          {selectedAdminUser && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
                
                <button
                  onClick={() => setSelectedAdminUser(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-bold mb-2 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <span>{lang === 'vi' ? 'Chi tiết lịch thuốc' : 'Patient Medication Schedule'}</span>
                </h3>

                <p className="text-xs text-slate-400 mb-4 font-semibold">
                  {lang === 'vi' ? `Tài khoản: ${selectedAdminUser.email}` : `Account: ${selectedAdminUser.email}`}
                </p>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {selectedAdminUser.medications && selectedAdminUser.medications.length > 0 ? (
                    selectedAdminUser.medications.map((med: any) => (
                      <div key={med.id || med.name} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-slate-200">{med.name}</h4>
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md text-[10px] font-bold">
                            {med.dosage}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                          <span>⏱️ {med.frequency}</span>
                          <span>📦 {lang === 'vi' ? `Còn lại: ${med.remaining_stock ?? med.total_stock ?? 'N/A'}` : `Remaining: ${med.remaining_stock ?? med.total_stock ?? 'N/A'}`}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {med.schedule && med.schedule.map((time: string) => (
                            <span key={time} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md text-[10px] text-slate-300">
                              🕒 {time}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-6">
                      {lang === 'vi' ? 'Không có thuốc nào được đăng ký.' : 'No medications registered.'}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 mt-4 flex justify-end">
                  <button
                    onClick={() => setSelectedAdminUser(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    {lang === 'vi' ? 'Đóng' : 'Close'}
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
