import React, { useMemo, useState } from "react";
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
} from "@ionic/react";
import { useQueryClient } from "@tanstack/react-query";
import {
    useEmailStatus,
    useSetSecondaryEmail,
    useApproveSecondarySms,
    useSwapPrimaryEmail,
    useClearSecondaryEmail,
} from "../hooks/api/account/emails";
import { checkmarkCircle, closeCircle } from "ionicons/icons";

type Props = { onDismiss: () => void };

// helpers
const normalize = (s: string) => (s || "").trim().toLowerCase();
const localPart = (email: string) => normalize(email).split("@", 1)[0];
const hasPlus = (email: string) => localPart(email).includes("+");
const emailLike = (s: string) => /.+@.+\..+/.test(s);

const ManageEmailsModal: React.FC<Props> = ({ onDismiss }) => {
    const qc = useQueryClient();

    // local UI state
    const [addMethod, setAddMethod] = useState<"email" | "sms">("email");
    const [secondaryDraft, setSecondaryDraft] = useState("");
    const [smsCode, setSmsCode] = useState("");
    const [toast, setToast] = useState<string | null>(null);

    // password-first dialog state
    const [pwdOpen, setPwdOpen] = useState(false);
    const [pwdAction, setPwdAction] = useState<"add" | "swap" | null>(null);

    // data
    const statusQuery = useEmailStatus();
    const status = statusQuery.data;

    // mutations
    const setSecondary = useSetSecondaryEmail({
        onSuccess: (msg) => {
            setToast(msg || "Approval sent.");
            qc.invalidateQueries({ queryKey: ["account", "email-status"] });
        },
        onError: (err) => setToast(err || "Could not add secondary."),
    });

    const approveSms = useApproveSecondarySms({
        onSuccess: (msg) => {
            setToast(msg || "Secondary approved.");
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
            setToast("Secondary removed.");
            qc.invalidateQueries({ queryKey: ["account", "email-status"] });
        },
        onError: (err) => setToast(err || "Could not remove secondary."),
    });

    // derived
    const addDisabled = useMemo(() => {
        if (!emailLike(secondaryDraft)) return true;
        if (hasPlus(secondaryDraft)) return true; // enforce: no '+'
        return false;
    }, [secondaryDraft]);

    const swapDisabled = useMemo(() => !status?.secondary_email_validated, [
        status?.secondary_email_validated,
    ]);

    const verifiedBadge = (ok?: boolean) => (
        <IonBadge color={ok ? "success" : "medium"}>
            {ok ? "Verified" : "Not verified"}
        </IonBadge>
    );

    // password dialog handler
    const handlePasswordConfirm = (data: any) => {
        console.log("HEWO")
        const pw = (data?.password ?? "").toString();
        if (!pw) return false; // keep alert open
        console.log("HEWO2")

        if (pwdAction === "add") {
            // re-check basic client-side constraints; server remains source of truth
            const email = normalize(secondaryDraft);
            console.log("email", email)

            if (!emailLike(email)) {
                setToast("Enter a valid email address.");
                return false;
            }
            if (hasPlus(email)) {
                setToast("Secondary email cannot include '+' aliases.");
                return false;
            }
            console.log("here", email)
            setSecondary.mutate({ email, current_password: pw, method: addMethod });
        } else if (pwdAction === "swap") {
            swapPrimary.mutate({ current_password: pw });
        }

        setPwdOpen(false);
        setPwdAction(null);
        return true;
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar className="modal-title">
                    <IonTitle>Email & Recovery</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onDismiss}>Done</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent className="edit-modal">
                {/* Current status */}
                <IonItem lines="full">
                    <IonLabel className="ion-text-wrap">
                        <div style={{ fontSize: 17, fontWeight: 600 }}>Primary email</div>
                        <div>
                            {statusQuery.isLoading ? (
                                <IonSpinner name="dots" />
                            ) : (
                                status?.primary_email
                            )}
                        </div>
                    </IonLabel>
                </IonItem>

                <IonItem lines="none">
                    <IonLabel className="ion-text-wrap">
                        <div style={{ fontSize: 17, fontWeight: 600 }}>Backup email</div>
                        <div>
                            {statusQuery.isLoading ? (
                                <IonSpinner name="dots" />
                            ) : status?.secondary_email ? (
                                <>
                                    <span>{status?.secondary_email}</span>&nbsp;
                                    {verifiedBadge(status?.secondary_email_verified
                                    )}
                                </>
                            ) : (
                                <em>None</em>
                            )}
                        </div>
                    </IonLabel>
                    {status?.secondary_email && (
                        <IonButton
                            slot="end"
                            fill="clear"
                            color="danger"
                            onClick={() => clearSecondary.mutate()}
                        >
                            Remove
                        </IonButton>
                    )}
                </IonItem>

                {status?.secondary_email && !(
                    status?.secondary_email_verified ??
                    (status?.secondary_email_approved && status?.secondary_email_validated)
                ) && (
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
                                <div>Approved by primary</div>

                                <IonIcon
                                    icon={status?.secondary_email_validated ? checkmarkCircle : closeCircle}
                                    color={status?.secondary_email_validated ? "success" : "medium"}
                                />
                                <div>Validated that can receive messages</div>
                            </div>
                        </Pad>
                    )}


                {/* Add secondary (password-first) */}
                {!status?.secondary_email &&
                    <>
                        <SectionTitle title="Add a secondary email" />
                        <IonItem>
                            <IonLabel position="stacked">Backup email</IonLabel>
                            <input
                                inputMode="email"
                                type="email"
                                value={secondaryDraft}
                                placeholder="youremail@example.com"
                                onChange={(e) => setSecondaryDraft((e.target as HTMLInputElement).value || "")}
                                style={{
                                    border: "1px solid var(--ion-color-medium, #ccc)",
                                    borderRadius: 8,
                                    padding: "10px 12px",
                                    width: "100%",
                                }}
                            />
                        </IonItem>
                        {secondaryDraft && hasPlus(secondaryDraft) && (
                            <Pad>
                                <IonNote color="danger">
                                    Backup email cannot include '+' aliases.
                                </IonNote>
                            </Pad>
                        )}


                        <Pad>
                            <IonNote>
                                Verification method
                            </IonNote>
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
                                    setPwdAction("add");
                                    setPwdOpen(true);
                                }}
                            >
                                {setSecondary.isPending ? <IonSpinner name="dots" /> : "Send approval"}
                            </IonButton>
                        </Pad>

                        {/* SMS approval input (inline) */}
                        {status?.secondary_email && !status?.secondary_email_validated && (
                            <>
                                <Pad>
                                    <IonItem>
                                        <IonLabel position="stacked">Enter SMS code</IonLabel>
                                        <input
                                            inputMode="numeric"
                                            type="text"
                                            maxLength={6}
                                            placeholder="123456"
                                            value={smsCode}
                                            onChange={(e) =>
                                                setSmsCode(
                                                    ((e.target as HTMLInputElement).value || "")
                                                        .replace(/\D/g, "")
                                                        .slice(0, 6)
                                                )
                                            }
                                            style={{
                                                border: "1px solid var(--ion-color-medium, #ccc)",
                                                borderRadius: 8,
                                                padding: "10px 12px",
                                                width: "100%",
                                            }}
                                        />
                                    </IonItem>
                                </Pad>
                                <Pad>
                                    <IonButton
                                        expand="block"
                                        disabled={!smsCode || approveSms.isPending}
                                        onClick={() => approveSms.mutate({ code: smsCode })}
                                    >
                                        {approveSms.isPending ? (
                                            <IonSpinner name="dots" />
                                        ) : (
                                            "Approve via SMS"
                                        )}
                                    </IonButton>
                                </Pad>
                            </>
                        )}
                    </>
                }

                {/* Swap to primary (password-first) */}
                <SectionTitle title="Swap to primary" />
                <Pad>
                    <IonNote>
                        You can make your verified backup the new primary. You'll sign in
                        with the new primary afterwards.
                    </IonNote>
                </Pad>
                <Pad>
                    <IonButton
                        expand="block"
                        disabled={swapDisabled || swapPrimary.isPending || !status?.secondary_email || !status?.secondary_email_validated}
                        onClick={() => {
                            setPwdAction("swap");
                            setPwdOpen(true);
                        }}
                    >
                        {swapPrimary.isPending ? (
                            <IonSpinner name="dots" />
                        ) : (
                            "Switch backup to primary"
                        )}
                    </IonButton>
                </Pad>

            </IonContent>


            {/* Password dialog used by both actions */}
            <IonAlert
                isOpen={pwdOpen}
                header="Confirm password"
                inputs={[{ name: "password", type: "password", placeholder: "Your current password" }]}
                buttons={[
                    { text: "Cancel", role: "cancel" },
                    { text: "Confirm", handler: handlePasswordConfirm },
                ]}
                onDidDismiss={() => {
                    setPwdOpen(false);
                    setPwdAction(null);
                }}
            />
        </IonPage>
    );
};

export default ManageEmailsModal;

// presentational helpers
const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <div style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700, opacity: 0.75 }}>
        {title}
    </div>
);

const Pad: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{ padding: "8px 16px" }}>{children}</div>
);
