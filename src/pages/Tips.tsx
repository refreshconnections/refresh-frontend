import { IonContent, IonPage, IonFab, IonFabButton, IonIcon, IonCard, IonCardContent, IonText, IonNote, IonButton, IonRow, IonSpinner } from '@ionic/react';
import React from 'react';
import { chevronBackOutline } from 'ionicons/icons';
import { useGetDailyTip } from '../hooks/api/tips';

type TipsProps = {
    onDismiss?: () => void;
};

const Tips: React.FC<TipsProps> = ({ onDismiss }) => {
    const { data: tip, isPending } = useGetDailyTip();

    return (
        <IonPage>
            <IonContent>
                <IonFab className="very-top" slot="fixed" vertical="top" horizontal="start">
                    <IonFabButton
                        onClick={onDismiss}
                        routerLink={!onDismiss ? '/me' : undefined}
                        routerDirection={onDismiss ? undefined : 'back'}
                        color="light"
                    >
                        <IonIcon icon={chevronBackOutline} />
                    </IonFabButton>
                </IonFab>

                {isPending ? (
                    <IonRow className="ion-justify-content-center ion-padding">
                        <IonSpinner name="bubbles" />
                    </IonRow>
                ) : tip ? (
                    <IonCard style={{ margin: '70px 16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 16px 0' }}>
                            <img src="../static/img/refresh-icon@3x.png" alt="Refresh Connections" style={{ width: '36px', height: '36px' }} />
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.5 }}>Refresh Connections</div>
                                <div style={{ fontSize: '13px', fontWeight: 600 }}>Tip of the Day</div>
                            </div>
                        </div>
                        <IonCardContent>
                            <IonText><h2 style={{ marginTop: '4px' }}>{tip.title}</h2></IonText>
                            <IonNote className="ion-text-wrap" style={{ display: 'block', marginTop: '6px' }}>{tip.description}</IonNote>
                            {tip.link && (
                                <IonButton fill="outline" size="small" style={{ marginTop: '10px' }} href={tip.link} target="_blank" rel="noopener noreferrer">
                                    {tip.link_name || 'Learn more'}
                                </IonButton>
                            )}
                        </IonCardContent>
                    </IonCard>
                ) : null}
            </IonContent>
        </IonPage>
    );
};

export default Tips;
