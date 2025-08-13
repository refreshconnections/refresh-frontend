import React, { useEffect, useRef, useState } from "react";
// import { FiLogIn } from "react-icons/fi";
// import myConfig from "../../configs";
// import { ToastContainer, toast } from "react-toastify";
import { IonContent, IonHeader, IonTitle, IonToolbar, IonLabel, IonInput, IonButton, IonItem, IonModal, IonButtons, IonNote, IonAlert, IonPage, IonTextarea, IonSelect, IonSelectOption } from '@ionic/react';
import Cookies from 'js-cookie';

import './CreatePostModal.css'
import { createGroupMessage, getMutualConnections } from "../hooks/utilities";

type Props = {
    onDismiss: () => void;
};

interface Group {
    group_name?: string,
    description?: string | null,
    requested_members?: number[] | null
}
const CreateGroupModal: React.FC<Props> = (props) => {

    const { onDismiss } = props;

    const modal = useRef<HTMLIonModalElement>(null);

    const [groupName, setGroupName] = useState<string>("");
    const [description, setDescription] = useState<string | null>(null);
    const [requestedMembers, setRequestedMembers] = useState([]);
    const [errors, setErrors] = useState<string[]>([]);

    const [mutuals, setMutuals] = useState<any>(null);

    const [showAlert, setShowAlert] = useState(false)

    function postSubmitSuccessful() {
        onDismiss();
    }


    useEffect(() => {


        const fetchData = async () => {

            try {
                setMutuals(await getMutualConnections());
            } catch (error: any) {
                console.log(error)
            }

        }

        fetchData()

    }, []);

    const csrftoken = Cookies.get('csrftoken');

    function formData() {
        const form_data: Group = {}

        console.log("requested members", requestedMembers)

        form_data.group_name = groupName;
        form_data.description = description;
        form_data.requested_members = requestedMembers;

        return form_data;
    }

    async function handlePostSubmit(e: any) {
        e.preventDefault();

        setErrors([])
        try {
            await createGroupMessage(formData())
            postSubmitSuccessful()
        }
        catch (error: any) {
            const errorsList: string[] = []
            console.log(error.response.data)
            if (error.response.data["group_name"]?.length > 0){
                error.response.data["group_name"].forEach((element: any) => {
                    errorsList.push("Group name: " + element["message"])
                })
            }
            if (error.response.data['description']?.length > 0) {
                error.response.data["description"].forEach((element: any) => {
                    errorsList.push("Description: " + element["message"])
                })
            }
            else {
                if (errorsList.length == 0) {
                    errorsList.push("Something went wrong.")
                }
            }
            setErrors(errorsList)
        }

    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar class="modal-title">
                    <IonTitle>Create Group</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onDismiss}>Cancel</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonAlert
                    isOpen={showAlert}
                    onDidDismiss={postSubmitSuccessful}
                    header="Your group has been created! Invites have been sent to the members you added."
                    buttons={['OK']}
                />
                <form className="ion-padding" onSubmit={handlePostSubmit}>
                    <IonItem>
                        <IonLabel position="stacked">Group Name</IonLabel>
                        <IonInput value={groupName}
                            name="group_name"
                            placeholder="Group Name"
                            onIonChange={e => setGroupName(e.detail.value!)}
                            type="text" 
                            autoCapitalize='words'/>
                    </IonItem>
                    <IonItem>
                        <IonLabel position="stacked">Description</IonLabel>
                        <IonInput value={description}
                            name="description"
                            placeholder="What's this group all about?"
                            onIonChange={e => setDescription(e.detail.value!)}
                            type="text" 
                            autoCapitalize='sentences'/>
                            
                    </IonItem>
                    <IonItem>
                        <IonLabel position="stacked">Members</IonLabel>
                        <IonSelect aria-label="Invite Members" placeholder="Select everyone you want to invite" multiple={true} onIonChange={e => setRequestedMembers(e.detail.value!)}>
                            {mutuals?.map((item: any, index: number) => (
                                <IonSelectOption key={index} value={item.user}>{item.name + " - Age: " + item.age}</IonSelectOption>
                            ))
                            }
                        </IonSelect>
                    </IonItem>
                    <IonButton className="ion-margin-top" type="submit" expand="block">
                        Start Group
                    </IonButton>
                    {errors && errors.length > 0 ? <IonNote color="danger">Errors:</IonNote> : null}
                    {errors?.map((message: string, index: number) =>
                        <div key={index}>
                            <IonNote >{message}</IonNote>
                        </div>
                    )}
                </form>
            </IonContent>
        </IonPage>
    )
};

export default CreateGroupModal;