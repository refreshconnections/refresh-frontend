import { IonContent, IonHeader, IonToolbar, IonTitle, IonSearchbar, IonList, IonButton, IonItem, IonLabel } from '@ionic/react';
import { useState } from 'react';

type Props = {
  onDismiss: (selectedCity?: any) => void;
};

const CitySelectorModal: React.FC<Props> = ({ onDismiss }) => {
  const [searchText, setSearchText] = useState('');
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchCities = async (query: string) => {
    if (!query || query.length < 2) {
      setCities([]);
      return;
    }
    setLoading(true);
    try {
      const username = "rconnections"; // Replace with your real GeoNames username
      const url = `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(query)}&maxRows=10&featureClass=P&username=${username}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.geonames) {
        const results = data.geonames.map((city: any) => ({
          name: `${city.name}${city.adminName1 ? `, ${city.adminName1}` : ''}, ${city.countryName}`,
          lat: city.lat,
          lng: city.lng,
        }));
        setCities(results);
      } else {
        setCities([]);
      }
    } catch (error) {
      console.error('Error searching cities:', error);
      setCities([]);
    }
    setLoading(false);
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Select a City</IonTitle>
          <IonButton fill="clear" slot="end" onClick={() => onDismiss()}>
            Cancel
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonSearchbar
          placeholder="Search for a city..."
          debounce={500}
          value={searchText}
          onIonInput={e => {
            const value = e.detail.value!;
            setSearchText(value);
            searchCities(value);
          }}
        />

        <IonList>
          {cities.map((city, index) => (
            <IonItem button key={index} onClick={() => onDismiss(city)}>
              <IonLabel>{city.name}</IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </>
  );
};

export default CitySelectorModal;
