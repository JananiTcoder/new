import { useState } from 'react'
import { CheckCircle2, Gauge } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Field, Input, Select, Textarea, Checkbox } from '../../components/ui/FormField'
import { useProviderAuth } from '../../provider/ProviderAuthContext'
import { useProviderData } from '../../provider/providerStore'
import { validateCapacity, hasErrors } from '../../provider/providerValidation'
import { OPERATING_STATUS_LIST, DETAIL_CATEGORY } from '../../types/provider'

const BASE_DEFAULTS = {
  infrastructureCategory: '',
  totalCapacity: '',
  availableCapacity: '',
  occupiedCapacity: '',
  reservedCapacity: '',
  roomCount: '',
  usableBeds: '',
  waterAvailable: false,
  toiletsAvailable: false,
  electricityAvailable: false,
  foodAvailable: false,
  medicalSupportAvailable: false,
  accessibilityAvailable: false,
  womenChildSupportAvailable: false,
  operatingStatus: OPERATING_STATUS_LIST[0],
  availableFrom: '',
  availableUntil: '',
  contactPerson: '',
  contactPhone: '',
  notes: '',
}

const HOSPITAL_DEFAULTS = { totalBeds: '', availableBeds: '', icuBeds: '', emergencyBeds: '', isolationBeds: '', ambulanceAvailable: false, medicalStaffAvailable: false }
const SCHOOL_DEFAULTS = { classroomCount: '', hallCapacity: '', drinkingWaterAvailable: false, toiletsAvailable: false, kitchenAvailable: false, sleepingArrangementAvailable: false, electricityAvailable: false }
const HALL_DEFAULTS = { hallCapacity: '', hallCount: '', washroomsAvailable: false, drinkingWaterAvailable: false, powerBackupAvailable: false, kitchenAvailable: false }
const NGO_DEFAULTS = { volunteersAvailable: '', foodPackets: '', waterPackets: '', medicalKits: '', vehiclesAvailable: '', temporaryShelterCapacity: '' }

