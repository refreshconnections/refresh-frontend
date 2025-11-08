// import { IonContent, IonCard, IonCardContent, IonPage, IonCardTitle, IonButton, IonFab, IonFabButton, IonIcon, IonRow, IonFabList, useIonAlert, useIonModal } from '@ionic/react';
// import ProfileCard from '../components/ProfileCard';
// import React, { useEffect, useMemo, useRef, useState } from 'react'
// import { square as squareIcon, filter as filterIcon, hourglass as hourglassIcon, alert as alertIcon, heartOutline as heartIcon, ellipsisHorizontal as ellipsisIcon, bugOutline as bugIcon } from 'ionicons/icons';

// import "./Page.css"
// import "./Picks.css"

// import { updateOutgoingConnections, updateDismissedConnections, updateBlockedConnections, increaseStreak, isPersonalPlus, sendAnOpener } from '../hooks/utilities';
// import CantAccessCard from '../components/CantAccessCard';
// import LoadingCard from '../components/LoadingCard';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import ReportModal from '../components/ReportModal';
// import AdvancedFilterModal from '../components/AdvancedFilterModal';
// import { faBarsFilter } from '@fortawesome/pro-solid-svg-icons/faBarsFilter';
// import { useQueryClient } from '@tanstack/react-query';
// import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
// import { useGetStatuses } from '../hooks/api/status';
// import StatusToast from '../components/StatusToast';
// import { getPicksWithFiltersFlatFn, usePicksWithFiltersFlat } from '../hooks/api/profiles/picks-with-filters';
// import { getProfileDetailsFn, useProfileDetails, userQueryKeys } from '../hooks/api';
// import { App as CapApp } from "@capacitor/app";
// import { getWithExpiry, removeFromCapacitorLocalStorage, setWithExpiry } from '../hooks/capacitorPreferences/all';
// import { removePickFromCapacitorLocalStorage } from '../hooks/capacitorPreferences/picks';
// import { faCommentHeart } from '@fortawesome/pro-solid-svg-icons';
// import { LikeMessageAlertModal } from './LikeMessageAlertModal';
// import { IconPop } from '../components/IconPop';




// const Picks: React.FC = () => {

//   const [nextLoading, setNextLoading] = useState(false);
//   const [filtersLoading, setFiltersLoading] = useState(false);
//   const [interactedProfiles, setInteractedProfiles] = useState<number[]>([]);

//   const [showMessagePop, setShowMessagePop] = useState(false);


//   const [buttonLoading, setButtonLoading] = useState(false);

//   const [error, setError] = useState<null | string>(null);
//   const [offendingId, setOffendingId] = useState<number | null>(null);
//   const [offendingName, setOffendingName] = useState<string | null>(null);

//   const [index, setIndex] = useState(0);

//   const queryClient = useQueryClient()
//   const { data: filterData, isLoading: filterDataIsLoading, isFetching: filterDataIsFetching } = useGetCurrentProfile()
//   const { data: data, isLoading: picksLoading, isFetching: picksFetching, refetch: picksRefetch } = usePicksWithFiltersFlat();

//   const [reorderedData, setReorderedData] = useState<any[]>([]);
//   const [uninteractedWithData, setUninteractedWithData] = useState<any[]>([]);
//   const [reorderedAndFilteredData, setReorderedAndFilteredData] = useState<any[]>([]);



//   const { data: profileDetails, isLoading: profileDetailsIsLoading, isFetching: profileDetailsIsFetching } = useProfileDetails(reorderedAndFilteredData && reorderedAndFilteredData[index] ? reorderedAndFilteredData[index] : null, true);




//   const lookingForFilterChecked: string[] = filterData?.filter_looking_for;

//   const [presentAlert] = useIonAlert();
//   const [presentfirstFiltersAlert] = useIonAlert();
//   const picksTopRef = useRef<null | HTMLDivElement>(null)

//   const [isToastOpen, setIsToastOpen] = useState<boolean>(false)

//   const statuses = useGetStatuses().data;

//   const delay = (ms: any) => new Promise(res => setTimeout(res, ms));

//   const picksStatus = useMemo(
//     () => statuses?.find(status => {
//       return status.page.includes('picks')
//     }),
//     [statuses]
//   );

//   const isBeforeExpiration = useMemo(
//     () => picksStatus?.active && new Date() < new Date(picksStatus?.expirationDateTime) || !picksStatus?.expirationDateTime,
//     [picksStatus?.expirationDateTime]
//   );

