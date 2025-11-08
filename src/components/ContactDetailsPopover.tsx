import { IonText, IonButton, IonIcon, IonPopover, IonList, IonItem } from "@ionic/react";
import { informationCircle } from "ionicons/icons";

const ContactDetailsPopover: React.FC = () => {
    return (
        <>
            <IonText color="danger">
                <p style={{ margin: 0 }}>
                    <IonButton
                        id="contact-help-trigger"
                        fill="clear"
                        size="small"
                        color="navy"
                        aria-label="How to share contact details safely"
                    >
                        <IonIcon icon={informationCircle} slot="start" />
                        How to share contact details safely
                    </IonButton>
                </p>
            </IonText>

            <IonPopover trigger="contact-help-trigger" showBackdrop dismissOnSelect side="left" alignment="center">
                <IonList lines="none" className="ion-padding">
                    <IonItem className="ion-text-wrap">
                        <div>
                            <h3 style={{ marginTop: 0, marginBottom: 8 }}>How to share contact details</h3>
                            <p style={{ margin: 0 }}>
                                For everyone's safety and privacy, you can't share personal contact info including emails, phone numbers,
                                and addresses in the public forum. Please use the <b>Connect from Refreshments</b> feature to be able to send Likes
                                and connect with others privately, where you can choose to share off-app contact information in direct messages once
                                both members are ready.
                            </p>
                            <br></br>
                            <p style={{ margin: 0 }}>To turn on Connect from Refreshments, head to your Settings (in the Me tab).</p>
                        </div>
                    </IonItem>
                </IonList>
            </IonPopover>
        </>
    )
}

export default ContactDetailsPopover;