import { IonPage } from "@ionic/react";
import "./Loading.css"

const Loading: React.FC = () => {

    return (
        <IonPage class="sls">
            <img alt="loading-page" src={"../static/img/loading-refresh-faster.gif"}></img>
        </IonPage>
    )

}
  
export default Loading;
  