//   useEffect(() => {


//     if (filterData) {


//       if (filterData?.created_profile && !(filterData?.deactivated_profile) && !(filterData?.paused_profile)) {
//         if (filterData?.subscription_level == "pro" && !(filterData?.settings_filter_reminder)) {
//           return
//         }
//         else {
//           firstFiltersAlert()
//         }
//       }

//     }


//   }, []);


//   // When new Picks data is fetched, reorder so the last shown pick is first.
//   useEffect(() => {
//     const reorderTheData = async () => {

//       const lastShownItem = await getWithExpiry('last_shown_pick');


//       if (lastShownItem) {
//         const lastIndex = data?.findIndex((item) => item === lastShownItem);
//         if (lastIndex !== -1) {
//           // Move the last shown item to the top
//           const reordered = [
//             data[lastIndex],
//             ...data.slice(0, lastIndex),
//             ...data.slice(lastIndex + 1),
//           ];
//           setReorderedData(reordered);
//         } else {
//           setReorderedData(data); // No last shown item found, use the filtered data as is
//         }
//       } else {
//         setReorderedData(data); // No last shown item, use the filtered data as is
//       }
//     };

//     if (data) {
//       reorderTheData();
//     }
//   }, [data]);

//   useEffect(() => {

//     if (index < reorderedAndFilteredData?.length - 1) {
//       queryClient.prefetchQuery({ queryKey: ['profiles', 'detail', reorderedAndFilteredData[index + 1]], queryFn: getProfileDetailsFn });
//     }


//   }, [index]);

//   useEffect(() => {

//     if (index == 0 && reorderedAndFilteredData?.length > 1) {
//       queryClient.prefetchQuery({ queryKey: ['profiles', 'detail', reorderedAndFilteredData[index + 1]], queryFn: getProfileDetailsFn });
//     }


//   }, [index, reorderedAndFilteredData]);

//   useEffect(() => {
//     const isSecondToLast = index === reorderedAndFilteredData.length - 2;
//     if (isSecondToLast) {
//       queryClient.prefetchQuery({
//         queryKey: ['picks_with_filters'],
//         queryFn: getPicksWithFiltersFlatFn, // or use the raw fetch fn if available
//       });
//     }
//   }, [index, reorderedAndFilteredData]);

//   // **UseEffect** to handle when index changes and refetch the query with new id
//   useEffect(() => {
//     if (reorderedAndFilteredData?.length > 0 && reorderedAndFilteredData[index] !== null) {
//       // Invalidate the current query and fetch new data for the new `id`
//       queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(reorderedAndFilteredData[index]) });
//     }
//   }, [index, reorderedAndFilteredData, queryClient]);  // Watching index and reorderedData



//   useEffect(() => {

//     setButtonLoading(false)
//     setIndex(0)

//   }, [data, picksFetching]);


//   useEffect(() => {

//     if (index == 0 && reorderedAndFilteredData && reorderedAndFilteredData?.length > 0) {
//       setWithExpiry('last_shown_pick', reorderedAndFilteredData[0], 1000 * 60 * 60 * 24 * 2);
//     }


//   }, [reorderedAndFilteredData]);
// // 
//   useEffect(() => {

//     const handleAlreadyInteractedWith = async () => {

//       // Handle the case of profiles being interacted with before the picks can refetch so they don't get shown the same profiles.
//       for (const id of interactedProfiles) {
//         try {
//           await removePickFromCapacitorLocalStorage(id);
//           console.log(`Removed profile with id ${id} from local storage.`);
//         } catch (error) {
//           console.error(`Failed to remove profile with id ${id} from local storage:`, error);
//         }
//       }
//     }

//     // Filter out the interacted profiles
//     if (interactedProfiles?.length > 0) {
//       const filteredData = reorderedData.filter(item => !interactedProfiles.includes(item));
//       setUninteractedWithData(filteredData)
//     }
//     else {
//       setUninteractedWithData(reorderedData)
//     }

//     if (reorderedData) {
//       handleAlreadyInteractedWith();
//     }


//   }, [reorderedData, interactedProfiles]);


//   useEffect(() => {

//     setReorderedAndFilteredData(uninteractedWithData)


//   }, [uninteractedWithData]);



//   const scrollToTop = () => {

//     picksTopRef.current?.scrollIntoView({
//       behavior: "auto",
//       block: "start"
//     })
//   }

