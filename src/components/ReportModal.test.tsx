import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';

const { mockReportSomething, mockSendAnEmail } = vi.hoisted(() => ({
  mockReportSomething: vi.fn(),
  mockSendAnEmail: vi.fn(),
}));

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>('@ionic/react');
  return {
    ...actual,
    IonAlert: ({ isOpen, onDidDismiss }: any) => (
      isOpen ? <button onClick={onDidDismiss}>OK</button> : null
    ),
    IonButton: ({ children, disabled, onClick, type }: any) => (
      <button disabled={disabled} onClick={onClick} type={type === 'submit' ? 'submit' : 'button'}>
        {children}
      </button>
    ),
    IonSelect: ({ children, onIonChange }: any) => (
      <select aria-label="Reason" onChange={(e) => onIonChange({ detail: { value: e.target.value } })}>
        <option value="">Select</option>
        {children}
      </select>
    ),
    IonSelectOption: ({ children, value }: any) => <option value={value}>{children}</option>,
    IonTextarea: ({ onIonInput, value }: any) => (
      <textarea value={value} onChange={(e) => onIonInput({ detail: { value: e.target.value } })} />
    ),
  };
});

vi.mock('../hooks/utilities', () => ({
  reportSomething: (...args: any[]) => mockReportSomething(...args),
  sendAnEmail: (...args: any[]) => mockSendAnEmail(...args),
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
  beforeEach(() => {
    vi.clearAllMocks();
    mockReportSomething.mockResolvedValue(undefined);
    mockSendAnEmail.mockResolvedValue(undefined);
  });

  it('warns that submitting a user report blocks the user', () => {
    renderReportModal();

    expect(screen.getByText(/Submitting this report will block this user/)).toBeInTheDocument();
    expect(screen.queryByText(/You will both lose access to your Chat/)).not.toBeInTheDocument();
  });

  it('does not show the block warning for non-user reports', () => {
    renderReportModal({ offender: 'comment' });

    expect(screen.queryByText(/Submitting this report will block this user/)).not.toBeInTheDocument();
    expect(screen.queryByText(/You will both lose access to your Chat/)).not.toBeInTheDocument();
  });

  it('warns that both users lose chat access when reporting someone with an existing chat', () => {
    renderReportModal({ hasExistingChat: true });

    expect(screen.getByText(/Submitting this report will block this user/)).toBeInTheDocument();
    expect(screen.getByText(/You will both lose access to your Chat/)).toBeInTheDocument();
  });

  it('dismisses with cancel role without reporting', () => {
    const onDismiss = vi.fn();
    renderReportModal({ onDismiss });

    fireEvent.click(screen.getByText('Cancel'));

    expect(onDismiss).toHaveBeenCalledWith(undefined, 'cancel');
    expect(mockReportSomething).not.toHaveBeenCalled();
    expect(mockSendAnEmail).not.toHaveBeenCalled();
  });

  it('reports and dismisses with submitted role after the success alert closes', async () => {
    const onDismiss = vi.fn();
    const onReportSubmitted = vi.fn();
    const { container } = renderReportModal({ onDismiss, onReportSubmitted });

    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Covid Minimizing' } });
    fireEvent.change(container.querySelector('textarea') as HTMLTextAreaElement, {
      target: { value: 'Details for the moderation team.' },
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Submit'));
    });

    await waitFor(() => {
      expect(mockReportSomething).toHaveBeenCalledWith(42, 'user');
    });

    expect(onReportSubmitted).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('OK'));

    expect(onReportSubmitted).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith(undefined, 'submitted');
  });
});
