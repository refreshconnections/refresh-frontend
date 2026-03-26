import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonNote,
  IonBadge,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
  IonAlert,
  IonIcon,
  IonToast,
  IonInput,
  IonSkeletonText,
  IonLoading,
  isPlatform,
} from "@ionic/react";
import { App } from "@capacitor/app";
import { useQueryClient } from "@tanstack/react-query";
import {
  useEmailStatus,
  useSetSecondaryEmail,
  useApproveSecondarySms,
  useSwapPrimaryEmail,
  useClearSecondaryEmail,
} from "../hooks/api/account/emails";
import { checkmarkCircle, closeCircle, refreshOutline } from "ionicons/icons";
import "./StatusToast.css";
import "./EditModal.css";
import "../pages/Settings.css";

type Props = { onDismiss: () => void };

// helpers
const normalize = (s: string) => (s || "").trim().toLowerCase();
const localPart = (email: string) => normalize(email).split("@", 1)[0];
const hasPlus = (email: string) => localPart(email).includes("+");
const emailLike = (s: string) => /.+@.+\..+/.test(s);

const EmailSettingsModal: React.FC<Props> = ({ onDismiss }) => {
  const qc = useQueryClient();

  // local UI state
  const [addMethod, setAddMethod] = useState<"email" | "sms">("email");
  const [secondaryDraft, setSecondaryDraft] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsOpen, setSmsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // password-first dialog state
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdInput, setPwdInput] = useState("");
  const [pwdAction, setPwdAction] = useState<"add" | "swap" | null>(null);
  // force-remount the password alert to ensure no stale input persists
  const [pwdAlertKey, setPwdAlertKey] = useState(0);
  const reopenPwdAlertFresh = () => setPwdAlertKey((k) => k + 1);

  // force-remount the SMS alert to ensure it pops fresh when it actually opens
  const [smsAlertKey, setSmsAlertKey] = useState(0);
  const reopenSmsAlertFresh = () => setSmsAlertKey((k) => k + 1);

  // confirm remove for verified backup email
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  // confirm before letting user close the SMS alert with an empty/short code
  const [confirmSmsExitOpen, setConfirmSmsExitOpen] = useState(false);

  // data
  const statusQuery = useEmailStatus();
  const status = statusQuery.data;

  // --- initial-loading gate that only applies on FIRST mount ---
  const hasLoadedOnceRef = useRef(false);
  useEffect(() => {
    if (status && !hasLoadedOnceRef.current) hasLoadedOnceRef.current = true;
  }, [status]);
  const isInitialLoading =
    !hasLoadedOnceRef.current &&
    (statusQuery.isLoading || (statusQuery.isFetching && !status));

  // mutations
  const setSecondary = useSetSecondaryEmail({
    onSuccess: (msg) => {
      setToast(msg || "Approval sent.");
      qc.invalidateQueries({ queryKey: ["account", "email-status"] });
      // Only open the SMS dialog *after* the password was accepted & server request succeeded
      if (addMethod === "sms") {
        setSmsCode("");
        reopenSmsAlertFresh();
        setSmsOpen(true);
      }
    },
    onError: (err) => {
      setToast(err || "Could not add backup.");
      // ensure any pending code dialog is closed on error
      setSmsOpen(false);
      setSmsCode("");
    },
  });

  const lastTwoDigits = useMemo(() => {
    const digits = (status?.phone ?? "").replace(/\D/g, "");
    return digits.slice(-2);
  }, [status?.phone]);

  const approveSms = useApproveSecondarySms({
    onSuccess: (msg) => {
      setToast(msg || "Backup approved.");
      qc.invalidateQueries({ queryKey: ["account", "email-status"] });
      setSmsCode("");
    },
    onError: (err) => setToast(err || "Invalid or expired code."),
  });

  const swapPrimary = useSwapPrimaryEmail({
    onSuccess: (msg) => {
      setToast(msg || "Primary email updated.");
      qc.invalidateQueries({ queryKey: ["account", "email-status"] });
    },
    onError: (err) => setToast(err || "Could not swap emails."),
  });

  const clearSecondary = useClearSecondaryEmail({
    onSuccess: () => {
      setToast("Backup removed.");
      qc.invalidateQueries({ queryKey: ["account", "email-status"] });
      // Clear the add form so removed email doesn't stick
      setSecondaryDraft("");
      setAddMethod("email");
      setSmsOpen(false);
      setSmsCode("");
      setPwdOpen(false);
      setPwdAction(null);
      setPwdInput("");
    },
    onError: (err) => setToast(err || "Could not remove backup."),
  });

  const stripPlusAlias = (email: string) => {
    const [local = "", domain = ""] = normalize(email).split("@");
    return `${local.split("+")[0]}@${domain}`;
  };

  const aliasOfPrimary = useMemo(() => {
    if (!secondaryDraft || !status?.primary_email) return false;
    return stripPlusAlias(secondaryDraft) === stripPlusAlias(status.primary_email);
  }, [secondaryDraft, status?.primary_email]);

  // derived
  const addDisabled = useMemo(() => {
    if (!emailLike(secondaryDraft)) return true;
    if (hasPlus(secondaryDraft)) return true; // enforce: no '+'
    if (aliasOfPrimary) return true;
    return false;
  }, [secondaryDraft, aliasOfPrimary]);

  const swapDisabled = useMemo(
    () => !status?.secondary_email_fully_verified,
    [status?.secondary_email_fully_verified]
  );

  const verifiedBadge = (ok?: boolean) => (
    <IonBadge color={ok ? "success" : "medium"}>{ok ? "Verified" : "Not verified"}</IonBadge>
  );

  // show "Recheck status" when we have a backup that is not fully verified
  const needsRecheck = useMemo(() => {
    if (!status?.secondary_email) return false;
    return !(status?.secondary_email_approved && status?.secondary_email_validated);
  }, [
    status?.secondary_email,
    status?.secondary_email_approved,
    status?.secondary_email_validated,
  ]);

  // Auto recheck on resume
  useEffect(() => {
    if (!needsRecheck) return;
    const listen = async () => {
      App.addListener("resume", async () => {
        try {
          await statusQuery.refetch();
        } catch (e) {
          console.warn("Failed to refetch on resume", e);
        }
      });
      App.addListener("pause", async () => {
        // no-op
      });
    };
    listen();
  }, [needsRecheck, statusQuery]);

  // password dialog handler (always required to add a backup, including after removal)
  const handlePasswordConfirm = (data: any) => {
    const pw = (data?.password ?? "").toString();
    if (!pw) return false; // keep alert open

    if (pwdAction === "add") {
      const email = normalize(secondaryDraft);
      if (!emailLike(email)) {
        setToast("Enter a valid email address.");
        return false;
      }
      if (hasPlus(email)) {
        setToast("Backup email cannot include '+' aliases.");
        return false;
      }

      // IMPORTANT: do NOT open the SMS dialog yet.
      // We only open it in setSecondary.onSuccess (after password is correct).
      setSecondary.mutate({ email, current_password: pw, method: addMethod });
    } else if (pwdAction === "swap") {
      swapPrimary.mutate({ current_password: pw });
    }

    setPwdOpen(false);
    setPwdAction(null);
    return true;
  };

  const handleSmsConfirm = (data: any) => {
    const code = ((data?.code ?? "") as string).replace(/\D/g, "").slice(0, 6);
    if (!code || code.length !== 6) {
      setToast("Enter the 6-digit code.");
      return false; // keep the alert open
    }
    approveSms.mutate({ code });
    return true;
  };

  // pending overlay (no full screen swap)
  const pageBusy = setSecondary.isPending || swapPrimary.isPending;

  // ----- Initial-loading screen (first mount only) -----
  if (isInitialLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar className="modal-title">
            <IonTitle>Email & Recovery</IonTitle>
            <IonButtons slot="end">
              <IonButton disabled>Done</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <div style={{ padding: 16 }}>
            <IonItem lines="full">
              <IonLabel className="ion-text-wrap">
                <span className="settings__field-label">Primary email</span>
                <IonSkeletonText animated style={{ width: "60%", height: 14 }} />
              </IonLabel>
            </IonItem>

            <IonItem lines="none">
              <IonLabel className="ion-text-wrap">
                <span className="settings__field-label">Backup email</span>
                <IonSkeletonText animated style={{ width: "50%", height: 14 }} />
              </IonLabel>
            </IonItem>

            <Pad>
              <IonSkeletonText animated style={{ width: "40%", height: 12, marginBottom: 8 }} />
              <IonSkeletonText animated style={{ width: "30%", height: 36, borderRadius: 8 }} />
            </Pad>

            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <IonSpinner name="dots" />
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // ----- Main UI -----
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="modal-title">
          <IonTitle>Email & Recovery</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => {
                // hard-clear sensitive state before dismissing parent modal
                setPwdOpen(false);
                setPwdAction(null);
                setPwdInput("");
                setSmsOpen(false);
                setSmsCode("");
                onDismiss();
              }}
            >
              Done
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Current status */}
        <IonItem lines="full">
          <IonLabel className="ion-text-wrap">
            <span className="settings__field-label">Primary email</span>
            <span className="settings__field-value">{status?.primary_email}</span>
          </IonLabel>
        </IonItem>

        <IonItem lines="none">
          <IonLabel className="ion-text-wrap">
            <span className="settings__field-label">Backup email</span>
            <span className="settings__field-value">
              {status?.secondary_email ? (
                <>
                  <span>{status?.secondary_email}</span>&nbsp;
                  {verifiedBadge(status?.secondary_email_fully_verified)}
                </>
              ) : (
                <em>None</em>
              )}
            </span>
          </IonLabel>

          {status?.secondary_email && (
            <IonButton
              slot="end"
              fill="clear"
              color="danger"
              onClick={() => {
                if (status?.secondary_email_fully_verified) {
                  setConfirmRemoveOpen(true);
                } else {
                  // If not verified, remove immediately
                  clearSecondary.mutate();
                }
              }}
            >
              Remove
            </IonButton>
          )}
        </IonItem>

        {needsRecheck && (
          <Pad>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "24px 1fr",
                rowGap: 8,
                columnGap: 8,
                alignItems: "center",
              }}
            >
              <IonIcon
                icon={status?.secondary_email_approved ? checkmarkCircle : closeCircle}
                color={status?.secondary_email_approved ? "success" : "medium"}
              />
              <div>Approved by primary email or phone number</div>

              <IonIcon
                icon={status?.secondary_email_validated ? checkmarkCircle : closeCircle}
                color={status?.secondary_email_validated ? "success" : "medium"}
              />
              <div>Validated that backup email can receive messages</div>
            </div>

            <IonButton
              size="small"
              fill="clear"
              onClick={() => statusQuery.refetch()}
              disabled={statusQuery.isFetching}
              slot="end"
            >
              {statusQuery.isFetching ? (
                <IonSpinner name="dots" />
              ) : (
                <>
                  <IonIcon icon={refreshOutline} slot="start" />
                  Recheck status
                </>
              )}
            </IonButton>
          </Pad>
        )}

        {/* Add backup (password-first) */}
        {!status?.secondary_email && (
          <>
            <IonItem lines="none">
              <IonLabel position="stacked" style={isPlatform('android') ? { paddingBottom: '15pt' } : undefined}>Add a backup email</IonLabel>
              <IonInput
                className="whitebox"
                inputMode="email"
                type="email"
                value={secondaryDraft}
                placeholder="youremail@example.com"
                onIonInput={(e) => setSecondaryDraft(e.detail.value!)}
              />
            </IonItem>

            {secondaryDraft && hasPlus(secondaryDraft) && (
              <Pad>
                <IonNote color="danger">Backup email cannot include '+' aliases.</IonNote>
              </Pad>
            )}

            {aliasOfPrimary && (
              <Pad>
                <IonNote color="danger">
                  Backup email can't be the same as your primary or “+” alias.
                </IonNote>
              </Pad>
            )}

            <Pad>
              <IonNote>Verification method</IonNote>
              <IonSegment
                value={addMethod}
                onIonChange={(e) => setAddMethod((e.detail.value as any) || "email")}
              >
                <IonSegmentButton value="email">
                  <IonLabel>Email</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="sms">
                  <IonLabel>SMS</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </Pad>

            <Pad>
              <IonButton
                expand="block"
                disabled={addDisabled || setSecondary.isPending}
                onClick={() => {
                  // ALWAYS ask for password before adding (even right after removal)
                  setPwdAction("add");
                  setPwdInput("");
                  reopenPwdAlertFresh();
                  setPwdOpen(true);
                }}
              >
                {setSecondary.isPending ? <IonSpinner name="dots" /> : "Send approval"}
              </IonButton>
            </Pad>
          </>
        )}

        {/* Swap to primary (password-first) */}
        <Pad>
          <IonNote>
            You can make your verified backup the new primary. You'll sign in with the new primary
            afterwards.
          </IonNote>
        </Pad>
        <Pad>
          <IonButton
            expand="block"
            disabled={
              swapDisabled ||
              swapPrimary.isPending ||
              !status?.secondary_email ||
              !status?.secondary_email_fully_verified
            }
            onClick={() => {
              setPwdAction("swap");
              setPwdInput("");
              reopenPwdAlertFresh();
              setPwdOpen(true);
            }}
          >
            {swapPrimary.isPending ? <IonSpinner name="dots" /> : "Switch backup to primary"}
          </IonButton>
        </Pad>
      </IonContent>

      {/* Password dialog used by both actions */}
      <IonAlert
        key={pwdAlertKey} // force fresh mount each time to avoid sticky value
        isOpen={pwdOpen}
        header="Confirm password"
        backdropDismiss={false}
        inputs={[
          {
            name: "password",
            type: "password",
            placeholder: "Your current password",
            // do not control `value` to let alert start with a clean field
          },
        ]}
        buttons={[
          { text: "Cancel", role: "cancel" },
          {
            text: "Confirm",
            handler: (data) => {
              const ok = handlePasswordConfirm(data);
              if (ok) setPwdInput(""); // clear after a successful submit
              return ok;
            },
          },
        ]}
        onDidDismiss={() => {
          setPwdOpen(false);
          setPwdAction(null);
          setPwdInput("");
        }}
      />

      <IonAlert
        key={smsAlertKey} // force fresh mount only when actually opened
        isOpen={smsOpen}
        header="Enter SMS code"
        message={`We texted a 6-digit code to your phone number ending in ••${lastTwoDigits || "??"}`}
        backdropDismiss={false}
        inputs={[
          {
            name: "code",
            type: "text",
            placeholder: "######",
            value: smsCode,
            attributes: { inputmode: "numeric", maxlength: 6 },
          },
        ]}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
            handler: (data) => {
              const raw = (data?.code ?? "") as string;
              const code = raw.replace(/\D/g, "").slice(0, 6);
              // if empty/short, require an extra "are you sure?"
              if (!code || code.length < 6) {
                setConfirmSmsExitOpen(true);
                return false; // keep the SMS alert open until user confirms
              }
              // otherwise allow close (user typed something but decided to cancel)
              setSmsOpen(false);
              setSmsCode("");
              return true;
            },
          },
          {
            text: approveSms.isPending ? "Verifying…" : "Verify",
            handler: (data) => {
              const ok = handleSmsConfirm(data);
              if (ok) setSmsCode("");
              return ok;
            },
          },
        ]}
        onDidDismiss={() => {
          if (!approveSms.isPending) {
            setSmsOpen(false);
            setSmsCode("");
          }
        }}
      />

      {/* Extra confirmation when trying to dismiss SMS without entering a code */}
        <IonAlert
        isOpen={confirmSmsExitOpen}
        header="Are you sure you want to close without verifying?"
        message=""
        backdropDismiss={false}
        buttons={[
            {
            text: "Close",               
            role: "cancel",
            handler: () => {
                setConfirmSmsExitOpen(false);
                setSmsOpen(false);
                setSmsCode("");
            },
            },
            {
            text: "Verify",              
            handler: () => {
                setConfirmSmsExitOpen(false);
                reopenSmsAlertFresh();
                setSmsOpen(true);
            },
            },
        ]}
        />

      {/* Confirm removal for verified backup */}
      <IonAlert
        isOpen={confirmRemoveOpen}
        header="Remove backup email?"
        message="Are you sure? You'll need to add and verify a new backup email from scratch."
        buttons={[
          { text: "No", role: "cancel", handler: () => setConfirmRemoveOpen(false) },
          {
            text: "Yes",
            handler: () => {
              setConfirmRemoveOpen(false);
              clearSecondary.mutate();
            },
          },
        ]}
        onDidDismiss={() => setConfirmRemoveOpen(false)}
      />

      <IonToast
        isOpen={!!toast}
        message={toast ?? ""}
        duration={2500}
        onDidDismiss={() => setToast(null)}
        cssClass={"status-toast"}
      />

      {/* Small overlay for pending actions (avoids full-screen reload) */}
      <IonLoading isOpen={pageBusy} message="Loading..." backdropDismiss={false} />
    </IonPage>
  );
};

export default EmailSettingsModal;

const Pad: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding: "8px 16px" }}>{children}</div>
);
