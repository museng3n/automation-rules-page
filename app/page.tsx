"use client"

import { useState, useEffect } from "react"
import { Plus, Download, Settings, Eye, Edit, MoreVertical, Search, ChevronDown } from "lucide-react"
import { apiClient } from "@/shared-api-config/api/client"
import ENDPOINTS from "@/shared-api-config/api/endpoints"
import { isAuthenticated } from "@/shared-api-config/utils/auth"
import { URLS } from "@/shared-api-config/api/config"

// Sample automation rules data (fallback)
const sampleRules = [
  {
    id: 1,
    titleAr: "الرد التلقائي على المهتمين",
    titleEn: "Auto-Reply for Interested",
    status: "active",
    platform: "instagram",
    trigger: { icon: "💬", textAr: 'تعليق جديد يحتوي على "مهتم"', textEn: 'New comment containing "مهتم"' },
    action: { icon: "💬📱", textAr: "رد تلقائي + رسالة خاصة", textEn: "Auto-reply + Send DM" },
    executions: 45,
    successRate: 92,
    lastRun: "منذ ساعة",
    messagePreview: "شكراً لاهتمامك! سنرسل لك التفاصيل...",
  },
  {
    id: 2,
    titleAr: "مرحباً بالمتابعين الجدد",
    titleEn: "Welcome New Followers",
    status: "active",
    platform: "instagram",
    trigger: { icon: "👤", textAr: "متابع جديد", textEn: "New Follow" },
    action: { icon: "📱", textAr: "إرسال رسالة ترحيب", textEn: "Send welcome DM" },
    executions: 23,
    successRate: 88,
    lastRun: "منذ 3 ساعات",
    messagePreview: "مرحباً! شكراً للمتابعة...",
  },
  {
    id: 3,
    titleAr: "رسالة المتابعة التلقائية",
    titleEn: "Auto Follow-up Message",
    status: "active",
    platform: "email",
    trigger: { icon: "📧", textAr: "البريد الإلكتروني مفتوح", textEn: "Email Opened" },
    action: { icon: "📧", textAr: "إرسال رسالة متابعة بعد يومين", textEn: "Send follow-up after 2 days" },
    executions: 67,
    successRate: 95,
    lastRun: "اليوم 10:00 صباحاً",
    messagePreview: "هل لديك أي أسئلة؟",
  },
  {
    id: 4,
    titleAr: "تأكيد الاشتراك",
    titleEn: "Subscription Confirmation",
    status: "paused",
    platform: "instagram",
    trigger: { icon: "💬", textAr: 'تعليق يحتوي على "اشتراك"', textEn: 'Comment contains "اشتراك"' },
    action: { icon: "💬💾🏷️", textAr: "رد + حفظ جهة اتصال + إضافة علامة", textEn: "Reply + Save Contact + Add Tag" },
    executions: 12,
    successRate: 90,
    lastRun: "منذ 4 أيام",
    messagePreview: "تم تأكيد اشتراكك!",
  },
  {
    id: 5,
    titleAr: "الرد على الاستفسارات",
    titleEn: "Reply to Inquiries",
    status: "active",
    platform: "facebook",
    trigger: { icon: "📱", textAr: "رسالة ماسنجر", textEn: "Messenger message" },
    action: { icon: "💬", textAr: "رد تلقائي مع الأسئلة الشائعة", textEn: "Auto-reply with FAQ" },
    executions: 34,
    successRate: 85,
    lastRun: "منذ 2 ساعة",
    messagePreview: "شكراً على تواصلك معنا...",
  },
  {
    id: 6,
    titleAr: "مشاركة المحتوى",
    titleEn: "Content Share",
    status: "draft",
    platform: "instagram",
    trigger: { icon: "🔄", textAr: "مشاركة المنشور", textEn: "Post Share" },
    action: { icon: "📱", textAr: "رسالة شكر", textEn: "Thank you DM" },
    executions: 0,
    successRate: 0,
    lastRun: "لم يتم التنفيذ بعد",
    messagePreview: "",
  },
]

