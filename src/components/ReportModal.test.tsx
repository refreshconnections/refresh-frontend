import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IonApp } from '@ionic/react';

vi.mock('../hooks/utilities', () => ({
  reportSomething: vi.fn(),
  sendAnEmail: vi.fn(),
}));

import ReportModal from './ReportModal';

const renderReportModal = (props: Partial<React.ComponentProps<typeof ReportModal>> = {}) => {
  return render(
    <IonApp>
      <ReportModal
        offender="user"
        text="Jordan"
        id={42}
        onDismiss={vi.fn()}
        {...props}
      />
    </IonApp>
  );
};

describe('ReportModal', () => {
  it('warns that submitting a user report blocks the user', () => {
    renderReportModal();

    expect(screen.getByText(/Submitting this report will block this user/)).toBeInTheDocument();
    expect(screen.queryByText(/You will both lose access to your Chat/)).not.toBeInTheDocument();
  });

  it('warns that both users lose chat access when reporting someone with an existing chat', () => {
    renderReportModal({ hasExistingChat: true });

    expect(screen.getByText(/Submitting this report will block this user/)).toBeInTheDocument();
    expect(screen.getByText(/You will both lose access to your Chat/)).toBeInTheDocument();
  });
});
