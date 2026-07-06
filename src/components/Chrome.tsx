'use client'

import React from 'react'
import type { Lang, Tab } from './types'

/* ------------------------------------------------------------------ */
/* Auth screen (login / signup split panel)                           */
/* ------------------------------------------------------------------ */
interface AuthScreenProps {
  lang: Lang; setLang: (v: Lang) => void
  authMode: 'login' | 'signup'
  setAuthMode: (v: 'login' | 'signup') => void
  authEmail: string; setAuthEmail: (v: string) => void
  authPassword: string; setAuthPassword: (v: string) => void
  showAuthPassword: boolean; setShowAuthPassword: (fn: (v: boolean) => boolean) => void
  authError: string | null
  authLoading: boolean
  handleAuth: (e: React.FormEvent) => void
  handleQuickSignIn: (role: 'admin' | 'user') => void
}

export function AuthScreen({
  lang, setLang, authMode, setAuthMode, authEmail, setAuthEmail, authPassword, setAuthPassword,
  showAuthPassword, setShowAuthPassword, authError, authLoading, handleAuth, handleQuickSignIn,
}: AuthScreenProps) {
  const vi = lang === 'vi'
  return (
    <div className="mm-auth-screen" style={{ position: 'relative', zIndex: 10, minHeight: '100vh', width: '100%', background: 'var(--mm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <button type="button" onClick={() => setLang(vi ? 'en' : 'vi')} className="mm-btn mm-btn-outline" style={{ position: 'absolute', top: '20px', right: '20px', padding: '7px 13px', fontSize: '13px', borderRadius: '999px', zIndex: 20 }} title="Language">
        {vi ? '🇻🇳 VI' : '🇬🇧 EN'}
      </button>
      <div className="mm-shadow" style={{ width: '100%', maxWidth: '1040px', borderRadius: '26px', overflow: 'hidden', border: '1px solid #DCDDD6', background: 'var(--mm-surface-2)', display: 'flex' }}>
        <div className="mm-auth-brand" style={{ width: '46%', flexShrink: 0, background: 'var(--mm-primary)', color: '#fff', padding: '52px 48px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-70px', top: '-40px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', right: '40px', bottom: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <span className="mm-icon-badge" style={{ width: '46px', height: '46px', background: 'rgba(255,255,255,0.18)', borderRadius: '13px' }}>
              <span className="ms" style={{ fontSize: '26px' }}>medication</span>
            </span>
            <span style={{ fontSize: '24px', fontWeight: 800 }}>MediMate</span>
          </div>
          <div style={{ marginTop: 'auto', position: 'relative' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.01em' }}>{vi ? <>Người bạn đồng hành<br />cho mỗi liều thuốc</> : <>Your companion<br />for every dose</>}</div>
            <div style={{ fontSize: '16px', lineHeight: 1.6, opacity: 0.9, marginTop: '16px', maxWidth: '400px' }}>{vi ? 'Nhắc uống đúng giờ, kiểm tra tương tác thuốc an toàn và trò chuyện cùng trợ lý AI.' : 'Timely dose reminders, safe drug-interaction checks, and a chat with your AI assistant.'}</div>
            <div style={{ display: 'flex', gap: '22px', marginTop: '28px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '14.5px' }}>
                <span className="ms" style={{ fontSize: '22px' }}>verified_user</span>{vi ? 'Bảo mật y khoa' : 'Medical-grade security'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '14.5px' }}>
                <span className="ms" style={{ fontSize: '22px' }}>medical_services</span>{vi ? 'Kiểm tra tương tác' : 'Interaction checks'}
              </div>
            </div>
          </div>
        </div>
        <div className="mm-auth-form" style={{ flex: 1, minWidth: 0, background: 'var(--mm-bg)', padding: '52px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
            <div className="mm-seg" style={{ marginBottom: '28px' }}>
              <button type="button" className={`mm-seg-item${authMode === 'login' ? ' active' : ''}`} onClick={() => setAuthMode('login')}>{vi ? 'Đăng nhập' : 'Log in'}</button>
              <button type="button" className={`mm-seg-item${authMode === 'signup' ? ' active' : ''}`} onClick={() => setAuthMode('signup')}>{vi ? 'Đăng ký' : 'Sign up'}</button>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{authMode === 'login' ? (vi ? 'Chào mừng trở lại' : 'Welcome back') : (vi ? 'Tạo tài khoản mới' : 'Create a new account')}</div>
            <div style={{ fontSize: '15px', color: 'var(--mm-text-muted)', marginTop: '5px', marginBottom: '24px' }}>{authMode === 'login' ? (vi ? 'Đăng nhập để tiếp tục theo dõi lịch uống thuốc.' : 'Log in to keep tracking your medication schedule.') : (vi ? 'Tạo tài khoản để bắt đầu quản lý thuốc cùng AI.' : 'Create an account to start managing your meds with AI.')}</div>
            <form onSubmit={handleAuth}>
              <label className="mm-field-label">Email</label>
              <div className="mm-input-wrap" style={{ marginBottom: '16px' }}>
                <span className="ms">mail</span>
                <input className="mm-input" type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="name@domain.com" required />
              </div>
              <label className="mm-field-label">{vi ? 'Mật khẩu' : 'Password'}</label>
              <div className="mm-input-wrap" style={{ marginBottom: '16px' }}>
                <span className="ms">lock</span>
                <input className="mm-input" type={showAuthPassword ? 'text' : 'password'} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="••••••••" required style={{ letterSpacing: showAuthPassword ? 'normal' : '2px' }} />
                <span className="ms" style={{ cursor: 'pointer' }} onClick={() => setShowAuthPassword((v) => !v)}>{showAuthPassword ? 'visibility' : 'visibility_off'}</span>
              </div>
              {authError && (
                <div className="mm-alert" style={{ marginBottom: '16px' }}>
                  <span className="ms" style={{ fontSize: '18px' }}>error</span>
                  <span>{authError}</span>
                </div>
              )}
              <button type="submit" disabled={authLoading} className="mm-btn mm-btn-primary" style={{ width: '100%', fontSize: '16px', padding: '15px' }}>
                {authLoading ? (vi ? 'Đang xử lý...' : 'Processing...') : authMode === 'login' ? (vi ? 'Đăng nhập' : 'Log in') : (vi ? 'Đăng ký' : 'Sign up')}
              </button>
            </form>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '22px 0' }}>
              <span style={{ flex: 1, height: '1px', background: '#E0DED4' }} />
              <span style={{ fontSize: '13px', color: 'var(--mm-text-faint)' }}>{vi ? 'hoặc dùng tài khoản demo' : 'or use a demo account'}</span>
              <span style={{ flex: 1, height: '1px', background: '#E0DED4' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button type="button" disabled={authLoading} className="mm-btn mm-btn-outline" style={{ padding: '13px', fontSize: '14px' }} onClick={() => handleQuickSignIn('admin')}>
                <span className="ms" style={{ fontSize: '20px' }}>admin_panel_settings</span>Demo Admin
              </button>
              <button type="button" disabled={authLoading} className="mm-btn mm-btn-outline" style={{ padding: '13px', fontSize: '14px' }} onClick={() => handleQuickSignIn('user')}>
                <span className="ms" style={{ fontSize: '20px' }}>person</span>Demo User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Top app header                                                      */
/* ------------------------------------------------------------------ */
interface AppHeaderProps {
  lang: Lang; setLang: (v: Lang) => void
  activeTab: Tab
  setActiveTab: (v: Tab) => void
  isAdmin: boolean
  streak: number
  user: any
  handleSignOut: () => void
  onProfile?: () => void
  t: any
}

export function AppHeader({ lang, setLang, activeTab, setActiveTab, isAdmin, streak, user, handleSignOut, onProfile, t }: AppHeaderProps) {
  return (
    <header style={{ height: '72px', background: 'var(--mm-bg)', borderBottom: '1px solid #E7E4DB', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '24px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
        <span className="mm-icon-badge" style={{ width: '38px', height: '38px', background: 'var(--mm-primary)', color: '#fff', borderRadius: '11px' }}>
          <span className="ms" style={{ fontSize: '22px' }}>medication</span>
        </span>
        <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--mm-text)' }}>MediMate</span>
      </div>
      <nav className="mm-topnav" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
        <button type="button" onClick={() => setActiveTab('dashboard')} className={`mm-navpill${activeTab === 'dashboard' ? ' active' : ''}`}>{lang === 'vi' ? 'Trang chủ' : 'Home'}</button>
        <button type="button" onClick={() => setActiveTab('schedule')} className={`mm-navpill${activeTab === 'schedule' ? ' active' : ''}`}>{lang === 'vi' ? 'Lịch thuốc' : 'Schedule'}</button>
        <button type="button" onClick={() => setActiveTab('chat')} className={`mm-navpill${activeTab === 'chat' ? ' active' : ''}`}>{lang === 'vi' ? 'Trợ lý' : 'Assistant'}</button>
        <button type="button" onClick={() => setActiveTab('stats')} className={`mm-navpill${activeTab === 'stats' ? ' active' : ''}`}>{lang === 'vi' ? 'Thống kê' : 'Stats'}</button>
        {isAdmin && (
          <button type="button" onClick={() => setActiveTab('admin')} className={`mm-navpill${activeTab === 'admin' ? ' active' : ''}`}>{lang === 'vi' ? 'Quản trị' : 'Admin'}</button>
        )}
      </nav>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {streak > 0 && (
          <span className="mm-chip" style={{ background: '#FBEEE0', color: '#B06A2C', padding: '8px 14px', fontSize: '14px' }}>
            <span className="ms" style={{ fontSize: '19px' }}>local_fire_department</span> {streak} {lang === 'vi' ? 'ngày' : 'days'}
          </span>
        )}
        <button type="button" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')} className="mm-btn mm-btn-outline" style={{ padding: '7px 13px', fontSize: '13px', borderRadius: '999px' }} title="Language">
          {lang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
        </button>
        <button type="button" onClick={onProfile} title={lang === 'vi' ? 'Hồ sơ của bạn' : 'Your profile'} className="mm-icon-badge" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary-dark)', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer' }}>
          {(user.email || '?').slice(0, 2).toUpperCase()}
        </button>
        <button type="button" onClick={handleSignOut} title={t.logout} className="mm-btn mm-btn-ghost" style={{ padding: '9px', borderRadius: '10px' }}>
          <span className="ms" style={{ fontSize: '22px' }}>logout</span>
        </button>
      </div>
    </header>
  )
}

/* ------------------------------------------------------------------ */
/* Toggle switch (settings)                                            */
/* ------------------------------------------------------------------ */
export function MMToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} style={{ width: '52px', height: '30px', borderRadius: '999px', border: 'none', cursor: 'pointer', padding: 0, background: on ? 'var(--mm-primary)' : '#D6DCCF', display: 'flex', alignItems: 'center', justifyContent: on ? 'flex-end' : 'flex-start', transition: 'background 0.18s ease', flexShrink: 0 }}>
      <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff', margin: '0 3px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* "Đang phát triển" placeholder (for tabs not yet wired)              */
/* ------------------------------------------------------------------ */
interface ComingSoonProps {
  icon: string
  title: string
  desc: string
  cta?: string
  onCta?: () => void
  /** Show the "under development" chip. Off for plain empty-states that are done features. */
  showDevBadge?: boolean
  lang?: Lang
}

export function ComingSoon({ icon, title, desc, cta, onCta, showDevBadge = true, lang = 'vi' }: ComingSoonProps) {
  return (
    <div className="mm-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '56px 32px', minHeight: '360px' }}>
      <span className="mm-icon-badge" style={{ width: '100px', height: '100px', borderRadius: '28px', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary)', marginBottom: '22px' }}>
        <span className="ms" style={{ fontSize: '52px' }}>{icon}</span>
      </span>
      {showDevBadge && (
        <span className="mm-chip" style={{ background: '#FBEEE0', color: 'var(--mm-orange)', padding: '6px 13px', fontSize: '12.5px', marginBottom: '14px' }}>
          <span className="ms" style={{ fontSize: '16px' }}>construction</span>{lang === 'vi' ? 'Đang phát triển' : 'Coming soon'}
        </span>
      )}
      <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--mm-text)', maxWidth: '520px' }}>{title}</div>
      <div style={{ fontSize: '15.5px', color: 'var(--mm-text-muted)', lineHeight: 1.6, maxWidth: '520px', marginTop: '10px' }}>{desc}</div>
      {cta && (
        <button type="button" onClick={onCta} className="mm-btn mm-btn-outline" style={{ marginTop: '26px', padding: '12px 22px', fontSize: '15px' }}>
          <span className="ms" style={{ fontSize: '20px' }}>home</span>{cta}
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Mobile bottom navigation                                            */
/* ------------------------------------------------------------------ */
interface BottomNavProps {
  lang: Lang
  activeTab: Tab
  setActiveTab: (v: Tab) => void
  isAdmin: boolean
}

export function BottomNav({ lang, activeTab, setActiveTab, isAdmin }: BottomNavProps) {
  return (
    <div className="mm-bottomnav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '64px', background: 'var(--mm-surface)', borderTop: '1px solid var(--mm-border-warm)', alignItems: 'center', justifyContent: 'space-around', zIndex: 30, padding: '0 12px', boxShadow: '0 -6px 20px -12px rgba(34,48,42,0.25)' }}>
      <button type="button" onClick={() => setActiveTab('dashboard')} className={`mm-bottomnav-item${activeTab === 'dashboard' ? ' active' : ''}`}>
        <span className="ms" style={{ fontSize: '24px' }}>home</span>
        <span style={{ fontSize: '10.5px' }}>{lang === 'vi' ? 'Trang chủ' : 'Home'}</span>
      </button>
      <button type="button" onClick={() => setActiveTab('schedule')} className={`mm-bottomnav-item${activeTab === 'schedule' ? ' active' : ''}`}>
        <span className="ms" style={{ fontSize: '24px' }}>calendar_month</span>
        <span style={{ fontSize: '10.5px' }}>{lang === 'vi' ? 'Lịch thuốc' : 'Schedule'}</span>
      </button>
      <button type="button" onClick={() => setActiveTab('chat')} className={`mm-bottomnav-item${activeTab === 'chat' ? ' active' : ''}`}>
        <span className="ms" style={{ fontSize: '24px' }}>neurology</span>
        <span style={{ fontSize: '10.5px' }}>{lang === 'vi' ? 'Trợ lý' : 'Assistant'}</span>
      </button>
      <button type="button" onClick={() => setActiveTab('stats')} className={`mm-bottomnav-item${activeTab === 'stats' ? ' active' : ''}`}>
        <span className="ms" style={{ fontSize: '24px' }}>insights</span>
        <span style={{ fontSize: '10.5px' }}>{lang === 'vi' ? 'Thống kê' : 'Stats'}</span>
      </button>
      {isAdmin && (
        <button type="button" onClick={() => setActiveTab('admin')} className={`mm-bottomnav-item${activeTab === 'admin' ? ' active' : ''}`}>
          <span className="ms" style={{ fontSize: '24px' }}>shield_person</span>
          <span style={{ fontSize: '10.5px' }}>{lang === 'vi' ? 'Quản trị' : 'Admin'}</span>
        </button>
      )}
    </div>
  )
}
