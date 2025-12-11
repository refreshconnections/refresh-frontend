import { IonPage } from "@ionic/react";
import "./Loading.css"

const Loading: React.FC = () => {
    return (
        <IonPage className="loading-page">
            <div className="loading-page__content">
                <img alt="loading-page" src={"../static/img/loading-refresh-faster.gif"} />
            </div>
        </IonPage>
    );
};
  
export default Loading;
  
