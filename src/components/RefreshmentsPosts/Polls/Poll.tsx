import React, { useEffect, useState } from 'react';
import { IonBadge, IonButton, IonItem, IonLabel, IonList, IonNote, IonRow, IonSpinner } from '@ionic/react';
import { motion } from 'motion/react';
import { useGetStaticPoll } from '../../../hooks/api/polls/static-poll';
import { useGetDynamicPoll } from '../../../hooks/api/polls/dynamic-poll';
import PollOptionItem from './PollOptionItem';

import './Poll.css'
import { voteOnPoll } from '../../../hooks/utilities';
import { useQueryClient } from '@tanstack/react-query';
import moment from 'moment';

type PollProps = {
    id: number;
};



const Poll: React.FC<PollProps> = ({ id }) => {

    const { data: pollDetails, isLoading: pollDetailsisLoading } = useGetStaticPoll(id);
    const { data: pollVotes, isLoading: pollVotesIsLoading } = useGetDynamicPoll(id);
    const queryClient = useQueryClient()


    const vote = async (optionid) => {

        await voteOnPoll(optionid)
        queryClient.invalidateQueries({ queryKey: ['poll-dynamic', id] })

    }

    const [showResults, setShowResults] = useState(false)

    useEffect(() => {

        let show = false

        if (new Date() > new Date(pollDetails?.close_date)) {
            show = true
        }
        else if (pollVotes?.user_vote !== null && pollVotes?.total_votes >= pollDetails?.show_votes_after_x_votes) {
            show = true
        }
        setShowResults(show)

    }, [pollVotes?.user_vote, pollVotes?.total_votes, pollDetails?.show_votes_after_x_votes, pollDetails?.close_date])


    return (
        <IonRow className="poll" style={{ display: "flex", flexDirection: "column" }}>
            <p style={{ fontWeight: "bold", fontSize: "13pt" }}>{pollDetails?.question}</p>
            {pollVotesIsLoading ?
                <IonRow className="ion-justify-content-center"><IonSpinner name="dots"></IonSpinner></IonRow>
                :

                <>
                    {(!showResults && pollVotes?.user_vote !== null) && <IonRow className="ion-padding">
                        <IonNote color="primary" className="ion-text-center">Thanks for voting! This poll displays results after {pollDetails?.show_votes_after_x_votes - pollVotes?.total_votes} more votes. Remind your connections to vote, and check back soon!</IonNote></IonRow>}
                    <div className="poll-list" style={{ flex: "0 0 auto" }}>
                        <ul className="poll-ul">
                            {(showResults) ?


                                pollVotes?.options_with_votes.map((pollOption: any, index: number) => (
                                    <li key={index}>

                                        <PollOptionItem showResults={showResults} userVote={pollVotes?.user_vote == pollOption.id} optionText={pollOption?.option_text} votePercentage={pollOption?.vote_percentage} isWinner={pollOption?.is_winner}>
                                        </PollOptionItem>
                                    </li>))

                                :
                                pollDetails?.options.map((pollOption: any, index: number) => (
                                    <li key={index}>

                                        <IonButton expand="block" className="ion-text-wrap" disabled={(!showResults && pollVotes?.user_vote !== null)} onClick={async () => await vote(pollOption.id)}>
                                            {pollOption.option_text}
                                        </IonButton>

                                    </li>))}

                        </ul>
                    </div>
                    {showResults &&
                        <IonRow style={{ width: "100%", display: "flex" }} className="ion-justify-content-end">
                            <IonNote>
                                {pollDetails?.show_number_of_votes ? pollVotes?.total_votes + " votes • " : ""}
                                {moment().isAfter(moment(pollDetails?.close_date))
                                    ? `Closed ${moment(pollDetails?.close_date).fromNow()}`
                                    : `Closes ${moment(pollDetails?.close_date).fromNow()}`}
                            </IonNote>
                        </IonRow>}
                </>
            }
        </IonRow>
    );
};

export default Poll;
