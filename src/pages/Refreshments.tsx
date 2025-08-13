import {
  IonContent, IonInfiniteScroll,
  IonInfiniteScrollContent, RefresherEventDetail, IonHeader, IonCard, IonCardContent, IonPage, IonTitle, IonToolbar, IonCardTitle, IonCardSubtitle, IonButton, IonText, IonFab, IonFabButton, IonIcon, IonRow, IonModal, IonButtons, IonItem, IonLabel, IonList, IonCheckbox, IonInput, IonRefresher, IonRefresherContent, IonFabList, useIonAlert, useIonModal, IonNote, IonCol, IonChip, IonAccordionGroup, IonAccordion, IonAlert, IonActionSheet, IonAvatar, IonSpinner
} from '@ionic/react';
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { arrowDown } from 'ionicons/icons';

import "./Page.css"
import "./Community.css"
import { useGetPosts } from '../hooks/api/refreshments/posts';
import RefreshmentsPost from '../components/RefreshmentsPosts/RefreshmentsPost';
import { faMagnifyingGlass } from '@fortawesome/pro-solid-svg-icons/faMagnifyingGlass';
import { faMegaphone } from '@fortawesome/pro-solid-svg-icons/faMegaphone';
import { faFrown } from '@fortawesome/pro-regular-svg-icons/faFrown';


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CreatePostModal from '../components/CreatePostModal';
import { faBarsFilter } from '@fortawesome/pro-solid-svg-icons/faBarsFilter';
import RefreshmentsFilters from '../components/RefreshmentsFilters';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useGetStatuses } from '../hooks/api/status';
import StatusToast from '../components/StatusToast';
import { App } from '@capacitor/app';
import { faMagnifyingGlassMinus } from '@fortawesome/pro-regular-svg-icons/faMagnifyingGlassMinus';
import { useGetCurrentStreak } from '../hooks/api/profiles/current-streak';
import { useGetGlobalAppCurrentProfile } from '../hooks/api/profiles/global-app-current-profile';
import { useGetSettingsCurrentProfile } from '../hooks/api/profiles/settings-current-profile';
import RefreshmentsFiltersModal from '../components/RefreshmentsFiltersModal';
import { Preferences } from '@capacitor/preferences';
import { isCommunityPlus } from '../hooks/utilities';
import { useGetSiteSettings } from '../hooks/api/sitesettings';


