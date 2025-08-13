import { IonButton, IonContent,  IonHeader, IonInput, IonItem, IonLabel, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useState } from 'react';


const PasswordReset: React.FC = () => {


    const [newpassword, setNewPassword] = useState<string>()
    const [newpassword2, setNewPassword2] = useState<string>()

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Let's reset your password</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <form className="ion-padding">
                <IonItem>
                        <IonLabel position="floating">New Password</IonLabel>
                        <IonInput value={newpassword}
                            name="newpassword"
                            onIonChange={e => setNewPassword(e.detail.value!)}
                            type="text" />
                    </IonItem>
                    <IonItem>
                        <IonLabel position="floating">New Password (again)</IonLabel>
                        <IonInput value={newpassword2}
                            name="newpassword2"
                            onIonChange={e => setNewPassword2(e.detail.value!)}
                            placeholder="Repeat your new password"
                            type="text" />
                    </IonItem>
                    <IonButton className="ion-margin-top" onClick={()=>alert("hi")} expand="block">
                       Reset your password
                    </IonButton>
                </form>
            </IonContent>
        </IonPage>
    );

};

export default PasswordReset;
