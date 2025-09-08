/**
 * Redis Health Check API Endpoint
 * Provides comprehensive Redis system health information
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  performHealthCheck, 
  getStatusSummary, 
  getSystemStatus 
} from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    const checkType = searchParams.get('type') || 'summary';

    switch (checkType) {
      case 'full':
        // Full comprehensive health check
        const fullHealth = await performHealthCheck({
          timeout: 5000,
          includeDetails: true,
          checkPersistence: true,
          checkPerformance: true,
        });

        return NextResponse.json(fullHealth, {
          status: fullHealth.status === 'healthy' ? 200 : 
                  fullHealth.status === 'degraded' ? 206 : 503,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Health-Status': fullHealth.status,
            'X-Health-Timestamp': fullHealth.timestamp.toString(),
          },
        });

      case 'system':
        // System-wide status including all components
        const systemStatus = await getSystemStatus();
        
        return NextResponse.json(systemStatus, {
          status: systemStatus.overall === 'healthy' ? 200 :
                  systemStatus.overall === 'degraded' ? 206 : 503,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Health-Status': systemStatus.overall,
          },
        });

      case 'summary':
      default:
        // Quick status summary
        const summary = await getStatusSummary();
        
        if (detailed) {
          // Include additional metrics
          const detailedSummary = {
            ...summary,
            timestamp: Date.now(),
            components: {
              redis: summary.status !== 'unhealthy',
              cache: true,
              sessions: true,
              pubsub: true,
              fallback: true,
            },
          };

          return NextResponse.json(detailedSummary, {
            status: summary.status === 'healthy' ? 200 :
                    summary.status === 'degraded' ? 206 : 503,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'X-Health-Status': summary.status,
            },
          });
        }

        return NextResponse.json(summary, {
          status: summary.status === 'healthy' ? 200 :
                  summary.status === 'degraded' ? 206 : 503,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Health-Status': summary.status,
          },
        });
    }
  } catch (error) {
    console.error('Health check API error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Status': 'unhealthy',
        },
      }
    );
  }
}

// Handle HEAD requests for load balancer health checks
export async function HEAD(request: NextRequest) {
  try {
    const summary = await getStatusSummary();
    
    return new NextResponse(null, {
      status: summary.status === 'healthy' ? 200 :
              summary.status === 'degraded' ? 206 : 503,
      headers: {
        'X-Health-Status': summary.status,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}