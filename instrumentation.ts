import { init } from '@/lib/env.server'; // startup env var check

// Ensure this function is exported
export async function register() {
  // We only want to run this code on the server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('Node.js runtime detected, running server-side instrumentation...');
    // Initialize environment variables first
    console.log('Initializing environment variables...');
    init();
    console.log('Environment variables initialized.');

    // Dynamically import the scheduler initializer
    // Use await import() for ESM compatibility
    try {
      console.log('Attempting to import scheduler...');
      // Ensure the path is correct relative to the project root
      const { initializeScheduler } = await import('./lib/scheduler');
      console.log('Scheduler imported successfully. Initializing...');
      initializeScheduler();
      console.log('Scheduler initialization called.');
    } catch (error) {
      console.error('Failed to import or initialize scheduler:', error);
    }
  } else {
    console.log(`Instrumentation hook running in environment: ${process.env.NEXT_RUNTIME}. Skipping server-side initialization.`);
  }
}