const PlatformBadge = ({ platform }: { platform: string }) => {
  const configs = {
    instagram: { bg: "bg-pink-100", text: "text-pink-700", icon: "📷", label: "Instagram" },
    facebook: { bg: "bg-blue-100", text: "text-blue-700", icon: "👥", label: "Facebook" },
    email: { bg: "bg-green-100", text: "text-green-700", icon: "📧", label: "Email" },
  }

  const config = configs[platform as keyof typeof configs]

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${config.bg} ${config.text} font-semibold`}>
      {config.icon} {config.label}
    </span>
  )
}

const StatusBadge = ({ status }: { status: string }) => {
  const configs = {
    active: { bg: "bg-green-100", text: "text-green-700", icon: "✅", label: "نشط" },
    paused: { bg: "bg-orange-100", text: "text-orange-700", icon: "⏸", label: "موقوف مؤقتاً" },
    draft: { bg: "bg-gray-100", text: "text-gray-700", icon: "📝", label: "مسودة" },
  }

  const config = configs[status as keyof typeof configs]

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${config.bg} ${config.text} font-semibold`}>
      {config.icon} {config.label}
    </span>
  )
}

const SuccessRateBar = ({ rate }: { rate: number }) => (
  <div className="w-full">
    <div className="flex items-center justify-between mb-1">
      <span className="text-sm text-gray-600">نسبة النجاح</span>
      <span className="text-sm font-semibold text-[#7C3AED]">{rate}%</span>
    </div>
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full bg-[#7C3AED] rounded-full transition-all" style={{ width: `${rate}%` }} />
    </div>
  </div>
)

const AutomationCard = ({ rule, onToggle }: { rule: any; onToggle?: (id: number) => void }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{rule.titleAr}</h3>
        <p className="text-sm text-gray-500">{rule.titleEn}</p>
      </div>
      <div className="flex items-center gap-2 mr-4">
        <button className="bg-[#7C3AED] hover:bg-[#6D31D4] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Eye className="w-4 h-4 text-white" />
          <span className="font-semibold">عرض</span>
        </button>
        <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Edit className="w-4 h-4 text-white" />
          <span className="font-semibold">تعديل</span>
        </button>
        <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors">
          <MoreVertical className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>

    {/* Badges */}
    <div className="flex items-center gap-2 mb-4">
      <StatusBadge status={rule.status} />
      <PlatformBadge platform={rule.platform} />
    </div>

    {/* Trigger */}
    <div className="bg-purple-50 rounded-lg p-3 mb-3">
      <p className="text-xs text-purple-400 mb-1 font-semibold">المحفز:</p>
      <p className="text-sm text-purple-400">
        {rule.trigger.icon} {rule.trigger.textAr}
      </p>
      <p className="text-xs text-gray-500 mt-1">{rule.trigger.textEn}</p>
    </div>

    {/* Action */}
    <div className="bg-orange-50 rounded-lg p-3 mb-4">
      <p className="text-xs text-orange-400 mb-1 font-semibold">الإجراء:</p>
      <p className="text-sm text-orange-400">
        {rule.action.icon} {rule.action.textAr}
      </p>
      <p className="text-xs text-gray-500 mt-1">{rule.action.textEn}</p>
    </div>

    {/* Stats */}
    <div className="border-t border-gray-200 pt-4 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">التنفيذات:</span>
        <span className="font-semibold text-gray-900">{rule.executions} مرة</span>
      </div>
      <SuccessRateBar rate={rule.successRate} />
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">آخر تنفيذ:</span>
        <span className="text-gray-900">{rule.lastRun}</span>
      </div>
    </div>
  </div>
)

export default function AutomationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false)
  const [rules, setRules] = useState<any[]>(sampleRules)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlToken = urlParams.get('token')
    if (urlToken) {
      localStorage.setItem('triggerio_token', urlToken)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = URLS.AUTH
      return
    }
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get(ENDPOINTS.AUTOMATION.BASE)
      if (response.data && Array.isArray(response.data)) {
        setRules(response.data)
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setRules(response.data.data)
      }
    } catch (err: any) {
      console.error("Failed to fetch automation rules:", err)
      setError(err.response?.data?.message || "فشل في تحميل القواعد")
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: number) => {
    try {
      await apiClient.post(ENDPOINTS.AUTOMATION.TOGGLE(id))
      fetchRules()
    } catch (err) {
      console.error("Failed to toggle rule:", err)
    }
  }

  const activeRules = rules.filter((rule) => rule.status === "active").length
  const totalExecutions = rules.reduce((sum, rule) => sum + (rule.executions || 0), 0)
  const avgSuccessRate = rules.length ? Math.round(rules.reduce((sum, rule) => sum + (rule.successRate || 0), 0) / rules.length) : 0

  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      rule.titleAr.includes(searchTerm) || rule.titleEn.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || rule.status === statusFilter
    const matchesPlatform = platformFilter === "all" || rule.platform === platformFilter
    return matchesSearch && matchesStatus && matchesPlatform
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200" dir="rtl">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">الأتمتة</h1>
            <p className="text-sm text-gray-600">{rules.length} قاعدة نشطة</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-[#7C3AED] text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-md hover:bg-gradient-to-r hover:from-purple-400 hover:via-pink-400 hover:to-orange-300 hover:shadow-lg hover:scale-105 transition-all duration-300">
              <Plus className="w-5 h-5 text-white" />
              <span className="font-semibold">إنشاء قاعدة جديدة</span>
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors">
              <Download className="w-5 h-5 text-white" />
              <span className="font-semibold">استيراد</span>
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-2">
              <span className="text-2xl text-purple-400">🤖</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{rules.length}</div>
            <div className="text-sm text-gray-600 mb-2">قاعدة</div>
            <div className="text-xs text-green-600 font-semibold">+5% ↑</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
              <span className="text-2xl text-blue-400">✅</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{activeRules}</div>
            <div className="text-sm text-gray-600 mb-2">نشطة</div>
            <div className="text-xs text-green-600 font-semibold">+12% ↑</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-2">
              <span className="text-2xl text-green-400">⚡</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{totalExecutions}</div>
            <div className="text-sm text-gray-600 mb-2">تنفيذ</div>
            <div className="text-xs text-green-600 font-semibold">+23% ↑</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-2">
              <span className="text-2xl text-orange-400">🎯</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{avgSuccessRate}%</div>
            <div className="text-sm text-gray-600 mb-2">نجاح</div>
            <div className="text-xs text-green-600 font-semibold">+2% ↑</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث عن قاعدة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] text-right"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <span>الحالة</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showStatusDropdown && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      setStatusFilter("all")
                      setShowStatusDropdown(false)
                    }}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-50"
                  >
                    الكل
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter("active")
                      setShowStatusDropdown(false)
                    }}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-50"
                  >
                    نشط
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter("paused")
                      setShowStatusDropdown(false)
                    }}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-50"
                  >
                    موقوف مؤقتاً
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter("draft")
                      setShowStatusDropdown(false)
                    }}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-50"
                  >
                    مسودة
                  </button>
                </div>
              )}
            </div>

            {/* Platform Filter */}
            <div className="relative">
              <button
                onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
                className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <span>المنصة</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showPlatformDropdown && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => {
                      setPlatformFilter("all")
                      setShowPlatformDropdown(false)
                    }}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-50"
                  >
                    الكل
                  </button>
                  <button
                    onClick={() => {
                      setPlatformFilter("instagram")
                      setShowPlatformDropdown(false)
                    }}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-50"
                  >
                    📷 Instagram
                  </button>
                  <button
                    onClick={() => {
                      setPlatformFilter("facebook")
                      setShowPlatformDropdown(false)
                    }}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-50"
                  >
                    👥 Facebook
                  </button>
                  <button
                    onClick={() => {
                      setPlatformFilter("email")
                      setShowPlatformDropdown(false)
                    }}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-50"
                  >
                    📧 Email
                  </button>
                </div>
              )}
            </div>

            <button className="px-6 py-2 bg-[#7C3AED] hover:bg-[#6D31D4] text-white rounded-lg font-semibold transition-colors">
              تصفية
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]"></div>
            <span className="mr-3 text-gray-600">جاري التحميل...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Automation Cards */}
        {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRules.map((rule) => (
            <AutomationCard key={rule.id} rule={rule} onToggle={handleToggle} />
          ))}
        </div>
        )}

        {filteredRules.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد قواعد أتمتة بعد</h3>
            <p className="text-gray-600 mb-2">No automation rules yet</p>
            <p className="text-gray-500 mb-6">ابدأ بإنشاء أول قاعدة لأتمتة تفاعلاتك مع جمهورك</p>
            <button className="bg-[#7C3AED] hover:bg-[#6D31D4] text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors">
              <Plus className="w-5 h-5 text-white" />
              <span className="font-semibold">إنشاء أول قاعدة</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
