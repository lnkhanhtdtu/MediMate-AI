'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { AddMedicationModal, EditMedicationModal, PatientDetailModal, AddUserModal, PrescriptionReviewModal } from '@/components/Modals'
import { AuthScreen, AppHeader, BottomNav, ComingSoon, MMToggle } from '@/components/Chrome'
import type { Tab } from '@/components/types'

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
    imageUploaded: "Đã tải ảnh lên để AI phân tích",
    send: "Gửi",
    loginTitle: "Chào Mừng Đến Với MediMate AI",
    loginSub: "Trợ lý ảo thông minh nhắc lịch và phân tích tương tác thuốc bằng AI",
    authLogin: "Đăng Nhập",
    emailLabel: "Địa chỉ Email",
    passLabel: "Mật khẩu",
    emailPlaceholder: "name@example.com",
    passPlaceholder: "Nhập mật khẩu",
    days: "ngày",
    capsules: "viên",
    or: "Hoặc",
    processing: "Đang xử lý...",
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
    imageUploaded: "Image uploaded for AI analysis",
    send: "Send",
    loginTitle: "Welcome to MediMate AI",
    loginSub: "Intelligent virtual assistant for medication reminders and AI drug interaction checks",
    authLogin: "Log In",
    emailLabel: "Email Address",
    passLabel: "Password",
    emailPlaceholder: "name@example.com",
    passPlaceholder: "Enter your password",
    days: "days",
    capsules: "pills",
    or: "Or",
    processing: "Processing...",
  }
}

// Severity → banner styling (kept in sync with the admin severity chips) so the
// system broadcast banner is colour-coded and icon-tagged by its severity.
type BroadcastSeverity = 'info' | 'warning' | 'urgent'
const BROADCAST_STYLE: Record<BroadcastSeverity, { bg: string; border: string; color: string; icon: string }> = {
  info: { bg: '#EAF3EC', border: '#C9DCCF', color: 'var(--mm-primary-dark)', icon: 'campaign' },
  warning: { bg: '#FBEEE0', border: '#F2D9B8', color: '#B06A2C', icon: 'warning' },
  urgent: { bg: '#FDF1EF', border: '#F0D6D2', color: '#C0574E', icon: 'priority_high' },
}
const broadcastStyle = (s?: string) => BROADCAST_STYLE[(s as BroadcastSeverity)] ?? BROADCAST_STYLE.info

// Achievement badge metadata (icon + bilingual label). Keyed by the VN string the app
// stores in `badges`; unknown values fall back to the raw string.
const BADGE_META: Record<string, { icon: string; vi: string; en: string }> = {
  'Chiến binh mới': { icon: 'military_tech', vi: 'Chiến binh mới', en: 'New warrior' },
  'Kỷ luật thép': { icon: 'fitness_center', vi: 'Kỷ luật thép', en: 'Iron discipline' },
  'Tương tác an toàn': { icon: 'verified_user', vi: 'Tương tác an toàn', en: 'Safe interactions' },
  'Trợ lý đắc lực': { icon: 'mic', vi: 'Trợ lý đắc lực', en: 'Voice pro' },
}

