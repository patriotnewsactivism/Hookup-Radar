declare module 'leaflet' {
  export = L;
}
declare namespace L {
  function map(element: HTMLElement, options?: any): Map;
  function tileLayer(urlTemplate: string, options?: any): TileLayer;
  function marker(latlng: [number, number], options?: any): Marker;
  function layerGroup(layers?: any[]): LayerGroup;
  function divIcon(options: any): any;
  interface Map {
    setView(center: [number, number], zoom: number): Map;
    flyTo(center: [number, number], zoom: number, options?: any): Map;
    getZoom(): number;
    remove(): void;
  }
  interface TileLayer { addTo(map: Map): TileLayer; }
  interface Marker { 
    addTo(group: LayerGroup): Marker;
    on(event: string, handler: () => void): Marker;
  }
  interface LayerGroup {
    addTo(map: Map): LayerGroup;
    clearLayers(): LayerGroup;
  }
}
