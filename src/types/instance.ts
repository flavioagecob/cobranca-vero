export type InstanceStatus = 'disconnected' | 'connecting' | 'connected';

export interface Instance {
  id: string;
  instance_id: string;
  token: string;
  name: string;
  phone_number: string | null;
  status: InstanceStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateInstanceResult {
  success: boolean;
  instance?: Instance;
  error?: string;
}

export interface ConnectResult {
  success: boolean;
  qr_code_base64?: string;
  error?: string;
}

export interface StatusResult {
  success: boolean;
  status?: InstanceStatus;
  phone_number?: string;
  error?: string;
}
