import { IonCard } from "@ionic/react";
import "./LoadingCard.css"

const LoadingCard: React.FC = () => {

    return (
        <IonCard className="loading-card ">
            <img alt="loading-page" src={"../static/img/loading-refresh-faster.gif"}></img>
        </IonCard>
    )

}
  
export default LoadingCard;