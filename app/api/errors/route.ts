import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  level: 'critical' | 'error' | 'warning' | 'info';
  timestamp: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  buildId?: string;
  digest?: string;
  context?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const errorReport: ErrorReport = await request.json();
    const headersList = headers();
    const userAgent = headersList.get('user-agent');
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');

    // Add server-side context
    const enhancedReport = {
      ...errorReport,
      serverTimestamp: new Date().toISOString(),
      userAgent: userAgent || errorReport.userAgent,
      clientIp: forwardedFor || realIp,
      headers: {
        referer: headersList.get('referer'),
        origin: headersList.get('origin'),
      },
    };

    // Log to console (in development/staging)
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error Report Received:', JSON.stringify(enhancedReport, null, 2));
    }

    // In production, you would send this to your error tracking service
    // Examples: Sentry, LogRocket, Datadog, etc.
    if (process.env.NODE_ENV === 'production') {
      await Promise.allSettled([
        // Example: Send to Sentry
        sendToSentry(enhancedReport),
        
        // Example: Send to custom logging service
        sendToLoggingService(enhancedReport),
        
        // Example: Store in database for analytics
        storeInDatabase(enhancedReport),
      ]);
    }

    return NextResponse.json({
      success: true,
      errorId: errorReport.errorId,
      message: 'Error report received',
    });

  } catch (error) {
    console.error('Failed to process error report:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process error report',
      },
      { status: 500 }
    );
  }
}

async function sendToSentry(errorReport: ErrorReport) {
  // Example Sentry integration
  // You would install @sentry/nextjs and configure it
  /*
  import * as Sentry from '@sentry/nextjs';
  
  Sentry.captureException(new Error(errorReport.message), {
    tags: {
      errorId: errorReport.errorId,
      level: errorReport.level,
    },
    extra: {
      stack: errorReport.stack,
      componentStack: errorReport.componentStack,
      context: errorReport.context,
    },
    user: {
      id: errorReport.userId,
    },
  });
  */
}

async function sendToLoggingService(errorReport: ErrorReport) {
  // Example: Send to external logging service
  if (process.env.LOGGING_WEBHOOK_URL) {
    try {
      await fetch(process.env.LOGGING_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.LOGGING_API_KEY && {
            'Authorization': `Bearer ${process.env.LOGGING_API_KEY}`
          }),
        },
        body: JSON.stringify(errorReport),
      });
    } catch (error) {
      console.error('Failed to send to logging service:', error);
    }
  }
}

async function storeInDatabase(errorReport: ErrorReport) {
  // Example: Store in database
  // You would use your database client here
  /*
  import { db } from '@/lib/db';
  
  try {
    await db.errorReports.create({
      data: {
        errorId: errorReport.errorId,
        message: errorReport.message,
        stack: errorReport.stack,
        level: errorReport.level,
        timestamp: new Date(errorReport.timestamp),
        userId: errorReport.userId,
        sessionId: errorReport.sessionId,
        url: errorReport.url,
        userAgent: errorReport.userAgent,
        context: errorReport.context,
      },
    });
  } catch (error) {
    console.error('Failed to store error in database:', error);
  }
  */
}