export default function Home() {
  const supabase = createClient()

  // State Variables
  const [lang, setLang] = useState<'vi' | 'en'>('en')
  const t = translations[lang]

  const [user, setUser] = useState<any>(null)
  const isAdmin = user && user.email && (user.email.toLowerCase().includes('admin') || user.email === 'admin@medimate.ai')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const [medications, setMedications] = useState<Medication[]>([])
  const [logs, setLogs] = useState<MedicationLog[]>([])
  const [loadingMeds, setLoadingMeds] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content: t.welcome,
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
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [isListening, setIsListening] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null)
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
      name?: string | null
      created_at: string
      medCount: number
      todayLogs: { taken: number; total: number }
      todayLogDetails?: any[]
      streak: number
      medications: any[]
    }>
    serviceKeyMissing?: boolean
  } | null>(null)
  const [loadingAdmin, setLoadingAdmin] = useState(false)
  const [selectedAdminUser, setSelectedAdminUser] = useState<any | null>(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [showProfile, setShowProfile] = useState(false)
  const [prescriptionReview, setPrescriptionReview] = useState<Medication[] | null>(null)
  const [fontScale, setFontScale] = useState<'sm' | 'md' | 'lg'>('md')
  const [pushReminders, setPushReminders] = useState(true)
  const [emailReminders, setEmailReminders] = useState(false)
  // Mobile-only bottom nav: render it purely from the layout viewport width
  // (independent of CSS media queries / cache / element zoom) so it never shows on desktop.
  const [isMobileNav, setIsMobileNav] = useState(false)
  useEffect(() => {
    const check = () => setIsMobileNav(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Deep-linking: open the tab named in ?tab= (from /admin, /schedule … redirect routes).
  useEffect(() => {
    if (!user) return
    const tab = new URLSearchParams(window.location.search).get('tab')
    const valid = ['dashboard', 'schedule', 'chat', 'stats', 'admin']
    if (!tab || !valid.includes(tab)) return
    setActiveTab(tab === 'admin' && !isAdmin ? 'dashboard' : (tab as Tab))
  }, [user, isAdmin])

  // Weekly adherence stats (current Mon–Sun), read straight from medication_logs (RLS-scoped).
  const [weekly, setWeekly] = useState<null | {
    byDay: { label: string; pct: number | null }[]
    byMed: { name: string; taken: number; total: number; pct: number }[]
    weekPct: number; taken: number; total: number
  }>(null)
  useEffect(() => {
    if (activeTab !== 'stats' || !user) return
    let cancelled = false
    ;(async () => {
      const now = new Date()
      const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const monday = new Date(todayMid)
      monday.setDate(todayMid.getDate() - ((todayMid.getDay() + 6) % 7))
      const start = new Date(monday)
      const end = new Date(monday); end.setDate(monday.getDate() + 6); end.setHours(23, 59, 59, 999)
      const { data, error } = await supabase
        .from('medication_logs')
        .select('scheduled_time,status,medication_id')
        .gte('scheduled_time', start.toISOString())
        .lte('scheduled_time', end.toISOString())
      if (cancelled) return
      if (error || !data) { setWeekly({ byDay: [], byMed: [], weekPct: 0, taken: 0, total: 0 }); return }
      const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
      const labels = lang === 'vi' ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const byDay = labels.map((label, i) => {
        const d = new Date(monday); d.setDate(monday.getDate() + i)
        const isFuture = d > todayMid
        const dayLogs = data.filter((l) => sameDay(new Date(l.scheduled_time), d))
        const total = dayLogs.length
        const taken = dayLogs.filter((l) => l.status === 'taken').length
        return { label, pct: (isFuture || total === 0) ? null : Math.round((taken / total) * 100) }
      })
      const nameById = new Map(medications.map((m) => [m.id, m.name]))
      const past = data.filter((l) => new Date(l.scheduled_time) <= now)
      const medMap = new Map<string, { taken: number; total: number }>()
      for (const l of past) {
        const name = nameById.get(l.medication_id) || 'Thuốc'
        const e = medMap.get(name) || { taken: 0, total: 0 }
        e.total++; if (l.status === 'taken') e.taken++
        medMap.set(name, e)
      }
      const byMed = [...medMap.entries()].map(([name, v]) => ({ name, taken: v.taken, total: v.total, pct: v.total > 0 ? Math.round((v.taken / v.total) * 100) : 0 })).sort((a, b) => b.pct - a.pct)
      const total = past.length
      const taken = past.filter((l) => l.status === 'taken').length
      setWeekly({ byDay, byMed, weekPct: total > 0 ? Math.round((taken / total) * 100) : 0, taken, total })
    })()
    return () => { cancelled = true }
  }, [activeTab, user, medications, lang])

  // Accessibility: scale the whole UI (zoom works on px-based styling).
  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem('medimate_fontScale')) as 'sm' | 'md' | 'lg' | null
    if (saved === 'sm' || saved === 'md' || saved === 'lg') setFontScale(saved)
  }, [])
  useEffect(() => {
    const map = { sm: '0.92', md: '1', lg: '1.12' } as const
    document.documentElement.style.setProperty('zoom', map[fontScale])
    if (typeof window !== 'undefined') localStorage.setItem('medimate_fontScale', fontScale)
  }, [fontScale])
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastSeverity, setBroadcastSeverity] = useState<'info' | 'warning' | 'urgent'>('info')
  // Latest system broadcast (shown as a banner to all users)
  const [latestBroadcast, setLatestBroadcast] = useState<{ id?: string; message: string; title?: string | null; severity?: string; created_at: string } | null>(null)
  // Remember which broadcast the user dismissed so the banner stays closed on reload.
  const [dismissedBroadcast, setDismissedBroadcast] = useState<string | null>(null)
  // Admin: create-user modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [creatingUser, setCreatingUser] = useState(false)

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
        alert(lang === 'vi' ? 'Trình duyệt của bạn không hỗ trợ Nhận diện giọng nói.' : 'Your browser does not support speech recognition.')
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

  // Restore client settings from localStorage on startup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Restoring UI Preferences
      const savedLang = localStorage.getItem('medimate_lang')
      if (savedLang === 'vi' || savedLang === 'en') setLang(savedLang)

      // Light-only theme (MediMate redesign): dark mode retired — always run light,
      // ignore any previously saved dark preference.

      const savedPush = localStorage.getItem('medimate_pushReminders')
      if (savedPush !== null) setPushReminders(savedPush === 'true')
      const savedEmail = localStorage.getItem('medimate_emailReminders')
      if (savedEmail !== null) setEmailReminders(savedEmail === 'true')
    }
  }, [])

  // Persist reminder preferences
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('medimate_pushReminders', String(pushReminders))
  }, [pushReminders])
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('medimate_emailReminders', String(emailReminders))
  }, [emailReminders])

  // Schedule in-browser push reminders for today's still-pending doses (fires while the
  // app tab is open — the honest client-only reminder path, no server cron required).
  useEffect(() => {
    if (!user || !pushReminders) return
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return
    const now = Date.now()
    const timers: number[] = []
    logs.filter((l) => l.status === 'scheduled').forEach((l) => {
      const delay = new Date(l.scheduled_time).getTime() - now
      if (delay > 0 && delay < 24 * 3600 * 1000) {
        const id = window.setTimeout(() => {
          try {
            new Notification(lang === 'vi' ? 'MediMate — Nhắc uống thuốc' : 'MediMate — Medication reminder', {
              body: `${l.medication?.name ?? ''} · ${l.medication?.dosage ?? ''}`.trim(),
            })
          } catch (_) {}
        }, delay)
        timers.push(id)
      }
    })
    return () => timers.forEach((tId) => clearTimeout(tId))
  }, [pushReminders, logs, user, lang])

  // Toggle push reminders, requesting browser notification permission when enabling.
  const togglePushReminders = async () => {
    const next = !pushReminders
    if (next && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      try { await Notification.requestPermission() } catch (_) {}
    }
    if (next && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied') {
      alert(lang === 'vi' ? 'Trình duyệt đang chặn thông báo. Hãy bật quyền Thông báo cho trang này để nhận nhắc nhở.' : 'Notifications are blocked. Please allow notifications for this site to receive reminders.')
    }
    setPushReminders(next)
  }

  // Snooze a dose: schedule a local browser reminder N minutes later (works while the tab
  // is open) and acknowledge in the chat thread.
  const handleSnooze = (log: MedicationLog, minutes = 15) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') { try { Notification.requestPermission() } catch (_) {} }
      if (Notification.permission === 'granted') {
        window.setTimeout(() => {
          try {
            new Notification(lang === 'vi' ? 'MediMate — Nhắc lại' : 'MediMate — Reminder', {
              body: `${log.medication?.name ?? ''} · ${log.medication?.dosage ?? ''}`.trim(),
            })
          } catch (_) {}
        }, minutes * 60000)
      }
    }
    setMessages((prev) => [
      ...prev,
      {
        role: 'model',
        content: lang === 'vi'
          ? `⏰ Đã hoãn nhắc **${log.medication?.name}** thêm ${minutes} phút.`
          : `⏰ Snoozed **${log.medication?.name}** for ${minutes} minutes.`,
      },
    ])
  }

  // Persist language to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('medimate_lang', lang)
    }
  }, [lang])



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
  const fetchMedications = async (silent = false) => {
    if (!silent) setLoadingMeds(true)
    try {
      const res = await fetch('/api/medications')
      const data = await res.json()
      if (Array.isArray(data)) {
        setMedications(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      if (!silent) setLoadingMeds(false)
    }
  }

  const fetchTodayLogs = async (silent = false) => {
    if (!silent) setLoadingLogs(true)
    try {
      const res = await fetch('/api/logs')
      const data = await res.json()
      if (Array.isArray(data)) {
        setLogs(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      if (!silent) setLoadingLogs(false)
    }
  }

  const getNextScheduledDose = () => {
    if (!logs || logs.length === 0) return null
    const scheduledToday = logs
      .filter(l => l.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())
    return scheduledToday[0] || null
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

  const fetchAdminData = async (silent = false) => {
    if (!silent) setLoadingAdmin(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data && data.users) {
        setAdminData(data)
      }
    } catch (e) {
      console.error('Error fetching admin data:', e)
    } finally {
      if (!silent) setLoadingAdmin(false)
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
        fetchMedications(true)
        fetchTodayLogs(true)
        
        // Add helper bot message
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            content: lang === 'vi'
              ? `✅ Đã thêm thuốc **${newMedName}** vào lịch trình của bạn thành công (uống lúc ${newMedTime}).`
              : `✅ Added **${newMedName}** to your schedule successfully (at ${newMedTime}).`,
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
        fetchMedications(true)
        fetchTodayLogs(true)
        
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            content: lang === 'vi'
              ? `ℹ️ Đã cập nhật thông tin thuốc **${editMedName}** thành công.`
              : `ℹ️ Updated **${editMedName}** successfully.`,
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
    if (!confirm(lang === 'vi' ? 'Bạn có chắc chắn muốn xoá lịch uống loại thuốc này?' : 'Are you sure you want to delete this medication schedule?')) return
    try {
      const res = await fetch(`/api/medications?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchMedications(true)
        fetchTodayLogs(true)
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
        fetchTodayLogs(true)
        fetchMedications(true)
        fetchStats()
        if (user?.email && (user.email.toLowerCase().includes('admin') || user.email === 'admin@medimate.ai')) {
          fetchAdminData(true)
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
      fetchTodayLogs(true)
      fetchMedications(true)
      fetchStats()
      if (user?.email && (user.email.toLowerCase().includes('admin') || user.email === 'admin@medimate.ai')) {
        fetchAdminData(true)
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
      fetchTodayLogs(true)
      fetchMedications(true)
      fetchStats()
      if (user?.email && (user.email.toLowerCase().includes('admin') || user.email === 'admin@medimate.ai')) {
        fetchAdminData(true)
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
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      })
      if (error) throw error
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error.')
    } finally {
      setAuthLoading(false)
    }
  }

  // Quick Demo Sign In helper
  const handleQuickSignIn = async (role: 'admin' | 'user') => {
    setAuthLoading(true)
    setAuthError(null)
    const email = role === 'admin' ? 'admin@medimate.ai' : 'user@medimate.ai'
    const password = role === 'admin' ? 'admin123456' : 'user123456'

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (err: any) {
      setAuthError(err.message || (lang === 'vi' ? 'Không thể đăng nhập tài khoản demo.' : 'Could not sign in to the demo account.'))
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
      ? `${userText} *(${t.imageUploaded})*`
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
          image: imagePayload,
          lang,
        }),
      })

      const data = await res.json()

      if (data.error) {
        setMessages((prev) => [...prev, { role: 'system', content: `❌ ${lang === 'vi' ? 'Lỗi' : 'Error'}: ${data.error}` }])
      } else if (data.action === 'WARNING_INTERACTION') {
        // We received a drug interaction warning!
        setWarningInfo(data.warning)
        setMessages((prev) => [...prev, { role: 'model', content: data.message }])
        // Some meds in a multi-drug prescription may already have been saved (only the
        // flagged one is held back), so refresh the list to reflect them.
        if (Array.isArray(data.savedMeds) && data.savedMeds.length > 0) {
          fetchMedications(true)
          fetchTodayLogs(true)
        }
      } else {
        // Success response
        setMessages((prev) => [...prev, { role: 'model', content: data.message }])
        // Refresh local data in case medication or log was modified
        if (data.action === 'MEDICATION_ADDED' || data.action === 'LOG_RECORDED') {
          fetchMedications(true)
          fetchTodayLogs(true)
        }
        // After a prescription scan, surface a review of exactly what the AI extracted.
        if (data.action === 'MEDICATION_ADDED' && Array.isArray(data.medications) && data.medications.length > 0 && (data.fromImage || imagePayload)) {
          setPrescriptionReview(data.medications)
        }
      }
    } catch (err) {
      console.error(err)
      setMessages((prev) => [...prev, { role: 'system', content: `❌ ${lang === 'vi' ? 'Lỗi kết nối đến máy chủ.' : 'Could not connect to the server.'}` }])
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
            content: lang === 'vi'
              ? `⚠️ *Bỏ qua cảnh báo.* Đã thêm thuốc **${warningInfo.medication.name}** vào lịch trình theo yêu cầu của bạn.`
              : `⚠️ *Warning ignored.* Added **${warningInfo.medication.name}** to your schedule as requested.`,
          },
        ])
        setWarningInfo(null)
        fetchMedications(true)
        fetchTodayLogs(true)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMeds(false)
    }
  }

  // Show/hide password toggle for the auth form (MediMate redesign)
  const [showAuthPassword, setShowAuthPassword] = useState(false)

  // Export the admin patient-adherence directory as a CSV report (no external deps).
  const handleExportReport = () => {
    if (!adminData) return
    const header = lang === 'vi'
      ? ['Email', 'Ngày tạo', 'Số thuốc', 'Chuỗi (ngày)', 'Đã uống hôm nay', 'Tổng liều hôm nay', 'Tuân thủ hôm nay (%)']
      : ['Email', 'Created', 'Medications', 'Streak (days)', 'Taken today', 'Total doses today', 'Adherence today (%)']
    const rows = adminData.users.map((u: any) => {
      const rate = u.todayLogs.total > 0 ? Math.round((u.todayLogs.taken / u.todayLogs.total) * 100) : 0
      return [u.email, new Date(u.created_at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US'), u.medCount, u.streak, u.todayLogs.taken, u.todayLogs.total, rate]
    })
    const esc = (c: unknown) => `"${String(c).replace(/"/g, '""')}"`
    const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `medimate-bao-cao-tuan-thu-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // --- Admin: create / delete user ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingUser(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUserEmail, password: newUserPassword, name: newUserName }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || (lang === 'vi' ? 'Không tạo được tài khoản.' : 'Failed to create user.')); return }
      setShowAddUserModal(false); setNewUserEmail(''); setNewUserPassword(''); setNewUserName('')
      fetchAdminData(true)
    } catch {
      alert(lang === 'vi' ? 'Lỗi kết nối.' : 'Connection error.')
    } finally {
      setCreatingUser(false)
    }
  }

  const handleDeleteUser = async (id: string, email: string) => {
    if (!confirm(lang === 'vi' ? `Xoá tài khoản ${email}? Hành động này không thể hoàn tác.` : `Delete ${email}? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { alert(data.error || (lang === 'vi' ? 'Không xoá được tài khoản.' : 'Failed to delete.')); return }
      setSelectedAdminUser(null)
      fetchAdminData(true)
    } catch {
      alert(lang === 'vi' ? 'Lỗi kết nối.' : 'Connection error.')
    }
  }

  // Load the latest system broadcast for the banner shown to all users
  useEffect(() => {
    if (!user) return
    if (typeof window !== 'undefined') {
      setDismissedBroadcast(localStorage.getItem('medimate_dismissedBroadcast'))
    }
    fetch('/api/broadcast')
      .then((r) => r.json())
      .then((d) => setLatestBroadcast(d?.broadcast || null))
      .catch(() => {})
  }, [user])

  // Dismiss the current broadcast banner (remembered per broadcast id / timestamp).
  const dismissBroadcast = () => {
    const key = latestBroadcast?.id || latestBroadcast?.created_at || ''
    setDismissedBroadcast(key)
    if (typeof window !== 'undefined') localStorage.setItem('medimate_dismissedBroadcast', key)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans" style={{ height: '100dvh', background: 'var(--mm-bg)', color: 'var(--mm-text)' }}>
      {/* Auth Screen */}
      {!user ? (
        <AuthScreen lang={lang} setLang={setLang} authEmail={authEmail} setAuthEmail={setAuthEmail} authPassword={authPassword} setAuthPassword={setAuthPassword} showAuthPassword={showAuthPassword} setShowAuthPassword={setShowAuthPassword} authError={authError} authLoading={authLoading} handleAuth={handleAuth} handleQuickSignIn={handleQuickSignIn} />
      ) : (
        /* App Main Screen */
        <div className="flex flex-col flex-1 min-h-0 z-10">
          
          {/* Header */}
          <AppHeader lang={lang} setLang={setLang} activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={!!isAdmin} streak={streak} user={user} handleSignOut={handleSignOut} onProfile={() => setShowProfile(true)} t={t} />

          {/* Main Workspace Layout */}
          <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
            
            {/* Left Panel: Dashboard (50%) */}
            <section className={`flex-1 min-h-0 flex-col overflow-y-auto p-6 md:p-8 pb-24 md:pb-8 ${activeTab === 'dashboard' ? 'flex' : 'hidden'}`} style={{ background: 'var(--mm-bg)', gap: '20px' }}>

              {/* System broadcast banner — colour + icon match the severity, with a close button */}
              {latestBroadcast && (latestBroadcast.id || latestBroadcast.created_at) !== dismissedBroadcast && (() => {
                const bs = broadcastStyle(latestBroadcast.severity)
                return (
                  <div style={{ background: bs.bg, border: `1px solid ${bs.border}`, borderRadius: '14px', padding: '13px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px', flexShrink: 0 }}>
                    <span className="ms" style={{ fontSize: '20px', color: bs.color, flexShrink: 0 }}>{bs.icon}</span>
                    <div style={{ flex: 1, minWidth: 0, fontSize: '13.5px', color: 'var(--mm-text-muted)', lineHeight: 1.5 }}>
                      <strong style={{ color: bs.color }}>{latestBroadcast.title?.trim() || (lang === 'vi' ? 'Thông báo hệ thống' : 'System notice')}: </strong>{latestBroadcast.message}
                    </div>
                    <button type="button" onClick={dismissBroadcast} aria-label={lang === 'vi' ? 'Đóng thông báo' : 'Dismiss'} className="mm-icon-badge" style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'transparent', color: bs.color, cursor: 'pointer', flexShrink: 0, border: 'none' }}>
                      <span className="ms" style={{ fontSize: '18px' }}>close</span>
                    </button>
                  </div>
                )
              })()}

              {/* Greeting */}
              {(() => {
                const hour = new Date().getHours()
                const greeting = lang === 'vi'
                  ? (hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối')
                  : (hour < 11 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening')
                const displayName = user?.email ? user.email.split('@')[0] : ''
                const dateStr = new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })
                const dosesLeft = logs.filter((l) => l.status === 'scheduled').length
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap', flexShrink: 0 }}>
                    <div>
                      <div style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--mm-text)' }}>{greeting}{displayName ? `, ${displayName}` : ''}</div>
                      <div style={{ fontSize: '15px', color: 'var(--mm-text-muted)', marginTop: '4px', textTransform: 'capitalize' }}>
                        {dateStr}{lang === 'vi'
                          ? (dosesLeft > 0 ? ` · Hôm nay còn ${dosesLeft} liều cần uống` : ' · Hôm nay bạn đã hoàn thành lịch uống 🎉')
                          : (dosesLeft > 0 ? ` · ${dosesLeft} doses left today` : ' · All doses done today 🎉')}
                      </div>
                    </div>
                    <span className="mm-chip" style={{ background: '#EAF3EC', color: 'var(--mm-primary-dark)', padding: '9px 15px', fontSize: '14px' }}>
                      <span className="ms" style={{ fontSize: '18px' }}>verified_user</span>{lang === 'vi' ? 'Đã kiểm tra tương tác thuốc' : 'Interactions checked'}
                    </span>
                  </div>
                )
              })()}

              {medications.length === 0 && !loadingMeds ? (
                /* Onboarding empty-state */
                <div className="mm-card" style={{ padding: '48px 32px 52px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <span className="mm-icon-badge" style={{ width: '100px', height: '100px', borderRadius: '28px', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary)', marginBottom: '22px' }}><span className="ms" style={{ fontSize: '54px' }}>medication_liquid</span></span>
                  <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--mm-text)' }}>{lang === 'vi' ? `Chào ${user?.email ? user.email.split('@')[0] : 'bạn'}! Bắt đầu nào 👋` : `Hi ${user?.email ? user.email.split('@')[0] : 'there'}! Let’s get started 👋`}</div>
                  <div style={{ fontSize: '16.5px', color: 'var(--mm-text-muted)', lineHeight: 1.6, maxWidth: '520px', marginTop: '12px' }}>{lang === 'vi' ? 'Bạn chưa có thuốc nào trong lịch. Chỉ cần chụp đơn thuốc — trợ lý AI sẽ tự đọc tên thuốc, liều lượng và lên lịch nhắc giúp bạn.' : 'You have no medications yet. Just snap your prescription — the AI reads the names, dosages and sets reminders for you.'}</div>
                  <div style={{ display: 'flex', gap: '14px', marginTop: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button type="button" onClick={() => { setActiveTab('chat'); setTimeout(() => imageInputRef.current?.click(), 120) }} className="mm-btn mm-btn-primary" style={{ padding: '15px 24px', fontSize: '16px' }}><span className="ms" style={{ fontSize: '23px' }}>photo_camera</span>{lang === 'vi' ? 'Quét đơn thuốc' : 'Scan prescription'}</button>
                    <button type="button" onClick={() => setShowAddModal(true)} className="mm-btn mm-btn-outline" style={{ padding: '15px 24px', fontSize: '16px' }}><span className="ms" style={{ fontSize: '23px' }}>edit</span>{lang === 'vi' ? 'Thêm thủ công' : 'Add manually'}</button>
                  </div>
                  <div style={{ display: 'flex', gap: '18px', marginTop: '44px', maxWidth: '820px', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                      { n: 1, vi: ['Chụp đơn thuốc', 'Chụp hoặc tải ảnh đơn của bác sĩ.'], en: ['Snap the prescription', 'Take or upload a photo of your doctor’s script.'] },
                      { n: 2, vi: ['AI đọc & kiểm tra', 'Tự nhận thuốc, liều và cảnh báo tương tác.'], en: ['AI reads & checks', 'Extracts meds, dosages and flags interactions.'] },
                      { n: 3, vi: ['Nhận nhắc đúng giờ', 'Nhắc uống mỗi ngày, theo dõi tuân thủ.'], en: ['Get timely reminders', 'Daily dose reminders and adherence tracking.'] },
                    ].map((s) => (
                      <div key={s.n} style={{ flex: '1 1 220px', minWidth: '200px', maxWidth: '250px', background: 'var(--mm-surface-2)', border: '1px solid var(--mm-border-warm)', borderRadius: '16px', padding: '22px 20px', textAlign: 'left' }}>
                        <span className="mm-icon-badge" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--mm-primary)', color: '#fff', fontWeight: 800, fontSize: '16px', marginBottom: '14px' }}>{s.n}</span>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--mm-text)' }}>{lang === 'vi' ? s.vi[0] : s.en[0]}</div>
                        <div style={{ fontSize: '14px', color: 'var(--mm-text-muted)', lineHeight: 1.5, marginTop: '5px' }}>{lang === 'vi' ? s.vi[1] : s.en[1]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (<>
              {/* Two-column: main + sidebar */}
              <div className="mm-home-grid" style={{ display: 'flex', gap: '22px', alignItems: 'flex-start' }}>
                {/* LEFT — hero + timeline */}
                <div className="mm-home-main" style={{ flex: '1.65 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Next dose hero */}
                  {(() => {
                    const nextDose = getNextScheduledDose()
                    if (!nextDose) return (
                      <div className="mm-card" style={{ padding: '26px', textAlign: 'center', color: 'var(--mm-text-faint)' }}>
                        <span className="ms" style={{ fontSize: '40px', display: 'block', margin: '0 auto 8px', color: 'var(--mm-primary)' }}>task_alt</span>
                        {lang === 'vi' ? 'Không có liều nào sắp tới. Bạn đang làm rất tốt!' : 'No upcoming dose. You are doing great!'}
                      </div>
                    )
                    const nextDoseTime = new Date(nextDose.scheduled_time).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <div style={{ background: 'var(--mm-primary)', color: '#fff', borderRadius: '20px', padding: '26px 28px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, opacity: 0.9, letterSpacing: '0.02em', position: 'relative' }}>
                          <span className="ms" style={{ fontSize: '18px' }}>schedule</span>{lang === 'vi' ? 'LIỀU KẾ TIẾP' : 'NEXT DOSE'} · {nextDoseTime}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', marginTop: '14px', position: 'relative', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.05 }}>{nextDose.medication?.name}</div>
                            <div style={{ fontSize: '16px', opacity: 0.92, marginTop: '7px' }}>{nextDose.medication?.dosage_quantity ?? 1} {lang === 'vi' ? 'viên' : 'pill'} · {nextDose.medication?.dosage}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '22px', position: 'relative', flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => handleToggleLogStatus(nextDose.id, nextDose.status)} className="mm-btn" style={{ flex: 1, minWidth: '150px', background: '#fff', color: 'var(--mm-primary-dark)', fontSize: '17px', padding: '15px' }}>
                            <span className="ms" style={{ fontSize: '22px' }}>check_circle</span>{lang === 'vi' ? 'Đã uống' : 'Taken'}
                          </button>
                          <button type="button" onClick={() => handleSnooze(nextDose, 15)} className="mm-btn" style={{ background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.45)', fontSize: '16px', fontWeight: 600, padding: '15px 22px' }}>
                            {lang === 'vi' ? 'Nhắc lại sau' : 'Snooze'}
                          </button>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Today's schedule timeline */}
                  <div className="mm-card" style={{ padding: '20px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ fontSize: '19px', fontWeight: 700, color: 'var(--mm-text)' }}>{t.todaySchedule}</div>
                      <span style={{ fontSize: '14px', color: 'var(--mm-text-muted)', fontWeight: 500 }}>{logs.filter((l) => l.status === 'taken').length} / {logs.length} {t.taken}</span>
                    </div>
                    {loadingLogs ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ height: '52px', background: '#F0EDE4', borderRadius: '14px' }} className="animate-pulse" />
                        <div style={{ height: '52px', background: '#F0EDE4', borderRadius: '14px' }} className="animate-pulse" />
                      </div>
                    ) : logs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--mm-text-faint)' }}>
                        <span className="ms" style={{ fontSize: '34px', display: 'block', margin: '0 auto 8px' }}>event_available</span>
                        {lang === 'vi' ? 'Chưa có lịch uống nào cho hôm nay.' : 'No doses scheduled for today.'}
                      </div>
                    ) : (
                      <div style={{ maxHeight: '460px', overflowY: 'auto', paddingRight: '4px' }}>
                        {(() => {
                          const groupedByTime: Record<string, typeof logs> = {}
                          logs.forEach((log) => {
                            const timeKey = new Date(log.scheduled_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                            if (!groupedByTime[timeKey]) groupedByTime[timeKey] = []
                            groupedByTime[timeKey].push(log)
                          })
                          const entries = Object.entries(groupedByTime)
                          return entries.map(([timeSlot, slotLogs], gi) => {
                            const allTaken = slotLogs.every((l) => l.status === 'taken')
                            const hasScheduled = slotLogs.some((l) => l.status === 'scheduled')
                            const isLast = gi === entries.length - 1
                            return (
                              <div key={timeSlot} style={{ display: 'flex', gap: '14px', alignItems: 'stretch' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '52px', flexShrink: 0 }}>
                                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: hasScheduled ? 'var(--mm-primary)' : 'var(--mm-text-faint)' }}>{timeSlot}</div>
                                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', marginTop: '8px', background: allTaken ? 'var(--mm-primary)' : '#fff', border: allTaken ? 'none' : '2px solid #C9CFC7' }} />
                                  {!isLast && <div style={{ flex: 1, width: '2px', background: '#E0DED4', marginTop: '2px' }} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '14px' }}>
                                  {hasScheduled && slotLogs.length > 1 && (
                                    <button type="button" onClick={() => handleBatchTakeAll(slotLogs.filter((l) => l.status === 'scheduled'))} className="mm-btn mm-btn-outline" style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '12.5px', borderRadius: '999px' }}>
                                      {lang === 'vi' ? 'Đã uống tất cả ✓' : 'Take all ✓'}
                                    </button>
                                  )}
                                  {slotLogs.map((log) => {
                                    const taken = log.status === 'taken'
                                    const missed = log.status === 'missed'
                                    return (
                                      <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: taken ? '#FBFAF6' : '#fff', border: '1px solid ' + (taken ? '#EDEAE0' : '#E6EFE8'), borderRadius: '14px', padding: '13px 16px', opacity: taken ? 0.72 : 1 }}>
                                        <span className="mm-icon-badge" style={{ width: '40px', height: '40px', borderRadius: '11px', background: '#E6EFE8', color: 'var(--mm-primary)' }}>
                                          <span className="ms" style={{ fontSize: '21px' }}>medication</span>
                                        </span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: '15.5px', fontWeight: 700, textDecoration: taken ? 'line-through' : 'none', textDecorationColor: '#B7C0B8', color: 'var(--mm-text)' }}>{log.medication?.name}</div>
                                          <div style={{ fontSize: '13px', color: 'var(--mm-text-faint)' }}>{log.medication?.dosage_quantity ?? 1} {lang === 'vi' ? 'viên' : 'pill'} · {log.medication?.dosage}</div>
                                        </div>
                                        {taken ? (
                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--mm-primary)', fontSize: '13.5px', fontWeight: 700 }}>
                                            <span className="ms" style={{ fontSize: '18px' }}>check_circle</span>{t.taken}
                                          </span>
                                        ) : (
                                          <button type="button" onClick={() => handleToggleLogStatus(log.id, log.status)} className="mm-btn mm-btn-primary" style={{ padding: '9px 15px', fontSize: '13.5px' }}>
                                            {missed ? t.skippedBadge : (lang === 'vi' ? 'Uống' : 'Take')}
                                          </button>
                                        )}
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
                </div>

                {/* RIGHT — sidebar */}
                <div className="mm-home-side" style={{ flex: '1 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Adherence ring */}
                  {(() => {
                    const totalToday = logs.length
                    const takenToday = logs.filter((l) => l.status === 'taken').length
                    const pct = totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : (streak > 0 ? 100 : 0)
                    return (
                      <div className="mm-card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '82px', height: '82px', borderRadius: '50%', background: `conic-gradient(var(--mm-primary) 0% ${pct}%, var(--mm-primary-soft) ${pct}% 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--mm-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, color: 'var(--mm-primary-dark)' }}>{pct}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--mm-text)' }}>{lang === 'vi' ? 'Tuân thủ hôm nay' : 'Adherence today'}</div>
                          <div style={{ fontSize: '13.5px', color: 'var(--mm-text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                            {lang === 'vi' ? <>Giữ trên 80% để duy trì<br />chuỗi {streak} ngày của bạn</> : <>Stay above 80% to keep<br />your {streak}-day streak</>}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Quick actions */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => setActiveTab('chat')} className="mm-btn" style={{ flex: 1, flexDirection: 'column', gap: '8px', border: '1px solid var(--mm-border-warm)', background: 'var(--mm-surface)', borderRadius: '15px', padding: '16px 10px', color: 'var(--mm-text)' }}>
                      <span className="mm-icon-badge" style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#E6EFE8', color: 'var(--mm-primary)' }}><span className="ms" style={{ fontSize: '24px' }}>photo_camera</span></span>
                      <span style={{ fontSize: '14.5px', fontWeight: 700 }}>{lang === 'vi' ? 'Quét đơn thuốc' : 'Scan prescription'}</span>
                    </button>
                    <button type="button" onClick={() => setShowAddModal(true)} className="mm-btn" style={{ flex: 1, flexDirection: 'column', gap: '8px', border: '1px solid var(--mm-border-warm)', background: 'var(--mm-surface)', borderRadius: '15px', padding: '16px 10px', color: 'var(--mm-text)' }}>
                      <span className="mm-icon-badge" style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#E6EFE8', color: 'var(--mm-primary)' }}><span className="ms" style={{ fontSize: '24px' }}>add</span></span>
                      <span style={{ fontSize: '14.5px', fontWeight: 700 }}>{lang === 'vi' ? 'Thêm thuốc' : 'Add medication'}</span>
                    </button>
                  </div>

                  {/* Achievement badges */}
                  {badges.length > 0 && (
                    <div className="mm-card" style={{ padding: '18px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="ms" style={{ fontSize: '20px', color: 'var(--mm-amber)' }}>emoji_events</span>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--mm-text)' }}>{t.badges}</div>
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--mm-text-muted)', marginBottom: '12px' }}>{t.badgesSub}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {badges.map((b) => {
                          const meta = BADGE_META[b]
                          const label = meta ? (lang === 'vi' ? meta.vi : meta.en) : b
                          return (
                            <span key={b} className="mm-chip" style={{ background: 'var(--mm-primary-soft)', color: 'var(--mm-primary-dark)', padding: '7px 12px', fontSize: '12.5px', fontWeight: 700 }}>
                              <span className="ms" style={{ fontSize: '16px' }}>{meta?.icon || 'workspace_premium'}</span>{label}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mini chat teaser */}
                  <div className="mm-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '270px' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--mm-border-warm)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="mm-icon-badge" style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--mm-primary)', color: '#fff' }}><span className="ms" style={{ fontSize: '19px' }}>neurology</span></span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: 700 }}>{lang === 'vi' ? 'Trợ lý MediMate' : 'MediMate Assistant'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--mm-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--mm-primary)' }} />{lang === 'vi' ? 'Đang trực tuyến' : 'Online'}</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#FCFBF8', overflowY: 'auto', maxHeight: '190px' }}>
                      {messages.slice(-3).map((m, i) => (
                        <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', background: m.role === 'user' ? 'var(--mm-primary)' : '#F0EDE4', color: m.role === 'user' ? '#fff' : '#3A473F', padding: '11px 15px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', fontSize: '14.5px', lineHeight: 1.5, whiteSpace: 'pre-line', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {m.content}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setActiveTab('chat')} style={{ margin: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', background: '#F4F2EC', border: '1px solid var(--mm-border-warm)', borderRadius: '12px', padding: '10px 14px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                      <span style={{ flex: 1, fontSize: '14px', color: 'var(--mm-text-faint)' }}>{lang === 'vi' ? 'Hỏi về thuốc của bạn…' : 'Ask about your meds…'}</span>
                      <span className="mm-icon-badge" style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--mm-primary)', color: '#fff' }}><span className="ms" style={{ fontSize: '19px' }}>send</span></span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Medication management list (full width) */}
              <div className="mm-card" style={{ padding: '20px 22px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--mm-text)' }}>{t.medList}</div>
                  <button type="button" onClick={() => setShowAddModal(true)} className="mm-btn mm-btn-outline" style={{ padding: '8px 13px', fontSize: '13px', borderRadius: '999px' }}>
                    <span className="ms" style={{ fontSize: '18px' }}>add</span>{t.addFast}
                  </button>
                </div>
                {loadingMeds ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ height: '64px', background: '#F0EDE4', borderRadius: '14px' }} className="animate-pulse" />
                    <div style={{ height: '64px', background: '#F0EDE4', borderRadius: '14px' }} className="animate-pulse" />
                  </div>
                ) : medications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--mm-text-faint)' }}>
                    <span className="ms" style={{ fontSize: '38px', display: 'block', margin: '0 auto 8px' }}>medication</span>
                    {t.noMedsRegistered}<br />{t.chatPrompt}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                    {medications.map((med) => {
                      const low = med.remaining_stock !== null && med.remaining_stock !== undefined && med.remaining_stock <= 5
                      return (
                        <div key={med.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', padding: '14px 16px', border: '1px solid #EDEAE0', borderRadius: '14px', background: '#FBFAF6' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0 }}>
                            <span className="mm-icon-badge" style={{ width: '40px', height: '40px', borderRadius: '11px', background: '#E6EFE8', color: 'var(--mm-primary)', fontWeight: 800, fontSize: '14px' }}>{med.name.slice(0, 2).toUpperCase()}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--mm-text)' }}>{med.name}</div>
                              <div style={{ fontSize: '13px', color: 'var(--mm-text-muted)', marginTop: '1px' }}>{med.dosage} · {med.frequency}</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '7px' }}>
                                {med.schedule.map((time, idx) => (
                                  <span key={idx} style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: '#EFEDE4', color: 'var(--mm-text-muted)' }}>{time}</span>
                                ))}
                              </div>
                              {med.total_stock !== undefined && med.total_stock !== null && (
                                <div style={{ marginTop: '9px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, color: low ? 'var(--mm-coral)' : 'var(--mm-text-muted)' }}>
                                    <span>{lang === 'vi' ? 'Tồn kho' : 'Stock'}: {med.remaining_stock} / {med.total_stock}</span>
                                    {low && <span>{lang === 'vi' ? '⚠️ Sắp hết!' : '⚠️ Low!'}</span>}
                                  </div>
                                  <div style={{ width: '100%', maxWidth: '150px', height: '4px', borderRadius: '999px', overflow: 'hidden', background: '#E4E5DE', marginTop: '5px' }}>
                                    <div style={{ height: '100%', borderRadius: '999px', background: low ? 'var(--mm-coral)' : 'var(--mm-primary)', width: `${Math.max(0, Math.min(100, ((med.remaining_stock ?? 0) / (med.total_stock ?? 1)) * 100))}%` }} />
                                  </div>
                                  <button type="button" onClick={() => handleRefillStock(med.id, med.total_stock ?? 30)} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--mm-primary)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '5px', fontFamily: 'inherit' }}>
                                    🔄 {lang === 'vi' ? 'Nạp thêm thuốc' : 'Refill'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                            <button type="button" onClick={() => handleEditMedicationClick(med)} className="mm-btn mm-btn-ghost" style={{ padding: '8px', borderRadius: '10px' }} title={lang === 'vi' ? 'Sửa' : 'Edit'}>
                              <span className="ms" style={{ fontSize: '20px' }}>edit</span>
                            </button>
                            <button type="button" onClick={() => handleDeleteMedication(med.id)} className="mm-btn mm-btn-ghost" style={{ padding: '8px', borderRadius: '10px', color: 'var(--mm-coral)' }} title={lang === 'vi' ? 'Xoá' : 'Delete'}>
                              <span className="ms" style={{ fontSize: '20px' }}>delete</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              </>)}

            </section>

            {/* Right Panel: Chat Interface */}
            <section className={`flex-1 min-h-0 flex-row overflow-hidden relative pb-20 md:pb-0 w-full ${activeTab === 'chat' ? 'flex' : 'hidden'}`} style={{ background: 'var(--mm-bg)' }}>
              {/* Suggested-topics rail (desktop) */}
              <aside className="hidden md:flex" style={{ width: '264px', flexShrink: 0, flexDirection: 'column', gap: '6px', background: 'var(--mm-surface-2)', borderRight: '1px solid var(--mm-border-warm)', padding: '22px 18px', overflowY: 'auto' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 6px 6px' }}>{lang === 'vi' ? 'Chủ đề gợi ý' : 'Suggested topics'}</div>
                {[
                  { icon: 'medication_liquid', vi: 'Thuốc của tôi', en: 'My medications', q: lang === 'vi' ? 'Cho tôi xem danh sách thuốc tôi đang dùng' : 'Show my current medications' },
                  { icon: 'policy', vi: 'Kiểm tra tương tác thuốc', en: 'Check interactions', q: lang === 'vi' ? 'Kiểm tra tương tác giữa các thuốc tôi đang dùng' : 'Check interactions between my medications' },
                  { icon: 'alarm', vi: 'Đổi giờ nhắc uống', en: 'Change reminder time', q: lang === 'vi' ? 'Tôi muốn đổi giờ nhắc uống thuốc' : 'I want to change my reminder times' },
                  { icon: 'help', vi: 'Công dụng & tác dụng phụ', en: 'Uses & side effects', q: lang === 'vi' ? 'Công dụng và tác dụng phụ của thuốc tôi đang dùng là gì?' : 'What are the uses and side effects of my medications?' },
                ].map((topic) => (
                  <button key={topic.icon} type="button" onClick={() => setInputMessage(topic.q)} className="mm-chat-topic" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 14px', borderRadius: '13px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', color: 'var(--mm-text)', width: '100%' }}>
                    <span className="mm-icon-badge" style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary)', flexShrink: 0 }}><span className="ms" style={{ fontSize: '19px' }}>{topic.icon}</span></span>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{lang === 'vi' ? topic.vi : topic.en}</span>
                  </button>
                ))}
              </aside>
              {/* Chat column */}
              <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
              {/* Chat header */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--mm-border-warm)', background: 'var(--mm-surface)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <span className="mm-icon-badge" style={{ width: '44px', height: '44px', borderRadius: '13px', background: 'var(--mm-primary)', color: '#fff' }}><span className="ms" style={{ fontSize: '25px' }}>neurology</span></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--mm-text)' }}>{lang === 'vi' ? 'Trợ lý MediMate' : 'MediMate Assistant'}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--mm-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--mm-primary)' }} />{lang === 'vi' ? 'Trực tuyến · trả lời bằng tiếng Việt' : 'Online · replies in Vietnamese'}
                  </div>
                </div>
              </div>
              {/* Messages */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#FCFBF8' }}>
                {messages.map((msg, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {msg.role !== 'user' && (
                      <span className="mm-icon-badge" style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary)', flexShrink: 0 }}><span className="ms" style={{ fontSize: '18px' }}>neurology</span></span>
                    )}
                    <div style={
                      msg.role === 'user'
                        ? { maxWidth: '80%', background: 'var(--mm-primary)', color: '#fff', padding: '13px 16px', borderRadius: '16px 16px 5px 16px', fontSize: '15.5px', lineHeight: 1.55, whiteSpace: 'pre-line', wordBreak: 'break-word', overflowWrap: 'anywhere' }
                        : msg.role === 'system'
                        ? { maxWidth: '85%', background: '#FDF3E7', border: '1px solid #F2D9B8', color: '#7A6A52', padding: '12px 15px', borderRadius: '16px 16px 16px 5px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', lineHeight: 1.5, whiteSpace: 'pre-line', wordBreak: 'break-word', overflowWrap: 'anywhere' }
                        : { maxWidth: '80%', background: '#F0EDE4', color: '#3A473F', padding: '13px 16px', borderRadius: '16px 16px 16px 5px', fontSize: '15.5px', lineHeight: 1.55, whiteSpace: 'pre-line', wordBreak: 'break-word', overflowWrap: 'anywhere' }
                    }>{msg.content}</div>
                  </div>
                ))}
                {loadingChat && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ background: '#F0EDE4', borderRadius: '14px', padding: '12px 16px', display: 'flex', gap: '5px' }}>
                      <span className="mm-dot" style={{ animationDelay: '0ms' }} />
                      <span className="mm-dot" style={{ animationDelay: '150ms' }} />
                      <span className="mm-dot" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              {/* Interaction warning overlay */}
              {warningInfo && (
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: '92px', background: '#FDF3E7', borderTop: '1px solid #F2D9B8', padding: '16px 20px', boxShadow: '0 -12px 30px -18px rgba(34,48,42,0.4)', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span className="mm-icon-badge" style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(176,106,44,0.12)', color: 'var(--mm-orange)', flexShrink: 0 }}><span className="ms" style={{ fontSize: '20px' }}>warning</span></span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--mm-orange)' }}>{lang === 'vi' ? 'Cảnh báo tương tác thuốc' : 'Drug interaction warning'}</div>
                      <div style={{ fontSize: '13px', marginTop: '4px', color: '#7A6A52', fontWeight: 500, lineHeight: 1.45 }}>{warningInfo.explanation}</div>
                      <div style={{ fontSize: '12.5px', marginTop: '7px', color: '#A08A6A', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span className="ms" style={{ fontSize: '15px' }}>database</span>{lang === 'vi' ? 'Nguồn: nhãn thuốc chính thức OpenFDA' : 'Source: official OpenFDA drug labels'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button type="button" onClick={() => setWarningInfo(null)} className="mm-btn mm-btn-outline" style={{ padding: '9px 14px', fontSize: '13px' }}>{lang === 'vi' ? 'Huỷ bỏ' : 'Cancel'}</button>
                    <button type="button" onClick={handleBypassWarningAndAdd} className="mm-btn" style={{ padding: '9px 14px', fontSize: '13px', background: 'rgba(176,106,44,0.15)', color: 'var(--mm-orange)', border: '1px solid rgba(176,106,44,0.35)' }}>{lang === 'vi' ? 'Vẫn thêm' : 'Add anyway'}</button>
                  </div>
                </div>
              )}
              {/* Image preview */}
              {selectedImage && (
                <div style={{ padding: '8px 16px', borderTop: '1px solid var(--mm-border-warm)', background: 'var(--mm-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={selectedImage.data} alt={lang === 'vi' ? 'Đơn thuốc' : 'Prescription'} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--mm-border)' }} />
                    <span style={{ fontSize: '13px', color: 'var(--mm-text-muted)' }}>{lang === 'vi' ? 'Đã chọn ảnh đơn thuốc' : 'Prescription image selected'}</span>
                  </div>
                  <button type="button" onClick={() => setSelectedImage(null)} className="mm-btn mm-btn-ghost" style={{ padding: '6px', borderRadius: '8px' }}><span className="ms" style={{ fontSize: '18px' }}>close</span></button>
                </div>
              )}
              {/* Quick-reply chips */}
              {!loadingChat && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '10px 16px 0', flexShrink: 0 }}>
                  {[
                    { icon: 'medication', vi: 'Dùng thuốc thay thế?', en: 'Any alternative meds?', q: lang === 'vi' ? 'Có thuốc nào thay thế an toàn hơn không?' : 'Is there a safer alternative medication?' },
                    { icon: 'call', vi: 'Khi nào cần gặp bác sĩ?', en: 'When to see a doctor?', q: lang === 'vi' ? 'Khi nào tôi nên liên hệ bác sĩ?' : 'When should I contact my doctor?' },
                  ].map((chip) => (
                    <button key={chip.icon} type="button" onClick={() => setInputMessage(chip.q)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 15px', borderRadius: '999px', border: 'none', background: '#F0EDE4', color: 'var(--mm-primary-dark)', fontSize: '14px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                      <span className="ms" style={{ fontSize: '17px' }}>{chip.icon}</span>{lang === 'vi' ? chip.vi : chip.en}
                    </button>
                  ))}
                </div>
              )}
              {/* Input */}
              <form onSubmit={handleSendMessage} style={{ padding: '14px 16px', borderTop: '1px solid var(--mm-border-warm)', background: 'var(--mm-surface)', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
                <button type="button" onClick={() => imageInputRef.current?.click()} className="mm-icon-badge" style={{ width: '46px', height: '46px', borderRadius: '12px', background: selectedImage ? 'var(--mm-primary)' : '#EFEDE4', color: selectedImage ? '#fff' : 'var(--mm-text-muted)', cursor: 'pointer', flexShrink: 0 }} title={lang === 'vi' ? 'Tải ảnh đơn thuốc' : 'Upload prescription'}>
                  <span className="ms" style={{ fontSize: '22px' }}>photo_camera</span>
                </button>
                <button type="button" onClick={startListening} className="mm-icon-badge" style={{ width: '46px', height: '46px', borderRadius: '12px', background: isListening ? 'var(--mm-coral)' : '#EFEDE4', color: isListening ? '#fff' : 'var(--mm-text-muted)', cursor: 'pointer', flexShrink: 0 }} title={lang === 'vi' ? 'Nói để nhập' : 'Speak'}>
                  <span className="ms" style={{ fontSize: '22px' }}>mic</span>
                </button>
                <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder={isListening ? (lang === 'vi' ? 'Đang nghe...' : 'Listening...') : (lang === 'vi' ? 'Hỏi về thuốc của bạn…' : 'Ask about your meds…')} disabled={loadingChat} style={{ flex: 1, minWidth: 0, background: '#F4F2EC', border: '1px solid var(--mm-border-warm)', borderRadius: '12px', padding: '13px 15px', fontSize: '14.5px', fontFamily: 'inherit', color: 'var(--mm-text)', outline: 'none' }} />
                <button type="submit" disabled={loadingChat || (!inputMessage.trim() && !selectedImage)} className="mm-icon-badge" style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'var(--mm-primary)', color: '#fff', cursor: 'pointer', flexShrink: 0, border: 'none', opacity: (loadingChat || (!inputMessage.trim() && !selectedImage)) ? 0.5 : 1 }}>
                  <span className="ms" style={{ fontSize: '22px' }}>send</span>
                </button>
              </form>
              </div>
            </section>

            {/* Admin Portal (Full Width) */}
            {activeTab === 'admin' && isAdmin && (
              <section className="flex-1 min-h-0 flex flex-col overflow-y-auto p-6 md:p-8 pb-24 md:pb-8" style={{ background: 'var(--mm-bg)' }}>
                {/* Header row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style={{ marginBottom: '22px' }}>
                  <div className="flex items-center" style={{ gap: '13px' }}>
                    <span className="mm-icon-badge" style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'var(--mm-primary-dark)', color: '#fff', flexShrink: 0 }}>
                      <span className="ms" style={{ fontSize: '24px' }}>admin_panel_settings</span>
                    </span>
                    <div>
                      <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--mm-text)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                        {lang === 'vi' ? 'Tổng quan hệ thống' : 'System Administration'}
                      </h2>
                      <p style={{ fontSize: '14px', color: 'var(--mm-text-muted)', marginTop: '4px' }}>
                        {lang === 'vi' ? 'Xem thống kê toàn hệ thống, giám sát tuân thủ và hỗ trợ người dùng.' : 'View system metrics, monitor patient adherence, and support users.'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setShowAddUserModal(true)}
                      className="mm-btn mm-btn-outline"
                      style={{ fontSize: '14px', fontWeight: 700, gap: '8px' }}
                    >
                      <span className="ms" style={{ fontSize: '19px' }}>person_add</span>
                      {lang === 'vi' ? 'Thêm người dùng' : 'Add user'}
                    </button>
                    <button
                      onClick={handleExportReport}
                      disabled={!adminData}
                      className="mm-btn mm-btn-outline"
                      style={{ fontSize: '14px', fontWeight: 700, gap: '8px', opacity: !adminData ? 0.6 : 1, cursor: !adminData ? 'default' : 'pointer' }}
                    >
                      <span className="ms" style={{ fontSize: '19px' }}>download</span>
                      {lang === 'vi' ? 'Xuất báo cáo' : 'Export'}
                    </button>
                    <button
                      onClick={() => fetchAdminData()}
                      disabled={loadingAdmin}
                      className="mm-btn mm-btn-primary"
                      style={{ fontSize: '14px', fontWeight: 700, gap: '8px', opacity: loadingAdmin ? 0.6 : 1, cursor: loadingAdmin ? 'default' : 'pointer' }}
                    >
                      <span className="ms" style={{ fontSize: '19px', animation: loadingAdmin ? 'spin 1s linear infinite' : 'none' }}>refresh</span>
                      {lang === 'vi' ? 'Làm mới dữ liệu' : 'Refresh Data'}
                    </button>
                  </div>
                </div>

                {/* Config notice when service-role key is missing (no fabricated data shown) */}
                {adminData?.serviceKeyMissing && (
                  <div style={{ background: '#FDF3E7', border: '1px solid #F2D9B8', borderRadius: '14px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span className="ms" style={{ fontSize: '20px', color: '#B06A2C', flexShrink: 0 }}>key_off</span>
                    <div style={{ fontSize: '13.5px', color: '#7A6A52', lineHeight: 1.5 }}>
                      {lang === 'vi'
                        ? <>Chưa cấu hình <b>SUPABASE_SERVICE_ROLE_KEY</b> nên không thể đọc dữ liệu người dùng thật. Thêm key (từ <code>supabase status</code>) vào <b>.env</b> rồi khởi động lại để hiển thị dữ liệu.</>
                        : <>No <b>SUPABASE_SERVICE_ROLE_KEY</b> configured, so real user data can’t be read. Add it to <b>.env</b> and restart to see live data.</>}
                    </div>
                  </div>
                )}

                {/* System Stats Overview */}
                {adminData && !adminData.serviceKeyMissing && (
                  <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '16px', marginBottom: '22px' }}>
                    <div className="mm-card" style={{ padding: '20px 22px' }}>
                      <span className="mm-icon-badge" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary)', marginBottom: '14px' }}>
                        <span className="ms" style={{ fontSize: '24px' }}>group</span>
                      </span>
                      <div style={{ fontSize: '30px', fontWeight: 800, lineHeight: 1, color: 'var(--mm-text)' }}>{adminData.stats.totalUsers}</div>
                      <div style={{ fontSize: '14px', color: 'var(--mm-text-muted)', marginTop: '6px' }}>
                        {lang === 'vi' ? 'Người dùng đang hoạt động' : 'Active Users'}
                      </div>
                    </div>
                    <div className="mm-card" style={{ padding: '20px 22px' }}>
                      <span className="mm-icon-badge" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary)', marginBottom: '14px' }}>
                        <span className="ms" style={{ fontSize: '24px' }}>medication</span>
                      </span>
                      <div style={{ fontSize: '30px', fontWeight: 800, lineHeight: 1, color: 'var(--mm-text)' }}>{adminData.stats.totalMeds}</div>
                      <div style={{ fontSize: '14px', color: 'var(--mm-text-muted)', marginTop: '6px' }}>
                        {lang === 'vi' ? 'Lịch thuốc đang theo dõi' : 'Medications'}
                      </div>
                    </div>
                    <div className="mm-card" style={{ padding: '20px 22px' }}>
                      <span className="mm-icon-badge" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary)', marginBottom: '14px' }}>
                        <span className="ms" style={{ fontSize: '24px' }}>trending_up</span>
                      </span>
                      <div style={{ fontSize: '30px', fontWeight: 800, lineHeight: 1, color: 'var(--mm-primary)' }}>{adminData.stats.complianceRate}%</div>
                      <div style={{ fontSize: '14px', color: 'var(--mm-text-muted)', marginTop: '6px' }}>
                        {lang === 'vi' ? 'Tuân thủ trung bình toàn hệ' : 'Adherence Rate'}
                      </div>
                    </div>
                    <div className="mm-card" style={{ padding: '20px 22px' }}>
                      <span className="mm-icon-badge" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary)', marginBottom: '14px' }}>
                        <span className="ms" style={{ fontSize: '24px' }}>monitoring</span>
                      </span>
                      <div style={{ fontSize: '30px', fontWeight: 800, lineHeight: 1, color: 'var(--mm-text)' }}>{adminData.stats.totalLogs}</div>
                      <div style={{ fontSize: '14px', color: 'var(--mm-text-muted)', marginTop: '6px' }}>
                        {lang === 'vi' ? 'Lượt uống hôm nay' : 'Logs Today'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Two-column layout: patient table + broadcast */}
                <div className="flex flex-col lg:flex-row items-start" style={{ gap: '22px' }}>
                  {/* Patient Adherence Directory */}
                  <div className="mm-card" style={{ flex: '1.9 1 0%', minWidth: 0, padding: 0, overflow: 'hidden', width: '100%' }}>
                    <div className="flex items-center justify-between" style={{ padding: '18px 22px', borderBottom: '1px solid var(--mm-border-warm)', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--mm-text)' }}>
                        {lang === 'vi' ? 'Phân tích theo bệnh nhân' : 'Patient Adherence Directory'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--mm-surface-2)', border: '1px solid var(--mm-border-warm)', borderRadius: '10px', padding: '8px 12px', minWidth: '200px' }}>
                        <span className="ms" style={{ fontSize: '19px', color: 'var(--mm-text-faint)' }}>search</span>
                        <input type="text" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder={lang === 'vi' ? 'Tìm bệnh nhân…' : 'Search patients…'} style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: '13.5px', color: 'var(--mm-text)' }} />
                      </div>
                    </div>

                    {loadingAdmin ? (
                      <div className="flex justify-center items-center" style={{ padding: '48px 0', gap: '10px', fontSize: '14px', color: 'var(--mm-text-muted)' }}>
                        <span className="ms" style={{ fontSize: '20px', color: 'var(--mm-primary)', animation: 'spin 1s linear infinite' }}>progress_activity</span>
                        {lang === 'vi' ? 'Đang tải danh sách người dùng...' : 'Loading patient directory...'}
                      </div>
                    ) : adminData && adminData.users.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        {/* header row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1fr 72px', padding: '12px 22px', background: 'var(--mm-surface-2)', fontSize: '12.5px', fontWeight: 700, color: 'var(--mm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid var(--mm-border-warm)', minWidth: '640px' }}>
                          <div>{lang === 'vi' ? 'Bệnh nhân' : 'Patient'}</div>
                          <div style={{ textAlign: 'center' }}>{lang === 'vi' ? 'Chuỗi' : 'Streak'}</div>
                          <div style={{ textAlign: 'center' }}>{lang === 'vi' ? 'Số thuốc' : 'Meds'}</div>
                          <div style={{ textAlign: 'center' }}>{lang === 'vi' ? 'Uống hôm nay' : 'Today'}</div>
                          <div style={{ textAlign: 'center' }}>{lang === 'vi' ? 'Tuân thủ' : 'Adherence'}</div>
                          <div style={{ textAlign: 'right' }}>{lang === 'vi' ? 'Thao tác' : 'Actions'}</div>
                        </div>
                        {adminData.users.filter((item) => !patientSearch.trim() || (item.email || '').toLowerCase().includes(patientSearch.trim().toLowerCase())).map((item) => {
                          const complete = item.todayLogs.total > 0 && item.todayLogs.taken === item.todayLogs.total
                          const rate = item.todayLogs.total > 0 ? Math.round((item.todayLogs.taken / item.todayLogs.total) * 100) : 0
                          return (
                            <div
                              key={item.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedAdminUser(item)}
                              onKeyDown={(e) => { if (e.key === 'Enter') setSelectedAdminUser(item) }}
                              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1fr 72px', padding: '14px 22px', alignItems: 'center', borderBottom: '1px solid var(--mm-border-warm)', minWidth: '640px', width: '100%', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                            >
                              <div className="flex items-center" style={{ gap: '11px', minWidth: 0 }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary-dark)', fontWeight: 700, fontSize: '14px', flexShrink: 0, textTransform: 'uppercase' }}>
                                  {(item.name || item.email || '?').slice(0, 2)}
                                </span>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--mm-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '190px' }}>{item.name || item.email}</div>
                                  <div style={{ fontSize: '12.5px', color: 'var(--mm-text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '190px' }}>
                                    {item.name ? item.email : new Date(item.created_at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                                  </div>
                                </div>
                              </div>
                              <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--mm-amber)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <span className="ms" style={{ fontSize: '18px' }}>local_fire_department</span>{item.streak}
                              </div>
                              <div style={{ textAlign: 'center', fontWeight: 600, color: 'var(--mm-text)' }}>{item.medCount}</div>
                              <div style={{ textAlign: 'center', fontWeight: 700, color: complete ? 'var(--mm-primary)' : (item.todayLogs.total === 0 ? 'var(--mm-text-faint)' : 'var(--mm-amber)') }}>
                                {item.todayLogs.taken}/{item.todayLogs.total}
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <span style={{ display: 'inline-block', padding: '5px 11px', borderRadius: '999px', background: item.todayLogs.total === 0 ? 'var(--mm-surface-3)' : (complete ? 'var(--mm-primary-soft)' : '#FBEEE0'), color: item.todayLogs.total === 0 ? 'var(--mm-text-muted)' : (complete ? 'var(--mm-primary-dark)' : '#B06A2C'), fontSize: '13px', fontWeight: 700 }}>
                                  {rate}%
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedAdminUser(item) }} className="mm-btn mm-btn-ghost" style={{ padding: '6px', borderRadius: '9px' }} title={lang === 'vi' ? 'Chi tiết' : 'Details'}>
                                  <span className="ms" style={{ fontSize: '19px' }}>visibility</span>
                                </button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteUser(item.id, item.email) }} className="mm-btn mm-btn-ghost" style={{ padding: '6px', borderRadius: '9px', color: '#C0574E' }} title={lang === 'vi' ? 'Xoá người dùng' : 'Delete user'}>
                                  <span className="ms" style={{ fontSize: '19px' }}>delete</span>
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div style={{ padding: '32px 0', textAlign: 'center', fontSize: '14px', color: 'var(--mm-text-faint)' }}>
                        {lang === 'vi' ? 'Chưa có người dùng nào.' : 'No users found.'}
                      </div>
                    )}
                  </div>

                  {/* Broadcast + attention column */}
                  <div className="flex flex-col" style={{ flex: '1 1 0%', minWidth: 0, gap: '16px', width: '100%' }}>
                    {/* Announcement Broadcast */}
                    <div className="mm-card" style={{ padding: '20px 22px' }}>
                      <div className="flex items-center" style={{ gap: '9px', fontSize: '16px', fontWeight: 700, color: 'var(--mm-text)', marginBottom: '6px' }}>
                        <span className="ms" style={{ fontSize: '22px', color: 'var(--mm-primary)' }}>campaign</span>
                        {lang === 'vi' ? 'Phát thông báo hệ thống' : 'System-Wide Broadcast'}
                      </div>
                      <div style={{ fontSize: '13.5px', color: 'var(--mm-text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
                        {lang === 'vi' ? 'Gửi tới toàn bộ người dùng đang hoạt động.' : 'Send an alert to all active users.'}
                      </div>
                      {/* Severity */}
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--mm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '7px' }}>{lang === 'vi' ? 'Mức độ' : 'Severity'}</div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                        {([
                          { key: 'info', icon: 'info', vi: 'Thông tin', en: 'Info', bg: 'var(--mm-primary-soft)', color: 'var(--mm-primary-dark)', border: '#C9DCCF' },
                          { key: 'warning', icon: 'warning', vi: 'Cảnh báo', en: 'Warning', bg: '#FBEEE0', color: '#B06A2C', border: '#F2D9B8' },
                          { key: 'urgent', icon: 'priority_high', vi: 'Khẩn cấp', en: 'Urgent', bg: '#FDF1EF', color: '#C0574E', border: '#F0D6D2' },
                        ] as const).map((s) => {
                          const active = broadcastSeverity === s.key
                          return (
                            <button key={s.key} type="button" onClick={() => setBroadcastSeverity(s.key)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 13px', borderRadius: '999px', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', background: active ? s.bg : 'transparent', color: active ? s.color : 'var(--mm-text-muted)', border: `1px solid ${active ? s.border : 'var(--mm-border-warm)'}` }}>
                              <span className="ms" style={{ fontSize: '16px' }}>{s.icon}</span>{lang === 'vi' ? s.vi : s.en}
                            </button>
                          )
                        })}
                      </div>
                      {/* Title */}
                      <input
                        type="text"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        placeholder={lang === 'vi' ? 'Tiêu đề (vd: Bảo trì hệ thống tối nay)' : 'Title (e.g. System maintenance tonight)'}
                        style={{ width: '100%', background: 'var(--mm-bg)', border: '1px solid var(--mm-border-warm)', borderRadius: '12px', padding: '12px 15px', fontSize: '14.5px', fontFamily: 'inherit', color: 'var(--mm-text)', outline: 'none', marginBottom: '10px' }}
                      />
                      <textarea
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        placeholder={lang === 'vi' ? 'Nội dung thông báo…' : 'Message content…'}
                        style={{ width: '100%', background: 'var(--mm-bg)', border: '1px solid var(--mm-border-warm)', borderRadius: '12px', padding: '13px 15px', fontSize: '14.5px', fontFamily: 'inherit', color: 'var(--mm-text)', minHeight: '78px', lineHeight: 1.5, outline: 'none', resize: 'vertical' }}
                      />
                      <button
                        onClick={async () => {
                          if (!broadcastMessage.trim()) return
                          const payload = { message: broadcastMessage.trim().slice(0, 500), title: broadcastTitle.trim().slice(0, 160) || null, severity: broadcastSeverity }
                          try {
                            const res = await fetch('/api/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                            const data = await res.json()
                            if (!res.ok) { alert(data.error || (lang === 'vi' ? 'Không phát được thông báo.' : 'Failed to broadcast.')); return }
                            const now = new Date().toISOString()
                            setLatestBroadcast({ id: now, message: payload.message, title: payload.title, severity: payload.severity, created_at: now })
                            setDismissedBroadcast(null) // make sure the fresh broadcast is shown
                            setBroadcastMessage(''); setBroadcastTitle(''); setBroadcastSeverity('info')
                            alert(lang === 'vi' ? 'Đã phát thông báo tới tất cả người dùng!' : 'Broadcast sent to all users!')
                          } catch {
                            alert(lang === 'vi' ? 'Lỗi kết nối.' : 'Connection error.')
                          }
                        }}
                        className="mm-btn mm-btn-primary"
                        style={{ marginTop: '12px', width: '100%', fontSize: '15px', fontWeight: 700, padding: '13px', gap: '8px' }}
                      >
                        <span className="ms" style={{ fontSize: '20px' }}>send</span>
                        {lang === 'vi' ? 'Phát thông báo' : 'Send'}
                      </button>
                      {/* Recently sent */}
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--mm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '18px 0 8px' }}>{lang === 'vi' ? 'Đã gửi gần đây' : 'Recently sent'}</div>
                      {latestBroadcast ? (() => {
                        const bs = broadcastStyle(latestBroadcast.severity)
                        return (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: bs.bg, border: `1px solid ${bs.border}`, borderRadius: '12px', padding: '12px 14px' }}>
                          <span className="ms" style={{ fontSize: '18px', color: bs.color, marginTop: '1px' }}>{bs.icon}</span>
                          <div style={{ minWidth: 0 }}>
                            {latestBroadcast.title?.trim() && <div style={{ fontSize: '13.5px', fontWeight: 700, color: bs.color, lineHeight: 1.45 }}>{latestBroadcast.title}</div>}
                            <div style={{ fontSize: '13.5px', color: 'var(--mm-text)', lineHeight: 1.45 }}>{latestBroadcast.message}</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--mm-text-faint)', marginTop: '4px' }}>{new Date(latestBroadcast.created_at).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}</div>
                          </div>
                        </div>
                        )
                      })() : (
                        <div style={{ fontSize: '13px', color: 'var(--mm-text-faint)', fontStyle: 'italic' }}>{lang === 'vi' ? 'Chưa có thông báo nào được gửi.' : 'No broadcasts sent yet.'}</div>
                      )}
                    </div>

                    {/* Attention card */}
                    <div style={{ background: '#FDF3E7', border: '1px solid #F2D9B8', borderRadius: '18px', padding: '20px 22px' }}>
                      <div className="flex items-center" style={{ gap: '9px', fontSize: '16px', fontWeight: 700, color: '#B06A2C', marginBottom: '6px' }}>
                        <span className="ms" style={{ fontSize: '22px' }}>priority_high</span>
                        {lang === 'vi' ? 'Cần chú ý' : 'Needs Attention'}
                      </div>
                      <div style={{ fontSize: '13.5px', color: '#7A6A52', lineHeight: 1.55 }}>
                        {(() => {
                          const lowCount = (adminData?.users || []).filter((u) => u.todayLogs.total > 0 && (u.todayLogs.taken / u.todayLogs.total) < 0.6).length
                          if (lowCount > 0) {
                            return lang === 'vi'
                              ? `${lowCount} bệnh nhân có tỷ lệ tuân thủ dưới 60% hôm nay. Nên gửi nhắc nhở riêng hoặc liên hệ người thân.`
                              : `${lowCount} patient(s) below 60% adherence today. Consider sending personal reminders or contacting caregivers.`
                          }
                          return lang === 'vi'
                            ? 'Tất cả bệnh nhân đang tuân thủ tốt hôm nay. Theo dõi thường xuyên để duy trì.'
                            : 'All patients are on track today. Keep monitoring to maintain adherence.'
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Weekly schedule (Lịch thuốc) */}
            {activeTab === 'schedule' && (
              <section className="flex-1 min-h-0 flex flex-col overflow-y-auto p-6 md:p-8 pb-24 md:pb-8" style={{ background: 'var(--mm-bg)' }}>
                {(() => {
                  const dayLabels = lang === 'vi' ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                  const now = new Date()
                  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                  const monday = new Date(todayMid)
                  monday.setDate(todayMid.getDate() - ((todayMid.getDay() + 6) % 7) + weekOffset * 7)
                  const weekDates = Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d })
                  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
                  const isScheduledOn = (med: Medication, date: Date) => {
                    const f = (med.frequency || '').toLowerCase()
                    const created = new Date(med.created_at)
                    const createdMid = new Date(created.getFullYear(), created.getMonth(), created.getDate())
                    if (date < createdMid) return false
                    if (f.includes('week') || f.includes('tuần')) return date.getDay() === created.getDay()
                    if (f.includes('other') || f.includes('cách')) return Math.round((date.getTime() - createdMid.getTime()) / 86400000) % 2 === 0
                    return true
                  }
                  const fmt = (d: Date) => d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'long' })
                  const dosesPerDay = medications.reduce((sum, m) => sum + (isScheduledOn(m, todayMid) ? (m.schedule?.length || 1) : 0), 0)
                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap', marginBottom: '22px' }}>
                        <div>
                          <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--mm-text)' }}>{fmt(weekDates[0])} — {fmt(weekDates[6])}</h2>
                          <p style={{ fontSize: '15px', color: 'var(--mm-text-muted)', marginTop: '3px' }}>
                            {lang === 'vi' ? `${medications.length} loại thuốc đang dùng · ${dosesPerDay} lần uống mỗi ngày` : `${medications.length} medications · ${dosesPerDay} doses per day`}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button type="button" onClick={() => setWeekOffset((w) => w - 1)} className="mm-icon-badge" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--mm-surface-2)', border: '1px solid var(--mm-border-warm)', color: 'var(--mm-text-muted)', cursor: 'pointer' }}><span className="ms" style={{ fontSize: '22px' }}>chevron_left</span></button>
                          <button type="button" onClick={() => setWeekOffset((w) => w + 1)} className="mm-icon-badge" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--mm-surface-2)', border: '1px solid var(--mm-border-warm)', color: 'var(--mm-text-muted)', cursor: 'pointer' }}><span className="ms" style={{ fontSize: '22px' }}>chevron_right</span></button>
                          {weekOffset !== 0 && (
                            <button type="button" onClick={() => setWeekOffset(0)} className="mm-btn mm-btn-outline" style={{ padding: '9px 14px', fontSize: '14px' }}>{lang === 'vi' ? 'Tuần này' : 'This week'}</button>
                          )}
                          <button type="button" onClick={() => setShowAddModal(true)} className="mm-btn mm-btn-primary" style={{ padding: '0 18px', height: '42px', fontSize: '15px' }}>
                            <span className="ms" style={{ fontSize: '20px' }}>add</span>{lang === 'vi' ? 'Thêm thuốc' : 'Add'}
                          </button>
                        </div>
                      </div>

                      {medications.length === 0 ? (
                        <ComingSoon showDevBadge={false} lang={lang} icon="calendar_month" title={lang === 'vi' ? 'Chưa có thuốc nào trong lịch' : 'No medications yet'} desc={lang === 'vi' ? 'Thêm thuốc hoặc quét đơn thuốc để xem lịch uống theo tuần.' : 'Add a medication or scan a prescription to see your weekly plan.'} cta={lang === 'vi' ? 'Thêm thuốc' : 'Add medication'} onCta={() => setShowAddModal(true)} />
                      ) : (
                        <div className="mm-card" style={{ padding: 0, overflow: 'hidden', flexShrink: 0 }}>
                          <div style={{ overflowX: 'auto' }}>
                            <div style={{ minWidth: '760px' }}>
                              {/* header */}
                              <div style={{ display: 'grid', gridTemplateColumns: '240px repeat(7, 1fr)', background: 'var(--mm-surface-2)', borderBottom: '1px solid var(--mm-border-warm)' }}>
                                <div style={{ padding: '14px 18px', fontSize: '13px', fontWeight: 700, color: 'var(--mm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{lang === 'vi' ? 'Thuốc' : 'Medication'}</div>
                                {weekDates.map((d, i) => {
                                  const isToday = sameDay(d, todayMid)
                                  return (
                                    <div key={i} style={{ padding: '10px 6px', textAlign: 'center', background: isToday ? 'var(--mm-primary-soft)' : 'transparent' }}>
                                      <div style={{ fontSize: '13px', fontWeight: isToday ? 700 : 600, color: isToday ? 'var(--mm-primary-dark)' : 'var(--mm-text-faint)' }}>{dayLabels[i]}</div>
                                      {isToday ? (
                                        <div style={{ margin: '3px auto 0', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--mm-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>{d.getDate()}</div>
                                      ) : (
                                        <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px', color: 'var(--mm-text)' }}>{d.getDate()}</div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                              {/* rows */}
                              {medications.map((med, ri) => (
                                <div key={med.id} style={{ display: 'grid', gridTemplateColumns: '240px repeat(7, 1fr)', alignItems: 'center', borderBottom: ri === medications.length - 1 ? 'none' : '1px solid var(--mm-border-warm)' }}>
                                  <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
                                    <span className="mm-icon-badge" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary)', flexShrink: 0 }}><span className="ms" style={{ fontSize: '20px' }}>medication</span></span>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--mm-text)', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.3 }}>{med.name}</div>
                                      <div style={{ fontSize: '12.5px', color: 'var(--mm-text-faint)', whiteSpace: 'normal', lineHeight: 1.35, marginTop: '2px' }}>{(med.schedule || []).join(' · ') || '—'}</div>
                                    </div>
                                  </div>
                                  {weekDates.map((d, i) => {
                                    const scheduled = isScheduledOn(med, d)
                                    const isToday = sameDay(d, todayMid)
                                    const isFuture = d > todayMid
                                    let cell: React.ReactNode = null
                                    if (!scheduled) {
                                      cell = <span style={{ color: 'var(--mm-border)', fontSize: '15px' }}>·</span>
                                    } else if (isToday) {
                                      const medLogs = logs.filter((l) => l.medication_id === med.id)
                                      const allTaken = medLogs.length > 0 && medLogs.every((l) => l.status === 'taken')
                                      const anyMissed = medLogs.some((l) => l.status === 'missed')
                                      if (allTaken) cell = <span className="ms" style={{ fontSize: '25px', color: 'var(--mm-primary)' }}>check_circle</span>
                                      else if (anyMissed) cell = <span className="ms" style={{ fontSize: '25px', color: '#C79A3B' }}>error</span>
                                      else cell = <span style={{ display: 'inline-block', width: '22px', height: '22px', borderRadius: '50%', border: '2px solid var(--mm-primary)' }} />
                                    } else if (isFuture) {
                                      cell = <span style={{ display: 'inline-block', width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #D6DCCF' }} />
                                    } else {
                                      cell = <span style={{ display: 'inline-block', width: '22px', height: '22px', borderRadius: '50%', border: '2px dashed #D6DCCF' }} />
                                    }
                                    return <div key={i} style={{ textAlign: 'center', padding: '12px 6px', background: isToday ? 'rgba(230,239,232,0.4)' : 'transparent' }}>{cell}</div>
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* legend */}
                      <div style={{ display: 'flex', gap: '22px', flexWrap: 'wrap', marginTop: '16px', fontSize: '13.5px', color: 'var(--mm-text-muted)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span className="ms" style={{ fontSize: '18px', color: 'var(--mm-primary)' }}>check_circle</span>{lang === 'vi' ? 'Đã uống' : 'Taken'}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '15px', height: '15px', borderRadius: '50%', border: '2px solid var(--mm-primary)' }} />{lang === 'vi' ? 'Hôm nay' : 'Today'}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '15px', height: '15px', borderRadius: '50%', border: '2px solid #D6DCCF' }} />{lang === 'vi' ? 'Sắp tới' : 'Upcoming'}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span className="ms" style={{ fontSize: '18px', color: '#C79A3B' }}>error</span>{lang === 'vi' ? 'Bỏ lỡ' : 'Missed'}</span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: 'var(--mm-text-faint)', marginTop: '10px' }}>{lang === 'vi' ? 'Ghi chú: trạng thái đã uống/bỏ lỡ hiện có cho hôm nay; các ngày khác hiển thị theo lịch trình.' : 'Note: taken/missed status is live for today; other days show the planned schedule.'}</p>
                    </>
                  )
                })()}
              </section>
            )}

            {/* Stats (Thống kê) */}
            {activeTab === 'stats' && (
              <section className="flex-1 min-h-0 flex flex-col overflow-y-auto p-6 md:p-8 pb-24 md:pb-8" style={{ background: 'var(--mm-bg)' }}>
                {(() => {
                  const byDay = weekly?.byDay ?? []
                  const byMed = weekly?.byMed ?? []
                  const weekPct = weekly?.weekPct ?? 0
                  const weekTaken = weekly?.taken ?? 0
                  const weekTotal = weekly?.total ?? 0
                  const worst = byMed.length ? byMed[byMed.length - 1] : null
                  return (
                    <>
                      <div style={{ marginBottom: '22px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--mm-text)' }}>{lang === 'vi' ? 'Thống kê tuân thủ' : 'Adherence statistics'}</h2>
                        <p style={{ fontSize: '15px', color: 'var(--mm-text-muted)', marginTop: '3px' }}>{lang === 'vi' ? 'Tổng quan tuân thủ điều trị của bạn.' : 'An overview of your treatment adherence.'}</p>
                      </div>

                      {/* Top 3 summary cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '16px', marginBottom: '22px' }}>
                        {/* Streak (highlighted) */}
                        <div style={{ borderRadius: '18px', padding: '22px 24px', background: 'var(--mm-primary)', color: '#fff', display: 'flex', alignItems: 'center', gap: '18px', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', right: '-30px', top: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                          <span className="mm-icon-badge" style={{ width: '54px', height: '54px', borderRadius: '15px', background: 'rgba(255,255,255,0.18)', color: '#fff', flexShrink: 0 }}><span className="ms" style={{ fontSize: '30px' }}>local_fire_department</span></span>
                          <div style={{ position: 'relative' }}>
                            <div style={{ fontSize: '38px', fontWeight: 800, lineHeight: 1 }}>{streak}</div>
                            <div style={{ fontSize: '14px', opacity: 0.92, marginTop: '4px', lineHeight: 1.3 }}>{lang === 'vi' ? 'ngày tuân thủ liên tục' : 'day adherence streak'}</div>
                          </div>
                        </div>
                        {/* Weekly ring */}
                        <div className="mm-card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '18px' }}>
                          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `conic-gradient(var(--mm-primary) 0% ${weekPct}%, var(--mm-primary-soft) ${weekPct}% 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--mm-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: 'var(--mm-primary-dark)' }}>{weekPct}%</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--mm-text)' }}>{lang === 'vi' ? 'Tuân thủ tuần này' : 'This week'}</div>
                            <div style={{ fontSize: '13.5px', color: 'var(--mm-text-muted)', marginTop: '3px', lineHeight: 1.4 }}>{lang === 'vi' ? 'Trung bình 7 ngày qua' : 'Average over 7 days'}</div>
                          </div>
                        </div>
                        {/* Doses on time */}
                        <div className="mm-card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '18px' }}>
                          <span className="mm-icon-badge" style={{ width: '54px', height: '54px', borderRadius: '15px', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary)', flexShrink: 0 }}><span className="ms" style={{ fontSize: '28px' }}>event_available</span></span>
                          <div>
                            <div style={{ fontSize: '30px', fontWeight: 800, lineHeight: 1, color: 'var(--mm-text)' }}>{weekTaken}<span style={{ fontSize: '18px', color: 'var(--mm-text-faint)' }}>/{weekTotal}</span></div>
                            <div style={{ fontSize: '14px', color: 'var(--mm-text-muted)', marginTop: '4px', lineHeight: 1.3 }}>{lang === 'vi' ? 'liều đã uống đúng hẹn' : 'doses taken on time'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col lg:flex-row items-stretch" style={{ gap: '22px' }}>
                        {/* Daily bar chart */}
                        <div className="mm-card" style={{ flex: '1.15 1 0%', minWidth: 0, width: '100%', padding: '20px 22px' }}>
                          <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--mm-text)' }}>{lang === 'vi' ? 'Tỷ lệ uống đúng theo ngày' : 'On-time rate by day'}</div>
                          <div style={{ fontSize: '13px', color: 'var(--mm-text-faint)', marginTop: '2px', marginBottom: '18px' }}>{lang === 'vi' ? '7 ngày gần nhất · ngưỡng đạt 80%' : 'Last 7 days · 80% target'}</div>
                          {!weekly ? (
                            <div style={{ fontSize: '14px', color: 'var(--mm-text-faint)', padding: '40px 0', textAlign: 'center' }}>{lang === 'vi' ? 'Đang tải…' : 'Loading…'}</div>
                          ) : (
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '10px', height: '176px', paddingTop: '18px' }}>
                              {/* 80% threshold line */}
                              <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${18 + 0.8 * 140}px`, borderTop: '1px dashed var(--mm-border)', zIndex: 0 }} />
                              {byDay.map((d, i) => {
                                const h = d.pct == null ? 4 : Math.max(4, Math.round((d.pct / 100) * 140))
                                const good = (d.pct ?? 0) >= 80
                                return (
                                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', zIndex: 1 }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: d.pct == null ? 'var(--mm-text-faint)' : good ? 'var(--mm-primary)' : '#C79A3B', marginBottom: '5px' }}>{d.pct == null ? '' : `${d.pct}%`}</div>
                                    <div style={{ width: '100%', maxWidth: '30px', height: `${h}px`, borderRadius: '7px 7px 3px 3px', background: d.pct == null ? 'var(--mm-surface-3)' : good ? 'var(--mm-primary)' : '#E6B34D' }} />
                                    <div style={{ fontSize: '12px', color: 'var(--mm-text-faint)', marginTop: '8px' }}>{d.label}</div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Per-medication (weekly) + tip */}
                        <div className="mm-card" style={{ flex: '1 1 0%', minWidth: 0, width: '100%', padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--mm-text)', marginBottom: '16px' }}>{lang === 'vi' ? 'Tuân thủ theo từng thuốc' : 'Adherence by medication'}</div>
                          {byMed.length === 0 ? (
                            <div style={{ fontSize: '14px', color: 'var(--mm-text-faint)', padding: '12px 0' }}>{weekly ? (lang === 'vi' ? 'Chưa có dữ liệu tuần này.' : 'No data this week.') : (lang === 'vi' ? 'Đang tải…' : 'Loading…')}</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                              {byMed.map((m) => {
                                const good = m.pct >= 80
                                return (
                                  <div key={m.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                                      <span style={{ fontWeight: 600, color: 'var(--mm-text)' }}>{m.name}</span>
                                      <span style={{ fontWeight: 700, color: good ? 'var(--mm-primary)' : '#B06A2C' }}>{m.pct}%</span>
                                    </div>
                                    <div style={{ height: '8px', borderRadius: '999px', background: 'var(--mm-surface-3)', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${m.pct}%`, background: good ? 'var(--mm-primary)' : '#E6B34D', borderRadius: '999px' }} />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          {worst && worst.pct < 90 && (
                            <div style={{ marginTop: '18px', display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#FDF3E7', border: '1px solid #F2D9B8', borderRadius: '13px', padding: '13px 15px' }}>
                              <span className="ms" style={{ fontSize: '20px', color: '#B06A2C', flexShrink: 0 }}>lightbulb</span>
                              <div style={{ fontSize: '13px', color: '#7A6A52', lineHeight: 1.5 }}>
                                {lang === 'vi'
                                  ? <>Bạn tuân thủ <b>{worst.name}</b> thấp nhất tuần này ({worst.pct}%). Cân nhắc đặt thêm nhắc nhở cho thuốc này.</>
                                  : <>Your lowest adherence this week is <b>{worst.name}</b> ({worst.pct}%). Consider adding a reminder.</>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </section>
            )}

          </main>

          {isMobileNav && <BottomNav lang={lang} activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={!!isAdmin} />}

          {/* Patient Profile overlay */}
          {showProfile && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--mm-bg)', overflowY: 'auto' }}>
              <div style={{ maxWidth: '980px', margin: '0 auto', padding: '20px 20px 60px' }}>
                {/* top bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0 20px' }}>
                  <button type="button" onClick={() => setShowProfile(false)} className="mm-icon-badge" style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--mm-surface)', border: '1px solid var(--mm-border-warm)', color: 'var(--mm-text-muted)', cursor: 'pointer' }}><span className="ms" style={{ fontSize: '22px' }}>arrow_back</span></button>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--mm-text)' }}>{lang === 'vi' ? 'Hồ sơ của bạn' : 'Your profile'}</div>
                </div>
                <div className="flex flex-col md:flex-row items-start" style={{ gap: '22px' }}>
                  {/* Left profile card */}
                  <div className="mm-card" style={{ width: '100%', maxWidth: '340px', padding: '26px 24px', textAlign: 'center', flexShrink: 0 }}>
                    <span className="mm-icon-badge" style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary-dark)', fontWeight: 800, fontSize: '30px', margin: '0 auto', textTransform: 'uppercase' }}>{(user.email || '?').slice(0, 2)}</span>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--mm-text)', marginTop: '14px' }}>{user.email ? user.email.split('@')[0] : (lang === 'vi' ? 'Người dùng' : 'User')}</div>
                    <div style={{ fontSize: '14px', color: 'var(--mm-text-faint)', marginTop: '2px', wordBreak: 'break-all' }}>{user.email}</div>
                    <div style={{ height: '1px', background: 'var(--mm-border-warm)', margin: '22px 0' }} />
                    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', color: 'var(--mm-text-faint)', fontWeight: 600, textTransform: 'uppercase' }}>{lang === 'vi' ? 'Chuỗi ngày tuân thủ' : 'Adherence streak'}</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mm-text)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}><span className="ms" style={{ fontSize: '18px', color: 'var(--mm-orange)' }}>local_fire_department</span>{streak} {lang === 'vi' ? 'ngày' : 'days'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12.5px', color: 'var(--mm-text-faint)', fontWeight: 600, textTransform: 'uppercase' }}>{lang === 'vi' ? 'Thuốc đang dùng' : 'Active medications'}</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mm-text)', marginTop: '2px' }}>{medications.length} {lang === 'vi' ? 'loại' : 'meds'}</div>
                      </div>
                    </div>
                    <button type="button" onClick={handleSignOut} className="mm-btn" style={{ width: '100%', marginTop: '22px', padding: '12px', fontSize: '14.5px', background: '#FDF1EF', color: '#C0574E', border: '1px solid #F0D6D2' }}>
                      <span className="ms" style={{ fontSize: '19px' }}>logout</span>{lang === 'vi' ? 'Đăng xuất' : 'Sign out'}
                    </button>
                  </div>

                  {/* Right settings */}
                  <div style={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Accessibility */}
                    <div className="mm-card" style={{ padding: '22px 24px' }}>
                      <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--mm-text)' }}>{lang === 'vi' ? 'Hiển thị & trợ năng' : 'Display & accessibility'}</div>
                      <div style={{ fontSize: '13.5px', color: 'var(--mm-text-faint)', marginTop: '2px' }}>{lang === 'vi' ? 'Tùy chỉnh cho dễ nhìn.' : 'Adjust for easier reading.'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '18px' }}>
                        <span className="mm-icon-badge" style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary)', flexShrink: 0 }}><span className="ms" style={{ fontSize: '22px' }}>format_size</span></span>
                        <div style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: 'var(--mm-text)' }}>{lang === 'vi' ? 'Cỡ chữ' : 'Font size'}</div>
                        <div className="mm-seg" style={{ padding: '4px' }}>
                          {(['sm', 'md', 'lg'] as const).map((s) => (
                            <button key={s} type="button" onClick={() => setFontScale(s)} className={`mm-seg-item${fontScale === s ? ' active' : ''}`} style={{ padding: '7px 14px', fontSize: s === 'sm' ? '13px' : s === 'md' ? '15px' : '17px' }}>A</button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Reminders */}
                    <div className="mm-card" style={{ padding: '22px 24px' }}>
                      <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--mm-text)', marginBottom: '4px' }}>{lang === 'vi' ? 'Lời nhắc' : 'Reminders'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '14px' }}>
                        <span className="mm-icon-badge" style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary)', flexShrink: 0 }}><span className="ms" style={{ fontSize: '21px' }}>notifications</span></span>
                        <div style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: 'var(--mm-text)' }}>{lang === 'vi' ? 'Nhắc đẩy (push)' : 'Push reminders'}</div>
                        <MMToggle on={pushReminders} onClick={togglePushReminders} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '14px' }}>
                        <span className="mm-icon-badge" style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'var(--mm-surface-3)', color: 'var(--mm-text-faint)', flexShrink: 0 }}><span className="ms" style={{ fontSize: '21px' }}>mail</span></span>
                        <div style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: 'var(--mm-text)' }}>{lang === 'vi' ? 'Nhắc qua email' : 'Email reminders'}</div>
                        <MMToggle on={emailReminders} onClick={() => setEmailReminders((v) => !v)} />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Manual Add Medication Modal */}
          {/* Add Medication Modal */}
          <AddMedicationModal lang={lang} showAddModal={showAddModal} setShowAddModal={setShowAddModal} handleManualAddMedication={handleManualAddMedication} newMedName={newMedName} setNewMedName={setNewMedName} newMedDosage={newMedDosage} setNewMedDosage={setNewMedDosage} newMedFreq={newMedFreq} setNewMedFreq={setNewMedFreq} newMedTime={newMedTime} setNewMedTime={setNewMedTime} newMedStock={newMedStock} setNewMedStock={setNewMedStock} newMedDosageQty={newMedDosageQty} setNewMedDosageQty={setNewMedDosageQty} newMedPrescriptionName={newMedPrescriptionName} setNewMedPrescriptionName={setNewMedPrescriptionName} />

          {/* Edit Medication Modal */}
          <EditMedicationModal lang={lang} showEditModal={showEditModal} editingMedication={editingMedication} setShowEditModal={setShowEditModal} setEditingMedication={setEditingMedication} handleSaveEditMedication={handleSaveEditMedication} editMedName={editMedName} setEditMedName={setEditMedName} editMedPrescriptionName={editMedPrescriptionName} setEditMedPrescriptionName={setEditMedPrescriptionName} editMedDosage={editMedDosage} setEditMedDosage={setEditMedDosage} editMedTime={editMedTime} setEditMedTime={setEditMedTime} editMedFreq={editMedFreq} setEditMedFreq={setEditMedFreq} editMedDosageQty={editMedDosageQty} setEditMedDosageQty={setEditMedDosageQty} editMedStock={editMedStock} setEditMedStock={setEditMedStock} editMedRemainingStock={editMedRemainingStock} setEditMedRemainingStock={setEditMedRemainingStock} />

          {/* Admin view user medication schedule modal */}
          <PrescriptionReviewModal lang={lang} meds={prescriptionReview} onClose={() => setPrescriptionReview(null)} onEdit={(m) => { setPrescriptionReview(null); handleEditMedicationClick(m) }} />

          <PatientDetailModal lang={lang} selectedAdminUser={selectedAdminUser} setSelectedAdminUser={setSelectedAdminUser} handleDeleteUser={handleDeleteUser} />

          <AddUserModal lang={lang} showAddUserModal={showAddUserModal} setShowAddUserModal={setShowAddUserModal} handleCreateUser={handleCreateUser} newUserEmail={newUserEmail} setNewUserEmail={setNewUserEmail} newUserPassword={newUserPassword} setNewUserPassword={setNewUserPassword} newUserName={newUserName} setNewUserName={setNewUserName} creatingUser={creatingUser} />

        </div>
      )}
    </div>
  )
}