//   const connectActionDoer = async (connection: number, action: "dismiss" | "like" | "block") => {

//     let response = ""

//     if (action == "like") {
//       response = await updateOutgoingConnections(connection)
//     }
//     else if (action == "block") {
//       response = await updateBlockedConnections(connection)
//     }
//     else {
//       response = await updateDismissedConnections(connection)
//     }

//     setInteractedProfiles(prevState => [...prevState, connection]);
//     return response

//   }

//   const [manualRefreshLoading, setManualRefreshLoading] = useState(false);
//   const [hasTriedInitialLoad, setHasTriedInitialLoad] = useState(false);


//   const shouldShowNoProfiles = useMemo(() => {
//     return hasTriedInitialLoad &&
//       !picksLoading &&
//       !profileDetailsIsLoading &&
//       !picksFetching &&
//       !filtersLoading &&
//       !nextLoading &&
//       reorderedAndFilteredData?.length === 0;
//   }, [hasTriedInitialLoad, picksLoading, profileDetailsIsLoading, picksFetching, filtersLoading, nextLoading, reorderedAndFilteredData]);

//   useEffect(() => {
//     if (!picksLoading && !profileDetailsIsLoading && !filtersLoading && !nextLoading && data !== undefined && !manualRefreshLoading) {
//       setHasTriedInitialLoad(true);
//     }
//   }, [picksLoading, profileDetailsIsLoading, filtersLoading, nextLoading, manualRefreshLoading, data]);




//   const [shouldAdvance, setShouldAdvance] = useState(false);


//   const handleNextItem = async (connection: number, action: "dismiss" | "like" | "block") => {

//     const currentProfileId = reorderedAndFilteredData[index];
//     const newIndex = index + 1;

//     setWithExpiry('last_shown_pick', reorderedAndFilteredData[newIndex], 1000 * 60 * 60 * 24 * 2);

//     // Do the server-side update
//     await connectActionDoer(connection, action);
//     scrollToTop();

//     // Remove the dismissed/liked profile locally
//     if (index < reorderedAndFilteredData.length - 1) {
//       const updatedList = reorderedAndFilteredData.filter((id) => id !== currentProfileId);
//       setReorderedAndFilteredData(updatedList);
//     } else {
//       // Trigger background refresh + safe fallback
//       setNextLoading(true);

//       setTimeout(async () => {
//         await connectActionDoer(connection, action); // still do this
//         scrollToTop();
//         await removeFromCapacitorLocalStorage('picks_with_filters');
//         await picksRefetch(); // refetches the new batch
//         setIndex(0); // reset safely
//         setInteractedProfiles([]);
//         setNextLoading(false);
//       }, 250); // short delay to allow render completion
//     }

//     // Trigger the effect that will update index
//     setShouldAdvance(true);
//   };

//   useEffect(() => {
//     if (shouldAdvance && reorderedAndFilteredData.length > 0) {
//       setShouldAdvance(false);
//       setIndex((prevIndex) => {
//         // Reset to 0 if index is now out of bounds
//         return prevIndex >= reorderedAndFilteredData.length ? 0 : prevIndex;
//       });
//       setNextLoading(false);
//     }
//   }, [reorderedAndFilteredData, shouldAdvance]);



//   const addOutgoingConnection = async (connection: number) => {
//     setButtonLoading(true)
//     await handleNextItem(connection, "like")

//     if (filterData?.settings_streak_tracker) {
//       await increaseStreak()
//       queryClient.invalidateQueries({ queryKey: ['streak'] })
//     }

//     setButtonLoading(false)

//     return
//   }

//   const addDismissedConnection = async (connection: number) => {
//     setButtonLoading(true)
//     await handleNextItem(connection, "dismiss")

//     // Need to wait til after the response until you handle the state better for that ^

//     setButtonLoading(false)

//     return
//   }

//   const getUnconnected = async () => {
//     setManualRefreshLoading(true);
//     await delay(1000); // force flower spin
//     setInteractedProfiles([]);
//     await removeFromCapacitorLocalStorage('picks_with_filters');
//     await picksRefetch();
//     setManualRefreshLoading(false);
//   };

//   const blockingAlert = async (connection: number) => {
//     presentAlert({
//       header: 'Are you sure you want to block this person?!',
//       buttons: [
//         {
//           text: 'Nevermind',
//           role: 'cancel',

//         },
//         {
//           text: 'Yes!',
//           role: 'confirm',
//           handler: () => {
//             addBlockedConnection(connection);
//           },
//         },
//       ]
//     })
//   }

