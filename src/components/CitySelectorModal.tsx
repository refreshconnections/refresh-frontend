import { IonButtons, IonContent, IonHeader, IonPage, IonToolbar, IonTitle, IonSearchbar, IonList, IonButton, IonItem, IonLabel, useIonAlert } from '@ionic/react';
import { useRef, useState } from 'react';

type Props = {
  onDismiss: (selectedCity?: any) => void;
};

type CitySearchResult = {
  name: string;
  lat: number;
  lng: number;
};

const CitySelectorModal: React.FC<Props> = ({ onDismiss }) => {
  const [searchText, setSearchText] = useState('');
  const [cities, setCities] = useState<CitySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [presentAlert] = useIonAlert();
  const hasShownUnavailableAlert = useRef(false);

  const presentUnavailableAlert = () => {
    if (hasShownUnavailableAlert.current) {
      return;
    }

    hasShownUnavailableAlert.current = true;
    presentAlert({
      header: "City search isn't working right now",
      message: "Try sharing your device location instead, or try again later.",
      buttons: ["OK"],
    });
  };

  const searchCities = async (query: string) => {
    if (!query || query.length < 2) {
      setCities([]);
      hasShownUnavailableAlert.current = false;
      return;
    }
    setLoading(true);
    try {
      const username = "rconnections";
      const url = `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(query)}&maxRows=10&featureClass=P&username=${username}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GeoNames request failed with ${response.status}`);
      }

      const data = await response.json();

      if (data.status || !Array.isArray(data.geonames)) {
        throw new Error(data.status?.message ?? 'Unexpected GeoNames response');
      }

      const results = data.geonames.map((city: any) => ({
        name: `${city.name}${city.adminName1 ? `, ${city.adminName1}` : ''}, ${city.countryName}`,
        lat: parseFloat(city.lat),
        lng: parseFloat(city.lng),
      }));
      setCities(results);
      hasShownUnavailableAlert.current = false;
    } catch (error) {
      console.error('Error searching cities:', error);
      setCities([]);
      presentUnavailableAlert();
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="modal-title">
          <IonTitle>Select a City</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => onDismiss()}>
              Done
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonSearchbar
          placeholder="Search for a city..."
          debounce={500}
          value={searchText}
          onIonChange={e => {
            const value = e.detail.value!;
            setSearchText(value);
            searchCities(value);
          }}
        />

        <IonList>
          {loading && (
            <IonItem>
              <IonLabel>Searching...</IonLabel>
            </IonItem>
          )}
          {cities.map((city, index) => (
            <IonItem button key={index} onClick={() => onDismiss(city)}>
              <IonLabel>{city.name}</IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default CitySelectorModal;
