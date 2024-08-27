import { registerOTel, OTLPHttpProtoTraceExporter } from '@vercel/otel'
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import { OpenInferenceSpanProcessor } from '@arizeai/openinference-vercel'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)

export function register() {
  registerOTel({
    serviceName: 'next-app',
    spanProcessors: [
      new OpenInferenceSpanProcessor(),
      new BatchSpanProcessor(
        new OTLPHttpProtoTraceExporter({
          url: 'http://localhost:6006/v1/traces'
        })
      )
    ]
  })
}
