import React from "react";
import {  IonRow, IonSearchbar } from '@ionic/react';



import './RefreshmentsFilters.css'




interface FiltersInterface {
 
  search: string,
  setSearch: React.Dispatch<React.SetStateAction<string>>
}


const RefreshmentsFilters: React.FC<FiltersInterface> = ({search, setSearch}) => {

    return (
        <IonRow class="filter-row ">
      
            <IonSearchbar debounce={1500} value={search} onIonChange={e => setSearch(e.detail.value!)} color="navy" placeholder="Looking for something specific?"></IonSearchbar>

              
        </IonRow >
    )
};

export default RefreshmentsFilters;
