'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { triggerManualBackup } from '@/app/actions/data'; // Import the server action
import { Loader2 } from 'lucide-react'; // For loading indicator

export default function DebugBackupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleBackupClick = async () => {
    setIsLoading(true);
    setStatusMessage('Starting backup...');
    setIsError(false);

    try {
      const result = await triggerManualBackup();
      setStatusMessage(result.message);
      setIsError(!result.success);
    } catch (error) {
      console.error("Error calling triggerManualBackup action:", error);
      setStatusMessage(`Client-side error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Debug Backup</h1>
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded space-y-4">
        <p className="text-muted-foreground">
          Click the button below to manually trigger the data backup process.
          Check the server console logs for detailed output. Backups are stored in the `/backups` directory.
        </p>
        <Button
          onClick={handleBackupClick}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Backup...
            </>
          ) : (
            'Run Manual Backup Now'
          )}
        </Button>
        {statusMessage && (
          <div className={`mt-4 p-3 rounded ${isError ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'}`}>
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
}
