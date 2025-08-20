import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { checkStartupPermissions } from '@/lib/startup-checks'
import RecheckButton from './RecheckButton'

export default async function PermissionError() {
  const permissionResult = await checkStartupPermissions()

  // If everything is fine, render nothing
  if (permissionResult.success) {
    return null
  }

  // Get error message
  const getErrorMessage = () => {
    return permissionResult.error?.message || 'Unknown permission error occurred.'
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-bold">Permission Error</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col">
        <div className="space-y-3">
          <span className="text-sm">
            {getErrorMessage()}{" "}
            <a
              href="https://docs.habittrove.com/troubleshooting"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-red-300"
            >
              Troubleshooting Guide
            </a>
          </span>
          <div>
            <RecheckButton />
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
