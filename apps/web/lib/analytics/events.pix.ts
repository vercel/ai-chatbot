export type PixEvents =
  | { name: 'ux.copy_click'; payload: { component_id: string } }
  | { name: 'pix_activation_start'; payload: { user_id: string; channel: 'app' | 'web' | 'whatsapp' } }
  | { name: 'pix_activation_success'; payload: { user_id: string; value: number } }
  | { name: 'ux.form_error'; payload: { field: string; error_type: string } }
  | { name: 'pix_simulation_done'; payload: { amount: number; installments: number } }
  | { name: 'cta_activate_click'; payload: { channel: 'app' | 'web' | 'whatsapp' | 'push' } }
  | { name: 'whatsapp_template_sent'; payload: { template_name: string; user_id: string } };

export function track<E extends PixEvents>(event: E) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('analytics', { detail: event }));
  }
  // server-side: log/queue
  // console.log('[analytics]', event);
}
