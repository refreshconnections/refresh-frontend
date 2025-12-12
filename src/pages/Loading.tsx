import { IonContent, IonPage } from "@ionic/react";
import "./Loading.css"

const Loading: React.FC = () => {
    return (
        <IonPage className="loading-page">
            <IonContent className="loading-page__content" fullscreen>
                <div className="loading-page__inner">
                    <img alt="loading-page" src={"../static/img/arrowload.gif"} />
                </div>
            </IonContent>
        </IonPage>
    );
};
  
export default Loading;
  
