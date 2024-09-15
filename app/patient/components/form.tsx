import { Widget } from './TerraWidget'

export function PatientForm() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Connect Your Health Device</h2>
      <p className="text-sm text-gray-600">
        Click the button below to connect your health device and start syncing your data.
      </p>
      <Widget />
    </div>
  )
}