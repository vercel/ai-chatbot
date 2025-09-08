import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

interface GlobalErrorReport {
  message: string;
  stack?: string;
  digest?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const globalErrorReport: GlobalErrorReport = await request.json();
    const headersList = headers();

    const enhancedReport = {
      ...globalErrorReport,
      type: 'global_error',
      serverTimestamp: new Date().toISOString(),
      userAgent: headersList.get('user-agent') || globalErrorReport.userAgent,
      clientIp: headersList.get('x-forwarded-for') || headersList.get('x-real-ip'),
      severity: 'critical',
    };

    // Log critical global errors
    console.error('🚨 GLOBAL ERROR:', JSON.stringify(enhancedReport, null, 2));

    // Send to monitoring services immediately for critical errors
    if (process.env.NODE_ENV === 'production') {
      await Promise.allSettled([
        // Send to error tracking service
        sendToCriticalMonitoring(enhancedReport),
        
        // Send alert to team
        sendAlertNotification(enhancedReport),
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Global error report received',
    });

  } catch (error) {
    console.error('Failed to process global error report:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process global error report',
      },
      { status: 500 }
    );
  }
}

async function sendToCriticalMonitoring(errorReport: any) {
  // Example: Send to monitoring service for critical errors
  if (process.env.CRITICAL_ERROR_WEBHOOK_URL) {
    try {
      await fetch(process.env.CRITICAL_ERROR_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.MONITORING_API_KEY && {
            'Authorization': `Bearer ${process.env.MONITORING_API_KEY}`
          }),
        },
        body: JSON.stringify(errorReport),
      });
    } catch (error) {
      console.error('Failed to send to critical monitoring:', error);
    }
  }
}

async function sendAlertNotification(errorReport: any) {
  // Example: Send Slack/Discord/Email alert for critical errors
  if (process.env.ALERT_WEBHOOK_URL) {
    try {
      const alertMessage = {
        text: `🚨 Critical Error in ${process.env.NEXT_PUBLIC_APP_NAME || 'Application'}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Critical Error Detected*\n\n*Message:* ${errorReport.message}\n*URL:* ${errorReport.url}\n*Time:* ${errorReport.timestamp}\n*User Agent:* ${errorReport.userAgent}`
            }
          }
        ]
      };

      await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertMessage),
      });
    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }
}