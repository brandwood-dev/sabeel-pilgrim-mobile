declare module '@rnmapbox/maps' {
    import { Component } from 'react';
    import { ViewProps } from 'react-native';

    export interface MapViewProps extends ViewProps {
        styleURL?: string;
        logoEnabled?: boolean;
        attributionEnabled?: boolean;
    }

    export class MapView extends Component<MapViewProps> { }

    export interface CameraProps {
        zoomLevel?: number;
        centerCoordinate?: number[];
        animationMode?: 'flyTo' | 'easeTo' | 'linearTo' | 'moveTo';
        animationDuration?: number;
    }

    export class Camera extends Component<CameraProps> { }

    export const StyleURL: {
        Street: string;
        Dark: string;
        Light: string;
        Outdoors: string;
        Satellite: string;
        SatelliteStreet: string;
        TrafficDay: string;
        TrafficNight: string;
    };

    export function setAccessToken(token: string): void;

    export interface VectorSourceProps {
        id: string;
        url?: string;
    }
    export class VectorSource extends Component<VectorSourceProps> { }

    export interface LineLayerProps {
        id: string;
        sourceLayer?: string;
        style?: any;
    }
    export class LineLayer extends Component<LineLayerProps> { }

    export interface PointAnnotationProps {
        id: string;
        coordinate: number[];
    }
    export class PointAnnotation extends Component<PointAnnotationProps> { }

    export interface UserLocationProps {
        visible?: boolean;
        showsUserHeadingIndicator?: boolean;
    }
    export class UserLocation extends Component<UserLocationProps> { }
}