//   const firstFiltersAlert = () => {
//     presentfirstFiltersAlert({
//       header: (lookingForFilterChecked.length > 0) ? 'You are refreshing for ' + lookingForFilterChecked.join(' and ') : 'You are refreshing for all categories.',
//       subHeader: 'Use the filter button to change your preferences. ',
//       buttons: [
//         {
//           text: 'Ok!',
//           role: 'cancel',
//         },
//       ]
//     })
//   }


//   // After initial data load completes, mark that we've tried
//   useEffect(() => {
//     if (!picksLoading && !profileDetailsIsLoading && !filtersLoading && !nextLoading && data !== undefined) {
//       setHasTriedInitialLoad(true);
//     }
//   }, [picksLoading, profileDetailsIsLoading, filtersLoading, nextLoading, data]);


//   const handleSendMessageAndLike = async (connection: number, message: string) => {
//     try {
//       await sendAnOpener(connection, message);
//       await addOutgoingConnection(connection);
//     } catch (err) {
//       console.error(err);
//     }
//   };


//   const addBlockedConnection = async (connection: number) => {
//     setButtonLoading(true)
//     await handleNextItem(connection, "block")
//     setButtonLoading(false)

//     return
//   }

//   const handleReportOpen = async (name: string, id: number) => {
//     setOffendingName(name)
//     setOffendingId(id)
//     createReportPresent()
//   }

//   const [createReportPresent, createReportDismiss] = useIonModal(ReportModal, {
//     offender: "user",
//     text: offendingName,
//     id: offendingId,
//     onDismiss: (data: string, role: string) => createReportDismiss(data, role),
//   });

//   const shouldShowManualLoadingCard = useMemo(() => {
//     return manualRefreshLoading && reorderedAndFilteredData?.length === 0;
//   }, [manualRefreshLoading, reorderedAndFilteredData]);



//   const handleFilterDismiss = async (changes: boolean) => {

//     if (changes) {

//       setFiltersLoading(true)
//       filterDismiss()


//       queryClient.invalidateQueries({ queryKey: ['current'] })

//       const response = await getUnconnected()
//       setFiltersLoading(false)

//     }
//     filterDismiss()


//   }

//   const [filterPresent, filterDismiss] = useIonModal(AdvancedFilterModal, {
//     currentProfileData: filterData,
//     pro: filterData?.subscription_level,
//     onDismiss: async (changes: boolean) => await handleFilterDismiss(changes),
//   });

//   const openAdvancedFilterModal = () => {
//     filterPresent();
//   }

//   const [presentLikeMessageModal, dismissLikeMessageModal] = useIonModal(LikeMessageAlertModal, {
//     connectionName: profileDetails?.name,
//     onDismiss: () => dismissLikeMessageModal(),
//     onSendLike: async () => {
//       await addOutgoingConnection(profileDetails?.user);
//       dismissLikeMessageModal();
//     },
//     onSendWithMessage: async (msg: string) => {
//       await handleSendMessageAndLike(profileDetails?.user, msg);
//       setShowMessagePop(true);
//       dismissLikeMessageModal();
//     },
//   });

// // Updated Picks.tsx return block

// return (
//   <IonPage>
//     {filterData && filterData?.created_profile && !(filterData?.deactivated_profile) && !(filterData?.paused_profile) ? (
//       <IonContent fullscreen scrollEvents={true} className="picks-offset">
//         <IonRow className="picks-filters">
//           <IonButton onClick={openAdvancedFilterModal}>
//             <FontAwesomeIcon icon={faBarsFilter} /> &nbsp; Filters
//           </IonButton>
//         </IonRow>
//         <div ref={picksTopRef}></div>

