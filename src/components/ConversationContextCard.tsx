import { IonCard, IonCardSubtitle, IonCardTitle, IonItem, IonLabel, IonNote, IonRow } from "@ionic/react";
import "./ConversationStarterCard.css"

type Props = {
    their_conversation_starter_text: string
    their_name: string
    your_conversation_starter_text: string | null
    
};

const ConversationContextCard: React.FC<Props> = ({their_conversation_starter_text, their_name, your_conversation_starter_text}) => {

    return (
        <IonRow className="convo-starter">
        <IonCard color="white" className="ion-padding">
            <h6>When no messages have been sent yet, people can choose to respond to a pre-selected "Conversation starter."</h6>
        {your_conversation_starter_text ?
            <>
            <p>You have a conversation starter set up. {their_name} might have responded to this prompt you selected: </p>
            <IonItem className="outgoing">
            <IonLabel className="ion-text-wrap the-actual-message">{your_conversation_starter_text}</IonLabel>
            </IonItem>
            </>
            :
            <p>You don't currently have a conversation starter set up. You can add one in the Me tab &gt; Settings &gt; Chat preferences!</p>
            }
        {their_conversation_starter_text ?
            <>
            <p>You might have responded to {their_name}'s current conversation starter, which is:</p>
            <IonItem className="incoming">
            <IonLabel className="ion-text-wrap the-actual-message">{their_conversation_starter_text}</IonLabel>
            </IonItem>
            </>
            :
            <p>{their_name} doesn't currently have a conversation starter set up.</p>
            }

        <IonRow className="ion-padding">
        <IonNote >*Conversation starters can be changed at any time, so these messages might not be about either! Just ask your chat partner -- it's another way to get the conversation going!</IonNote>
        </IonRow>
        </IonCard>
        </IonRow>
    )

}
  
export default ConversationContextCard;