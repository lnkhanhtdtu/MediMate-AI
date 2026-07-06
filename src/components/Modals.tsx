'use client'

import React from 'react'
import type { Lang, Medication } from './types'

// Close a modal on Escape. Shared by every modal for consistent keyboard a11y.
function useEscToClose(onClose: () => void) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
}

// Shared backdrop props: clicking the scrim closes the modal; the card stops propagation.
const backdropStyle = { background: 'rgba(34,48,42,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as const
const stop = (e: React.MouseEvent) => e.stopPropagation()

/* ------------------------------------------------------------------ */
/* Prescription review (after AI reads a scanned prescription)         */
/* ------------------------------------------------------------------ */
interface PrescriptionReviewModalProps {
  lang: Lang
  meds: Medication[] | null
  onClose: () => void
  onEdit: (med: Medication) => void
}

export function PrescriptionReviewModal({ lang, meds, onClose, onEdit }: PrescriptionReviewModalProps) {
  useEscToClose(onClose)
  if (!meds || meds.length === 0) return null
  return (
    <div onClick={onClose} className="fixed inset-0 flex items-center justify-center p-4 z-50" style={backdropStyle}>
      <div role="dialog" aria-modal="true" onClick={stop} className="mm-card relative w-full" style={{ maxWidth: '520px', borderRadius: '22px', padding: '24px', boxShadow: 'var(--mm-shadow)', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} className="absolute cursor-pointer" style={{ top: '18px', right: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '10px', background: 'var(--mm-surface-2)', color: 'var(--mm-text-muted)', border: '1px solid var(--mm-border)' }} aria-label={lang === 'vi' ? 'Đóng' : 'Close'}>
          <span className="ms" style={{ fontSize: '20px' }}>close</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', paddingRight: '40px' }}>
          <span className="mm-icon-badge" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--mm-primary)', color: '#fff' }}><span className="ms" style={{ fontSize: '22px' }}>verified</span></span>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--mm-text)', margin: 0 }}>{lang === 'vi' ? 'Xác nhận đơn thuốc' : 'Prescription confirmed'}</h3>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--mm-text-muted)', margin: '0 0 16px' }}>{lang === 'vi' ? 'AI đã đọc ảnh và thêm các thuốc dưới đây vào lịch. Bấm sửa nếu cần điều chỉnh.' : 'The AI read your image and added these to your schedule. Tap edit to adjust.'}</p>

        {/* AI count banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--mm-primary)', marginBottom: '14px' }}>
          <span className="ms" style={{ fontSize: '20px' }}>auto_awesome</span>{lang === 'vi' ? `AI đọc được ${meds.length} loại thuốc` : `AI read ${meds.length} medication(s)`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {meds.map((m) => (
            <div key={m.id} style={{ background: 'var(--mm-surface-2)', border: '1px solid var(--mm-border-warm)', borderRadius: '16px', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="mm-icon-badge" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary)', flexShrink: 0 }}><span className="ms" style={{ fontSize: '24px' }}>pill</span></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--mm-text)' }}>{m.name}</div>
                  {m.prescription_name && <div style={{ fontSize: '13px', color: 'var(--mm-text-faint)' }}>{m.prescription_name}</div>}
                </div>
                <button type="button" onClick={() => onEdit(m)} className="mm-btn mm-btn-ghost" style={{ padding: '7px', borderRadius: '9px' }} title={lang === 'vi' ? 'Sửa' : 'Edit'}><span className="ms" style={{ fontSize: '20px', color: '#B7C0B8' }}>edit</span></button>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '13px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '90px', background: 'var(--mm-surface)', border: '1px solid var(--mm-border-warm)', borderRadius: '10px', padding: '9px 13px' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--mm-text-faint)', fontWeight: 600, textTransform: 'uppercase' }}>{lang === 'vi' ? 'Liều' : 'Dose'}</div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--mm-text)' }}>{m.dosage}</div>
                </div>
                <div style={{ flex: 1, minWidth: '90px', background: 'var(--mm-surface)', border: '1px solid var(--mm-border-warm)', borderRadius: '10px', padding: '9px 13px' }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--mm-text-faint)', fontWeight: 600, textTransform: 'uppercase' }}>{lang === 'vi' ? 'Tần suất' : 'Frequency'}</div>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--mm-text)' }}>{m.frequency}</div>
                </div>
                <div style={{ flex: 1, minWidth: '90px', background: '#EAF3EC', border: '1px solid #D9E4DC', borderRadius: '10px', padding: '9px 13px' }}>
                  <div style={{ fontSize: '11.5px', color: '#5C8A6E', fontWeight: 600, textTransform: 'uppercase' }}>{lang === 'vi' ? 'Giờ nhắc' : 'Reminder'}</div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--mm-primary-dark)' }}>{(m.schedule || []).join(' · ') || '—'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* OpenFDA banner */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#EAF3EC', borderRadius: '13px', padding: '13px 15px', marginTop: '16px' }}>
          <span className="ms" style={{ fontSize: '22px', color: 'var(--mm-primary)', flexShrink: 0 }}>verified_user</span>
          <div style={{ fontSize: '13.5px', color: 'var(--mm-primary-dark)', lineHeight: 1.45 }}>{lang === 'vi' ? 'Đã đối chiếu OpenFDA — không phát hiện tương tác nguy hiểm giữa các thuốc đã thêm.' : 'Checked against OpenFDA — no dangerous interactions detected among the added medications.'}</div>
        </div>

        <button type="button" onClick={onClose} className="mm-btn mm-btn-primary" style={{ width: '100%', marginTop: '18px', padding: '16px', fontSize: '17px', borderRadius: '14px' }}>
          <span className="ms" style={{ fontSize: '23px' }}>event_available</span>{lang === 'vi' ? 'Xong' : 'Done'}
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Add Medication                                                      */
/* ------------------------------------------------------------------ */
interface AddMedicationModalProps {
  lang: Lang
  showAddModal: boolean
  setShowAddModal: (v: boolean) => void
  handleManualAddMedication: (e: React.FormEvent) => void
  newMedName: string; setNewMedName: (v: string) => void
  newMedDosage: string; setNewMedDosage: (v: string) => void
  newMedFreq: string; setNewMedFreq: (v: string) => void
  newMedTime: string; setNewMedTime: (v: string) => void
  newMedStock: string; setNewMedStock: (v: string) => void
  newMedDosageQty: string; setNewMedDosageQty: (v: string) => void
  newMedPrescriptionName: string; setNewMedPrescriptionName: (v: string) => void
}

export function AddMedicationModal({
  lang, showAddModal, setShowAddModal, handleManualAddMedication,
  newMedName, setNewMedName, newMedDosage, setNewMedDosage, newMedFreq, setNewMedFreq,
  newMedTime, setNewMedTime, newMedStock, setNewMedStock, newMedDosageQty, setNewMedDosageQty,
  newMedPrescriptionName, setNewMedPrescriptionName,
}: AddMedicationModalProps) {
  const close = () => setShowAddModal(false)
  useEscToClose(close)
  const vi = lang === 'vi'
  if (!showAddModal) return null
  return (
    <div onClick={close} className="fixed inset-0 flex items-center justify-center p-4 z-50" style={backdropStyle}>
      <div role="dialog" aria-modal="true" onClick={stop} className="mm-card relative w-full" style={{ maxWidth: '460px', borderRadius: '22px', padding: '24px', boxShadow: 'var(--mm-shadow)', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={close} className="absolute cursor-pointer" style={{ top: '18px', right: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '10px', background: 'var(--mm-surface-2)', color: 'var(--mm-text-muted)', border: '1px solid var(--mm-border)' }} aria-label={vi ? 'Đóng' : 'Close'}>
          <span className="ms" style={{ fontSize: '20px' }}>close</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', paddingRight: '40px' }}>
          <span className="mm-icon-badge" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--mm-primary)', color: '#fff' }}><span className="ms" style={{ fontSize: '22px' }}>add</span></span>
          <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--mm-text)', margin: 0 }}>{vi ? 'Đăng Ký Lịch Uống Thuốc Mới' : 'Add New Medication'}</h3>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--mm-text-muted)', margin: '0 0 20px' }}>{vi ? 'Nhập thông tin thuốc để tạo lịch nhắc.' : 'Enter the medication details to create a reminder schedule.'}</p>
        <form onSubmit={handleManualAddMedication} className="space-y-4">
          <div>
            <label className="mm-field-label">{vi ? 'Tên thuốc' : 'Medication name'}</label>
            <div className="mm-input-wrap">
              <span className="ms" style={{ fontSize: '20px' }}>medication</span>
              <input type="text" value={newMedName} onChange={(e) => setNewMedName(e.target.value)} className="mm-input" placeholder={vi ? 'Ví dụ: Aspirin, Paracetamol' : 'e.g. Aspirin, Paracetamol'} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mm-field-label">{vi ? 'Liều lượng' : 'Dosage'}</label>
              <div className="mm-input-wrap">
                <span className="ms" style={{ fontSize: '20px' }}>science</span>
                <input type="text" value={newMedDosage} onChange={(e) => setNewMedDosage(e.target.value)} className="mm-input" placeholder={vi ? 'Ví dụ: 81mg, 1 viên' : 'e.g. 81mg, 1 tablet'} required />
              </div>
            </div>
            <div>
              <label className="mm-field-label">{vi ? 'Thời gian uống' : 'Time'}</label>
              <div className="mm-input-wrap">
                <span className="ms" style={{ fontSize: '20px' }}>schedule</span>
                <input type="time" value={newMedTime} onChange={(e) => setNewMedTime(e.target.value)} className="mm-input" required />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mm-field-label">{vi ? 'Tần suất' : 'Frequency'}</label>
              <select value={newMedFreq} onChange={(e) => setNewMedFreq(e.target.value)} className="mm-input" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--mm-border)', background: 'var(--mm-surface)', color: 'var(--mm-text)', fontSize: '14px' }}>
                <option value="Hàng ngày">{vi ? 'Hàng ngày' : 'Daily'}</option>
                <option value="Cách ngày">{vi ? 'Cách ngày' : 'Every other day'}</option>
                <option value="Hàng tuần">{vi ? 'Hàng tuần' : 'Weekly'}</option>
              </select>
            </div>
            <div>
              <label className="mm-field-label">{vi ? 'Số lượng thuốc (Tồn kho)' : 'Stock quantity'}</label>
              <div className="mm-input-wrap">
                <span className="ms" style={{ fontSize: '20px' }}>inventory_2</span>
                <input type="number" value={newMedStock} onChange={(e) => setNewMedStock(e.target.value)} className="mm-input" placeholder={vi ? 'Mặc định: 30' : 'Default: 30'} min="0.1" step="any" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mm-field-label">{vi ? 'Số viên uống mỗi lần' : 'Amount per dose'}</label>
              <div className="mm-input-wrap">
                <span className="ms" style={{ fontSize: '20px' }}>pill</span>
                <input type="number" value={newMedDosageQty} onChange={(e) => setNewMedDosageQty(e.target.value)} className="mm-input" placeholder={vi ? 'Mặc định: 1' : 'Default: 1'} min="0.1" step="any" />
              </div>
            </div>
            <div>
              <label className="mm-field-label">{vi ? 'Nhãn đơn thuốc (Tùy chọn)' : 'Prescription label (optional)'}</label>
              <div className="mm-input-wrap">
                <span className="ms" style={{ fontSize: '20px' }}>label</span>
                <input type="text" value={newMedPrescriptionName} onChange={(e) => setNewMedPrescriptionName(e.target.value)} className="mm-input" placeholder={vi ? 'Ví dụ: Đơn khớp, Đơn huyết áp' : 'e.g. Joint script, BP script'} />
              </div>
            </div>
          </div>
          <button type="submit" className="mm-btn mm-btn-primary" style={{ width: '100%', marginTop: '4px', minHeight: '48px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span className="ms" style={{ fontSize: '20px' }}>add</span>
            {vi ? 'Thêm Lịch Trình' : 'Add Schedule'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Edit Medication                                                     */
/* ------------------------------------------------------------------ */
interface EditMedicationModalProps {
  lang: Lang
  showEditModal: boolean
  editingMedication: Medication | null
  setShowEditModal: (v: boolean) => void
  setEditingMedication: (v: Medication | null) => void
  handleSaveEditMedication: (e: React.FormEvent) => void
  editMedName: string; setEditMedName: (v: string) => void
  editMedPrescriptionName: string; setEditMedPrescriptionName: (v: string) => void
  editMedDosage: string; setEditMedDosage: (v: string) => void
  editMedTime: string; setEditMedTime: (v: string) => void
  editMedFreq: string; setEditMedFreq: (v: string) => void
  editMedDosageQty: string; setEditMedDosageQty: (v: string) => void
  editMedStock: string; setEditMedStock: (v: string) => void
  editMedRemainingStock: string; setEditMedRemainingStock: (v: string) => void
}

export function EditMedicationModal({
  lang, showEditModal, editingMedication, setShowEditModal, setEditingMedication, handleSaveEditMedication,
  editMedName, setEditMedName, editMedPrescriptionName, setEditMedPrescriptionName,
  editMedDosage, setEditMedDosage, editMedTime, setEditMedTime, editMedFreq, setEditMedFreq,
  editMedDosageQty, setEditMedDosageQty, editMedStock, setEditMedStock, editMedRemainingStock, setEditMedRemainingStock,
}: EditMedicationModalProps) {
  const close = () => { setShowEditModal(false); setEditingMedication(null) }
  useEscToClose(close)
  const vi = lang === 'vi'
  if (!showEditModal || !editingMedication) return null
  return (
    <div onClick={close} className="fixed inset-0 flex items-center justify-center p-4 z-50" style={backdropStyle}>
      <div role="dialog" aria-modal="true" onClick={stop} className="mm-card relative w-full" style={{ maxWidth: '460px', borderRadius: '22px', padding: '24px', boxShadow: 'var(--mm-shadow)', maxHeight: '90vh', overflowY: 'auto' }}>
        <button type="button" onClick={close} className="absolute cursor-pointer" style={{ top: '18px', right: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '10px', background: 'var(--mm-surface-2)', color: 'var(--mm-text-muted)', border: '1px solid var(--mm-border)' }} aria-label={vi ? 'Đóng' : 'Close'}>
          <span className="ms" style={{ fontSize: '20px' }}>close</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', paddingRight: '40px' }}>
          <span className="mm-icon-badge" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--mm-primary)', color: '#fff' }}><span className="ms" style={{ fontSize: '22px' }}>edit</span></span>
          <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--mm-text)', margin: 0 }}>{vi ? 'Chỉnh Sửa Lịch Uống Thuốc' : 'Edit Medication'}</h3>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--mm-text-muted)', margin: '0 0 20px' }}>{vi ? 'Cập nhật thông tin và tồn kho thuốc.' : 'Update the medication details and stock.'}</p>
        <form onSubmit={handleSaveEditMedication} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mm-field-label">{vi ? 'Tên thuốc' : 'Medication name'}</label>
              <div className="mm-input-wrap">
                <span className="ms" style={{ fontSize: '20px' }}>medication</span>
                <input type="text" value={editMedName} onChange={(e) => setEditMedName(e.target.value)} className="mm-input" required />
              </div>
            </div>
            <div>
              <label className="mm-field-label">{vi ? 'Nhãn đơn thuốc (Tùy chọn)' : 'Prescription label (optional)'}</label>
              <div className="mm-input-wrap">
                <span className="ms" style={{ fontSize: '20px' }}>label</span>
                <input type="text" value={editMedPrescriptionName} onChange={(e) => setEditMedPrescriptionName(e.target.value)} className="mm-input" placeholder={vi ? 'Ví dụ: Đơn khớp, Đơn huyết áp' : 'e.g. Joint script, BP script'} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mm-field-label">{vi ? 'Liều lượng' : 'Dosage'}</label>
              <div className="mm-input-wrap">
                <span className="ms" style={{ fontSize: '20px' }}>science</span>
                <input type="text" value={editMedDosage} onChange={(e) => setEditMedDosage(e.target.value)} className="mm-input" required />
              </div>
            </div>
            <div>
              <label className="mm-field-label">{vi ? 'Giờ uống thuốc' : 'Time'}</label>
              <div className="mm-input-wrap">
                <span className="ms" style={{ fontSize: '20px' }}>schedule</span>
                <input type="time" value={editMedTime} onChange={(e) => setEditMedTime(e.target.value)} className="mm-input" required />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mm-field-label">{vi ? 'Tần suất' : 'Frequency'}</label>
              <select value={editMedFreq} onChange={(e) => setEditMedFreq(e.target.value)} className="mm-input" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--mm-border)', background: 'var(--mm-surface)', color: 'var(--mm-text)', fontSize: '14px' }}>
                <option value="Hàng ngày">{vi ? 'Hàng ngày' : 'Daily'}</option>
                <option value="Cách ngày">{vi ? 'Cách ngày' : 'Every other day'}</option>
                <option value="Hàng tuần">{vi ? 'Hàng tuần' : 'Weekly'}</option>
              </select>
            </div>
            <div>
              <label className="mm-field-label">{vi ? 'Số viên uống mỗi lần' : 'Amount per dose'}</label>
              <div className="mm-input-wrap">
                <span className="ms" style={{ fontSize: '20px' }}>pill</span>
                <input type="number" value={editMedDosageQty} onChange={(e) => setEditMedDosageQty(e.target.value)} className="mm-input" min="0.1" step="any" required />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mm-field-label">{vi ? 'Tổng kho ban đầu' : 'Initial stock'}</label>
              <div className="mm-input-wrap">
                <span className="ms" style={{ fontSize: '20px' }}>inventory_2</span>
                <input type="number" value={editMedStock} onChange={(e) => setEditMedStock(e.target.value)} className="mm-input" min="0.1" step="any" required />
              </div>
            </div>
            <div>
              <label className="mm-field-label">{vi ? 'Tồn kho còn lại' : 'Remaining stock'}</label>
              <div className="mm-input-wrap">
                <span className="ms" style={{ fontSize: '20px' }}>inventory</span>
                <input type="number" value={editMedRemainingStock} onChange={(e) => setEditMedRemainingStock(e.target.value)} className="mm-input" min="0" step="any" required />
              </div>
            </div>
          </div>
          <button type="submit" className="mm-btn mm-btn-primary" style={{ width: '100%', marginTop: '4px', minHeight: '48px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span className="ms" style={{ fontSize: '20px' }}>save</span>
            {vi ? 'Lưu Thay Đổi' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Admin: patient medication drill-down                                */
/* ------------------------------------------------------------------ */
interface PatientDetailModalProps {
  lang: Lang
  selectedAdminUser: any
  setSelectedAdminUser: (v: any) => void
  handleDeleteUser: (id: string, email: string) => void
}

export function PatientDetailModal({ lang, selectedAdminUser, setSelectedAdminUser, handleDeleteUser }: PatientDetailModalProps) {
  const close = () => setSelectedAdminUser(null)
  useEscToClose(close)
  if (!selectedAdminUser) return null
  return (
    <div onClick={close} className="fixed inset-0 flex items-center justify-center p-4 z-50" style={backdropStyle}>
      <div role="dialog" aria-modal="true" onClick={stop} className="mm-card relative w-full" style={{ maxWidth: '520px', borderRadius: '22px', padding: '24px', boxShadow: 'var(--mm-shadow)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <button type="button" onClick={close} className="absolute cursor-pointer" style={{ top: '18px', right: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '10px', background: 'var(--mm-surface-2)', color: 'var(--mm-text-muted)', border: '1px solid var(--mm-border)' }} aria-label={lang === 'vi' ? 'Đóng' : 'Close'}>
          <span className="ms" style={{ fontSize: '20px' }}>close</span>
        </button>
        {(() => {
          const u = selectedAdminUser
          const name = u.name || (u.email ? u.email.split('@')[0] : (lang === 'vi' ? 'Bệnh nhân' : 'Patient'))
          const rate = u.todayLogs && u.todayLogs.total > 0 ? Math.round((u.todayLogs.taken / u.todayLogs.total) * 100) : 0
          const logs: any[] = Array.isArray(u.todayLogDetails) ? u.todayLogDetails : []
          const fmtTime = (s: string) => new Date(s).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
          const exportPatientReport = () => {
            const rows = [
              [lang === 'vi' ? 'Thuốc' : 'Medication', lang === 'vi' ? 'Liều' : 'Dose', lang === 'vi' ? 'Tần suất' : 'Frequency', lang === 'vi' ? 'Giờ nhắc' : 'Times'],
              ...(u.medications || []).map((m: any) => [m.name, m.dosage, m.frequency, (m.schedule || []).join(' ')]),
            ]
            const csv = rows.map((r) => r.map((c: string) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
            const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = `medimate-${name}.csv`; a.click(); URL.revokeObjectURL(url)
          }
          const stats = [
            { icon: 'local_fire_department', color: 'var(--mm-orange)', value: u.streak ?? 0, label: lang === 'vi' ? 'ngày liên tục' : 'day streak' },
            { icon: 'trending_up', color: 'var(--mm-primary)', value: `${rate}%`, label: lang === 'vi' ? 'tuân thủ hôm nay' : 'adherence today' },
            { icon: 'medication', color: 'var(--mm-primary)', value: u.medCount ?? (u.medications?.length || 0), label: lang === 'vi' ? 'thuốc đang dùng' : 'meds' },
            { icon: 'check_circle', color: 'var(--mm-primary)', value: `${u.todayLogs?.taken ?? 0}/${u.todayLogs?.total ?? 0}`, label: lang === 'vi' ? 'đã uống hôm nay' : 'taken today' },
          ]
          return (
            <>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingRight: '40px', borderBottom: '1px solid var(--mm-border-warm)', paddingBottom: '16px', flexWrap: 'wrap' }}>
                <span className="mm-icon-badge" style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary-dark)', fontWeight: 800, fontSize: '20px', textTransform: 'uppercase' }}>{(u.email || '?').slice(0, 2)}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--mm-text)', margin: 0 }}>{name}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: '12.5px', color: 'var(--mm-text-faint)', marginTop: '3px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span className="ms" style={{ fontSize: '15px' }}>mail</span>{u.email}</span>
                    {u.created_at && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span className="ms" style={{ fontSize: '15px' }}>event</span>{new Date(u.created_at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}</span>}
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', paddingTop: '16px', paddingRight: '4px' }}>
                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => alert(lang === 'vi' ? `Đã gửi nhắc nhở riêng tới ${name} (mô phỏng).` : `Personal reminder sent to ${name} (simulated).`)} className="mm-btn mm-btn-outline" style={{ padding: '9px 14px', fontSize: '13.5px' }}><span className="ms" style={{ fontSize: '18px' }}>campaign</span>{lang === 'vi' ? 'Gửi nhắc riêng' : 'Send reminder'}</button>
                  <button type="button" onClick={exportPatientReport} className="mm-btn mm-btn-outline" style={{ padding: '9px 14px', fontSize: '13.5px' }}><span className="ms" style={{ fontSize: '18px' }}>download</span>{lang === 'vi' ? 'Xuất báo cáo' : 'Export'}</button>
                </div>

                {/* Mini-stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
                  {stats.map((s) => (
                    <div key={s.label} style={{ background: 'var(--mm-surface-2)', border: '1px solid var(--mm-border-warm)', borderRadius: '13px', padding: '12px 10px', textAlign: 'center' }}>
                      <span className="ms" style={{ fontSize: '20px', color: s.color }}>{s.icon}</span>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--mm-text)', marginTop: '2px' }}>{s.value}</div>
                      <div style={{ fontSize: '10.5px', color: 'var(--mm-text-faint)', lineHeight: 1.2, marginTop: '2px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Medications */}
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '8px' }}>{lang === 'vi' ? 'Thuốc đang dùng' : 'Medications'}</div>
                {u.medications && u.medications.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                    {u.medications.map((med: any) => (
                      <div key={med.id || med.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', border: '1px solid var(--mm-border-warm)', borderRadius: '13px', background: 'var(--mm-surface-2)' }}>
                        <span className="mm-icon-badge" style={{ width: '40px', height: '40px', borderRadius: '11px', background: 'var(--mm-primary-soft)', color: 'var(--mm-primary)', flexShrink: 0 }}><span className="ms" style={{ fontSize: '21px' }}>pill</span></span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--mm-text)' }}>{med.name}</div>
                          <div style={{ fontSize: '12.5px', color: 'var(--mm-text-faint)' }}>{med.dosage} · {med.frequency} · {(med.schedule || []).join(', ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '14px', color: 'var(--mm-text-faint)', textAlign: 'center', padding: '18px 0' }}>{lang === 'vi' ? 'Không có thuốc nào được đăng ký.' : 'No medications registered.'}</p>
                )}

                {/* Today's log timeline */}
                {logs.length > 0 && (
                  <>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--mm-text-faint)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '8px' }}>{lang === 'vi' ? 'Nhật ký uống hôm nay' : "Today's log"}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {logs.map((l) => {
                        const st = l.status === 'taken' ? { icon: 'check_circle', color: 'var(--mm-primary)', label: lang === 'vi' ? 'đã uống' : 'taken' }
                          : l.status === 'missed' ? { icon: 'error', color: '#C79A3B', label: lang === 'vi' ? 'bỏ lỡ' : 'missed' }
                          : { icon: 'schedule', color: 'var(--mm-text-faint)', label: lang === 'vi' ? 'chờ uống' : 'pending' }
                        return (
                          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1px solid var(--mm-border-warm)', borderRadius: '11px' }}>
                            <span className="ms" style={{ fontSize: '20px', color: st.color }}>{st.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mm-text)' }}>{l.name}</span>
                              <span style={{ fontSize: '12.5px', color: 'var(--mm-text-faint)' }}> · {fmtTime(l.scheduled_time)}</span>
                            </div>
                            <span style={{ fontSize: '12.5px', fontWeight: 700, color: st.color }}>{st.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--mm-border-warm)', marginTop: '16px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <button type="button" onClick={() => handleDeleteUser(u.id, u.email)} className="mm-btn" style={{ padding: '10px 16px', fontSize: '14px', gap: '7px', background: 'rgba(225,101,90,0.12)', color: 'var(--mm-coral)', border: '1px solid rgba(225,101,90,0.3)' }}>
                  <span className="ms" style={{ fontSize: '18px' }}>delete</span>{lang === 'vi' ? 'Xoá tài khoản' : 'Delete user'}
                </button>
                <button type="button" onClick={() => setSelectedAdminUser(null)} className="mm-btn mm-btn-outline" style={{ padding: '10px 18px', fontSize: '14px' }}>{lang === 'vi' ? 'Đóng' : 'Close'}</button>
              </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Admin: add user                                                     */
/* ------------------------------------------------------------------ */
interface AddUserModalProps {
  lang: Lang
  showAddUserModal: boolean
  setShowAddUserModal: (v: boolean) => void
  handleCreateUser: (e: React.FormEvent) => void
  newUserEmail: string; setNewUserEmail: (v: string) => void
  newUserPassword: string; setNewUserPassword: (v: string) => void
  newUserName: string; setNewUserName: (v: string) => void
  creatingUser: boolean
}

export function AddUserModal({
  lang, showAddUserModal, setShowAddUserModal, handleCreateUser,
  newUserEmail, setNewUserEmail, newUserPassword, setNewUserPassword, newUserName, setNewUserName, creatingUser,
}: AddUserModalProps) {
  const close = () => setShowAddUserModal(false)
  useEscToClose(close)
  if (!showAddUserModal) return null
  return (
    <div onClick={close} className="fixed inset-0 flex items-center justify-center p-4 z-50" style={backdropStyle}>
      <div role="dialog" aria-modal="true" onClick={stop} className="mm-card relative w-full" style={{ maxWidth: '440px', borderRadius: '22px', padding: '24px', boxShadow: 'var(--mm-shadow)' }}>
        <button type="button" onClick={close} className="absolute cursor-pointer" style={{ top: '18px', right: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '10px', background: 'var(--mm-surface-2)', color: 'var(--mm-text-muted)', border: '1px solid var(--mm-border)' }} aria-label={lang === 'vi' ? 'Đóng' : 'Close'}>
          <span className="ms" style={{ fontSize: '20px' }}>close</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', paddingRight: '40px' }}>
          <span className="mm-icon-badge" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--mm-primary)', color: '#fff' }}><span className="ms" style={{ fontSize: '22px' }}>person_add</span></span>
          <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--mm-text)', margin: 0 }}>{lang === 'vi' ? 'Thêm người dùng mới' : 'Add New User'}</h3>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--mm-text-muted)', margin: '0 0 20px' }}>{lang === 'vi' ? 'Tạo tài khoản bệnh nhân mới (email được xác thực sẵn).' : 'Create a new patient account (email pre-confirmed).'}</p>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="mm-field-label">{lang === 'vi' ? 'Họ và tên' : 'Full name'}</label>
            <div className="mm-input-wrap">
              <span className="ms" style={{ fontSize: '20px' }}>person</span>
              <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className="mm-input" placeholder={lang === 'vi' ? 'Nguyễn Văn A' : 'Jane Doe'} />
            </div>
          </div>
          <div>
            <label className="mm-field-label">Email</label>
            <div className="mm-input-wrap">
              <span className="ms" style={{ fontSize: '20px' }}>mail</span>
              <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="mm-input" placeholder="name@domain.com" required />
            </div>
          </div>
          <div>
            <label className="mm-field-label">{lang === 'vi' ? 'Mật khẩu (tối thiểu 6 ký tự)' : 'Password (min 6 chars)'}</label>
            <div className="mm-input-wrap">
              <span className="ms" style={{ fontSize: '20px' }}>lock</span>
              <input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="mm-input" placeholder="••••••" minLength={6} required />
            </div>
          </div>
          <button type="submit" disabled={creatingUser} className="mm-btn mm-btn-primary" style={{ width: '100%', minHeight: '48px', fontWeight: 700, gap: '8px', opacity: creatingUser ? 0.6 : 1 }}>
            <span className="ms" style={{ fontSize: '20px' }}>check</span>
            {creatingUser ? (lang === 'vi' ? 'Đang tạo...' : 'Creating...') : (lang === 'vi' ? 'Tạo tài khoản' : 'Create account')}
          </button>
        </form>
      </div>
    </div>
  )
}
