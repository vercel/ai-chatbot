'use client';

import React from 'react';
import { Session } from '@/lib/stores/chatStore';

interface SessionWrapperProps {
  session: Session;
  children: React.ReactNode;
  isActive?: boolean;
}

/**
 * Wrapper simplificado para sessões
 */
export function SessionWrapper({ 
  session, 
  children, 
  isActive = false 
}: SessionWrapperProps) {
  return (
    <React.Fragment key={session.id}>
      {children}
    </React.Fragment>
  );
}

export default SessionWrapper;