//         {profileDetails && data && data.length > 0 && reorderedAndFilteredData.length > 0 && !profileDetails.deactivated_profile ? (
//           (picksLoading || profileDetailsIsLoading || nextLoading || filtersLoading) ? (
//             <>
//               <IonRow className="page-title bigger">
//                 <img className="color-invertible" src="../static/img/picks.png" alt="picks" />
//               </IonRow>
//               <LoadingCard />
//             </>
//           ) : (
//             <>
//               <ProfileCard
//                 cardData={profileDetails}
//                 pro={isPersonalPlus(filterData.subscription_level)}
//                 settingsAlt={filterData.settings_alt_text}
//               />
//               <IonFab className="bigger" slot="fixed" vertical="bottom" horizontal="end">
//                 <IonFabButton disabled={buttonLoading} onClick={() => {
//                   presentLikeMessageModal({ cssClass: 'like-message-alert-modal' });
//                 }}>
//                   <IonIcon icon={heartIcon}></IonIcon>
//                 </IonFabButton>
//               </IonFab>
//               <IonFab className="very-bottom" slot="fixed" vertical="bottom" horizontal="start">
//                 <IonFabButton disabled={buttonLoading} color="secondary">
//                   <IonIcon icon={bugIcon}></IonIcon>
//                 </IonFabButton>
//                 <IonFabList className="with-label" side="top">
//                   <IonFabButton color="warning" disabled={buttonLoading} onClick={() => addDismissedConnection(profileDetails.user)} data-label="Ignore for now">
//                     <IonIcon icon={hourglassIcon}></IonIcon>
//                   </IonFabButton>
//                   <IonFabButton color="danger" disabled={buttonLoading} onClick={() => blockingAlert(profileDetails.user)} data-label="Block">
//                     <IonIcon icon={squareIcon}></IonIcon>
//                   </IonFabButton>
//                   <IonFabButton color="dark" disabled={buttonLoading} onClick={() => handleReportOpen(profileDetails.name, profileDetails.user)} data-label="Report">
//                     <IonIcon icon={alertIcon}></IonIcon>
//                   </IonFabButton>
//                 </IonFabList>
//               </IonFab>
//             </>
//           )
//         ) : shouldShowManualLoadingCard || shouldShowNoProfiles ? (
//           <>
//             <IonRow className="page-title bigger">
//               <img className="color-invertible" src="../static/img/picks.png" alt="picks" />
//             </IonRow>
//             <IonCard className="prelaunch">
//               <IonCardTitle style={{ fontWeight: "normal" }}>
//                 {manualRefreshLoading ? "Refreshing..." : "No new Profiles to view!"}
//                 <br /><br />
//                 <IonButton onClick={openAdvancedFilterModal} color="primary" disabled={manualRefreshLoading}>
//                   <IonIcon icon={filterIcon}></IonIcon> &nbsp;Adjust Your Filters
//                 </IonButton>
//                 <br /><br />
//                 <span style={{ fontSize: "16px", lineHeight: "0.8" }}>
//                   Check back later for new members joining our community.
//                 </span>
//               </IonCardTitle>
//               <IonCardContent>
//                 Plus, join the discussion at the Refreshments Bar (community forum).
//               </IonCardContent>
//             </IonCard>
//             <IonCard className="out-of-profiles">
//               <IonRow className="ion-justify-content-center spinning-flower-wrapper">
//                 <img
//                   className={manualRefreshLoading ? "flower-mask spin" : "flower-mask"}
//                   src="../static/img/flower-mask.png"
//                   alt="refresh-mask"
//                 />
//               </IonRow>
//               <IonRow className="picks-buttons">
//                 <IonButton
//                   className="clearfilters"
//                   onClick={async () => {
//                     setManualRefreshLoading(true);
//                     await delay(1000);
//                     await getUnconnected();
//                     setManualRefreshLoading(false);
//                   }}
//                   disabled={manualRefreshLoading}
//                 >
//                   {manualRefreshLoading ? "Refreshing..." : "Refresh your Picks"}
//                 </IonButton>
//               </IonRow>
//             </IonCard>
//           </>
//         ) : null}

//         {picksStatus?.active && (picksStatus?.header || picksStatus?.message) && isBeforeExpiration && (
//           <StatusToast isToastOpen={true} setIsToastOpen={setIsToastOpen} header={picksStatus.header} message={picksStatus.message} />
//         )}

//         <IconPop
//           trigger={showMessagePop}
//           position="center"
//           emojis={['🧡']}
//           icons={[faCommentHeart]}
//           intensity="big"
//           onComplete={() => setShowMessagePop(false)}
//         />
//       </IonContent>
//     ) : (
//       <IonContent>
//         <IonRow className="page-title bigger">
//           <img className="color-invertible" src="../static/img/picks.png" alt="picks" />
//         </IonRow>
//         {!filterDataIsLoading && filterData && (!filterData.created_profile || filterData.deactivated_profile || filterData.paused_profile) ? (
//           <CantAccessCard tabName="Picks" />
//         ) : (
//           <LoadingCard />
//         )}
//       </IonContent>
//     )}
//   </IonPage>
// );



// };

// export default Picks;
