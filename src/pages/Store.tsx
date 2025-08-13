import { IonContent, RefresherEventDetail, IonHeader, IonCard, IonCardContent, IonPage, IonTitle, IonToolbar, IonCardTitle, IonCardSubtitle, IonButton, IonText, IonFab, IonFabButton, IonIcon, IonRow, IonModal, IonButtons, IonItem, IonLabel, IonList, IonCheckbox, IonInput, IonRefresher, IonRefresherContent, IonFabList, useIonAlert, useIonModal, IonNote, IonCol, IonGrid, IonCardHeader } from '@ionic/react';
import ProfileCard from '../components/ProfileCard';
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { chevronBackOutline } from 'ionicons/icons';


import "./Page.css"
import "./Store.css"

import { getCurrentUserProfile, updateCurrentUserProfile, isMobile } from '../hooks/utilities';


/* In app purchases */
import { useGetStatuses } from '../hooks/api/status';
import StatusToast from '../components/StatusToast';
import { useGetCurrentProfile } from '../hooks/api/profiles/current-profile';
import { Purchases, PURCHASES_ERROR_CODE, PurchasesOfferings } from '@revenuecat/purchases-capacitor';
import { useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/pro-solid-svg-icons';

function SubscriptionMessage({ subscriptionLevel }: { subscriptionLevel: string | null }) {
    const isSubscribed = subscriptionLevel && subscriptionLevel !== "none";

  let levelName = "";
  switch (subscriptionLevel) {
    case "communityplus":
      levelName = "Community+";
      break;
    case "personalplus":
      levelName = "Personal+";
      break;
    case "pro":
      levelName = "Pro";
      break;
    default:
      levelName = "";
  }



  const description = isSubscribed
    ? "Together, we're building a conscientious community while you enjoy an upgraded experience designed for deeper connections." : "Discover everything Refresh Connections has to offer and pick the plan that's right for you."

  return (
    <IonCard color="navy" className="ion-padding" style={{ textAlign: "center", borderRadius: "16px" }}>
        <FontAwesomeIcon icon={faStar} style={{ fontSize: '36px', color: 'var(--ion-color-primary)', marginTop: "15pt" }} />

      <IonCardHeader>

        <IonCardTitle style={{ marginTop: '8px', fontSize: '20px' }}>
          {isSubscribed ?`Welcome to ${levelName}!` : "Unlock the complete Pro experience."}
        </IonCardTitle>
      </IonCardHeader>


      <IonCardContent>
        <IonText color="white">
          <p style={{ marginTop: '8px', fontSize: '16px' }}>{description}</p>
        </IonText>
      </IonCardContent>
    </IonCard>
  );
  }


const Store: React.FC = () => {

    const data = useGetCurrentProfile().data;
    const queryClient = useQueryClient()


    // const [data, setData] = useState<any>(null);
    const [subscriptionsOfferings, setSubscriptionOfferings] = useState<any>(null);

    const [allOfferings, setAllOfferings] = useState<any>(null);
    const [currentOffering, setCurrentOffering] = useState<any>(null);
    const [activeEntitlement, setActiveEntitlement] = useState<any>(null);




    const [error, setError] = useState<any>(null);
    const [loading, setLoading] = useState<any>(false);
    const [purchaseLoading, setPurchaseLoading] = useState<any>(false);
    const [revCatWorked, setRevCatWorked] = useState<any>(false);

    const packagesReadyForPurchase = ["refreshsubscriptionpro", "refreshsubscriptionpro:refreshsubscription", "communityplus", "personalplus", "personalplus:personalplus", "communityplus:communityplus"]

    const [isToastOpen, setIsToastOpen] = useState<boolean>(false)

    const statuses = useGetStatuses().data;

    const storeStatus = useMemo(
        () => statuses?.find(status => {
            return status.page.includes('store')
        }),
        [statuses]
    );

    const isBeforeExpiration = useMemo(
        () => storeStatus?.active && new Date() < new Date(storeStatus?.expirationDateTime) || !storeStatus?.expirationDateTime,
        [storeStatus?.expirationDateTime]
    );

    function renderOffering(offering: any, isCurrent: boolean) {
        const product = offering.availablePackages[0]?.product;
        const features = offering.metadata?.features || [];
        const googletrial = offering.metadata?.google?.trial || "";
        const appletrial = offering.metadata?.apple?.trial || "";
        const header = offering.metadata?.header || "";

        let buttonLabel = "Subscribe now";

        const entitlementToOfferingMap: Record<string, string> = {
            pro: "pro-refreshconnections",
            communityplus: "communityplus",
            personalplus: "personalplus",
          };

        // Properly check if activeEntitlement is not empty
        const hasActiveEntitlement = activeEntitlement && Object.keys(activeEntitlement).length > 0;

        const activeEntitlementId = (activeEntitlement && typeof activeEntitlement === 'object' && Object.keys(activeEntitlement).length > 0)
            ? Object.keys(activeEntitlement)[0]
            : null;

        // console.log("active", activeEntitlement)
        // console.log("offering identifier", offering.identifier)
        // console.log("entitlementToOfferingMap[activeEntitlement]", entitlementToOfferingMap[activeEntitlement])

        if (activeEntitlementId && offering.identifier === entitlementToOfferingMap[activeEntitlementId]) {
        buttonLabel = "You are subscribed!";
        } else if (hasActiveEntitlement) {
        buttonLabel = "Switch to this subscription";
        }


        return (
            <>
                <IonLabel className="ion-text-center">
                    <h2 style={{ fontSize: isCurrent ? '24px' : '20px', fontWeight: isCurrent ? 'bold' : 'normal' }}>
                        {product?.title}
                    </h2>
                    <h3 style={{ fontSize: isCurrent ? '20px' : '16px', color: isCurrent ? '#ffffff' : '#333' }}>
                        {product?.priceString}/month
                    </h3>
                    
                </IonLabel>
                <IonRow className="ion-justify-content-center">
                    {isCurrent &&
                        <img className="ion-padding" src="../static/img/freshypro.png" alt={product.title} style={{ width: "40%", textAlign: "center" }} />
                    }
                <p style={{
                    fontSize: '16px',
                    color: isCurrent ? 'var(--ion-color-light)' : 'var(--ion-color-medium)',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    margin: '10pt 15pt 10pt 15pt',
                }}>
                     <FontAwesomeIcon icon={faStar} /> {header}
                </p>
                </IonRow>

                <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                    {features.map((feature: string, index: number) => (
                        <li key={index} style={{ fontSize: '16px', color: isCurrent ? '#ffffff' : '#666' }}>
                            {feature}
                        </li>
                    ))}
                </ul>

                {/* Trial info (optional) */}
                {/* {product?.introPrice && (
                    <IonText color={isCurrent ? 'light' : 'medium'}>
                        🎉 Intro offer: {product.introPrice.priceString} for {product.introPrice.periodNumberOfUnits} months
                    </IonText>
                )} */}
                {(Capacitor.getPlatform() === 'ios' && appletrial) ?
                     <IonText color={isCurrent ? 'light' : 'medium'}>
                        🎉 Intro offer: {appletrial}
                    </IonText>
                    :
                    (Capacitor.getPlatform() === 'android' && googletrial) ?
                    <IonText color={isCurrent ? 'light' : 'medium'}>
                            🎉 Intro offer: {googletrial}
                        </IonText>
                        :
                        <></>
                }

                <IonButton expand="block" size={isCurrent ? "large" : "default"} color={isCurrent ? "tertiary" : "primary"}className="ion-margin-top" onClick={async () => purchase(offering.availablePackages[0])}>
                    {buttonLabel}
                </IonButton>
            </>
        );
    }




    useEffect(() => {

        const fetchDataRevenueCat = async () => {
            setError(null);
            setLoading(true);
            try {
                if (isMobile()) {
                    const offerings: PurchasesOfferings = await Purchases.getOfferings();
                    // console.log("stringed offerings", JSON.stringify(offerings, null, 2));
                    setSubscriptionOfferings(offerings)
                    const allOfferings = offerings?.all || {};
                    const currentOffering = offerings?.current?.identifier; // This is "pro"

                    console.log("current offering", currentOffering)

                    setAllOfferings(allOfferings)
                    setCurrentOffering(currentOffering)
                    const revenueCatCustomerInfo = (await Purchases.restorePurchases()).customerInfo;
                    setActiveEntitlement(revenueCatCustomerInfo?.entitlements?.active ?? null)

                }
                else {
                    // const offerings = `{"all":{"pro-refreshconnections":{"monthly":{"presentedOfferingContext":{"placementIdentifier":null,"offeringIdentifier":"pro-refreshconnections","targetingContext":null},"product":{"subscriptionPeriod":"P1M","pricePerWeekString":"$4.60","pricePerMonthString":"$19.98","pricePerYearString":"$239.87","productCategory":"SUBSCRIPTION","description":"Monthly Pro features subscription","pricePerYear":239.87,"pricePerMonth":19.98,"identifier":"refreshsubscriptionpro","currencyCode":"USD","pricePerWeek":4.6,"productType":"AUTO_RENEWABLE_SUBSCRIPTION","discounts":[],"priceString":"$19.99","price":19.989999999999995,"introPrice":{"periodUnit":"MONTH","priceString":"$0.00","period":"P3M","price":0,"cycles":1,"periodNumberOfUnits":3},"title":"Refresh Connections Pro"},"packageType":"MONTHLY","identifier":"$rc_monthly","offeringIdentifier":"pro-refreshconnections"},"identifier":"pro-refreshconnections","availablePackages":[{"identifier":"$rc_monthly","product":{"discounts":[],"currencyCode":"USD","pricePerWeek":4.6,"pricePerYearString":"$239.87","subscriptionPeriod":"P1M","title":"Refresh Connections Pro","pricePerWeekString":"$4.60","introPrice":{"price":0,"cycles":1,"periodUnit":"MONTH","priceString":"$0.00","period":"P3M","periodNumberOfUnits":3},"pricePerYear":239.87,"productType":"AUTO_RENEWABLE_SUBSCRIPTION","price":19.989999999999995,"identifier":"refreshsubscriptionpro","productCategory":"SUBSCRIPTION","description":"Monthly Pro features subscription","priceString":"$19.99","pricePerMonth":19.98,"pricePerMonthString":"$19.98"},"packageType":"MONTHLY","offeringIdentifier":"pro-refreshconnections","presentedOfferingContext":{"placementIdentifier":null,"offeringIdentifier":"pro-refreshconnections","targetingContext":null}}],"serverDescription":"All pro features","metadata":{}}},"current":{"identifier":"pro-refreshconnections","availablePackages":[{"presentedOfferingContext":{"offeringIdentifier":"pro-refreshconnections","placementIdentifier":null,"targetingContext":null},"packageType":"MONTHLY","identifier":"$rc_monthly","product":{"pricePerWeek":4.6,"pricePerMonth":19.98,"subscriptionPeriod":"P1M","pricePerWeekString":"$4.60","productType":"AUTO_RENEWABLE_SUBSCRIPTION","identifier":"refreshsubscriptionpro","currencyCode":"USD","introPrice":{"periodNumberOfUnits":3,"priceString":"$0.00","periodUnit":"MONTH","cycles":1,"price":0,"period":"P3M"},"price":19.989999999999995,"pricePerYear":239.87,"pricePerMonthString":"$19.98","priceString":"$19.99","pricePerYearString":"$239.87","title":"Refresh Connections Pro","discounts":[],"productCategory":"SUBSCRIPTION","description":"Monthly Pro features subscription"},"offeringIdentifier":"pro-refreshconnections"}],"monthly":{"presentedOfferingContext":{"targetingContext":null,"offeringIdentifier":"pro-refreshconnections","placementIdentifier":null},"packageType":"MONTHLY","product":{"priceString":"$19.99","pricePerMonth":19.98,"productType":"AUTO_RENEWABLE_SUBSCRIPTION","description":"Monthly Pro features subscription","title":"Refresh Connections Pro","discounts":[],"pricePerYear":239.87,"pricePerYearString":"$239.87","productCategory":"SUBSCRIPTION","subscriptionPeriod":"P1M","pricePerWeekString":"$4.60","introPrice":{"period":"P3M","periodNumberOfUnits":3,"periodUnit":"MONTH","price":0,"cycles":1,"priceString":"$0.00"},"price":19.989999999999995,"pricePerWeek":4.6,"identifier":"refreshsubscriptionpro","pricePerMonthString":"$19.98","currencyCode":"USD"},"offeringIdentifier":"pro-refreshconnections","identifier":"$rc_monthly"},"serverDescription":"All pro features","metadata":{"apple":{"trial":"3 month free trial for new subscribers!"},"features":["See all Likes at once","View all Let's Talk Abouts","Submit new posts to the Refreshments Bar","Initiate mode","Pro banners","and more!"],"google":{"trial":"3 month free trial for new subscribers! Use promo code REFRESH3MONTHS"}}}}`
                    const offerings = `
                        {
                        \"all\": {
                            \"personalplus\": {
                            \"availablePackages\": [
                                {
                                \"presentedOfferingContext\": {
                                    \"placementIdentifier\": null,
                                    \"targetingContext\": null,
                                    \"offeringIdentifier\": \"personalplus\"
                                },
                                \"offeringIdentifier\": \"personalplus\",
                                \"product\": {
                                    \"pricePerMonth\": 9.99,
                                    \"price\": 9.99,
                                    \"introPrice\": null,
                                    \"currencyCode\": \"USD\",
                                    \"pricePerYearString\": \"$119.88\",
                                    \"subscriptionPeriod\": \"P1M\",
                                    \"identifier\": \"personalplus\",
                                    \"pricePerMonthString\": \"$9.99\",
                                    \"discounts\": [],
                                    \"productCategory\": \"SUBSCRIPTION\",
                                    \"productType\": \"AUTO_RENEWABLE_SUBSCRIPTION\",
                                    \"priceString\": \"$9.99\",
                                    \"pricePerYear\": 119.88,
                                    \"pricePerWeek\": 2.29,
                                    \"description\": \"Monthly Personal+ features subscription\",
                                    \"title\": \"Personal+\",
                                    \"pricePerWeekString\": \"$2.29\"
                                },
                                \"packageType\": \"MONTHLY\",
                                \"identifier\": \"$rc_monthly\"
                                }
                            ],
                            \"monthly\": {
                                \"packageType\": \"MONTHLY\",
                                \"product\": {
                                \"subscriptionPeriod\": \"P1M\",
                                \"pricePerMonthString\": \"$9.99\",
                                \"priceString\": \"$9.99\",
                                \"pricePerYear\": 119.88,
                                \"pricePerYearString\": \"$119.88\",
                                \"description\": \"Monthly Personal+ features subscription\",
                                \"pricePerWeekString\": \"$2.29\",
                                \"productCategory\": \"SUBSCRIPTION\",
                                \"title\": \"Personal+\",
                                \"discounts\": [],
                                \"price\": 9.99,
                                \"introPrice\": null,
                                \"identifier\": \"personalplus\",
                                \"productType\": \"AUTO_RENEWABLE_SUBSCRIPTION\",
                                \"currencyCode\": \"USD\",
                                \"pricePerMonth\": 9.99,
                                \"pricePerWeek\": 2.29
                                },
                                \"offeringIdentifier\": \"personalplus\",
                                \"identifier\": \"$rc_monthly\",
                                \"presentedOfferingContext\": {
                                \"placementIdentifier\": null,
                                \"offeringIdentifier\": \"personalplus\",
                                \"targetingContext\": null
                                }
                            },
                            \"metadata\": {
                                \"active\": true,
                                \"header\": \"Features for profile discoverability and deeper connections\",
                                \"features\": [
                                \"See all Likes at once\",
                                \"View all Let's Talk Abouts\",
                                \"Submit new posts to the Refreshments Bar\",
                                \"Initiate mode\",
                                \"Pro banners\",
                                \"and more!\"
                                ],
                                \"apple\": {
                                \"trial\": null
                                },
                                \"google\": {
                                \"trial\": null
                                }
                            },
                            \"identifier\": \"personalplus\",
                            \"serverDescription\": \"Personal+ features\"
                            },
                            \"pro-refreshconnections\": {
                            \"serverDescription\": \"All pro features\",
                            \"availablePackages\": [
                                {
                                \"product\": {
                                    \"pricePerMonthString\": \"$19.98\",
                                    \"productType\": \"AUTO_RENEWABLE_SUBSCRIPTION\",
                                    \"pricePerYear\": 239.87,
                                    \"price\": 19.989999999999995,
                                    \"title\": \"Refresh Connections Pro\",
                                    \"discounts\": [],
                                    \"description\": \"Monthly Pro features subscription\",
                                    \"identifier\": \"refreshsubscriptionpro\",
                                    \"currencyCode\": \"USD\",
                                    \"pricePerWeek\": 4.6,
                                    \"pricePerMonth\": 19.98,
                                    \"subscriptionPeriod\": \"P1M\",
                                    \"productCategory\": \"SUBSCRIPTION\",
                                    \"priceString\": \"$19.99\",
                                    \"introPrice\": {
                                    \"cycles\": 1,
                                    \"period\": \"P3M\",
                                    \"price\": 0,
                                    \"periodUnit\": \"MONTH\",
                                    \"priceString\": \"$0.00\",
                                    \"periodNumberOfUnits\": 3
                                    },
                                    \"pricePerWeekString\": \"$4.60\",
                                    \"pricePerYearString\": \"$239.87\"
                                },
                                \"presentedOfferingContext\": {
                                    \"targetingContext\": null,
                                    \"offeringIdentifier\": \"pro-refreshconnections\",
                                    \"placementIdentifier\": null
                                },
                                \"offeringIdentifier\": \"pro-refreshconnections\",
                                \"packageType\": \"MONTHLY\",
                                \"identifier\": \"$rc_monthly\"
                                }
                            ],
                            \"monthly\": {
                                \"product\": {
                                \"description\": \"Monthly Pro features subscription\",
                                \"productCategory\": \"SUBSCRIPTION\",
                                \"pricePerMonth\": 19.98,
                                \"pricePerWeek\": 4.6,
                                \"discounts\": [],
                                \"pricePerMonthString\": \"$19.98\",
                                \"productType\": \"AUTO_RENEWABLE_SUBSCRIPTION\",
                                \"subscriptionPeriod\": \"P1M\",
                                \"identifier\": \"refreshsubscriptionpro\",
                                \"currencyCode\": \"USD\",
                                \"price\": 19.989999999999995,
                                \"pricePerWeekString\": \"$4.60\",
                                \"introPrice\": {
                                    \"periodNumberOfUnits\": 3,
                                    \"cycles\": 1,
                                    \"period\": \"P3M\",
                                    \"price\": 0,
                                    \"periodUnit\": \"MONTH\",
                                    \"priceString\": \"$0.00\"
                                },
                                \"pricePerYearString\": \"$239.87\",
                                \"priceString\": \"$19.99\",
                                \"title\": \"Refresh Connections Pro\",
                                \"pricePerYear\": 239.87
                                },
                                \"packageType\": \"MONTHLY\",
                                \"presentedOfferingContext\": {
                                \"offeringIdentifier\": \"pro-refreshconnections\",
                                \"targetingContext\": null,
                                \"placementIdentifier\": null
                                },
                                \"identifier\": \"$rc_monthly\",
                                \"offeringIdentifier\": \"pro-refreshconnections\"
                            },
                            \"metadata\": {
                                \"google\": {
                                \"trial\": \"3 month free trial for new subscribers! Use promo code REFRESH3MONTHS\"
                                },
                                \"active\": true,
                                \"features\": [
                                \"See all Likes at once\",
                                \"View all Let's Talk Abouts\",
                                \"Submit new posts to the Refreshments Bar\",
                                \"Initiate mode\",
                                \"Pro banners\",
                                \"and more!\"
                                ],
                                \"apple\": {
                                \"trial\": \"3 month free trial for new subscribers!\"
                                },
                                \"header\": \"All Community+ and Personal+ features, plus expanded Pro benefits.\"
                            },
                            \"identifier\": \"pro-refreshconnections\"
                            },
                            \"communityplus\": {
                            \"metadata\": {
                                \"features\": [
                                \"See all Likes at once\",
                                \"View all Let's Talk Abouts\",
                                \"Submit new posts to the Refreshments Bar\",
                                \"Initiate mode\",
                                \"Pro banners\",
                                \"and more!\"
                                ],
                                \"active\": true,
                                \"apple\": {
                                \"trial\": null
                                },
                                \"google\": {
                                \"trial\": null
                                },
                                 \"header\": \"Features for more local reach and community engagement.\"
                            },
                            \"availablePackages\": [
                                {
                                \"offeringIdentifier\": \"communityplus\",
                                \"identifier\": \"$rc_monthly\",
                                \"presentedOfferingContext\": {
                                    \"placementIdentifier\": null,
                                    \"targetingContext\": null,
                                    \"offeringIdentifier\": \"communityplus\"
                                },
                                \"packageType\": \"MONTHLY\",
                                \"product\": {
                                    \"description\": \"Monthly Community+ features subscription\",
                                    \"productType\": \"AUTO_RENEWABLE_SUBSCRIPTION\",
                                    \"currencyCode\": \"USD\",
                                    \"discounts\": [],
                                    \"pricePerWeek\": 2.29,
                                    \"pricePerMonthString\": \"$9.99\",
                                    \"pricePerYearString\": \"$119.88\",
                                    \"price\": 9.99,
                                    \"pricePerMonth\": 9.99,
                                    \"pricePerYear\": 119.88,
                                    \"priceString\": \"$9.99\",
                                    \"introPrice\": null,
                                    \"productCategory\": \"SUBSCRIPTION\",
                                    \"subscriptionPeriod\": \"P1M\",
                                    \"identifier\": \"communityplus\",
                                    \"title\": \"Community+\",
                                    \"pricePerWeekString\": \"$2.29\"
                                }
                                }
                            ],
                            \"serverDescription\": \"Community+ features\",
                            \"identifier\": \"communityplus\",
                            \"monthly\": {
                                \"identifier\": \"$rc_monthly\",
                                \"product\": {
                                \"discounts\": [],
                                \"description\": \"Monthly Community+ features subscription\",
                                \"pricePerWeekString\": \"$2.29\",
                                \"title\": \"Community+\",
                                \"identifier\": \"communityplus\",
                                \"introPrice\": null,
                                \"pricePerMonthString\": \"$9.99\",
                                \"currencyCode\": \"USD\",
                                \"productType\": \"AUTO_RENEWABLE_SUBSCRIPTION\",
                                \"pricePerWeek\": 2.29,
                                \"priceString\": \"$9.99\",
                                \"subscriptionPeriod\": \"P1M\",
                                \"price\": 9.99,
                                \"pricePerYear\": 119.88,
                                \"pricePerMonth\": 9.99,
                                \"productCategory\": \"SUBSCRIPTION\",
                                \"pricePerYearString\": \"$119.88\"
                                },
                                \"offeringIdentifier\": \"communityplus\",
                                \"packageType\": \"MONTHLY\",
                                \"presentedOfferingContext\": {
                                \"targetingContext\": null,
                                \"offeringIdentifier\": \"communityplus\",
                                \"placementIdentifier\": null
                                }
                            }
                            }
                        },
                        \"current\": {
                            \"identifier\": \"pro-refreshconnections\",
                            \"serverDescription\": \"All pro features\",
                            \"metadata\": {
                            \"google\": {
                                \"trial\": \"3 month free trial for new subscribers! Use promo code REFRESH3MONTHS\"
                            },
                            \"active\": true,
                            \"features\": [
                                \"See all Likes at once\",
                                \"View all Let's Talk Abouts\",
                                \"Submit new posts to the Refreshments Bar\",
                                \"Initiate mode\",
                                \"Pro banners\",
                                \"and more!\"
                            ],
                            \"apple\": {
                                \"trial\": \"3 month free trial for new subscribers!\"
                            }
                            },
                            \"monthly\": {
                            \"offeringIdentifier\": \"pro-refreshconnections\",
                            \"identifier\": \"$rc_monthly\",
                            \"packageType\": \"MONTHLY\",
                            \"product\": {
                                \"discounts\": [],
                                \"pricePerYearString\": \"$239.87\",
                                \"currencyCode\": \"USD\",
                                \"introPrice\": {
                                \"cycles\": 1,
                                \"price\": 0,
                                \"period\": \"P3M\",
                                \"periodNumberOfUnits\": 3,
                                \"periodUnit\": \"MONTH\",
                                \"priceString\": \"$0.00\"
                                },
                                \"pricePerMonth\": 19.98,
                                \"productType\": \"AUTO_RENEWABLE_SUBSCRIPTION\",
                                \"description\": \"Monthly Pro features subscription\",
                                \"identifier\": \"refreshsubscriptionpro\",
                                \"pricePerWeekString\": \"$4.60\",
                                \"pricePerMonthString\": \"$19.98\",
                                \"price\": 19.989999999999995,
                                \"priceString\": \"$19.99\",
                                \"subscriptionPeriod\": \"P1M\",
                                \"title\": \"Refresh Connections Pro\",
                                \"productCategory\": \"SUBSCRIPTION\",
                                \"pricePerWeek\": 4.6,
                                \"pricePerYear\": 239.87
                            },
                            \"presentedOfferingContext\": {
                                \"targetingContext\": null,
                                \"placementIdentifier\": null,
                                \"offeringIdentifier\": \"pro-refreshconnections\"
                            }
                            },
                            \"availablePackages\": [
                            {
                                \"offeringIdentifier\": \"pro-refreshconnections\",
                                \"packageType\": \"MONTHLY\",
                                \"presentedOfferingContext\": {
                                \"offeringIdentifier\": \"pro-refreshconnections\",
                                \"placementIdentifier\": null,
                                \"targetingContext\": null
                                },
                                \"identifier\": \"$rc_monthly\",
                                \"product\": {
                                \"pricePerYear\": 239.87,
                                \"identifier\": \"refreshsubscriptionpro\",
                                \"currencyCode\": \"USD\",
                                \"introPrice\": {
                                    \"priceString\": \"$0.00\",
                                    \"periodUnit\": \"MONTH\",
                                    \"periodNumberOfUnits\": 3,
                                    \"period\": \"P3M\",
                                    \"price\": 0,
                                    \"cycles\": 1
                                },
                                \"pricePerMonth\": 19.98,
                                \"title\": \"Refresh Connections Pro\",
                                \"productCategory\": \"SUBSCRIPTION\",
                                \"subscriptionPeriod\": \"P1M\",
                                \"pricePerWeekString\": \"$4.60\",
                                \"price\": 19.989999999999995,
                                \"pricePerMonthString\": \"$19.98\",
                                \"discounts\": [],
                                \"priceString\": \"$19.99\",
                                \"pricePerWeek\": 4.6,
                                \"description\": \"Monthly Pro features subscription\",
                                \"pricePerYearString\": \"$239.87\",
                                \"productType\": \"AUTO_RENEWABLE_SUBSCRIPTION\"
                                }
                            }
                            ]
                        }
                        }`
                    const offerings1 = JSON.parse(offerings)
                    // console.log(offerings1)
                    // const offerings_list = offerings.all.current.availablePackages
                    // const huh = [ offerings_list]
                    setSubscriptionOfferings(offerings1)



                    const allOfferings = offerings1?.all || {};
                    const currentOffering = offerings1?.current?.identifier // This is "pro"


                    setAllOfferings(allOfferings)
                    setCurrentOffering(currentOffering)

                    setActiveEntitlement("pro")



                }

            } catch (error: any) {
                setError(error.message);
                setLoading(false)
                console.log(error)
                console.log("hi sub", subscriptionsOfferings)
            }

        }

        fetchDataRevenueCat();




    }, []);

    const delay = (ms: any) => new Promise(res => setTimeout(res, ms));

    const purchase = async (revCatProduct: any) => {
        try {
            console.log("item revcat", revCatProduct)
            const purchaseResult = await Purchases.purchasePackage({
                aPackage: revCatProduct
            });
            console.log("Trans", purchaseResult)
            if (typeof purchaseResult.customerInfo.entitlements.active['pro'] !== "undefined") {
                setPurchaseLoading(true)
                await updateCurrentUserProfile({ "subscription_level": "pro" })
                await updateCurrentUserProfile({ "subscription_source": "RevenueCat" })
            }
            else if (typeof purchaseResult.customerInfo.entitlements.active['communityplus'] !== "undefined") {
                setPurchaseLoading(true)
                await updateCurrentUserProfile({ "subscription_level": "communityplus", "subscription_source": "RevenueCat" })
            }
            else if (typeof purchaseResult.customerInfo.entitlements.active['personalplus'] !== "undefined") {
                setPurchaseLoading(true)
                await updateCurrentUserProfile({ "subscription_level": "personalplus", "subscription_source": "RevenueCat" })
            }
        } catch (error: any) {
            if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
                // Purchase cancelled
            } else {
                // Error making purchase
            }
        }
        await delay(3000)
        queryClient.invalidateQueries({ queryKey: ['current'] })
        setPurchaseLoading(false)
    }

    const restorePurchases = async () => {
        setPurchaseLoading(true)
        // Must have a case to restore purchases for each Non-consumable (one-time purchase) and every kind of subscription
        try {
            const revenueCatCustomerInfo = (await Purchases.restorePurchases()).customerInfo;

            const entitlements = revenueCatCustomerInfo.entitlements.active
            console.log("entitlements", entitlements)
            await delay(1000)

            if ("pro" in revenueCatCustomerInfo.entitlements.active) {
                console.log("pro here")
                await updateCurrentUserProfile({ "subscription_level": "pro", "subscription_source": "RevenueCat - restore" })
                queryClient.invalidateQueries({ queryKey: ['current'] })
                queryClient.invalidateQueries({ queryKey: ['settings-current'] })
                queryClient.invalidateQueries({ queryKey: ['global-current'] })
                setRevCatWorked(true)
            }
            else if ("communityplus" in revenueCatCustomerInfo.entitlements.active) {
                await updateCurrentUserProfile({ "subscription_level": "communityplus", "subscription_source": "RevenueCat - restore" })
                queryClient.invalidateQueries({ queryKey: ['current'] })
                queryClient.invalidateQueries({ queryKey: ['settings-current'] })
                queryClient.invalidateQueries({ queryKey: ['global-current'] })
                setRevCatWorked(true)
            }
            else if ("personalplus" in revenueCatCustomerInfo.entitlements.active) {
                await updateCurrentUserProfile({ "subscription_level": "personalplus", "subscription_source": "RevenueCat - restore" })
                queryClient.invalidateQueries({ queryKey: ['current'] })
                queryClient.invalidateQueries({ queryKey: ['settings-current'] })
                queryClient.invalidateQueries({ queryKey: ['global-current'] })
                setRevCatWorked(true)
            }
            else {
                console.log("hm not sure what's up here")
                // await updateCurrentUserProfile({ "subscription_level": "none" })
                // await updateCurrentUserProfile({ "subscription_source": "RevenueCat - none" })
                queryClient.invalidateQueries({ queryKey: ['current'] })
                queryClient.invalidateQueries({ queryKey: ['global-current'] })
            }

        } catch (e) {
            // initialization error

            console.log("Revenue cat restore purchases error", e)

        }

        setPurchaseLoading(false)
    }

    console.log("currentOffering:", currentOffering);
    console.log("allOfferings:", allOfferings);
    // console.log("allOfferings keys:", Object.keys(allOfferings));

    return (
        <IonPage>
            <IonContent>

                <IonFab className="very-top" slot="fixed" vertical="top" horizontal="start">
                    <IonFabButton routerLink="/me" routerDirection="back" color="light">
                        <IonIcon icon={chevronBackOutline}></IonIcon>
                    </IonFabButton>
                </IonFab>
                <IonRow className="page-title">
                    <img className="color-invertible" src="../static/img/store.png" alt="store" />
                </IonRow>
                <SubscriptionMessage subscriptionLevel={data?.subscription_level}/>

                {/* <IonGrid className="store-grid">

                    <IonRow className="section-title">
                        Become a Refresh Pro
                    </IonRow>
                    <IonRow>

                        {(subscriptionsOfferings?.all.availablePackages)?.map((item: any, index: number) => (
                            ((packagesReadyForPurchase ?? []).includes(item.product.identifier) && subscriptionsOfferings?.all?.metadata?.active == true)&& 
                                (
                            <>
                                <IonCol size="6" key={index}>
                                    <IonCard button onClick={async () => purchase(item)} style={{ textAlign: "center" }}>
                                        {purchaseLoading ?
                                            <img src="../static/img/arrowload.gif" style={{ width: "60%", textAlign: "center" }} />
                                            :
                                            <img src="../static/img/freshypro.png" alt={item.product.title} style={{ width: "60%", textAlign: "center" }} />
                                        }
                                        <IonCardTitle>{item.product.title}</IonCardTitle>
                                        {data?.subscription_level == "pro" ?
                                            <IonCardSubtitle>You are subscribed!</IonCardSubtitle> :
                                            <IonCardSubtitle>{item.product.priceString}/month</IonCardSubtitle>
                                        }
                                    </IonCard>
                                </IonCol>

                                {subscriptionsOfferings?.all?.metadata ?
                                    <IonCol className="sub-description" size="6" key={"0" + index}>
                                        <IonList>
                                            <ul>
                                                {(Capacitor.getPlatform() === 'ios' && subscriptionsOfferings?.all?.metadata?.apple?.trial) ?
                                                    <li key="ios-trial">
                                                        {subscriptionsOfferings?.all?.metadata?.apple?.trial}
                                                    </li>
                                                    :
                                                    (Capacitor.getPlatform() === 'android' && subscriptionsOfferings?.all?.metadata?.google?.trial) ?
                                                        <li key="android-trial">
                                                            {subscriptionsOfferings?.all?.metadata?.google?.trial}
                                                        </li>
                                                        :
                                                        <></>
                                                }
                                                {(subscriptionsOfferings?.all?.metadata?.features)?.map((item: any, index: number) => (
                                                    <li key={index+ "metadata"}>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </IonList>
                                    </IonCol>
                                    : <></>}
                            </>
                        )
                        ))}
                    
                    </IonRow>


                    {(subscriptionsOfferings?.skus?.length == 0 || subscriptionsOfferings == null) ?
                        <IonRow style={{ justifyContent: "center", paddingTop: "30px" }}><IonText>Nothing here yet!</IonText></IonRow> :
                        <></>}
                    <IonRow className="ion-padding ion-text-center">
                        <IonNote>Review the <a href="https://refreshconnections.com/terms">Terms and Conditions</a> and <a href="https://refreshconnections.com/privacy">Privacy Policy</a>.</IonNote>
                    </IonRow>

                </IonGrid> */}
                {allOfferings && Object.keys(allOfferings).length > 0 && (
                    <>
                        {/* 1. Current offering first */}
                        {currentOffering 
                        && allOfferings[currentOffering]
                        && allOfferings[currentOffering].availablePackages?.length > 0
                        && allOfferings[currentOffering].metadata?.active === true
                        && (packagesReadyForPurchase ?? []).includes(allOfferings[currentOffering].availablePackages[0]?.product?.identifier) 
                        && (
                        <IonCard color="primary" className="ion-padding">
                    
                        {renderOffering(allOfferings[currentOffering], true)}
                        </IonCard>
                        )}

                        {/* 2. Other offerings */}
                        {Object.keys(allOfferings)
                            .filter(key => key !== currentOffering)
                            .map(key => {
                            const offering = allOfferings[key];
                            if (!offering) return null;
                            if (!(packagesReadyForPurchase ?? []).includes(offering.availablePackages[0]?.product?.identifier)) return null
                            if (offering.metadata?.active !== true) return null; // Must be active
                            if (!offering.availablePackages?.length) return null; // Must have packages

                            return (
                                <IonCard key={key} color="light" className="ion-padding">
                                {renderOffering(offering, false)}
                                </IonCard>
                            );
                            })}

                    </>
                )}

                <IonRow className="content-bottom">
                    {(subscriptionsOfferings?.skus?.length == 0 || subscriptionsOfferings == null) ?
                        <></> :
                        <IonButton onClick={restorePurchases}>Restore Purchases</IonButton>}
                    <IonButton fill="outline" routerLink="/help">Help</IonButton>
                </IonRow>
            </IonContent>

            {storeStatus?.active && (storeStatus?.header || storeStatus?.message) && isBeforeExpiration ?
                <StatusToast isToastOpen={true} setIsToastOpen={setIsToastOpen} header={storeStatus?.header} message={storeStatus?.message} />
                : <></>}
        </IonPage>
    );

};



export default Store;