const Refreshments: React.FC = () => {

  const queryClient = useQueryClient()
  

  const [bar, setBar] = useState<string>("")
  const [bars, setBars] = useState<string>("")
  const [radius, setRadius] = useState<number | null>(null)
  const [sort, setSort] = useState<string>("recent")
  const [local, setLocal] = useState<boolean>(true)
  const [littleLoading, setLittleLoading] = useState<boolean>(false);



  const [search, setSearch] = useState<string>("")

  const [isToastOpen, setIsToastOpen] = useState<boolean>(false)


  const {data: posts, isLoading: postsLoading} = useGetPosts(bars, search, local, radius, sort)

  const [length, setLength] = useState(5)

  const [somePosts, setSomePosts] = useState(posts?.slice(0, 5))

  const [showStoreAlert, setShowStoreAlert] = useState(false)
  const [showFilterRow, setShowFilterRow] = useState(false)

  const statuses = useGetStatuses().data;
  const siteSettings = useGetSiteSettings().data;

  const currentStreak = useGetCurrentStreak().data;


  const { data: globalCurrentProfile, isLoading: globalIsLoading } = useGetGlobalAppCurrentProfile();
  const { data: settingsCurrentProfile, isLoading: settingsIsLoading } = useGetSettingsCurrentProfile();



  const refreshmentsStatus = useMemo(
    () => statuses?.find(status => {
      return status.page.includes('refreshments')}),
    [statuses]
  );

  const isBeforeExpiration = useMemo(
    () => refreshmentsStatus?.active && new Date() < new Date(refreshmentsStatus?.expirationDateTime),
    [refreshmentsStatus?.expirationDateTime]
  );

  const refreshmentsTop = useRef<null | HTMLDivElement>(null)

  const scrollToRefreshmentsTop = () => {

    refreshmentsTop.current?.scrollIntoView({
        behavior: "auto",
        block: "center"
    })
  }


  useEffect(() => {

    setSomePosts(posts?.slice(0, length))

  }, [posts, length])


  const [createPostPresent, createPostDismiss] = useIonModal(CreatePostModal, {
    preferred_name: globalCurrentProfile?.name,
    username: globalCurrentProfile?.username,
    onDismiss: (data: string, role: string) => createPostDismiss(data, role),
  });

  const handleFilterDismiss = (bars: string, local: boolean, radius: number | null, sortSelected: string) => {
    setBars(bars)
    setRadius(radius)
    setSort(sortSelected)
    setLocal(local)
    filterDismiss()

  }

  const [filterPresent, filterDismiss] = useIonModal(RefreshmentsFiltersModal, {
    barsProp: bars,
    radiusProp: radius,
    localProp: local,
    sortProp: sort,
    onDismiss: (bars: string, local: boolean, radius: number | null, sortSelected: string) => handleFilterDismiss(bars, local, radius, sortSelected),
  });

  const openRefreshmentsFiltersModal = () => {
    filterPresent();
  }

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    setLittleLoading(true)
    setTimeout(async () => {
      queryClient.invalidateQueries({
      queryKey: ['filteredposts'], exact: false,
    } );
      event.detail.complete();
      setLittleLoading(false)
    }, 2000);
  }


  useEffect(() => {
    const loadFilters = async () => {
      const storedFilters = await Preferences.get({ key: "filters" });

      if (!!storedFilters.value) {
        setBars(storedFilters.value);
      }
      else {
        setBars('all')
      }

      // Load saved radius if exists
      const storedRadius = await Preferences.get({ key: "radius" });
      if (storedRadius.value) setRadius(parseInt(storedRadius.value));

      const storedLocalPosts = await Preferences.get({ key: "local" });
      if (storedLocalPosts.value) setLocal(storedLocalPosts.value == 'off' ? false : true);

      const storedSort = await Preferences.get({ key: "sort" });
      if (storedSort.value) setSort(storedSort.value);
    };

    loadFilters();
  }, []);





  return (
    <IonPage>
      <IonContent>
        <IonRow className="page-title" id="refreshments-top" style={{ marginBottom: "10pt" }}>
          <img src="../static/img/refreshments.png" alt="refreshments" className="dark-dont-show" />
          <img src="../static/img/refreshments-white.png" alt="refreshments" className="dark-show" />
        </IonRow>
        <div ref={refreshmentsTop}></div>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>
        {littleLoading ? <IonRow className="ion-justify-content-center"><IonSpinner name="dots"></IonSpinner></IonRow> : <></>}
        <IonRow className="filter-buttons">
          <IonButton onClick={() => setShowFilterRow(showFilterRow ? false : true)}>
          {showFilterRow ? <FontAwesomeIcon icon={faMagnifyingGlassMinus} /> : <FontAwesomeIcon icon={faMagnifyingGlass} /> }
          </IonButton>
          <IonCol className="filter-column" onClick={openRefreshmentsFiltersModal}>

            {!bars || (bars == "all") ?
              <IonText color="gray">Showing all posts</IonText> :
              <IonText color="gray">Showing filtered posts</IonText>
            }
           
              <IonButton fill="clear" size="small" color='gray'>
                <FontAwesomeIcon icon={faBarsFilter} />
              </IonButton>
          </IonCol>
          {settingsCurrentProfile?.settings_create_posts && (isCommunityPlus(globalCurrentProfile?.subscription_level) || siteSettings?.allow_free_users_to_submit_posts || currentStreak?.streak_count >= 5) ?
            <IonButton color="tertiary" onClick={() => createPostPresent()}>
              <FontAwesomeIcon icon={faMegaphone} />
            </IonButton>
            : isCommunityPlus(globalCurrentProfile?.subscription_level) && !settingsCurrentProfile?.settings_create_posts ?
              <></>
              :
              <>
                <IonButton color="gray" onClick={() => setShowStoreAlert(true)}>
                  <FontAwesomeIcon icon={faMegaphone} />
                </IonButton>
                <IonAlert
                  isOpen={showStoreAlert}
                  onDidDismiss={() => setShowStoreAlert(false)}
                  header="You need a 5 day streak to create your own post."
                  subHeader="Or get Community+ or Refresh Pro to post now!"
                  buttons={[{
                    text: "Not now",
                    role: 'destructive'
                  },
                  {
                    text: 'What is my streak?',
                    handler: async () => {
                        window.location.pathname = "/activity"
                    }
                  },
                  {
                    text: 'Get Pro!',
                    handler: async () => {
                      window.location.pathname = "/store"
                    }
                  }]}
                />
              </>}
        </IonRow>
        {showFilterRow ?
          <RefreshmentsFilters search={search} setSearch={setSearch} /> : <></>}
        {(somePosts && !postsLoading && !globalIsLoading)?
        <IonList id="wl" lines="full" className="refreshments-list">
          {somePosts?.map((e: any) => (
            <li key={e}>
              <RefreshmentsPost post_id={e} />
            </li>
          ))}
        </IonList>  
        :
        <IonRow className="ion-justify-content-center">
            <img alt="Refresh Connections logo spinning" src="../static/img/arrowload.gif" style={{paddingTop: "40pt", width: "30%"}}></img>
                </IonRow>}     
        {/* {posts?.length > length ?
        <IonRow className="ion-justify-content-center">
          <IonButton size="small" fill="outline" onClick={() => setLength(length + 3)}>See more</IonButton>
        </IonRow>
        : <></>
      } */}
        <IonInfiniteScroll
          onIonInfinite={(ev) => {
            if (posts?.length > length) {
              setLength(length + 2)
              setTimeout(() => ev.target.complete(), 500);
            }
            setTimeout(() => ev.target.complete(), 0);
          }}
        >
          <IonInfiniteScrollContent loadingSpinner="bubbles" style={{ minHeight: "14px" }}></IonInfiniteScrollContent>
        </IonInfiniteScroll>
        <IonRow className="ion-justify-content-center">
          {posts?.length > length ?
            <IonButton size="small" fill="outline" onClick={() => setLength(length + 3)}>See more</IonButton>

            : posts?.length > 3 ?
              <IonButton size="small" fill="clear" onClick={scrollToRefreshmentsTop}>Back to top</IonButton>
              : posts?.length == 0 ?
                <IonNote>Nothing here yet &nbsp;<FontAwesomeIcon icon={faFrown}/></IonNote>
                : <></>
          }
        </IonRow>
        {refreshmentsStatus?.active && (refreshmentsStatus?.header || refreshmentsStatus?.message) && isBeforeExpiration ?
          <StatusToast isToastOpen={true} setIsToastOpen={setIsToastOpen} header={refreshmentsStatus?.header} message={refreshmentsStatus?.message}/> 
        : <></>}
      </IonContent>
    </IonPage>
  );

};



export default Refreshments;
