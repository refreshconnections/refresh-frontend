import React, { useEffect, useState } from "react";

import { IonRow, IonCheckbox, IonItem, IonLabel } from '@ionic/react';

import './Participated.css'
import { markParticipated, unmarkParticipated } from "../../hooks/utilities";
import { useGetCurrentProfile } from "../../hooks/api/profiles/current-profile";
import { useQueryClient } from "@tanstack/react-query";



type Props = {
    campaign_id: number
};

const mark = async (campaign_id: number) => {
    const response = await markParticipated(campaign_id)
    return response
}

const unmark = async (campaign_id: number) => {
    const response = await unmarkParticipated(campaign_id)
    return response
}

const Participated: React.FC<Props> = (props) => {

    const {campaign_id} = props

    const currentUserProfile = useGetCurrentProfile().data;
    const queryClient = useQueryClient()

    const [participated, setParticipated] = useState(false)

    useEffect(()=> {

        setParticipated(currentUserProfile?.participated_in?.includes(campaign_id))

    }, [currentUserProfile, campaign_id])

    const markOrUnMark = async (event: any) => {
        if (campaign_id) {
            if (!event.detail.checked) {
                await unmark(campaign_id)
                queryClient.invalidateQueries({ queryKey: ['current'] })
                setParticipated(false)
            }
            else {
                await mark(campaign_id)
                queryClient.invalidateQueries({ queryKey: ['current'] })
                setParticipated(true)
            }
        }

    }
    

    return (
        <>
        {currentUserProfile ?
       
        <IonRow className="participated">
            <IonItem lines="none" color="white">
            <IonCheckbox checked={participated} onIonChange={async e => markOrUnMark(e)}></IonCheckbox>
            <IonLabel> &nbsp; I participated in this.</IonLabel>
            </IonItem>
        </IonRow>
        : <></>}
      </>
    )
};

export default Participated;