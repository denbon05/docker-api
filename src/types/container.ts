// TODO specify types

interface ILabels {
  [key: string]: string;
}

export interface ContainerData {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Command: string;
  Created: number;
  Ports: number[];
  Labels: ILabels;
  State:
    | 'running'
    | 'exited'
    | 'removing'
    | 'created'
    | 'paused'
    | 'restarting';
  Status: string;
  HostConfig: any;
  NetworkSettings: any;
  Mounts: any[];
}
