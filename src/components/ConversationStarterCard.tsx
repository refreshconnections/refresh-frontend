import { IonButton, IonCard, IonCardSubtitle, IonCardTitle, IonItem, IonLabel, IonRow } from "@ionic/react";
import "./ConversationStarterCard.css"
import { useState } from "react";

type Props = {
    their_conversation_starter_text: string
    their_name: string
    your_conversation_starter_text: string | null
    
};

const ConversationStarterCard: React.FC<Props> = ({their_conversation_starter_text, their_name, your_conversation_starter_text}) => {

    const [showSelfConversationStarter, setShowSelfConversationStarter] = useState<boolean>(false)

    return (
        <IonRow class="convo-starter">
        <IonCard className="ion-padding" color="white">
            <h6>No one has started the chat yet!</h6>
            <p>In situations like this, {their_name} has chosen a prompt that could help get the conversation going: </p>
            <IonItem class="incoming">
            <IonLabel class="ion-text-wrap the-actual-message">{their_conversation_starter_text}</IonLabel>
            </IonItem>
            
        </IonCard>
        <IonCard style={{boxShadow: "none", width: "100%", marginTop: 0, marginBottom: 0}}>
        {your_conversation_starter_text ?
            <>
            <IonRow class="ion-justify-content-center">
                                <IonButton size="small" fill="outline" onClick={() => setShowSelfConversationStarter(showSelfConversationStarter ? false : true)}>
                                    {showSelfConversationStarter ? "Hide my conversation starter" : "What's my conversation starter?"}
                                </IonButton>
            </IonRow>
            {showSelfConversationStarter &&
            <IonCard class="ion-padding" color="white">
            <p>You've chosen a conversation starter too! {their_name} might respond to this prompt: </p>
            <IonItem class="outgoing">
            <IonLabel class="ion-text-wrap the-actual-message-but-small">{your_conversation_starter_text}</IonLabel>
            </IonItem>
            </IonCard>
            }
            </>
            :
            <IonRow class="ion-text-center">
            <p>By the way, you haven't chosen a conversation starter! You can turn this on in the Me tab &gt; Settings &gt; Chat preferences.</p>
            </IonRow>
            }
        </IonCard>
        </IonRow>
    )

}
  
export default ConversationStarterCard;