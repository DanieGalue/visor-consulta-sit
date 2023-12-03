import { createStore } from 'vuex'
import axios from 'axios';

export default createStore({
  state: {
    maps: [],
    selectedMap: null,
    mapLayers: [],
    secondDrawer: false,
    markedCoordinate: { lat: 0, lng: 0 },
    features: [],
    // other state properties...
  },
  getters: {
    mapLayers: state => {
      console.log('mapLayers in store:', state.mapLayers); // print the value of mapLayers in the store
      return state.mapLayers;
    },
    markedCoordinate: state => state.markedCoordinate,
    // other getters...
  },
  mutations: {
    setMaps(state, maps) {
      state.maps = maps;
    },
    setSelectedMap(state, map) {
      state.selectedMap = map;
      state.mapLayers = map.maplayers;
      //console.log(state.mapLayers);
    },
    setMapLayers(state, mapLayers) {
      state.mapLayers = mapLayers;
    },
    toggleLayerVisibility(state, layerIndex) {
      if (state.mapLayers[layerIndex]) {
        state.mapLayers[layerIndex].visibility = !state.mapLayers[layerIndex].visibility;
      }
    },
    setLayerOpacity(state, { layerIndex, opacity }) {
      state.mapLayers[layerIndex].opacity = opacity;
    },
    openSecondDrawer(state) {
      state.secondDrawer = true;
    },
    closeSecondDrawer(state) {
      state.secondDrawer = false;
    },
    markCoordinate(state, coordinate) {
      state.markedCoordinate = coordinate;
      console.log('markedCoordinate', state.markedCoordinate);
    },
    setFeatures(state, features) {
      state.features = features;
    },
    // other mutations...
  },
  actions: {
    async fetchMaps({ commit }) {
      const response = await axios.get("https://ec2-54-145-253-11.compute-1.amazonaws.com/api/v2/maps");
      commit('setMaps', response.data.maps);
    },
    fetchFeatures({ state, commit }) {
      const coordinate = state.markedCoordinate;
      const wmsUrl = 'https://ec2-54-145-253-11.compute-1.amazonaws.com/geoserver/ows';
      const layerName = 'geonode:comunas_maracaibo';
      const buffer = 0.01; // adjust this value as needed
      // Construct the GetFeatureInfo URL
      const getFeatureInfoUrl = `${wmsUrl}?service=WMS&version=1.1.1&request=GetFeatureInfo&layers=${layerName}&styles=&srs=EPSG:4326&format=image/png&bbox=${coordinate.lng - buffer},${coordinate.lat - buffer},${coordinate.lng + buffer},${coordinate.lat + buffer}&width=256&height=256&query_layers=${layerName}&info_format=application/json&x=128&y=128`;
      axios.get(getFeatureInfoUrl).then(response => {
        console.log('Queried', response);
        commit('setFeatures', response.data.features);
        console.log('features', state.features);
      });
    }
    // other actions...
  },
  modules: {
  }
})
