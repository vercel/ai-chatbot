export type PartialEventResponse = RecursivePartial<EventResponse>

interface EventResponse {
  fallbacks: string[]
  headers: Headers
  id: string
  jobs: Job[]
  reporters: string[]
  results: Results
  start_time: number
  states: State[]
  supervisors: string[]
}

interface Headers {
  env: string
  expired_at: Date
  id: number
  name: string
  permissions: string[]
  user_name: string
  uuid: string
  version: string
}

interface Job {
  extra_files: ExtraFiles
  extra_params: ExtraFiles
  files: JobFile[]
  name: string
  params: Params
  required_result_files: ExtraFiles
  required_result_params: ExtraFiles
  topic: string
}

interface ExtraFiles {}

interface JobFile {
  label: string
  metadata: ExtraFiles
  path: string
}

interface Params {
  enable_pitch_correction?: boolean
  end_index?: string
  f0_predictor?: string
  file: string[] | string
  is_overlapadd?: boolean
  mode?: string
  original_sr?: boolean
  output_file?: OutputFile
  speakers?: string[]
  speakers_pitch_adjustment?: SpeakersPitchAdjustment
  start_index?: string
  stem?: string[]
  usage?: string
}

interface OutputFile {
  merged_result?: string
  trim_cut_result?: string
}

interface SpeakersPitchAdjustment {
  [key: string]: number[]
}

interface Results {
  step_1: Step
  step_2: Step
  step_3: Step
  step_4: Step
  step_5: Step
}

interface Step {
  data: ExtraFiles
  files: StepFile[]
}

interface StepFile {
  label: string
  metadata: Metadata
  path: string
}

interface Metadata {
  s3: ExtraFiles
}

interface State {
  exception: ExtraFiles
  exec_time: number
  job_name: string
  node_name: string
  timestamp: number
}