function toNumberOrZero(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export default function ProviderCapacity() {
  const { provider } = useProviderAuth()
  const { getCapacity, getDetails, getDetailCategory, upsertCapacity, upsertDetails } = useProviderData()
  const category = getDetailCategory(provider.id)
  const existingCapacity = getCapacity(provider.id)
  const existingDetails = getDetails(provider.id)

  const [form, setForm] = useState({
    ...BASE_DEFAULTS,
    ...(existingCapacity || {}),
    infrastructureCategory: existingCapacity?.infrastructureCategory || provider.accountType,
    contactPerson: existingCapacity?.contactPerson || provider.contactPerson,
    contactPhone: existingCapacity?.contactPhone || provider.phone,
  })
  const [detailForm, setDetailForm] = useState({
    ...(category === DETAIL_CATEGORY.HOSPITAL ? HOSPITAL_DEFAULTS : {}),
    ...(category === DETAIL_CATEGORY.SCHOOL ? SCHOOL_DEFAULTS : {}),
    ...(category === DETAIL_CATEGORY.COMMUNITY_HALL ? HALL_DEFAULTS : {}),
    ...(category === DETAIL_CATEGORY.NGO ? NGO_DEFAULTS : {}),
    ...(existingDetails?.[category] || {}),
  })
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  const set = (k) => (e) => {
    setSaved(false)
    setForm((f) => ({ ...f, [k]: e.target.value }))
  }
  const setCheck = (k) => (v) => {
    setSaved(false)
    setForm((f) => ({ ...f, [k]: v }))
  }
  const setDetail = (k) => (e) => {
    setSaved(false)
    setDetailForm((f) => ({ ...f, [k]: e.target.value }))
  }
  const setDetailCheck = (k) => (v) => {
    setSaved(false)
    setDetailForm((f) => ({ ...f, [k]: v }))
  }

  const submit = (e) => {
    e.preventDefault()
    const fieldErrors = validateCapacity(form)
    setErrors(fieldErrors)
    if (hasErrors(fieldErrors)) return

    upsertCapacity(provider.id, {
      ...form,
      totalCapacity: toNumberOrZero(form.totalCapacity),
      availableCapacity: toNumberOrZero(form.availableCapacity),
      occupiedCapacity: toNumberOrZero(form.occupiedCapacity),
      reservedCapacity: toNumberOrZero(form.reservedCapacity),
      roomCount: toNumberOrZero(form.roomCount),
      usableBeds: toNumberOrZero(form.usableBeds),
    })

    if (category !== DETAIL_CATEGORY.NONE) {
      const numericDetail = Object.fromEntries(Object.entries(detailForm).map(([k, v]) => [k, typeof v === 'boolean' ? v : toNumberOrZero(v)]))
      upsertDetails(provider.id, category, numericDetail)
    }
    setSaved(true)
  }

  return (
    <div className="p-4 lg:p-8 max-w-[900px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Gauge size={22} className="text-emerald-600 dark:text-emerald-400" /> Capacity Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Enter and update your actual capacity. Every other GEOSENTRA portal reads directly from this record.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={submit} className="space-y-6" noValidate>
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Base Capacity</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Infrastructure category" required error={errors.infrastructureCategory} className="sm:col-span-2">
                <Input value={form.infrastructureCategory} onChange={set('infrastructureCategory')} error={errors.infrastructureCategory} />
              </Field>
              <Field label="Total physical capacity" required error={errors.totalCapacity}>
                <Input type="number" min="0" value={form.totalCapacity} onChange={set('totalCapacity')} error={errors.totalCapacity} />
              </Field>
              <Field label="Currently available capacity" required error={errors.availableCapacity}>
                <Input type="number" min="0" value={form.availableCapacity} onChange={set('availableCapacity')} error={errors.availableCapacity} />
              </Field>
              <Field label="Currently occupied capacity" required error={errors.occupiedCapacity}>
                <Input type="number" min="0" value={form.occupiedCapacity} onChange={set('occupiedCapacity')} error={errors.occupiedCapacity} />
              </Field>
              <Field label="Reserved emergency capacity" required error={errors.reservedCapacity}>
                <Input type="number" min="0" value={form.reservedCapacity} onChange={set('reservedCapacity')} error={errors.reservedCapacity} />
              </Field>
              <Field label="Number of rooms/halls">
                <Input type="number" min="0" value={form.roomCount} onChange={set('roomCount')} />
              </Field>
              <Field label="Number of usable beds (if applicable)">
                <Input type="number" min="0" value={form.usableBeds} onChange={set('usableBeds')} />
              </Field>
              <Field label="Operating status">
                <Select value={form.operatingStatus} onChange={set('operatingStatus')}>
                  {OPERATING_STATUS_LIST.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Availability start date">
                <Input type="date" value={form.availableFrom} onChange={set('availableFrom')} />
              </Field>
              <Field label="Availability end date">
                <Input type="date" value={form.availableUntil} onChange={set('availableUntil')} />
              </Field>
              <Field label="Contact person" required error={errors.contactPerson}>
                <Input value={form.contactPerson} onChange={set('contactPerson')} error={errors.contactPerson} />
              </Field>
              <Field label="Contact phone" required error={errors.contactPhone}>
                <Input value={form.contactPhone} onChange={set('contactPhone')} error={errors.contactPhone} />
              </Field>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">General Facilities</h2>
            <div className="grid sm:grid-cols-3 gap-2.5">
              <Checkbox label="Water availability" checked={form.waterAvailable} onChange={setCheck('waterAvailable')} />
              <Checkbox label="Toilet availability" checked={form.toiletsAvailable} onChange={setCheck('toiletsAvailable')} />
              <Checkbox label="Electricity availability" checked={form.electricityAvailable} onChange={setCheck('electricityAvailable')} />
              <Checkbox label="Food availability" checked={form.foodAvailable} onChange={setCheck('foodAvailable')} />
              <Checkbox label="Medical support availability" checked={form.medicalSupportAvailable} onChange={setCheck('medicalSupportAvailable')} />
              <Checkbox label="Accessibility support" checked={form.accessibilityAvailable} onChange={setCheck('accessibilityAvailable')} />
              <Checkbox label="Women & child safety facilities" checked={form.womenChildSupportAvailable} onChange={setCheck('womenChildSupportAvailable')} />
            </div>
          </section>

          {category === DETAIL_CATEGORY.HOSPITAL && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Hospital Details</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Total beds">
                  <Input type="number" min="0" value={detailForm.totalBeds} onChange={setDetail('totalBeds')} />
                </Field>
                <Field label="Available beds">
                  <Input type="number" min="0" value={detailForm.availableBeds} onChange={setDetail('availableBeds')} />
                </Field>
                <Field label="ICU beds">
                  <Input type="number" min="0" value={detailForm.icuBeds} onChange={setDetail('icuBeds')} />
                </Field>
                <Field label="Emergency beds">
                  <Input type="number" min="0" value={detailForm.emergencyBeds} onChange={setDetail('emergencyBeds')} />
                </Field>
                <Field label="Isolation beds">
                  <Input type="number" min="0" value={detailForm.isolationBeds} onChange={setDetail('isolationBeds')} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-2.5 mt-2.5">
                <Checkbox label="Ambulance availability" checked={detailForm.ambulanceAvailable} onChange={setDetailCheck('ambulanceAvailable')} />
                <Checkbox label="Medical staff availability" checked={detailForm.medicalStaffAvailable} onChange={setDetailCheck('medicalStaffAvailable')} />
              </div>
            </section>
          )}

          {category === DETAIL_CATEGORY.SCHOOL && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">School / College Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Classrooms available">
                  <Input type="number" min="0" value={detailForm.classroomCount} onChange={setDetail('classroomCount')} />
                </Field>
                <Field label="Hall capacity">
                  <Input type="number" min="0" value={detailForm.hallCapacity} onChange={setDetail('hallCapacity')} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-3 gap-2.5 mt-2.5">
                <Checkbox label="Drinking water" checked={detailForm.drinkingWaterAvailable} onChange={setDetailCheck('drinkingWaterAvailable')} />
                <Checkbox label="Toilets" checked={detailForm.toiletsAvailable} onChange={setDetailCheck('toiletsAvailable')} />
                <Checkbox label="Kitchen / food facility" checked={detailForm.kitchenAvailable} onChange={setDetailCheck('kitchenAvailable')} />
                <Checkbox label="Sleeping arrangement" checked={detailForm.sleepingArrangementAvailable} onChange={setDetailCheck('sleepingArrangementAvailable')} />
                <Checkbox label="Electricity" checked={detailForm.electricityAvailable} onChange={setDetailCheck('electricityAvailable')} />
              </div>
            </section>
          )}

          {category === DETAIL_CATEGORY.COMMUNITY_HALL && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Community Hall Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Hall capacity">
                  <Input type="number" min="0" value={detailForm.hallCapacity} onChange={setDetail('hallCapacity')} />
                </Field>
                <Field label="Number of halls">
                  <Input type="number" min="0" value={detailForm.hallCount} onChange={setDetail('hallCount')} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-2.5 mt-2.5">
                <Checkbox label="Washrooms" checked={detailForm.washroomsAvailable} onChange={setDetailCheck('washroomsAvailable')} />
                <Checkbox label="Drinking water" checked={detailForm.drinkingWaterAvailable} onChange={setDetailCheck('drinkingWaterAvailable')} />
                <Checkbox label="Power backup" checked={detailForm.powerBackupAvailable} onChange={setDetailCheck('powerBackupAvailable')} />
                <Checkbox label="Kitchen" checked={detailForm.kitchenAvailable} onChange={setDetailCheck('kitchenAvailable')} />
              </div>
            </section>
          )}

          {category === DETAIL_CATEGORY.NGO && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">NGO / Relief Resources</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Volunteers available">
                  <Input type="number" min="0" value={detailForm.volunteersAvailable} onChange={setDetail('volunteersAvailable')} />
                </Field>
                <Field label="Food packets">
                  <Input type="number" min="0" value={detailForm.foodPackets} onChange={setDetail('foodPackets')} />
                </Field>
                <Field label="Water packets">
                  <Input type="number" min="0" value={detailForm.waterPackets} onChange={setDetail('waterPackets')} />
                </Field>
                <Field label="Medical kits">
                  <Input type="number" min="0" value={detailForm.medicalKits} onChange={setDetail('medicalKits')} />
                </Field>
                <Field label="Vehicles available">
                  <Input type="number" min="0" value={detailForm.vehiclesAvailable} onChange={setDetail('vehiclesAvailable')} />
                </Field>
                <Field label="Temporary shelter capacity">
                  <Input type="number" min="0" value={detailForm.temporaryShelterCapacity} onChange={setDetail('temporaryShelterCapacity')} />
                </Field>
              </div>
            </section>
          )}

          <Field label="Additional notes">
            <Textarea value={form.notes} onChange={set('notes')} placeholder="Anything else relocation planners should know..." />
          </Field>

          <div className="flex items-center gap-3">
            <Button type="submit" size="lg">
              Save Capacity
            </Button>
            {saved && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Saved — visible across GEOSENTRA immediately
              </span>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
}
