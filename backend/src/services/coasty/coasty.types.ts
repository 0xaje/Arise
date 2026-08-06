export type CoastyRunStatus =
  | 'queued'
  | 'starting'
  | 'running'
  | 'awaiting_human'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'timed_out';

export interface CoastyUsage {
  step_count?: number;
  total_tokens?: number;
  cost_usd?: number;
  duration_seconds?: number;
}

export interface CoastyRunResult {
  outcome?: string;
  summary?: string;
  output_json?: string | Record<string, any>;
  evidence_url?: string;
  evidence_id?: string;
}

export interface CoastyRunError {
  code?: string;
  message?: string;
  details?: Record<string, any>;
}

export interface CoastyRun {
  id: string;
  machine_id: string;
  task: string;
  cua_version: string;
  status: CoastyRunStatus;
  max_steps: number;
  step_count?: number;
  result?: CoastyRunResult;
  error?: CoastyRunError;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  usage?: CoastyUsage;
}

export interface CoastyRunEvent {
  id?: string;
  run_id: string;
  sequence?: number;
  event_type: 'run_created' | 'run_started' | 'step_started' | 'step_completed' | 'awaiting_human' | 'run_completed' | 'run_failed' | 'run_cancelled';
  message?: string;
  action_type?: string;
  action_summary?: string;
  application?: string;
  result_summary?: string;
  evidence_url?: string;
  evidence_id?: string;
  timestamp: string;
  payload?: Record<string, any>;
}

export interface CreateCoastyRunPayload {
  machine_id: string;
  task: string;
  cua_version?: string;
  instructions?: string;
  system_prompt?: string;
  max_steps?: number;
  deadline_seconds?: number;
  on_awaiting_human?: 'pause' | 'fail' | 'notify';
  webhook_url?: string;
}
